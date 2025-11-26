/**
 * Type definitions for test globals
 */

import type { StartedMySqlContainer } from "@testcontainers/mysql";
import type { Connection } from "mysql2/promise";
import type { MySql2Database } from "drizzle-orm/mysql2";
import type * as schema from "../drizzle/schema";

declare global {
  var testContainer: StartedMySqlContainer | undefined;
  var testConnection: Connection | undefined;
  var testDb: MySql2Database<typeof schema> | undefined;
  var dockerAvailable: boolean | undefined;
}

export {};
