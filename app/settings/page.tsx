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
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@/components/ui/field";
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
  SettingsIcon,
  ZapIcon,
  SaveIcon,
  TrashIcon,
  UsersIcon,
  FileTextIcon,
  UserIcon,
} from "lucide-react";
import type { Settings } from "@/lib/types";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = React.useState<Settings>({
    electricityRate: 15,
  });
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [deleteLoading, setDeleteLoading] = React.useState<string | null>(null);

  // Load settings on mount
  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!session?.user?.id) {
      toast.error("User not authenticated");
      return;
    }

    try {
      const response = await fetch(`/api/settings?userId=${session.user.id}`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        toast.error("Failed to load settings");
      }
    } catch (error) {
      logger.error("settings_load_failed", error as Error);
      toast.error("Failed to load settings");
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Electricity rate validation
    if (!settings.electricityRate) {
      newErrors.electricityRate = "Please enter electricity rate";
    } else {
      const rate = settings.electricityRate;
      if (isNaN(rate) || rate <= 0) {
        newErrors.electricityRate =
          "Electricity rate must be a positive number";
      } else if (rate > 1000) {
        newErrors.electricityRate = "Electricity rate seems unusually high";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveSettings = async () => {
    if (!validateForm()) {
      toast.error("Please fix validation errors");
      return;
    }

    if (!session?.user?.id) {
      toast.error("User not authenticated");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          electricityRate: settings.electricityRate,
        }),
      });

      if (response.ok) {
        toast.success("Settings saved successfully");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to save settings");
      }
    } catch (error) {
      logger.error("settings_save_failed", error as Error);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSettings({ electricityRate: 15 });
    setErrors({});
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ZapIcon />
            Electricity Settings
          </CardTitle>
          <CardDescription>
            Configure the electricity rate used for invoice calculations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveSettings();
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="electricityRate">
                  Electricity Rate (Rs./unit) *
                </FieldLabel>
                <Input
                  id="electricityRate"
                  type="number"
                  step="0.01"
                  value={settings.electricityRate}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setSettings({ ...settings, electricityRate: value });
                    if (errors.electricityRate) {
                      setErrors((prev) => ({
                        ...prev,
                        electricityRate: "",
                      }));
                    }
                  }}
                  aria-invalid={!!errors.electricityRate}
                  required
                  placeholder="Enter electricity rate per unit"
                  className="transition-all duration-200 hover:border-primary focus:scale-[1.02]"
                />
                {errors.electricityRate && (
                  <FieldError>{errors.electricityRate}</FieldError>
                )}
                <FieldDescription>
                  This rate will be used for all new invoices. Existing invoices
                  will not be affected.
                </FieldDescription>
              </Field>

              <Field orientation="horizontal">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <SaveIcon className="h-4 w-4" />
                  {loading ? "Saving..." : "Save Settings"}
                </Button>
                <Button type="button" variant="outline" onClick={handleReset}>
                  Reset to Default
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="mt-6 bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">About Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-1.5"></div>
              <div>
                <p className="font-medium">Global Rate Setting</p>
                <p className="text-muted-foreground">
                  The electricity rate you set here will be used as the default
                  for all new invoices.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-1.5"></div>
              <div>
                <p className="font-medium">Existing Invoices</p>
                <p className="text-muted-foreground">
                  Changing this setting will not affect invoices that have
                  already been generated.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-1.5"></div>
              <div>
                <p className="font-medium">Rate Flexibility</p>
                <p className="text-muted-foreground">
                  You can update this rate anytime to reflect changes in utility
                  company pricing.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management Card */}
      <Card className="mt-6 border-destructive/20">
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
