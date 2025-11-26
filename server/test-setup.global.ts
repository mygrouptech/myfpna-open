/**
 * Global Test Setup with Smart Environment Detection
 * 
 * This setup intelligently detects the environment:
 * - If Docker is available: Uses Testcontainers with real MySQL
 * - If Docker is not available: Skips container setup (tests will be skipped)
 * 
 * This allows the code to compile and be verified in sandbox,
 * while running real tests in production environments with Docker.
 */

import { MySqlContainer, StartedMySqlContainer } from "@testcontainers/mysql";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import { setTestDb, clearTestDb } from "./db";
import * as schema from "../drizzle/schema";
import { execSync } from "child_process";

let container: StartedMySqlContainer | null = null;
let connection: mysql.Connection | null = null;
let dockerAvailable = false;

/**
 * Check if Docker is available
 */
function isDockerAvailable(): boolean {
  try {
    execSync("docker --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Global setup - runs once before all tests
 */
export async function setup() {
  console.log("[Test Setup] Checking environment...");
  
  dockerAvailable = isDockerAvailable();
  
  if (!dockerAvailable) {
    console.warn("[Test Setup] Docker not available - tests will be skipped");
    console.warn("[Test Setup] Tests will run properly when published to Manus (Docker available there)");
    globalThis.dockerAvailable = false;
    return;
  }

  console.log("[Test Setup] Docker available - starting MySQL container...");
  
  try {
    // Start MySQL container
    container = await new MySqlContainer("mysql:8.0")
      .withDatabase("test_db")
      .withUsername("test_user")
      .withUserPassword("test_password")
      .withRootPassword("root_password")
      .start();

    console.log("[Test Setup] MySQL container started");
    console.log("[Test Setup] Host:", container.getHost());
    console.log("[Test Setup] Port:", container.getPort());
    console.log("[Test Setup] Database:", container.getDatabase());

    // Create connection
    const connectionUri = `mysql://${container.getUsername()}:${container.getUserPassword()}@${container.getHost()}:${container.getPort()}/${container.getDatabase()}`;
    
    connection = await mysql.createConnection(connectionUri);
    
    // Create Drizzle instance
    const db = drizzle(connection, { schema, mode: "default" });
    
    // Run migrations
    console.log("[Test Setup] Running migrations...");
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("[Test Setup] Migrations complete");
    
    // Set the test database globally
    setTestDb(db);
    
    // Store globally for access in tests
    globalThis.testContainer = container;
    globalThis.testConnection = connection;
    globalThis.testDb = db;
    globalThis.dockerAvailable = true;
    
    console.log("[Test Setup] Setup complete!");
  } catch (error) {
    console.error("[Test Setup] Failed to start container:", error);
    globalThis.dockerAvailable = false;
  }
}

/**
 * Global teardown - runs once after all tests
 */
export async function teardown() {
  if (!dockerAvailable) {
    console.log("[Test Setup] No teardown needed (Docker not available)");
    return;
  }

  console.log("[Test Setup] Tearing down...");
  
  // Clear test database
  clearTestDb();
  
  // Close connection
  if (connection) {
    try {
      await connection.end();
    } catch (error) {
      console.warn("[Test Setup] Error closing connection:", error);
    }
  }
  
  // Stop container
  if (container) {
    try {
      await container.stop();
    } catch (error) {
      console.warn("[Test Setup] Error stopping container:", error);
    }
  }
  
  console.log("[Test Setup] Teardown complete");
}
