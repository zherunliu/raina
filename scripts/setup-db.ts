import "dotenv/config";
import { setupDatabase, closeDatabase } from "../src/server/db";
try {
  await setupDatabase();
  console.log("Database schema ready");
} finally {
  await closeDatabase();
}
