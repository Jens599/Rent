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
import { SettingsIcon, ZapIcon, SaveIcon } from "lucide-react";
import type { Settings } from "@/lib/types";
import { toast } from "sonner";

export default function SettingsPage() {
  const [settings, setSettings] = React.useState<Settings>({
    electricityRate: 15,
  });
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Load settings on mount
  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        toast.error("Failed to load settings");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
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
      toast.error("Please fix the validation errors");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success("Settings saved successfully");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSettings({ electricityRate: 15 });
    setErrors({});
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
    </div>
  );
}
