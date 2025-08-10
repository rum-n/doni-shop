#!/usr/bin/env node

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import readline from "readline";

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createAdminUser() {
  try {
    console.log("=== Create Admin User ===\n");

    // Get user input
    const email = await question("Email: ");
    const name = await question("Name: ");
    const password = await question("Password: ");
    const confirmPassword = await question("Confirm Password: ");

    // Validate input
    if (!email || !name || !password) {
      console.error("❌ All fields are required");
      process.exit(1);
    }

    if (password !== confirmPassword) {
      console.error("❌ Passwords do not match");
      process.exit(1);
    }

    if (password.length < 6) {
      console.error("❌ Password must be at least 6 characters long");
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.error("❌ User with this email already exists");
      process.exit(1);
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: "admin",
      },
    });

    console.log("\n✅ Admin user created successfully!");
    console.log(`ID: ${adminUser.id}`);
    console.log(`Email: ${adminUser.email}`);
    console.log(`Name: ${adminUser.name}`);
    console.log(`Role: ${adminUser.role}`);
    console.log(`Created: ${adminUser.createdAt}`);
  } catch (error) {
    console.error("❌ Error creating admin user:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

// Run the script
createAdminUser();
