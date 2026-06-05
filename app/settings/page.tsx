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
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [deleteLoading, setDeleteLoading] = React.useState<string | null>(null);
  const [settingsLoading, setSettingsLoading] = React.useState(true);
  const [settingsSaving, setSettingsSaving] = React.useState(false);
  const [moduleReorderMode, setModuleReorderMode] = React.useState<"drag" | "buttons">("buttons");

  React.useEffect(() => {
    if (!session?.user?.id) return;

    const loadSettings = async () => {
      setSettingsLoading(true);
      try {
        const response = await fetch(`/api/settings?userId=${session.user.id}`);
        if (!response.ok) throw new Error("Failed to load settings");
        const data = await response.json();
        setModuleReorderMode(data.moduleReorderMode === "drag" ? "drag" : "buttons");
      } catch (error) {
        toast.error("Failed to load preferences");
      } finally {
        setSettingsLoading(false);
      }
    };

    loadSettings();
  }, [session?.user?.id]);

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
