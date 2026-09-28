import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";

const allowedTypes = ["video/mp4", "video/quicktime", "video/webm", "audio/mpeg", "audio/wav", "image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json()) as HandleUploadBody;
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const validPrefix = `${user.id}/`;
        if (!pathname.startsWith(validPrefix) || pathname.includes("..") || !/^[a-zA-Z0-9._/-]+$/.test(pathname)) throw new Error("INVALID_STORAGE_PATH");
        return { allowedContentTypes: allowedTypes, maximumSizeInBytes: 2 * 1024 * 1024 * 1024, addRandomSuffix: true, tokenPayload: JSON.stringify({ userId: user.id }) };
      },
      onUploadCompleted: async () => { /* Worker ingestion is queued by the project API after upload. */ },
    });
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message === "UNAUTHENTICATED" ? "UNAUTHENTICATED" : "UPLOAD_REJECTED" }, { status: message === "UNAUTHENTICATED" ? 401 : 400 });
  }
}
