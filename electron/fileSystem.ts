import fs, { watch } from "node:fs";
import path from "node:path";
import os from "node:os";
import { BrowserWindow, ipcMain } from "electron";

let fileWatcher: fs.FSWatcher | null = null;

const homeDir = os.homedir();
const notesDir = path.join(homeDir, "notes");

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

export async function readMarkdownFile(
  filePath: string,
): Promise<MarkdownItem | null> {
  try {
    const stats = await fs.promises.stat(filePath);
    if (!stats.isFile()) {
      console.error("Not a file:", filePath);
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
    console.error("Error reading markdown file", error);
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
    console.error("Error creating folder", error);
    return null;
  }
}

export async function createMarkdownFile(): Promise<MarkdownItem | null> {
  try {
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

    const displayName =
      nextNumber === 0 ? "Untitled" : `Untitled ${nextNumber}`;
    const fileName = `${displayName}.md`;
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
    console.error("Error creating markdown file", error);
    return null;
  }
}

async function readDirectoryRecursively(
  directoryPath: string,
): Promise<DirectoryContents> {
  try {
    const files = await fs.promises.readdir(directoryPath);

    const itemsPromises = files.map(async (file) => {
      const filePath = path.join(directoryPath, file);
      const stats = await fs.promises.stat(filePath);
      const isDirectory = stats.isDirectory();

      if (isDirectory) {
        const children = await readDirectoryRecursively(filePath);
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

    return validItems.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error(`Error reading directory ${directoryPath}:`, error);
    return [];
  }
}

export async function loadExistingNotes() {
  try {
    return await readDirectoryRecursively(notesDir);
  } catch (error) {
    console.error("Error loading existing notes:", error);
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
    console.error("Error writing markdown file", error);
    return false;
  }
}

export async function setupFileSystemListeners(mainWindow: BrowserWindow) {
  await setupVault();
  ipcMain.handle("create-markdown-file", async () => {
    return await createMarkdownFile();
  });
  ipcMain.handle("load-existing-notes", async () => {
    return await loadExistingNotes();
  });
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
  startFileWatcher(mainWindow);
}
