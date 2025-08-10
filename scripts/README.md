# Scripts

This directory contains utility scripts for managing the application.

## Create Admin User

Creates a new admin user in the database with proper password hashing.

### Usage

You can run the script in several ways:

#### Using npm scripts (recommended):

```bash
# Using JavaScript version
npm run create-admin

# Using TypeScript version
npm run create-admin:ts
```

#### Direct execution:

```bash
# JavaScript version
node scripts/create-admin.js

# TypeScript version
ts-node scripts/create-admin.ts
```

### What the script does:

1. **Prompts for user input**: Email, name, password, and password confirmation
2. **Validates input**: Ensures all fields are provided and passwords match
3. **Checks for existing users**: Prevents duplicate email addresses
4. **Hashes password**: Uses bcrypt with 12 salt rounds for security
5. **Creates admin user**: Adds user to database with 'admin' role
6. **Provides feedback**: Shows success message with user details

### Requirements:

- Database connection (DATABASE_URL environment variable)
- Prisma client generated (`npm run postinstall`)
- bcrypt package installed

### Example output:

```
=== Create Admin User ===

Email: admin@example.com
Name: John Doe
Password: ********
Confirm Password: ********

✅ Admin user created successfully!
ID: 507f1f77bcf86cd799439011
Email: admin@example.com
Name: John Doe
Role: admin
Created: 2024-01-15T10:30:00.000Z
```

### Security Notes:

- Passwords are hashed using bcrypt with 12 salt rounds
- Minimum password length is 6 characters
- Email addresses must be unique
- The script validates all input before creating the user
