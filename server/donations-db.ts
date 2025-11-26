import { eq } from "drizzle-orm";
import { donations, type InsertDonation } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Create a new donation record
 */
export async function createDonation(donation: InsertDonation) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const [result] = await db.insert(donations).values(donation);
  return result;
}

/**
 * Get donation by Stripe session ID (for idempotency)
 */
export async function getDonationBySessionId(sessionId: string) {
  const db = await getDb();
  if (!db) {
    return null;
  }

  const result = await db
    .select()
    .from(donations)
    .where(eq(donations.stripeSessionId, sessionId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Get all donations for a user
 */
export async function getUserDonations(userId: number) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db
    .select()
    .from(donations)
    .where(eq(donations.userId, userId))
    .orderBy(donations.createdAt);
}

/**
 * Get all donations (admin only)
 */
export async function getAllDonations() {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db.select().from(donations).orderBy(donations.createdAt);
}
