import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { logger } from "@/lib/logger";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const MAX_QR_BYTES = 500_000;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function GET(request: NextRequest) {
  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const methods = await convex.query(api.tasks.getPaymentMethods, {
      userId: userId as any,
    });
    return NextResponse.json(
      methods.map((method) => ({
        ...method,
        imageUrl: `/api/payment-methods/image?storageId=${encodeURIComponent(method.storageId)}`,
      })),
    );
  } catch (error) {
    logger.error("api_payment_methods_get_failed", error as Error, { userId });
    return NextResponse.json(
      { error: "Failed to load payment QR codes" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userId = formData.get("userId");
    const name = formData.get("name");
    const provider = formData.get("provider");
    const image = formData.get("image");

    if (
      typeof userId !== "string" ||
      typeof name !== "string" ||
      typeof provider !== "string" ||
      !(image instanceof File)
    ) {
      return NextResponse.json(
        { error: "Name, provider, user ID, and QR image are required" },
        { status: 400 },
      );
    }
    if (!name.trim() || !provider.trim()) {
      return NextResponse.json(
        { error: "Enter a name and payment provider" },
        { status: 400 },
      );
    }
    if (!ALLOWED_IMAGE_TYPES.has(image.type) || image.size > MAX_QR_BYTES) {
      return NextResponse.json(
        { error: "Use a PNG, JPEG, or WebP image under 500 KB" },
        { status: 400 },
      );
    }

    const uploadUrl = await convex.mutation(
      api.tasks.generatePaymentQrUploadUrl,
      { userId: userId as any },
    );
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": image.type },
      body: image,
    });
    if (!uploadResponse.ok) {
      throw new Error("Convex image upload failed");
    }
    const uploadResult = (await uploadResponse.json()) as {
      storageId: string;
    };
    const uploadedStorageId = uploadResult.storageId;

    const methodId = await convex.mutation(api.tasks.createPaymentMethod, {
      userId: userId as any,
      name: name.trim(),
      provider: provider.trim(),
      storageId: uploadedStorageId as any,
    });

    return NextResponse.json({ success: true, methodId });
  } catch (error) {
    logger.error("api_payment_methods_post_failed", error as Error);
    return NextResponse.json(
      { error: "Failed to save payment QR code" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId, methodId } = await request.json();
    if (!userId || !methodId) {
      return NextResponse.json(
        { error: "User ID and payment method ID are required" },
        { status: 400 },
      );
    }
    await convex.mutation(api.tasks.deletePaymentMethod, {
      userId: userId as any,
      methodId: methodId as any,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("api_payment_methods_delete_failed", error as Error);
    return NextResponse.json(
      { error: "Failed to remove payment QR code" },
      { status: 500 },
    );
  }
}
