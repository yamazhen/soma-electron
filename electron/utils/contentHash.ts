import crypto from "node:crypto";

export const generateContentHash = (content: string): string => {
  return crypto.createHash("md5").update(content).digest("hex");
};

export default generateContentHash;
