import fs, { watch } from "node:fs";
import path from "node:path";
import os from "node:os";
import { BrowserWindow, ipcMain } from "electron";
import { getDatabase } from "./database";

let fileWatcher: fs.FSWatcher | null = null;

const homeDir = os.homedir();
const notesDir = path.join(homeDir, "notes");

export function getFileOrder(parentPath: string): Record<string, number> {
  try {
    const db = getDatabase();
    const rows = db
      .prepare(
        "SELECT file_path, order_index FROM file_orders WHERE parent_path = ?",
      )
      .all(parentPath);

    const orderMap: Record<string, number> = {};

    rows.forEach((row: any) => {
      orderMap[row.file_path] = row.order_index;
    });

    return orderMap;
  } catch (error) {
    return {};
  }
}

export function deleteFileOrdersByPath(filePath: string): boolean {
  try {
    const db = getDatabase();

    db.exec("BEGIN TRANSACTION;");

    try {
      const stmt = db.prepare("DELETE FROM file_orders WHERE file_path = ?");
      stmt.run(filePath);

      const dirStmt = db.prepare(
        "DELETE FROM file_orders WHERE file_path LIKE ? OR parent_path LIKE ?",
      );
      dirStmt.run(`${filePath}/%`, `${filePath}/%`);

      db.exec("COMMIT;");
      return true;
    } catch (error) {
      db.exec("ROLLBACK;");
      return false;
    }
  } catch (error) {
    return false;
  }
}

export function updateFileOrder(
  orders: Array<{ path: string; parentPath: string; index: number }>,
): boolean {
  try {
    if (orders.length === 0) {
      return true;
    }

    const db = getDatabase();

    db.exec("BEGIN TRANSACTION;");

    try {
      db.prepare("SELECT * FROM file_orders").all();
      const stmt = db.prepare(`
        INSERT INTO file_orders (file_path, parent_path, order_index)
        VALUES (?, ?, ?)
        ON CONFLICT(file_path) DO UPDATE SET
          parent_path = excluded.parent_path,
          order_index = excluded.order_index
      `);

      const ordersByParent: Record<
        string,
        Array<{ path: string; index: number }>
      > = {};

      for (const item of orders) {
        stmt.run(item.path, item.parentPath, item.index);

        if (!ordersByParent[item.parentPath]) {
          ordersByParent[item.parentPath] = [];
        }
        ordersByParent[item.parentPath].push({
          path: item.path,
          index: item.index,
        });
      }

      db.exec("COMMIT;");
      return true;
    } catch (error) {
      db.exec("ROLLBACK;");
      return false;
    }
  } catch (error) {
    return false;
  }
}

async function deleteFileOrFolder(
  filePath: string,
): Promise<{ success: boolean }> {
  try {
    const stats = await fs.promises.stat(filePath);
    if (stats.isDirectory()) {
      await fs.promises.rmdir(filePath, { recursive: true });
    } else {
      await fs.promises.rm(filePath);
    }
    deleteFileOrdersByPath(filePath);
    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
    };
  }
}

async function renameFileOrFolder(
  oldPath: string,
  newName: string,
): Promise<{ success: boolean; newPath?: string }> {
  try {
    const dir = path.dirname(oldPath);
    const ext = path.extname(oldPath);
    const isDirectory = ext === "";

    const newFilename = isDirectory ? newName : `${newName}${ext}`;
    const newPath = path.join(dir, newFilename);

    try {
      await fs.promises.stat(newPath);
      return {
        success: false,
      };
    } catch (error) {
      // file does not exist, so we continue
    }

    await fs.promises.rename(oldPath, newPath);

    const db = getDatabase();
    const stmt = db.prepare(
      "update file_orders set file_path = ? where file_path = ?",
    );
    stmt.run(newPath, oldPath);

    if (isDirectory) {
      const updateChildPaths = db.prepare(
        "update file_orders set file_path = replace(file_path, ?, ?), parent_path = replace(parent_path, ?, ?) where file_path like ? or parent_path like ?",
      );
      updateChildPaths.run(
        oldPath,
        newPath,
        oldPath,
        newPath,
        `${oldPath}/%`,
        `${oldPath}/%`,
      );
    }
    return {
      success: true,
      newPath: newPath,
    };
  } catch (error) {
    return {
      success: false,
    };
  }
}

function naturalSort(a: string, b: string): number {
  const regex = /(\d+)|(\D+)/g;

  const aParts = a.match(regex) || [];
  const bParts = b.match(regex) || [];

  for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
    if (/^\d+$/.test(aParts[i]) && /^\d+$/.test(bParts[i])) {
      const diff = parseInt(aParts[i], 10) - parseInt(bParts[i], 10);
      if (diff !== 0) {
        return diff;
      }
    } else {
      const diff = aParts[i].localeCompare(bParts[i]);
      if (diff !== 0) {
        return diff;
      }
    }
  }

  return aParts.length - bParts.length;
}

function sortDirectoryContents(
  contents: DirectoryContents,
  sortMethod: SortMethod,
  orderMap: Record<string, number>,
): DirectoryContents {
  return contents.sort((a, b) => {
    if (sortMethod === "custom") {
      const aIndex =
        orderMap[a.path] !== undefined
          ? orderMap[a.path]
          : Number.MAX_SAFE_INTEGER;
      const bIndex =
        orderMap[b.path] !== undefined
          ? orderMap[b.path]
          : Number.MAX_SAFE_INTEGER;
      if (
        aIndex !== Number.MAX_SAFE_INTEGER &&
        bIndex !== Number.MAX_SAFE_INTEGER
      ) {
        return aIndex - bIndex;
      }
      if (aIndex !== Number.MAX_SAFE_INTEGER) return -1;
      if (bIndex !== Number.MAX_SAFE_INTEGER) return 1;
    }
    return sortMethod === "asc"
      ? naturalSort(a.name, b.name)
      : naturalSort(b.name, a.name);
  });
}

async function readDirectoryRecursively(
  directoryPath: string,
  sortMethod: SortMethod,
  folderCheck: boolean = true,
): Promise<DirectoryContents> {
  try {
    const files = await fs.promises.readdir(directoryPath);

    const itemsPromises = files.map(async (file) => {
      const filePath = path.join(directoryPath, file);
      const stats = await fs.promises.stat(filePath);
      const isDirectory = stats.isDirectory();

      if (isDirectory) {
        if (!folderCheck) {
          return null;
        }

        const children = await readDirectoryRecursively(filePath, sortMethod);
        const dirItem: DirectoryItem = {
          path: filePath,
          name: file,
          isDirectory: true,
          children,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
        };
        return dirItem;
      } else if (file.endsWith(".md")) {
        const mdItem: MarkdownItem = {
          path: filePath,
          name: path.basename(file, ".md"),
          isDirectory: false,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
        };
        return mdItem;
      }

      return null;
    });

    const items = await Promise.all(itemsPromises);

    function isFileItem(item: any): item is DirectoryItem | MarkdownItem {
      return item !== null;
    }
    const validItems = items.filter(isFileItem);

    const orderMap = sortMethod === "custom" ? getFileOrder(directoryPath) : {};

    return sortDirectoryContents(validItems, sortMethod, orderMap);
  } catch (error) {
    return [];
  }
}

export async function setupVault(): Promise<void> {
  await fs.promises.mkdir(notesDir, { recursive: true });
}

export function startFileWatcher(mainWindow: BrowserWindow) {
  if (fileWatcher) {
    fileWatcher.close();
  }
  fileWatcher = watch(notesDir, { recursive: true }, () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("file-system-changed");
    }
  });
}

export function getNotesDir(): string {
  return notesDir;
}

export function saveFileOrder(
  filePath: string,
  parentPath: string,
  index: number,
) {
  try {
    const db = getDatabase();
    const stmt =
      db.prepare(`insert into file_orders (file_path, parent_path, order_index)
                            values (?, ?, ?) on conflict(file_path) do update set order_index = ?`);
    stmt.run(filePath, parentPath, index, index);
    return true;
  } catch (error) {
    return false;
  }
}

export async function readMarkdownFile(
  filePath: string,
): Promise<MarkdownItem | null> {
  try {
    const stats = await fs.promises.stat(filePath);
    if (!stats.isFile()) {
      return null;
    }

    const content = await fs.promises.readFile(filePath, "utf-8");
    return {
      path: filePath,
      name: path.basename(filePath, ".md"),
      isDirectory: false,
      content: content,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
    };
  } catch (error) {
    return null;
  }
}

export async function createFolder(): Promise<DirectoryItem | null> {
  try {
    const files = await fs.promises.readdir(notesDir);
    const folderPattern = /^New Folder(?:\s(\d+))?$/;

    const fileInfos = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(notesDir, file);
        const stats = await fs.promises.stat(filePath);
        return {
          file,
          isDirectory: stats.isDirectory(),
        };
      }),
    );

    const existingNumbers = fileInfos
      .filter((info) => info.isDirectory && folderPattern.test(info.file))
      .map((info) => {
        const match = info.file.match(folderPattern);
        if (!match) return 0;
        return match[1] ? parseInt(match[1], 10) : 0;
      })
      .sort((a, b) => a - b);

    let nextNumber = 0;
    let found = false;

    for (const num of existingNumbers) {
      if (num !== nextNumber) {
        found = true;
        break;
      }
      nextNumber++;
    }

    if (!found && existingNumbers.length > 0) {
      nextNumber = existingNumbers[existingNumbers.length - 1] + 1;
    }

    const folderName =
      nextNumber === 0 ? "New Folder" : `New Folder ${nextNumber}`;
    const folderPath = path.join(notesDir, folderName);

    await fs.promises.mkdir(folderPath, { recursive: true });

    return {
      path: folderPath,
      name: folderName,
      isDirectory: true,
      children: [],
      createdAt: new Date(),
      modifiedAt: new Date(),
    };
  } catch (error) {
    return null;
  }
}

export async function createMarkdownFile(
  customFileName?: string,
): Promise<MarkdownItem | null> {
  try {
    let fileName, displayName;

    if (customFileName && customFileName.trim() !== "") {
      displayName = customFileName.trim();
      fileName = `${displayName}.md`;
    } else {
      const files = await fs.promises.readdir(notesDir);
      const untitledPattern = /^Untitled(?:\s(\d+))?\.md$/;
      const existingNumbers = files
        .filter((file) => untitledPattern.test(file))
        .map((file) => {
          const match = file.match(untitledPattern);
          if (!match) return 0;
          return match[1] ? parseInt(match[1], 10) : 0;
        })
        .sort((a, b) => a - b);

      let nextNumber = 0;
      let found = false;
      for (const num of existingNumbers) {
        if (num !== nextNumber) {
          found = true;
          break;
        }
        nextNumber++;
      }
      if (!found && existingNumbers.length > 0) {
        nextNumber = existingNumbers[existingNumbers.length - 1] + 1;
      }

      displayName = nextNumber === 0 ? "Untitled" : `Untitled ${nextNumber}`;
      fileName = `${displayName}.md`;
    }

    const filePath = path.join(notesDir, fileName);
    const fileContent = `# ${displayName}\n\nThis is a new note created on ${new Date().toLocaleDateString()}.\n`;

    await fs.promises.writeFile(filePath, fileContent, "utf-8");

    return {
      path: filePath,
      name: displayName,
      isDirectory: false,
      content: fileContent,
      createdAt: new Date(),
      modifiedAt: new Date(),
    };
  } catch (error) {
    return null;
  }
}

export async function loadExistingNotes(
  sortMethod: SortMethod,
  folderCheck: boolean = true,
): Promise<DirectoryContents> {
  try {
    return await readDirectoryRecursively(notesDir, sortMethod, folderCheck);
  } catch (error) {
    return [];
  }
}

export async function writeMarkdownFile(
  filePath: string,
  content: string,
): Promise<boolean> {
  try {
    await fs.promises.writeFile(filePath, content, "utf-8");
    return true;
  } catch (error) {
    return false;
  }
}

export async function moveFile(
  oldPath: string,
  targetDir: string,
): Promise<{ success: boolean; newPath?: string }> {
  try {
    const fileName = path.basename(oldPath);
    const newPath = path.join(targetDir, fileName);

    try {
      await fs.promises.stat(newPath);
      if (oldPath !== newPath) {
        const ext = path.extname(fileName);
        const nameWithoutExt = path.basename(fileName, ext);
        const uniqueName = `${nameWithoutExt}-${Date.now()}${ext}`;
        const uniquePath = path.join(targetDir, uniqueName);

        await fs.promises.mkdir(path.dirname(uniquePath), { recursive: true });
        await fs.promises.rename(oldPath, uniquePath);

        const db = getDatabase();
        const stmt = db.prepare(
          "UPDATE file_orders SET file_path = ?, parent_path = ? WHERE file_path = ?",
        );
        stmt.run(uniquePath, targetDir, oldPath);
        return {
          success: true,
          newPath: uniquePath,
        };
      }
    } catch (error) {
      // File does not exist, so we continue
    }
    await fs.promises.mkdir(targetDir, { recursive: true });
    await fs.promises.rename(oldPath, newPath);

    const db = getDatabase();
    const stmt = db.prepare(
      "UPDATE file_orders SET file_path = ?, parent_path = ? WHERE file_path = ?",
    );
    stmt.run(newPath, targetDir, oldPath);

    return {
      success: true,
      newPath: newPath,
    };
  } catch (error) {
    return {
      success: false,
    };
  }
}

export async function setupFileSystemListeners(mainWindow: BrowserWindow) {
  await setupVault();

  ipcMain.handle("create-markdown-file", async (_, customFileName?: string) => {
    return await createMarkdownFile(customFileName);
  });

  ipcMain.handle(
    "load-existing-notes",
    async (_, sortMethod: SortMethod, folderCheck: boolean = true) => {
      return await loadExistingNotes(sortMethod, folderCheck);
    },
  );

  ipcMain.handle("create-folder", async () => {
    return await createFolder();
  });

  ipcMain.handle("read-markdown-file", async (_, filePath: string) => {
    return await readMarkdownFile(filePath);
  });

  ipcMain.handle(
    "write-markdown-file",
    async (_, filePath: string, content: string) => {
      return await writeMarkdownFile(filePath, content);
    },
  );

  ipcMain.handle(
    "update-file-orders",
    async (
      _,
      orders: Array<{ path: string; parentPath: string; index: number }>,
    ) => {
      return updateFileOrder(orders);
    },
  );

  ipcMain.handle("get-file-order", async (_, parentPath: string) => {
    return getFileOrder(parentPath);
  });

  ipcMain.handle("move-file", async (_, oldPath: string, newPath: string) => {
    return moveFile(oldPath, newPath);
  });

  ipcMain.handle("get-notes-dir", () => {
    return getNotesDir();
  });

  ipcMain.handle(
    "rename-file-or-folder",
    async (_, oldPath: string, newName: string) => {
      return renameFileOrFolder(oldPath, newName);
    },
  );

  ipcMain.handle("delete-file-or-folder", async (_, filePath: string) => {
    return deleteFileOrFolder(filePath);
  });

  startFileWatcher(mainWindow);
}
