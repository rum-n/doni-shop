import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Folder every browser-side upload is pinned to. It is part of the signature,
// so the client cannot redirect uploads elsewhere.
const UPLOAD_FOLDER = "artwork-images";

// Hands the browser a short-lived signature so it can upload straight to
// Cloudinary. Image bytes never pass through this deployment.
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.error("Cloudinary environment variables are not configured");
      return NextResponse.json(
        { message: "Image uploads are not configured" },
        { status: 500 }
      );
    }

    const timestamp = Math.round(Date.now() / 1000);

    // Only the params signed here may be sent with the upload; Cloudinary
    // rejects the request if the client adds or changes any of them.
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder: UPLOAD_FOLDER },
      apiSecret
    );

    return NextResponse.json({
      cloudName,
      apiKey,
      timestamp,
      folder: UPLOAD_FOLDER,
      signature,
    });
  } catch (error) {
    console.error("Error creating upload signature:", error);
    return NextResponse.json(
      { message: "Could not authorize the upload" },
      { status: 500 }
    );
  }
}
