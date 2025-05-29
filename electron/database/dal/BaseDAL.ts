import { getDatabase } from "../database";

export abstract class BaseDAL {
  protected get db() {
    return getDatabase();
  }

  protected transaction<T>(callback: () => T): T {
    const transactionFn = this.db.transaction(callback);
    return transactionFn();
  }
}
