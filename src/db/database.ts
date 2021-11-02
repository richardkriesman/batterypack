import { Connection, createConnection } from "typeorm";

export class Database {
  static async connect(fileName: string): Promise<Database> {
    const db = new Database();
    db.#connection = await createConnection({
      type: "better-sqlite3",
      database: fileName,
      entities: [],
      subscribers: [],
      migrations: [],
      synchronize: true, // TODO: Remember to turn this off!!!
      migrationsRun: true,
    });
    return db;
  }

  #connection: Connection;

  private constructor() {}
}
