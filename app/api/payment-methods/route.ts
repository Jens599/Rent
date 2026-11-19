import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { logger } from "@/lib/logger";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const MAX_QR_BYTES = 500_000;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function paymentQrResponse(
  body: unknown,
  status: number,
  requestId: string,
) {
  return NextResponse.json(body, {
    status,
    headers: { "X-Request-ID": requestId },
  });
}

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId) {
    return paymentQrResponse(
      {
        error: "User ID is required",
        code: "MISSING_USER_ID",
        stage: "validate_request",
        requestId,
      },
      400,
      requestId,
    );
  }

  logger.info("api_payment_qr_list_started", { requestId });
  try {
    const methods = await convex.query(api.tasks.getPaymentMethods, {
      userId: userId as Id<"users">,
    });
    logger.info("api_payment_qr_list_succeeded", {
      requestId,
      count: methods.length,
      elapsedMs: Date.now() - startedAt,
    });
    return paymentQrResponse(
      methods.map((method) => ({
        ...method,
        imageUrl: `/api/payment-methods/image?storageId=${encodeURIComponent(method.storageId)}`,
      })),
      200,
      requestId,
    );
  } catch (error) {
    logger.error("api_payment_methods_get_failed", error as Error, {
      requestId,
      stage: "query_payment_methods",
      elapsedMs: Date.now() - startedAt,
    });
    return paymentQrResponse(
      {
        error: "Failed to load payment QR codes",
        code: "PAYMENT_QR_LIST_FAILED",
        stage: "query_payment_methods",
        requestId,
      },
      500,
      requestId,
    );
  }
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  let stage = "parse_form_data";
  let imageType: string | undefined;
  let imageSize: number | undefined;

  const logStage = (name: string, outcome: "started" | "completed") => {
    logger.info("api_payment_qr_upload_stage", {
      requestId,
      stage: name,
      outcome,
      elapsedMs: Date.now() - startedAt,
      ...(imageType && { imageType }),
      ...(imageSize !== undefined && { imageSize }),
    });
  };

  try {
    logStage(stage, "started");
    const formData = await request.formData();
    const userId = formData.get("userId");
    const name = formData.get("name");
    const provider = formData.get("provider");
    const image = formData.get("image");
    const borderColorValue = formData.get("borderColor");
    const borderWidthValue = formData.get("borderWidth");
    const borderStyleValue = formData.get("borderStyle");
    logStage(stage, "completed");

    if (
      typeof userId !== "string" ||
      typeof name !== "string" ||
      typeof provider !== "string" ||
      !(image instanceof File)
    ) {
      logger.warn("api_payment_qr_upload_validation_failed", {
        requestId,
        stage: "validate_form",
        reason: "missing_required_fields",
      });
      return paymentQrResponse(
        {
          error: "Name, provider, user ID, and QR image are required",
          code: "MISSING_REQUIRED_FIELDS",
          stage: "validate_form",
          requestId,
        },
        400,
        requestId,
      );
    }
    if (!name.trim() || !provider.trim()) {
      logger.warn("api_payment_qr_upload_validation_failed", {
        requestId,
        stage: "validate_form",
        reason: "empty_name_or_provider",
      });
      return paymentQrResponse(
        {
          error: "Enter a name and payment provider",
          code: "INVALID_NAME_OR_PROVIDER",
          stage: "validate_form",
          requestId,
        },
        400,
        requestId,
      );
    }
    const borderColor =
      typeof borderColorValue === "string" ? borderColorValue : "#7C3AED";
    const borderWidth =
      typeof borderWidthValue === "string" ? Number(borderWidthValue) : 2;
    const borderStyle =
      typeof borderStyleValue === "string" ? borderStyleValue : "solid";
    if (!/^#[\da-f]{6}$/i.test(borderColor)) {
      return paymentQrResponse(
        {
          error: "Choose a valid 6-digit hex border color",
          code: "INVALID_BORDER_COLOR",
          stage: "validate_border",
          requestId,
        },
        400,
        requestId,
      );
    }
    if (!Number.isInteger(borderWidth) || borderWidth < 1 || borderWidth > 8) {
      return paymentQrResponse(
        {
          error: "Border thickness must be between 1 and 8 pixels",
          code: "INVALID_BORDER_WIDTH",
          stage: "validate_border",
          requestId,
        },
        400,
        requestId,
      );
    }
    if (!["solid", "dashed", "dotted"].includes(borderStyle)) {
      return paymentQrResponse(
        {
          error: "Choose a solid, dashed, or dotted border",
          code: "INVALID_BORDER_STYLE",
          stage: "validate_border",
          requestId,
        },
        400,
        requestId,
      );
    }
    imageType = image.type;
    imageSize = image.size;
    if (!ALLOWED_IMAGE_TYPES.has(image.type) || image.size > MAX_QR_BYTES) {
      logger.warn("api_payment_qr_upload_validation_failed", {
        requestId,
        stage: "validate_image",
        reason: !ALLOWED_IMAGE_TYPES.has(image.type)
          ? "unsupported_content_type"
          : "file_too_large",
        imageType,
        imageSize,
      });
      return paymentQrResponse(
        {
          error: "Use a PNG, JPEG, or WebP image under 500 KB",
          code: "INVALID_IMAGE",
          stage: "validate_image",
          requestId,
        },
        400,
        requestId,
      );
    }

    stage = "generate_upload_url";
    logStage(stage, "started");
    const uploadUrl = await convex.mutation(
      api.tasks.generatePaymentQrUploadUrl,
      { userId: userId as Id<"users"> },
    );
    logStage(stage, "completed");

    stage = "upload_image";
    logStage(stage, "started");
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": image.type },
      body: image,
    });
    if (!uploadResponse.ok) {
      throw new Error(
        `Convex image upload returned HTTP ${uploadResponse.status}`,
      );
    }
    logStage(stage, "completed");

    stage = "read_upload_result";
    logStage(stage, "started");
    const uploadResult = (await uploadResponse.json()) as {
      storageId: string;
    };
    const uploadedStorageId = uploadResult.storageId;
    if (!uploadedStorageId) {
      throw new Error("Convex image upload response did not include a storage ID");
    }
    logStage(stage, "completed");

    stage = "create_payment_method";
    logStage(stage, "started");
    const methodId = await convex.mutation(api.tasks.createPaymentMethod, {
      userId: userId as Id<"users">,
      name: name.trim(),
      provider: provider.trim(),
      storageId: uploadedStorageId as Id<"_storage">,
      borderColor,
      borderWidth,
      borderStyle: borderStyle as "solid" | "dashed" | "dotted",
    });
    logStage(stage, "completed");

    logger.info("api_payment_qr_upload_succeeded", {
      requestId,
      elapsedMs: Date.now() - startedAt,
      imageType,
      imageSize,
    });
    return paymentQrResponse(
      {
        success: true,
        methodId,
        requestId,
        elapsedMs: Date.now() - startedAt,
      },
      200,
      requestId,
    );
  } catch (error) {
    logger.error("api_payment_methods_post_failed", error as Error, {
      requestId,
      stage,
      elapsedMs: Date.now() - startedAt,
      ...(imageType && { imageType }),
      ...(imageSize !== undefined && { imageSize }),
    });
    return paymentQrResponse(
      {
        error: "Failed to save payment QR code",
        code: "PAYMENT_QR_SAVE_FAILED",
        stage,
        requestId,
      },
      500,
      requestId,
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
      userId: userId as Id<"users">,
      methodId: methodId as Id<"paymentMethods">,
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
