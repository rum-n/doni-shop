import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcrypt';
import { db } from '@/lib/db';

// This should be a secure, randomly generated string
const API_SECRET = process.env.API_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Check for API secret in headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${API_SECRET}`) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Request body:', body); // Debug log

    const { email, name, password, role } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 400 });
    }

    // Hash the password
    const hashedPassword = await hash(password, 10);

    // Create the user
    const user = await db.user.create({
      data: {
        email,
        name: name || '',
        password: hashedPassword,
        role: role || 'admin',
      },
    });

    console.log('User created:', user.id); // Debug log

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    // Return more detailed error information
    return NextResponse.json(
      {
        message: 'An error occurred while creating the user',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// GET method to check if the endpoint is available
export async function GET() {
  return NextResponse.json({
    message: 'Admin user creation endpoint is active',
    apiSecret: API_SECRET
  });
}