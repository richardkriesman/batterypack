import { Connection, createConnection } from "typeorm";
import { Credential } from "@project/db/entities";

export class Database {
  static async connect(fileName: string): Promise<Database> {
    const db = new Database();
    db.#connection = await createConnection({
      type: "better-sqlite3",
      database: fileName,
      entities: [Credential],
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
