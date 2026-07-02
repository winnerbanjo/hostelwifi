import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

function uploadBuffer(buffer: Buffer, reference: string) {
  return new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "jendor-the-plug/receipts",
        public_id: `${reference}-${Date.now()}`,
        resource_type: "auto"
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

export async function POST(request: Request) {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return NextResponse.json({ error: "Receipt upload is not configured." }, { status: 500 });
  }

  const formData = await request.formData();
  const reference = String(formData.get("reference") || "receipt").replace(/[^a-zA-Z0-9-_]/g, "");
  const file = formData.get("receipt");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Receipt file is required." }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Receipt must be 8MB or less." }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const result = await uploadBuffer(Buffer.from(bytes), reference || "receipt");
  return NextResponse.json({
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type
  });
}
