import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { FileOrderDAL } from "../database/dal";

/* im lazy to use the helper functions right now,
 * so leaving it as is for now and will refactor later */

export class FileSystemService {
  private fileOrderDAL = new FileOrderDAL();
  private homeDir = os.homedir();
  private notesDir = path.join(this.homeDir, "notes");

  constructor() {
    this.ensureNotesDir();
  }

  private async ensureNotesDir(): Promise<void> {
    await fs.promises.mkdir(this.notesDir, { recursive: true });
  }

  getNotesDir(): string {
    return this.notesDir;
  }

  getFileOrder(parentPath: string): Record<string, number> {
    return this.fileOrderDAL.getFileOrder(parentPath);
  }

  updateFileOrders(
    orders: Array<{ path: string; parentPath: string; index: number }>,
  ): boolean {
    return this.fileOrderDAL.updateFileOrders(orders);
  }

  saveFileOrder(filePath: string, parentPath: string, index: number): boolean {
    return this.fileOrderDAL.saveFileOrder(filePath, parentPath, index);
  }

  async deleteFileOrFolder(filePath: string): Promise<{ success: boolean }> {
    try {
      const stats = await fs.promises.stat(filePath);
      if (stats.isDirectory()) {
        await fs.promises.rm(filePath, { recursive: true });
      } else {
        await fs.promises.rm(filePath);
      }

      this.fileOrderDAL.deleteFileOrdersByPath(filePath);

      return { success: true };
    } catch (error) {
      console.error("Error deleting file/folder:", error);
      return { success: false };
    }
  }

  async renameFileOrFolder(
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
        return { success: false };
      } catch (error) {
        // continue if file doesnt exist
      }

      await fs.promises.rename(oldPath, newPath);

      this.fileOrderDAL.updateFilePathsAfterRename(oldPath, newPath);

      return { success: true, newPath };
    } catch (error) {
      console.error("Error renaming file/folder:", error);
      return { success: false };
    }
  }

  async moveFile(
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

          await fs.promises.mkdir(path.dirname(uniquePath), {
            recursive: true,
          });
          await fs.promises.rename(oldPath, uniquePath);

          this.fileOrderDAL.updateFilePathsAfterMove(
            oldPath,
            uniquePath,
            targetDir,
          );

          return { success: true, newPath: uniquePath };
        }
      } catch (error) {
        // continue if file doesnt exist
      }

      await fs.promises.mkdir(targetDir, { recursive: true });
      await fs.promises.rename(oldPath, newPath);

      this.fileOrderDAL.updateFilePathsAfterMove(oldPath, newPath, targetDir);

      return { success: true, newPath };
    } catch (error) {
      console.error("Error moving file:", error);
      return { success: false };
    }
  }

  async readMarkdownFile(filePath: string): Promise<MarkdownItem | null> {
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
      console.error("Error reading markdown file:", error);
      return null;
    }
  }

  async writeMarkdownFile(filePath: string, content: string): Promise<boolean> {
    try {
      await fs.promises.writeFile(filePath, content, "utf-8");
      return true;
    } catch (error) {
      console.error("Error writing markdown file:", error);
      return false;
    }
  }

  async createFolder(): Promise<DirectoryItem | null> {
    try {
      const files = await fs.promises.readdir(this.notesDir);
      const folderPattern = /^New Folder(?:\s(\d+))?$/;

      const fileInfos = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(this.notesDir, file);
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
          return match[1] ? Number.parseInt(match[1], 10) : 0;
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
      const folderPath = path.join(this.notesDir, folderName);

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
      console.error("Error creating folder:", error);
      return null;
    }
  }

  async createMarkdownFile(
    customFileName?: string,
  ): Promise<MarkdownItem | null> {
    try {
      let fileName;
      let displayName;
      let fileContent;

      if (customFileName && customFileName.trim() !== "") {
        displayName = customFileName.trim();
        fileName = `${displayName}.md`;
        fileContent = `# ${displayName}\n\nToday's note`;
      } else {
        const files = await fs.promises.readdir(this.notesDir);
        const untitledPattern = /^Untitled(?:\s(\d+))?\.md$/;
        const existingNumbers = files
          .filter((file) => untitledPattern.test(file))
          .map((file) => {
            const match = file.match(untitledPattern);
            if (!match) return 0;
            return match[1] ? Number.parseInt(match[1], 10) : 0;
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
        fileContent = `# ${displayName}\n\nThis is a new note created on ${new Date().toLocaleDateString()}.\n`;
      }

      const filePath = path.join(this.notesDir, fileName);
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
      console.error("Error creating markdown file:", error);
      return null;
    }
  }

  private naturalSort(a: string, b: string): number {
    const regex = /(\d+)|(\D+)/g;
    const aParts = a.match(regex) || [];
    const bParts = b.match(regex) || [];

    for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
      if (/^\d+$/.test(aParts[i]) && /^\d+$/.test(bParts[i])) {
        const diff =
          Number.parseInt(aParts[i], 10) - Number.parseInt(bParts[i], 10);
        if (diff !== 0) {
          return diff;
        }
      }
      const diff = aParts[i].localeCompare(bParts[i]);
      if (diff !== 0) {
        return diff;
      }
    }
    return aParts.length - bParts.length;
  }

  private sortDirectoryContents(
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
        ? this.naturalSort(a.name, b.name)
        : this.naturalSort(b.name, a.name);
    });
  }

  private async readDirectoryRecursively(
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

          const children = await this.readDirectoryRecursively(
            filePath,
            sortMethod,
          );
          const dirItem: DirectoryItem = {
            path: filePath,
            name: file,
            isDirectory: true,
            children,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime,
          };
          return dirItem;
        }

        if (file.endsWith(".md")) {
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
      const validItems = items.filter(
        (item): item is DirectoryItem | MarkdownItem => item !== null,
      );

      const orderMap =
        sortMethod === "custom"
          ? this.fileOrderDAL.getFileOrder(directoryPath)
          : {};
      return this.sortDirectoryContents(validItems, sortMethod, orderMap);
    } catch (error) {
      console.error("Error reading directory recursively:", error);
      return [];
    }
  }

  async loadExistingNotes(
    sortMethod: SortMethod,
    folderCheck: boolean = true,
  ): Promise<DirectoryContents> {
    try {
      return await this.readDirectoryRecursively(
        this.notesDir,
        sortMethod,
        folderCheck,
      );
    } catch (error) {
      console.error("Error loading existing notes:", error);
      return [];
    }
  }
}
