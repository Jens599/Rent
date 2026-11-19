"use client";

import * as React from "react";
import Cropper, { type Area } from "react-easy-crop";
import { CropIcon, ScanLineIcon, ZoomInIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MAX_IMAGE_BYTES = 500_000;

interface PaymentQrCropDialogProps {
  file: File | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (file: File) => void;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read this image"));
    image.src = src;
  });
}

async function findQrArea(imageUrl: string): Promise<Area | null> {
  const image = await loadImage(imageUrl);
  const scale = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Image processing is unavailable in this browser");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const { default: jsQR } = await import("jsqr");
  const result = jsQR(
    context.getImageData(0, 0, canvas.width, canvas.height).data,
    canvas.width,
    canvas.height,
    { inversionAttempts: "attemptBoth" },
  );
  if (!result) return null;

  const corners = [
    result.location.topLeftCorner,
    result.location.topRightCorner,
    result.location.bottomRightCorner,
    result.location.bottomLeftCorner,
  ];
  const sourceScale = 1 / scale;
  const xs = corners.map((corner) => corner.x * sourceScale);
  const ys = corners.map((corner) => corner.y * sourceScale);
  const boxWidth = Math.max(...xs) - Math.min(...xs);
  const boxHeight = Math.max(...ys) - Math.min(...ys);
  const side = Math.min(
    Math.max(boxWidth, boxHeight) * 1.16,
    image.naturalWidth,
    image.naturalHeight,
  );
  const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
  const left = Math.max(0, Math.min(image.naturalWidth - side, centerX - side / 2));
  const top = Math.max(0, Math.min(image.naturalHeight - side, centerY - side / 2));

  return {
    x: (left / image.naturalWidth) * 100,
    y: (top / image.naturalHeight) * 100,
    width: (side / image.naturalWidth) * 100,
    height: (side / image.naturalHeight) * 100,
  };
}

async function createCroppedFile(
  imageUrl: string,
  file: File,
  crop: Area,
): Promise<File> {
  const image = await loadImage(imageUrl);
  const scale = Math.min(1, 1600 / Math.max(crop.width, crop.height));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image processing is unavailable in this browser");

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const outputScale = scale * 0.86 ** attempt;
    canvas.width = Math.max(1, Math.round(crop.width * outputScale));
    canvas.height = Math.max(1, Math.round(crop.height * outputScale));
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.96),
    );
    if (blob && blob.size <= MAX_IMAGE_BYTES) {
      const baseName = file.name.replace(/\.[^.]+$/, "") || "payment-qr";
      const outputType = blob.type || "image/png";
      const extension = outputType === "image/webp" ? "webp" : "png";
      return new File([blob], `${baseName}-cropped.${extension}`, {
        type: outputType,
        lastModified: Date.now(),
      });
    }
  }

  throw new Error("The cropped image is still over 500 KB. Zoom out and try again.");
}

export function PaymentQrCropDialog({
  file,
  open,
  onOpenChange,
  onApply,
}: PaymentQrCropDialogProps) {
  const [imageUrl, setImageUrl] = React.useState("");
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [initialArea, setInitialArea] = React.useState<Area>();
  const [cropperKey, setCropperKey] = React.useState(0);
  const [croppedArea, setCroppedArea] = React.useState<Area>();
  const [detecting, setDetecting] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);

  React.useEffect(() => {
    if (!file) {
      setImageUrl("");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setImageUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  React.useEffect(() => {
    if (!open) {
      setInitialArea(undefined);
      setCroppedArea(undefined);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    }
  }, [open]);

  const autoCrop = async () => {
    if (!imageUrl) return;
    setDetecting(true);
    try {
      const area = await findQrArea(imageUrl);
      if (!area) {
        toast.warning("No QR code found. Adjust the square crop manually.");
        return;
      }
      setInitialArea(area);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedArea(undefined);
      setCropperKey((current) => current + 1);
      toast.success("QR code found. Review the crop before applying it.");
    } catch (error) {
      console.error("[payment-qr-crop] auto-detection failed", error);
      toast.error("Could not detect the QR code. You can still crop it manually.");
    } finally {
      setDetecting(false);
    }
  };

  const startManualCrop = () => {
    setInitialArea(undefined);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedArea(undefined);
    setCropperKey((current) => current + 1);
  };

  const applyCrop = async () => {
    if (!file || !imageUrl || !croppedArea) return;
    setProcessing(true);
    try {
      onApply(await createCroppedFile(imageUrl, file, croppedArea));
      onOpenChange(false);
    } catch (error) {
      console.error("[payment-qr-crop] image processing failed", error);
      toast.error(
        error instanceof Error ? error.message : "Could not process this image",
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl gap-5">
        <DialogHeader>
          <DialogTitle>Frame the payment QR</DialogTitle>
          <DialogDescription>
            Auto-detect finds the QR code; drag the image and adjust zoom to
            fine-tune the square crop.
          </DialogDescription>
        </DialogHeader>

        {imageUrl ? (
          <>
            <div className="relative mx-auto aspect-square w-full max-w-[420px] overflow-hidden rounded-md bg-slate-950">
              <Cropper
                key={cropperKey}
                image={imageUrl}
                crop={crop}
                zoom={zoom}
                rotation={0}
                aspect={1}
                minZoom={1}
                maxZoom={5}
                zoomSpeed={1}
                cropShape="rect"
                objectFit="contain"
                showGrid
                restrictPosition
                initialCroppedAreaPercentages={initialArea}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, pixels) => setCroppedArea(pixels)}
                style={{
                  cropAreaStyle: {
                    border: "2px solid #a855f7",
                    color: "#a855f7",
                  },
                }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={startManualCrop}
                disabled={detecting || processing}
              >
                <CropIcon />
                Manual crop
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={autoCrop}
                disabled={detecting || processing}
              >
                <ScanLineIcon />
                {detecting ? "Finding QR…" : "Auto-detect QR"}
              </Button>
              <label className="flex min-w-48 flex-1 items-center gap-3 text-sm text-muted-foreground">
                <ZoomInIcon className="size-4 shrink-0" />
                <span className="sr-only">Crop zoom</span>
                <input
                  aria-label="Crop zoom"
                  type="range"
                  min="1"
                  max="5"
                  step="0.05"
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                  className="w-full accent-primary"
                />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              The saved image is cropped to a square and optimized as WebP,
              keeping it under the 500 KB upload limit.
            </p>
          </>
        ) : (
          <div className="grid aspect-square place-items-center rounded-md bg-muted text-sm text-muted-foreground">
            Preparing image…
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={applyCrop}
            disabled={!croppedArea || processing || !imageUrl}
          >
            {processing ? "Processing…" : "Use this crop"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
