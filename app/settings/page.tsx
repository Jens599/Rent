"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { logger } from "@/lib/logger";
import {
  ArrowUpDownIcon,
  GripVerticalIcon,
  SettingsIcon,
  TrashIcon,
  UsersIcon,
  FileTextIcon,
  UserIcon,
  QrCodeIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import type { PaymentMethod } from "@/lib/types";
import { PaymentQrCropDialog } from "@/components/payment-qr-crop-dialog";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [deleteLoading, setDeleteLoading] = React.useState<string | null>(null);
  const [settingsLoading, setSettingsLoading] = React.useState(true);
  const [settingsSaving, setSettingsSaving] = React.useState(false);
  const [moduleReorderMode, setModuleReorderMode] = React.useState<"drag" | "buttons">("buttons");
  const [paymentMethods, setPaymentMethods] = React.useState<PaymentMethod[]>([]);
  const [paymentName, setPaymentName] = React.useState("");
  const [paymentProvider, setPaymentProvider] = React.useState("Bank transfer");
  const [paymentImage, setPaymentImage] = React.useState<File | null>(null);
  const [croppedPaymentImage, setCroppedPaymentImage] =
    React.useState<File | null>(null);
  const [paymentCropOpen, setPaymentCropOpen] = React.useState(false);
  const [paymentBorderColor, setPaymentBorderColor] = React.useState("#7C3AED");
  const [paymentBorderWidth, setPaymentBorderWidth] = React.useState("2");
  const [paymentBorderStyle, setPaymentBorderStyle] =
    React.useState<"solid" | "dashed" | "dotted">("solid");
  const [paymentSaving, setPaymentSaving] = React.useState(false);

  React.useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated" || !session?.user?.id) {
      setSettingsLoading(false);
      return;
    }

    const loadSettings = async () => {
      setSettingsLoading(true);
      try {
        const [response, paymentResponse] = await Promise.all([
          fetch(`/api/settings?userId=${session.user.id}`),
          fetch(`/api/payment-methods?userId=${session.user.id}`),
        ]);
        if (!response.ok) throw new Error("Failed to load settings");
        if (!paymentResponse.ok) throw new Error("Failed to load payment methods");
        const [data, methods] = await Promise.all([
          response.json(),
          paymentResponse.json(),
        ]);
        setModuleReorderMode(data.moduleReorderMode === "drag" ? "drag" : "buttons");
        setPaymentMethods(methods);
      } catch (error) {
        toast.error("Failed to load preferences");
      } finally {
        setSettingsLoading(false);
      }
    };

    loadSettings();
  }, [status, session?.user?.id]);

  const savePaymentMethod = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session?.user?.id || !croppedPaymentImage) {
      toast.error("Choose an image and apply a crop first");
      return;
    }
    setPaymentSaving(true);
    try {
      const formData = new FormData();
      formData.set("userId", session.user.id);
      formData.set("name", paymentName.trim() || paymentProvider);
      formData.set("provider", paymentProvider);
      formData.set("image", croppedPaymentImage);
      formData.set("borderColor", paymentBorderColor);
      formData.set("borderWidth", paymentBorderWidth);
      formData.set("borderStyle", paymentBorderStyle);
      const response = await fetch("/api/payment-methods", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) {
        const diagnostic = {
          status: response.status,
          code: result.code,
          stage: result.stage,
          requestId: result.requestId ?? response.headers.get("X-Request-ID"),
        };
        console.error("[payment-qr-upload] request failed", diagnostic);
        toast.error(result.error || "Upload failed", {
          description: [
            result.stage && `Stage: ${result.stage}`,
            diagnostic.requestId && `Request ID: ${diagnostic.requestId}`,
          ]
            .filter(Boolean)
            .join(" · "),
        });
        return;
      }

      const methodsResponse = await fetch(
        `/api/payment-methods?userId=${session.user.id}`,
      );
      if (!methodsResponse.ok) throw new Error("Could not refresh payment methods");
      setPaymentMethods(await methodsResponse.json());
      setPaymentName("");
      setPaymentImage(null);
      setCroppedPaymentImage(null);
      setPaymentBorderColor("#7C3AED");
      setPaymentBorderWidth("2");
      setPaymentBorderStyle("solid");
      const fileInput = document.getElementById(
        "payment-qr-image",
      ) as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
      toast.success("Payment QR saved");
    } catch (error) {
      console.error("[payment-qr-upload] network or response error", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save payment QR",
      );
    } finally {
      setPaymentSaving(false);
    }
  };

  const removePaymentMethod = async (method: PaymentMethod) => {
    if (!session?.user?.id) return;
    if (
      !window.confirm(
        `Remove ${method.name}? Existing invoices will keep their saved QR image.`,
      )
    ) {
      return;
    }
    try {
      const response = await fetch("/api/payment-methods", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          methodId: method._id,
        }),
      });
      if (!response.ok) throw new Error("Failed to remove payment QR");
      setPaymentMethods((current) =>
        current.filter((item) => item._id !== method._id),
      );
      toast.success("Payment QR removed");
    } catch {
      toast.error("Failed to remove payment QR");
    }
  };

  const saveModuleReorderMode = async (mode: "drag" | "buttons") => {
    if (!session?.user?.id) {
      toast.error("User not authenticated");
      return;
    }

    const previousMode = moduleReorderMode;
    setModuleReorderMode(mode);
    setSettingsSaving(true);

    try {
      const currentResponse = await fetch(`/api/settings?userId=${session.user.id}`);
      const currentSettings = currentResponse.ok ? await currentResponse.json() : { electricityRate: 15 };
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          electricityRate: currentSettings.electricityRate || 15,
          moduleReorderMode: mode,
        }),
      });

      if (!response.ok) throw new Error("Failed to save settings");
      toast.success("Module reorder preference saved");
    } catch (error) {
      setModuleReorderMode(previousMode);
      toast.error("Failed to save preference");
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleDeleteAllInvoices = async () => {
    if (!session?.user?.id) {
      toast.error("User not authenticated");
      return;
    }

    setDeleteLoading("invoices");
    try {
      const response = await fetch("/api/settings/delete-invoices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Successfully deleted ${data.count} invoices`);
      } else {
        toast.error("Failed to delete invoices");
      }
    } catch (error) {
      logger.error("settings_delete_invoices_failed", error as Error);
      toast.error("Failed to delete invoices");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleDeleteAllTenants = async () => {
    if (!session?.user?.id) {
      toast.error("User not authenticated");
      return;
    }

    setDeleteLoading("tenants");
    try {
      const response = await fetch("/api/settings/delete-tenants", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Successfully deleted ${data.count} tenants`);
      } else {
        toast.error("Failed to delete tenants");
      }
    } catch (error) {
      logger.error("settings_delete_tenants_failed", error as Error);
      toast.error("Failed to delete tenants");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (!session?.user?.id) {
      toast.error("User not authenticated");
      return;
    }

    setDeleteLoading("account");
    try {
      const response = await fetch("/api/settings/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id }),
      });

      if (response.ok) {
        toast.success("Account deleted successfully");
        // Redirect to sign in page after account deletion
        window.location.href = "/auth/signin";
      } else {
        toast.error("Failed to delete account");
      }
    } catch (error) {
      logger.error("settings_delete_account_failed", error as Error);
      toast.error("Failed to delete account");
    } finally {
      setDeleteLoading(null);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <SettingsIcon />
          Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your application settings and preferences
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Payment QR codes</CardTitle>
          <CardDescription>
            Save bank, eSewa, Khalti, or other payment QR images. Choose which
            ones to include while creating each invoice.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={savePaymentMethod} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">
                Payment provider
                <select
                  value={paymentProvider}
                  onChange={(event) => setPaymentProvider(event.target.value)}
                  className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm"
                >
                  <option>Bank transfer</option>
                  <option>eSewa</option>
                  <option>Khalti</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium">
                Display name
                <Input
                  value={paymentName}
                  onChange={(event) => setPaymentName(event.target.value)}
                  placeholder="Optional, e.g. Rent account"
                  maxLength={60}
                />
              </label>
              <label className="space-y-2 text-sm font-medium sm:col-span-2">
                QR image (PNG, JPEG, or WebP; up to 500 KB)
                <Input
                  id="payment-qr-image"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    if (!file) return;
                    if (
                      file.size > 500_000 ||
                      !["image/png", "image/jpeg", "image/webp"].includes(
                        file.type,
                      )
                    ) {
                      toast.error("Choose a PNG, JPEG, or WebP image under 500 KB");
                      event.target.value = "";
                      setPaymentImage(null);
                      setCroppedPaymentImage(null);
                      return;
                    }
                    setPaymentImage(file);
                    setCroppedPaymentImage(null);
                    setPaymentCropOpen(true);
                  }}
                />
                <span className="block text-xs font-normal text-muted-foreground">
                  {croppedPaymentImage
                    ? `Cropped and ready: ${croppedPaymentImage.name}`
                    : paymentImage
                      ? "Crop this image before saving."
                      : "Select an image, then auto-detect or frame the QR manually."}
                </span>
              </label>
            </div>
            <div className="grid gap-4 rounded-md border bg-muted/20 p-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="space-y-2 text-sm font-medium">
                  Border color
                  <Input
                    type="color"
                    value={paymentBorderColor}
                    onChange={(event) =>
                      setPaymentBorderColor(event.target.value.toUpperCase())
                    }
                    className="h-10 w-full cursor-pointer p-1"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  Thickness
                  <select
                    value={paymentBorderWidth}
                    onChange={(event) => setPaymentBorderWidth(event.target.value)}
                    className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((width) => (
                      <option key={width} value={width}>
                        {width} px
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium">
                  Border style
                  <select
                    value={paymentBorderStyle}
                    onChange={(event) =>
                      setPaymentBorderStyle(
                        event.target.value as "solid" | "dashed" | "dotted",
                      )
                    }
                    className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                  </select>
                </label>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div
                  className="grid size-12 shrink-0 place-items-center bg-white"
                  style={{
                    borderColor: paymentBorderColor,
                    borderWidth: `${paymentBorderWidth}px`,
                    borderStyle: paymentBorderStyle,
                  }}
                  aria-label="Payment QR border preview"
                >
                  <QrCodeIcon className="size-7 text-slate-700" />
                </div>
                Preview for this payment method
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {paymentImage && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPaymentCropOpen(true)}
                >
                  Adjust crop
                </Button>
              )}
              <Button
                type="submit"
                disabled={paymentSaving || !croppedPaymentImage}
              >
                {paymentSaving ? "Saving QR…" : "Add payment QR"}
              </Button>
            </div>
          </form>

          {paymentMethods.length > 0 && (
            <div className="grid gap-3 border-t pt-5 sm:grid-cols-2">
              {paymentMethods.map((method) => (
                <div
                  key={method._id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  {method.imageUrl && (
                    <div
                      className="size-16 shrink-0 bg-white p-0.5"
                      style={{
                        borderColor: method.borderColor ?? "#7C3AED",
                        borderWidth: `${method.borderWidth ?? 2}px`,
                        borderStyle: method.borderStyle ?? "solid",
                      }}
                    >
                      <Image
                        src={method.imageUrl}
                        alt={`${method.provider} QR code`}
                        width={64}
                        height={64}
                        unoptimized
                        className="size-full object-contain"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{method.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {method.provider}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${method.name}`}
                    onClick={() => removePaymentMethod(method)}
                  >
                    <TrashIcon className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <PaymentQrCropDialog
            file={paymentImage}
            open={paymentCropOpen}
            onOpenChange={setPaymentCropOpen}
            onApply={setCroppedPaymentImage}
          />
        </CardContent>
      </Card>

      <Card className="mb-6 overflow-hidden border-primary/15 bg-gradient-to-br from-background to-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDownIcon className="h-5 w-5" />
            Module Reordering
          </CardTitle>
          <CardDescription>
            Choose how calculation modules are reordered in the module editor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 rounded-2xl border bg-background/80 p-2 shadow-sm sm:grid-cols-2">
            <button
              type="button"
              disabled={settingsLoading || settingsSaving}
              onClick={() => saveModuleReorderMode("drag")}
              className={`rounded-xl border p-4 text-left transition-all ${
                moduleReorderMode === "drag"
                  ? "border-primary bg-primary text-primary-foreground shadow-md"
                  : "border-transparent hover:bg-muted/70"
              }`}
            >
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <GripVerticalIcon className="h-4 w-4" />
                Drag Handles
              </div>
              <p className={`text-sm ${moduleReorderMode === "drag" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                Sleek drag-and-drop ordering with touch support.
              </p>
            </button>
            <button
              type="button"
              disabled={settingsLoading || settingsSaving}
              onClick={() => saveModuleReorderMode("buttons")}
              className={`rounded-xl border p-4 text-left transition-all ${
                moduleReorderMode === "buttons"
                  ? "border-primary bg-primary text-primary-foreground shadow-md"
                  : "border-transparent hover:bg-muted/70"
              }`}
            >
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <ArrowUpDownIcon className="h-4 w-4" />
                Arrow Buttons
              </div>
              <p className={`text-sm ${moduleReorderMode === "buttons" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                Precise up/down controls as a reliable backup.
              </p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Data Management Card */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <TrashIcon />
            Data Management
          </CardTitle>
          <CardDescription>
            Dangerous operations that cannot be undone. Please be careful.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-destructive rounded-full mt-1.5"></div>
              <div>
                <p className="font-medium">Delete All Invoices</p>
                <p className="text-muted-foreground text-sm">
                  Remove all invoice history for your account. This action
                  cannot be undone.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deleteLoading === "invoices"}
                      className="mt-2"
                    >
                      {deleteLoading === "invoices" ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <FileTextIcon className="h-4 w-4 mr-2" />
                          Delete All Invoices
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete All Invoices?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all your invoices. This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAllInvoices}
                        className="bg-destructive text-destructive-foreground"
                      >
                        Delete All Invoices
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-destructive rounded-full mt-1.5"></div>
              <div>
                <p className="font-medium">Delete All Tenants</p>
                <p className="text-muted-foreground text-sm">
                  Remove all tenant information for your account. This action
                  cannot be undone.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deleteLoading === "tenants"}
                      className="mt-2"
                    >
                      {deleteLoading === "tenants" ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <UsersIcon className="h-4 w-4 mr-2" />
                          Delete All Tenants
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete All Tenants?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all your tenants. This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAllTenants}
                        className="bg-destructive text-destructive-foreground"
                      >
                        Delete All Tenants
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-destructive rounded-full mt-1.5"></div>
              <div>
                <p className="font-medium">Delete Account</p>
                <p className="text-muted-foreground text-sm">
                  Permanently delete your account and all associated data. This
                  action cannot be undone.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deleteLoading === "account"}
                      className="mt-2"
                    >
                      {deleteLoading === "account" ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <UserIcon className="h-4 w-4 mr-2" />
                          Delete Account
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Account?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete your account, all invoices,
                        all tenants, and all settings. This action cannot be
                        undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground"
                      >
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
