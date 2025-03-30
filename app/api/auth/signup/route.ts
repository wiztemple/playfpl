import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";
import { z } from "zod";
import { generateVerificationCode, sendVerificationEmail } from "@/lib/email";

// Validation schema
const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  fplTeamId: z.number(),
  fplTeamName: z.string().optional(), // Add this field
});

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate request body
        const validationResult = signupSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: "Invalid data", details: validationResult.error.format() },
                { status: 400 }
            );
        }

        const { email, password, name, username, fplTeamId } = validationResult.data;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "User with this email already exists" },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate a verification code
        const verificationCode = generateVerificationCode();
        const codeExpiry = new Date();
        codeExpiry.setMinutes(codeExpiry.getMinutes() + 30); // Code valid for 30 minutes

        // Get current date for updatedAt
        const now = new Date();

        // Create user with required fields
        const user = await prisma.user.create({
            data: {
                email,
                name,
                username,
                fplTeamId,
                fplTeamName: "", // Initialize empty team name
                password: hashedPassword,
                updatedAt: now,
                accounts: {
                    create: {
                        type: "credentials",
                        provider: "credentials",
                        providerAccountId: email,
                    }
                }
            },
        });

        // Create verification token with the code
        await prisma.verificationToken.create({
            data: {
                identifier: user.id,
                token: verificationCode,
                expires: codeExpiry,
            }
        });

        // Send verification email with code
        await sendVerificationEmail(email, name, verificationCode);

        return NextResponse.json(
            {
                message: "User created successfully. Please check your email for verification code.",
                userId: user.id
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json(
            { error: "Failed to create user" },
            { status: 500 }
        );
    }
}