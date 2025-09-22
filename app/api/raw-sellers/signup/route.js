import connectDB from "@/lib/dbConnect";
import RawMaterialSeller from "@/models/RawMaterialSeller";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const { email, password, name, phone } = body;

    // Input validation
    if (!email || !password || !name || !phone) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // ✅ Check for existing email
    const existing = await RawMaterialSeller.findOne({
      "contact.email": email,
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // ✅ Hash password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create new seller without sellerId initially
    const createdSeller = await RawMaterialSeller.create({
      name,
      contact: {
        email,
        phone,
      },
      password: hashedPassword,
    });

    // ✅ Update the document to set sellerId = _id
    createdSeller.sellerId = createdSeller._id.toString();
    await createdSeller.save();

    // ✅ Generate JWT Token
    const token = jwt.sign(
      {
        userId: createdSeller._id,
        sellerId: createdSeller.sellerId,
        email: createdSeller.contact.email,
        role: 'seller'
      },
      process.env.JWT_SECRET || 'your-secret-key', // Make sure to set this in .env.local
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      success: true,
      token, // ✅ Return the token
      seller: {
        id: createdSeller._id,
        sellerId: createdSeller.sellerId,
        name: createdSeller.name,
        email: createdSeller.contact.email,
        phone: createdSeller.contact.phone,
      },
    });
  } catch (error) {
    console.error("RawSeller Signup Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}