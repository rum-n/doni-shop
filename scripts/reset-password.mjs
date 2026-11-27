#!/usr/bin/env node
/**
 * Sets a new password for an existing account.
 *
 * Passwords are bcrypt hashes, so a forgotten one cannot be recovered — only
 * replaced. `create-admin` refuses an email that already exists, which is why
 * this is separate.
 *
 *   npm run reset-password
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

// Matches scripts/create-admin.js, so every account in the database is
// hashed at the same cost.
const SALT_ROUNDS = 12;
const MIN_LENGTH = 12;

const db = new PrismaClient();
const rl = readline.createInterface({ input: stdin, output: stdout });

/** Reads a line without echoing it, so the password stays out of the scrollback. */
async function secret(prompt) {
  stdout.write(prompt);

  const wasRaw = stdin.isRaw;
  if (stdin.isTTY) stdin.setRawMode(true);

  let value = "";

  await new Promise((resolve) => {
    const onData = (chunk) => {
      const char = chunk.toString("utf8");

      if (char === "\r" || char === "\n") {
        stdin.removeListener("data", onData);
        if (stdin.isTTY) stdin.setRawMode(wasRaw);
        stdout.write("\n");
        resolve();
        return;
      }

      if (char === "\u0003") {
        // Ctrl-C
        stdout.write("\n");
        process.exit(130);
      }

      if (char === "\u007f" || char === "\b") {
        value = value.slice(0, -1);
        return;
      }

      value += char;
    };

    stdin.on("data", onData);
  });

  return value;
}

try {
  const accounts = await db.user.findMany({
    where: { role: "admin" },
    select: { email: true, name: true },
    orderBy: { createdAt: "asc" },
  });

  if (accounts.length === 0) {
    console.error("No admin account exists. Run: npm run create-admin");
    process.exit(1);
  }

  console.log("Admin accounts:");
  for (const a of accounts) {
    console.log(`  ${a.email}${a.name ? `  (${a.name})` : ""}`);
  }
  console.log("");

  const email = (await rl.question("Email to reset: ")).trim().toLowerCase();

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true },
  });

  if (!user) {
    console.error(`No account found for ${email}`);
    process.exit(1);
  }

  const password = await secret("New password: ");
  const confirm = await secret("Confirm password: ");

  if (password !== confirm) {
    console.error("Passwords do not match.");
    process.exit(1);
  }

  if (password.length < MIN_LENGTH) {
    console.error(`Password must be at least ${MIN_LENGTH} characters.`);
    process.exit(1);
  }

  await db.user.update({
    where: { id: user.id },
    data: { password: await bcrypt.hash(password, SALT_ROUNDS) },
  });

  console.log(`\nPassword updated for ${user.email} (${user.role}).`);
  console.log("Existing sessions stay valid for up to 30 days — sign out to end them.");
} catch (error) {
  console.error("Failed to reset the password:", error.message);
  process.exit(1);
} finally {
  await db.$disconnect();
  rl.close();
}
