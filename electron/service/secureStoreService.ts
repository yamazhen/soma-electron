import keytar from "keytar";
import { env } from "../config";

export class SecureStoreService {
  async get(key: string): Promise<string | null> {
    return keytar.getPassword(env.gatewayUrl, key);
  }

  async set(key: string, value: string): Promise<void> {
    await keytar.setPassword(env.gatewayUrl, key, value);
  }

  async delete(key: string): Promise<void> {
    await keytar.deletePassword(env.gatewayUrl, key);
  }
}
