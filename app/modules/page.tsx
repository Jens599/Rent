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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  CalculatorIcon,
  GripVerticalIcon,
  PlusIcon,
  RotateCcwIcon,
  SaveIcon,
  TrashIcon,
  TestTubeIcon,
} from "lucide-react";
import type { CalculationModuleConfig, CalculationModuleInput } from "@/lib/calculations/types";

interface CalculationModulePreset {
  _id: string;
  name: string;
  description?: string;
  modules: CalculationModuleConfig[];
  createdAt: string;
  updatedAt: string;
}

const emptyModule: CalculationModuleConfig = {
  name: "",
  description: "",
  enabled: true,
  order: 1,
  category: "custom",
  inputs: [],
  formula: "",
  output: { key: "", label: "", format: "currency" },
  dependencies: [],
};

const builtInVariables = [
  { key: "tenantBaseRent", label: "Tenant Base Rent" },
  { key: "previousMonthReading", label: "Previous Meter Reading" },
  { key: "currentMonthReading", label: "Current Meter Reading" },
  { key: "electricityRate", label: "Electricity Rate" },
];

function sanitizeKey(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9_\s-]/g, "")
    .replace(/[\s-]+(.)/g, (_, char) => char.toUpperCase())
    .replace(/^[A-Z]/, (char) => char.toLowerCase());
}

function inferDependencies(module: CalculationModuleConfig, modules: CalculationModuleConfig[]) {
  const outputByKey = new Map(modules.filter((item) => item._id !== module._id).map((item) => [item.output.key, item]));
  const formulaTokens = module.formula.match(/[a-zA-Z_][a-zA-Z0-9_.]*/g) || [];

  return [...new Set(formulaTokens)]
    .map((token) => outputByKey.get(token))
    .filter(Boolean)
    .map((dependency) => ({
      moduleId: dependency!.name,
      outputKey: dependency!.output.key,
    }));
}

function formatValue(value: number, format: string) {
  if (format === "currency") {
    return `Rs. ${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (format === "percent") return `${value.toFixed(2)}%`;
  return value.toFixed(2);
}

export default function ModulesPage() {
  const [modules, setModules] = React.useState<CalculationModuleConfig[]>([]);
  const [presets, setPresets] = React.useState<CalculationModulePreset[]>([]);
  const [selectedModule, setSelectedModule] = React.useState<CalculationModuleConfig>(emptyModule);
  const [activePresetId, setActivePresetId] = React.useState<string | null>(null);
  const [activePresetName, setActivePresetName] = React.useState("");
  const [activePresetDescription, setActivePresetDescription] = React.useState("");
  const [showModuleSetup, setShowModuleSetup] = React.useState(false);
  const [showPresetForm, setShowPresetForm] = React.useState(false);
  const [showPresetDetails, setShowPresetDetails] = React.useState(false);
  const [editingInputIndex, setEditingInputIndex] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [presetSaving, setPresetSaving] = React.useState(false);
  const [resettingModules, setResettingModules] = React.useState(false);
  const [presetName, setPresetName] = React.useState("");
  const [presetDescription, setPresetDescription] = React.useState("");
  const [errors, setErrors] = React.useState<string[]>([]);
  const [previewInputs, setPreviewInputs] = React.useState<Record<string, string>>({
    tenantBaseRent: "20000",
    previousMonthReading: "100",
    currentMonthReading: "160",
    electricityRate: "15",
  });
  const [preview, setPreview] = React.useState<any>(null);
  const [draggedModuleIndex, setDraggedModuleIndex] = React.useState<number | null>(null);
  const [dropTarget, setDropTarget] = React.useState<{ index: number; position: "before" | "after" } | null>(null);
  const moduleRowRefs = React.useRef<Array<HTMLDivElement | null>>([]);
  const activePointerId = React.useRef<number | null>(null);

  React.useEffect(() => {
    loadModules();
    loadPresets();
  }, []);

  const loadModules = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/calculation-modules");
      if (!response.ok) throw new Error("Failed to load modules");
      const data = await response.json();
      setModules(data);
      setSelectedModule(data[0] || emptyModule);
      const electricityModule = data.find(
        (item: CalculationModuleConfig) => item.output.key === "electricityCost",
      );
      const electricityRateInput = electricityModule?.inputs.find(
        (input: CalculationModuleInput) => input.key === "electricityRate",
      );
      if (electricityRateInput?.defaultValue !== undefined) {
        setPreviewInputs((current) => ({
          ...current,
          electricityRate: String(electricityRateInput.defaultValue),
        }));
      }
    } catch (error) {
      toast.error("Failed to load calculation modules");
    } finally {
      setLoading(false);
    }
  };

  const loadPresets = async () => {
    try {
      const response = await fetch("/api/calculation-module-presets");
      if (!response.ok) throw new Error("Failed to load presets");
      const data = await response.json();
      setPresets(data);
    } catch (error) {
      toast.error("Failed to load billing presets");
    }
  };

  const resetModulesToDefault = async () => {
    setResettingModules(true);
    try {
      const response = await fetch("/api/calculation-modules/reset", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Failed to reset modules");
        return;
      }

      const data = await response.json();
      toast.success(`Reset ${data.count} modules to defaults`);
      setPreview(null);
      await loadModules();
    } catch (error) {
      toast.error("Failed to reset modules");
    } finally {
      setResettingModules(false);
    }
  };

  const saveCurrentPreset = async () => {
    const name = presetName.trim();
    if (!name) {
      toast.error("Preset name is required");
      return;
    }

    setPresetSaving(true);
    try {
      const response = await fetch("/api/calculation-module-presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: presetDescription.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to save preset");
        return;
      }

      toast.success("Billing preset saved");
      setPresetName("");
      setPresetDescription("");
      setShowPresetForm(false);
      await loadPresets();
    } catch (error) {
      toast.error("Failed to save preset");
    } finally {
      setPresetSaving(false);
    }
  };

  const applyPreset = async (presetId: string, edit = false) => {
    const preset = presets.find((item) => item._id === presetId);
    try {
      const response = await fetch("/api/calculation-module-presets/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presetId }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to apply preset");
        return;
      }

      toast.success(`Applied preset with ${data.count} modules`);
      setPreview(null);
      await loadModules();
      await loadPresets();
      if (edit) {
        setActivePresetId(presetId);
        setActivePresetName(preset?.name || "");
        setActivePresetDescription(preset?.description || "");
        setShowModuleSetup(true);
      }
    } catch (error) {
      toast.error("Failed to apply preset");
    }
  };

  const editPreset = async (presetId: string) => {
    await applyPreset(presetId, true);
  };

  const saveActivePresetChanges = async () => {
    if (!activePresetId) {
      toast.error("No preset is currently being edited");
      return;
    }

    await persistActivePresetSnapshot(true);
  };

  const persistActivePresetSnapshot = async (showToast = false) => {
    if (!activePresetId) return;

    setPresetSaving(true);
    try {
      const response = await fetch("/api/calculation-module-presets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presetId: activePresetId,
          name: activePresetName,
          description: activePresetDescription,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to save preset changes");
        return;
      }

      if (showToast) toast.success("Preset changes saved");
      await loadPresets();
    } catch (error) {
      toast.error("Failed to save preset changes");
    } finally {
      setPresetSaving(false);
    }
  };

  const deletePreset = async (presetId: string) => {
    try {
      const response = await fetch(`/api/calculation-module-presets?id=${presetId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Failed to delete preset");
        return;
      }

      toast.success("Billing preset deleted");
      await loadPresets();
    } catch (error) {
      toast.error("Failed to delete preset");
    }
  };

  const updateSelected = (updates: Partial<CalculationModuleConfig>) => {
    setSelectedModule((current) => ({ ...current, ...updates }));
    setErrors([]);
  };

  const persistModuleOrder = async (orderedModules: CalculationModuleConfig[]) => {
    try {
      await Promise.all(
        orderedModules.map((calculationModule) =>
          fetch("/api/calculation-modules", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...calculationModule,
              moduleId: calculationModule._id,
            }),
          }),
        ),
      );
    } catch (error) {
      toast.error("Failed to save module order");
    }
  };

  const reorderModules = async (fromIndex: number, targetIndex: number) => {
    if (fromIndex === targetIndex || fromIndex + 1 === targetIndex) return;

    const reordered = [...modules];
    const [movedModule] = reordered.splice(fromIndex, 1);
    const adjustedTargetIndex = fromIndex < targetIndex ? targetIndex - 1 : targetIndex;
    reordered.splice(adjustedTargetIndex, 0, movedModule);

    const orderedModules = reordered.map((calculationModule, moduleIndex) => ({
      ...calculationModule,
      order: moduleIndex + 1,
    }));

    setModules(orderedModules);
    setSelectedModule((current) =>
      orderedModules.find((calculationModule) => calculationModule._id === current._id) || current,
    );
    await persistModuleOrder(orderedModules);
    if (activePresetId) await persistActivePresetSnapshot();
    toast.success("Module order updated");
  };

  const updateDropTargetFromPointer = (clientY: number) => {
    let closestIndex = -1;
    let closestPosition: "before" | "after" = "before";
    let closestDistance = Number.POSITIVE_INFINITY;

    moduleRowRefs.current.forEach((row, index) => {
      if (!row) return;
      const rect = row.getBoundingClientRect();
      const beforeDistance = Math.abs(clientY - rect.top);
      const afterDistance = Math.abs(clientY - rect.bottom);
      const position = beforeDistance <= afterDistance ? "before" : "after";
      const distance = beforeDistance <= afterDistance ? beforeDistance : afterDistance;

      if (distance < closestDistance) {
        closestIndex = index;
        closestPosition = position;
        closestDistance = distance;
      }
    });

    if (closestIndex >= 0) {
      setDropTarget({ index: closestIndex, position: closestPosition });
    }
  };

  const finishPointerReorder = async () => {
    if (draggedModuleIndex !== null && dropTarget) {
      const targetIndex = dropTarget.position === "before"
        ? dropTarget.index
        : dropTarget.index + 1;
      await reorderModules(draggedModuleIndex, targetIndex);
    }
    activePointerId.current = null;
    setDraggedModuleIndex(null);
    setDropTarget(null);
  };

  React.useEffect(() => {
    if (draggedModuleIndex === null) return;

    const handlePointerMove = (event: PointerEvent) => {
      if (activePointerId.current !== null && event.pointerId !== activePointerId.current) return;
      event.preventDefault();
      updateDropTargetFromPointer(event.clientY);
    };

    const handlePointerUp = async (event: PointerEvent) => {
      if (activePointerId.current !== null && event.pointerId !== activePointerId.current) return;
      await finishPointerReorder();
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [draggedModuleIndex, dropTarget]);

  const insertFormulaToken = (token: string) => {
    updateSelected({ formula: `${selectedModule.formula}${selectedModule.formula ? " " : ""}${token}` });
  };

  const addInput = () => {
    const input: CalculationModuleInput = {
      key: `input${selectedModule.inputs.length + 1}`,
      label: "New Input",
      type: "number",
      required: true,
      exposed: true,
      defaultValue: 0,
      helpText: "Enter the amount or rate used by this billing rule.",
    };
    updateSelected({ inputs: [...selectedModule.inputs, input] });
    setEditingInputIndex(selectedModule.inputs.length);
  };

  const updateInput = (index: number, updates: Partial<CalculationModuleInput>) => {
    updateSelected({
      inputs: selectedModule.inputs.map((input, inputIndex) =>
        inputIndex === index ? { ...input, ...updates } : input,
      ),
    });
  };

  const removeInput = (index: number) => {
    updateSelected({ inputs: selectedModule.inputs.filter((_, inputIndex) => inputIndex !== index) });
    setEditingInputIndex(null);
  };

  const saveModule = async () => {
    setSaving(true);
    const dependencies = inferDependencies(selectedModule, modules);
    const payload = { ...selectedModule, dependencies };

    try {
      const response = await fetch("/api/calculation-modules", {
        method: selectedModule._id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedModule._id ? { ...payload, moduleId: selectedModule._id } : payload),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrors(data.errors || [data.error || "Failed to save module"]);
        return;
      }

      toast.success("Calculation module saved");
      if (activePresetId) await persistActivePresetSnapshot();
      await loadModules();
      setSelectedModule(data);
    } catch (error) {
      toast.error("Failed to save module");
    } finally {
      setSaving(false);
    }
  };

  const deleteModule = async () => {
    if (!selectedModule._id) return;
    try {
      const response = await fetch(`/api/calculation-modules?id=${selectedModule._id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete module");
      toast.success("Calculation module deleted");
      await loadModules();
    } catch (error) {
      toast.error("Failed to delete module");
    }
  };

  const runPreview = async () => {
    const dependencies = inferDependencies(selectedModule, modules);
    const draftModules = modules.map((calculationModule) =>
      calculationModule._id === selectedModule._id ? { ...selectedModule, dependencies } : calculationModule,
    );
    const modulesForPreview = selectedModule._id ? draftModules : [...draftModules, { ...selectedModule, dependencies }];

    const response = await fetch("/api/calculation-modules/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modules: modulesForPreview, inputs: previewInputs }),
    });
    const data = await response.json();
    setPreview(data);
    if (data.errors?.length) setErrors(data.errors);
    else toast.success("Preview calculated successfully");
  };

  const availableVariables = [
    ...builtInVariables,
    ...selectedModule.inputs.map((input) => ({ key: input.key, label: input.label })),
    ...modules
      .filter((calculationModule) => calculationModule._id !== selectedModule._id)
      .map((calculationModule) => ({ key: calculationModule.output.key, label: `${calculationModule.name} Output` })),
  ];
  const dependencies = inferDependencies(selectedModule, modules);

  if (loading) {
    return <div className="container mx-auto p-6">Loading calculation modules...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalculatorIcon /> Calculation Modules
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Build rent calculations from configurable modules, formulas, inputs, and dependencies.
          </p>
        </div>
        {showModuleSetup && (
          <div className="flex flex-wrap gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowModuleSetup(false);
                setActivePresetId(null);
                setActivePresetName("");
                setActivePresetDescription("");
              }}
            >
              Back to Presets
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={resettingModules}>
                  <RotateCcwIcon className="h-4 w-4" />
                  {resettingModules ? "Resetting..." : "Reset Modules"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset calculation modules?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete custom modules and restore the default rent,
                    electricity usage, electricity charge, and final total modules.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={resetModulesToDefault}>
                    Reset Modules
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button onClick={() => setSelectedModule({ ...emptyModule, order: modules.length + 1 })}>
              <PlusIcon className="h-4 w-4" /> New Module
            </Button>
          </div>
        )}
      </div>

      {!showModuleSetup ? (
      <Card>
        <CardHeader>
          <CardTitle>Select Billing Preset</CardTitle>
          <CardDescription>
            Choose a saved billing setup before editing calculation modules.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showPresetForm ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPresetForm(true)}
            >
              <PlusIcon className="h-4 w-4" /> Add New Preset
            </Button>
          ) : (
            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
                  <Field>
                    <FieldLabel>Preset Name</FieldLabel>
                    <Input
                      value={presetName}
                      onChange={(event) => setPresetName(event.target.value)}
                      placeholder="Standard monthly billing"
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Description</FieldLabel>
                    <Input
                      value={presetDescription}
                      onChange={(event) => setPresetDescription(event.target.value)}
                      placeholder="Base rent + electricity"
                    />
                  </Field>
                  <div className="flex items-end">
                    <Button onClick={saveCurrentPreset} disabled={presetSaving} className="w-full">
                      <SaveIcon className="h-4 w-4" />
                      {presetSaving ? "Saving..." : "Save Preset"}
                    </Button>
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setPresetName("");
                        setPresetDescription("");
                        setShowPresetForm(false);
                      }}
                      className="w-full"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {presets.length === 0 ? (
            <div className="text-center py-8">
              <CalculatorIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No billing presets saved</p>
              <p className="text-sm text-muted-foreground mt-1">
                Continue to module setup, configure your modules, then save the setup as a preset.
              </p>
              <Button className="mt-4" onClick={() => setShowModuleSetup(true)}>
                Edit Modules
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {presets.map((preset) => (
                  <Card key={preset._id} className="transition-all border-2">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <h3 className="font-semibold">{preset.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {preset.description || `${preset.modules.length} saved modules`}
                            </p>
                          </div>
                          <Badge variant="secondary">{preset.modules.length} modules</Badge>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">Includes</p>
                          <div className="flex flex-wrap gap-2">
                            {preset.modules.slice(0, 4).map((savedModule) => (
                              <Badge key={`${preset._id}-${savedModule.name}`} variant="outline">
                                {savedModule.name}
                              </Badge>
                            ))}
                            {preset.modules.length > 4 && (
                              <Badge variant="secondary">+{preset.modules.length - 4}</Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="default" size="sm" className="w-full">
                                Apply
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Apply billing preset?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will replace your active calculation modules with the modules saved in “{preset.name}”. Existing invoices will not be changed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => applyPreset(preset._id)}>
                                  Apply Preset
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => editPreset(preset._id)}
                          >
                            Edit
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className="w-full">
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete billing preset?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This deletes “{preset.name}”. Active modules and existing invoices will not be changed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deletePreset(preset._id)}>
                                  Delete Preset
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      ) : (
      <>
      <Card className="mb-4 border-primary/20 bg-muted/20" size="sm">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>{activePresetId ? activePresetName || "Editing Preset" : "Editing Current Module Setup"}</CardTitle>
              {activePresetId && activePresetDescription && (
                <CardDescription>{activePresetDescription}</CardDescription>
              )}
            </div>
            <div className="flex gap-2">
              {activePresetId && (
                <Button variant="outline" size="sm" onClick={() => setShowPresetDetails((current) => !current)}>
                  {showPresetDetails ? "Hide Details" : "Edit Details"}
                </Button>
              )}
              {activePresetId && (
                <Button onClick={saveActivePresetChanges} disabled={presetSaving} size="sm">
                  <SaveIcon className="h-4 w-4" />
                  {presetSaving ? "Saving..." : "Save Preset"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        {showPresetDetails && (
        <CardContent>
          {activePresetId ? (
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <Field>
                <FieldLabel>Preset Name</FieldLabel>
                <Input
                  value={activePresetName}
                  onChange={(event) => setActivePresetName(event.target.value)}
                  placeholder="Standard monthly billing"
                />
              </Field>
              <Field>
                <FieldLabel>Description</FieldLabel>
                <Input
                  value={activePresetDescription}
                  onChange={(event) => setActivePresetDescription(event.target.value)}
                  placeholder="Base rent + electricity"
                />
              </Field>
              <div className="flex items-end">
                <Button onClick={saveActivePresetChanges} disabled={presetSaving} className="w-full">
                  <SaveIcon className="h-4 w-4" />
                  {presetSaving ? "Saving..." : "Save Preset Changes"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-muted-foreground">
                These edits affect the active module setup. Save as a new preset from the preset screen if you want to reuse it.
              </p>
            </div>
          )}
        </CardContent>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr_340px]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Modules</CardTitle>
            <CardDescription>{modules.length} configured modules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {modules.map((calculationModule, index) => (
              <div
                key={calculationModule._id || calculationModule.name}
                ref={(element) => {
                  moduleRowRefs.current[index] = element;
                }}
                draggable
                onDragStart={(event) => {
                  setDraggedModuleIndex(index);
                  event.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  const rect = event.currentTarget.getBoundingClientRect();
                  const offset = event.clientY - rect.top;
                  const position = offset < rect.height / 2 ? "before" : "after";
                  setDropTarget({ index, position });
                }}
                onDrop={async (event) => {
                  event.preventDefault();
                  if (draggedModuleIndex !== null && dropTarget) {
                    const targetIndex = dropTarget.position === "before"
                      ? dropTarget.index
                      : dropTarget.index + 1;
                    await reorderModules(draggedModuleIndex, targetIndex);
                  }
                  setDraggedModuleIndex(null);
                  setDropTarget(null);
                }}
                onDragEnd={() => {
                  setDraggedModuleIndex(null);
                  setDropTarget(null);
                }}
                className={`group relative flex w-full items-center gap-2 border p-2 text-left transition-colors ${
                  selectedModule._id === calculationModule._id
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "bg-background/40 hover:bg-muted/60"
                }`}
              >
                {draggedModuleIndex !== null && dropTarget?.index === index && (
                  <div className={`absolute left-0 right-0 z-10 h-1.5 rounded-full bg-primary shadow-[0_0_0_3px_hsl(var(--background))] ${
                    dropTarget.position === "before" ? "-top-1" : "-bottom-1"
                  }`} />
                )}
                <button
                  type="button"
                  aria-label="Drag to reorder module"
                  className="touch-none p-1"
                  onPointerDown={(event) => {
                    if (event.pointerType === "mouse") return;
                    activePointerId.current = event.pointerId;
                    setDraggedModuleIndex(index);
                    updateDropTargetFromPointer(event.clientY);
                  }}
                >
                  <GripVerticalIcon className={`h-4 w-4 shrink-0 cursor-grab ${
                    selectedModule._id === calculationModule._id ? "text-primary-foreground/80" : "text-muted-foreground"
                  }`} />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedModule(calculationModule)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{calculationModule.name}</span>
                    <Badge variant={calculationModule.enabled ? "secondary" : "outline"} className="shrink-0">
                      {calculationModule.enabled ? "On" : "Off"}
                    </Badge>
                  </div>
                  <p className={`mt-0.5 truncate text-xs ${
                    selectedModule._id === calculationModule._id ? "text-primary-foreground/80" : "text-muted-foreground"
                  }`}>
                    Outputs {calculationModule.output.label}
                  </p>
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader className="border-b">
            <CardTitle>{selectedModule._id ? "Edit Module" : "Create Module"}</CardTitle>
            <CardDescription>Use the buttons in the formula builder to avoid typing technical expressions.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="gap-4">
              {errors.length > 0 && (
                <div className="border border-destructive/50 bg-destructive/5 p-3 text-destructive space-y-1">
                  {errors.map((error) => <p key={error}>{error}</p>)}
                </div>
              )}

              <Card className="bg-muted/20 border-primary/20" size="sm">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>Module Basics</CardTitle>
                      <CardDescription>Name the module and decide when it should run.</CardDescription>
                    </div>
                    <Badge variant={selectedModule.enabled ? "secondary" : "outline"}>
                      {selectedModule.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-4 md:grid-cols-[1fr_180px_180px]">
                    <Field>
                      <FieldLabel>Name</FieldLabel>
                      <Input
                        value={selectedModule.name}
                        onChange={(event) => updateSelected({ name: event.target.value })}
                        placeholder="Electricity Charge"
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Status</FieldLabel>
                      <Select
                        value={selectedModule.enabled ? "enabled" : "disabled"}
                        onValueChange={(value) => updateSelected({ enabled: value === "enabled" })}
                      >
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enabled">Enabled</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel>Category</FieldLabel>
                      <Select value={selectedModule.category} onValueChange={(category) => updateSelected({ category: category as any })}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['rent', 'electricity', 'tax', 'discount', 'fee', 'total', 'custom'].map((category) => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel>Description</FieldLabel>
                    <Textarea
                      value={selectedModule.description || ""}
                      onChange={(event) => updateSelected({ description: event.target.value })}
                      placeholder="Example: Calculates electricity charges from units consumed and the rate per unit."
                      className="min-h-16"
                    />
                  </Field>
                </CardContent>
              </Card>

              <Card className="bg-muted/20" size="sm">
                <CardHeader>
                  <CardTitle>Output</CardTitle>
                  <CardDescription>This is the value other modules can use.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-[1fr_1fr_180px]">
                    <Field>
                      <FieldLabel>Display Label</FieldLabel>
                      <Input
                        value={selectedModule.output.label}
                        onChange={(event) => updateSelected({ output: { ...selectedModule.output, label: event.target.value } })}
                        placeholder="Electricity Charge"
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Reference Key</FieldLabel>
                      <Input
                        value={selectedModule.output.key}
                        onChange={(event) => updateSelected({ output: { ...selectedModule.output, key: sanitizeKey(event.target.value) } })}
                        placeholder="electricityCost"
                      />
                      <FieldDescription>Use this key in formulas.</FieldDescription>
                    </Field>
                    <Field>
                      <FieldLabel>Format</FieldLabel>
                      <Select value={selectedModule.output.format} onValueChange={(format) => updateSelected({ output: { ...selectedModule.output, format: format as any } })}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="currency">Currency</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="percent">Percent</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/20" size="sm">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>Inputs</CardTitle>
                      <CardDescription>Compact list of values this module asks for on invoice forms.</CardDescription>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addInput}>
                      <PlusIcon className="h-4 w-4" /> Add Input
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedModule.inputs.length === 0 ? (
                    <div className="border border-dashed p-6 text-center text-muted-foreground">
                      <p>No custom inputs yet.</p>
                      <p className="text-xs mt-1">Add inputs like Tax Rate, Parking Fee, or Maintenance Charge.</p>
                    </div>
                  ) : selectedModule.inputs.map((input, index) => (
                    <div key={`${input.key}-${index}`} className="flex items-center justify-between gap-3 border bg-background/40 p-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium truncate">{input.label || `Input ${index + 1}`}</p>
                          <Badge variant="outline">{input.type}</Badge>
                          {input.required && <Badge variant="secondary">Required</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          Key: {input.key || "not set"} · Default: {String(input.defaultValue ?? "none")}
                          {input.exposed === false ? " · Hidden" : " · Shown"}
                        </p>
                        {input.helpText && (
                          <p className="text-xs text-muted-foreground truncate">{input.helpText}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => setEditingInputIndex(index)}>
                          Edit
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeInput(index)} aria-label="Remove input">
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Dialog open={editingInputIndex !== null} onOpenChange={(open) => !open && setEditingInputIndex(null)}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Edit Input</DialogTitle>
                    <DialogDescription>
                      Configure how this input appears on invoice forms and how formulas reference it.
                    </DialogDescription>
                  </DialogHeader>
                  {editingInputIndex !== null && selectedModule.inputs[editingInputIndex] && (
                    <div className="space-y-5">
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field>
                          <FieldLabel>Input Label</FieldLabel>
                          <Input
                            value={selectedModule.inputs[editingInputIndex].label}
                            onChange={(event) => updateInput(editingInputIndex, { label: event.target.value })}
                            placeholder="Tax Rate, Parking Fee, Maintenance Charge"
                          />
                        </Field>
                        <Field>
                          <FieldLabel>Formula Key</FieldLabel>
                          <Input
                            value={selectedModule.inputs[editingInputIndex].key}
                            onChange={(event) => updateInput(editingInputIndex, { key: sanitizeKey(event.target.value) })}
                            placeholder="taxRate, parkingFee, maintenanceCharge"
                          />
                          <FieldDescription>Short key used in formulas.</FieldDescription>
                        </Field>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field>
                          <FieldLabel>Input Style</FieldLabel>
                          <Select
                            value={selectedModule.inputs[editingInputIndex].type}
                            onValueChange={(type) => updateInput(editingInputIndex, { type: type as any })}
                          >
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="number">Number Field</SelectItem>
                              <SelectItem value="text">Text Field</SelectItem>
                              <SelectItem value="checkbox">Checkbox</SelectItem>
                              <SelectItem value="radio">Radio Choices</SelectItem>
                              <SelectItem value="select">Dropdown</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field>
                          <FieldLabel>Default Value</FieldLabel>
                          <Input
                            value={String(selectedModule.inputs[editingInputIndex].defaultValue ?? "")}
                            onChange={(event) => {
                              const input = selectedModule.inputs[editingInputIndex];
                              updateInput(editingInputIndex, {
                                defaultValue: input.type === "number" || input.type === "radio" || input.type === "select"
                                  ? Number(event.target.value || 0)
                                  : input.type === "checkbox"
                                    ? event.target.value === "true" || event.target.value === "1"
                                    : event.target.value,
                              });
                            }}
                            placeholder="15, true, Monthly, or 5"
                          />
                          <FieldDescription>For checkbox use true/false. For choices use the numeric value.</FieldDescription>
                        </Field>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field>
                          <FieldLabel>Show Input</FieldLabel>
                          <Select
                            value={selectedModule.inputs[editingInputIndex].exposed === false ? "hidden" : "shown"}
                            onValueChange={(value) => updateInput(editingInputIndex, { exposed: value === "shown" })}
                          >
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="shown">Show on invoice/test forms</SelectItem>
                              <SelectItem value="hidden">Hide and use default value</SelectItem>
                            </SelectContent>
                          </Select>
                          <FieldDescription>Hide fixed values like a tax rate if users should not edit them during billing.</FieldDescription>
                        </Field>
                        <Field>
                          <FieldLabel>Required</FieldLabel>
                          <Select
                            value={selectedModule.inputs[editingInputIndex].required ? "required" : "optional"}
                            onValueChange={(value) => updateInput(editingInputIndex, { required: value === "required" })}
                          >
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="required">Required</SelectItem>
                              <SelectItem value="optional">Optional</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                      </div>
                      {(selectedModule.inputs[editingInputIndex].type === "radio" || selectedModule.inputs[editingInputIndex].type === "select") && (
                        <Field>
                          <FieldLabel>Choices</FieldLabel>
                          <Input
                            value={(selectedModule.inputs[editingInputIndex].options || []).join(", ")}
                            onChange={(event) =>
                              updateInput(editingInputIndex, {
                                options: event.target.value
                                  .split(",")
                                  .map((option) => option.trim())
                                  .filter(Boolean),
                              })
                            }
                            placeholder="0: No Tax, 5: Reduced Tax, 10: Standard Tax"
                          />
                          <FieldDescription>Comma-separated. Use `value: label`, for example `5: Reduced Tax`.</FieldDescription>
                        </Field>
                      )}
                      <Field>
                        <FieldLabel>Helper Text</FieldLabel>
                        <Input
                          value={selectedModule.inputs[editingInputIndex].helpText || ""}
                          onChange={(event) => updateInput(editingInputIndex, { helpText: event.target.value })}
                          placeholder="Example: Enter the monthly parking fee for this tenant."
                        />
                      </Field>
                    </div>
                  )}
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setEditingInputIndex(null)}>
                      Close
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Card className="bg-muted/20 border-primary/20" size="sm">
                <CardHeader>
                  <CardTitle>Formula Builder</CardTitle>
                  <CardDescription>Build the formula by clicking values and operations. No coding required.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium mb-2 text-muted-foreground">Available Values</p>
                      <div className="flex flex-wrap gap-2">
                        {availableVariables.map((variable) => (
                          <Button key={variable.key} type="button" variant="outline" size="sm" onClick={() => insertFormulaToken(variable.key)}>
                            {variable.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-2 text-muted-foreground">Operations</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: "Add", value: "+" },
                          { label: "Subtract", value: "-" },
                          { label: "Multiply", value: "*" },
                          { label: "Divide", value: "/" },
                          { label: "(", value: "(" },
                          { label: ")", value: ")" },
                        ].map((operator) => (
                          <Button key={operator.label} type="button" variant="secondary" size="sm" onClick={() => insertFormulaToken(operator.value)}>
                            {operator.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Field>
                    <FieldLabel>Formula</FieldLabel>
                    <Input
                      value={selectedModule.formula}
                      onChange={(event) => updateSelected({ formula: event.target.value })}
                      placeholder="electricityUnits * electricityRate"
                      className="font-mono"
                    />
                    <FieldDescription>Example: electricityUnits * electricityRate</FieldDescription>
                  </Field>
                </CardContent>
              </Card>

              <div className="sticky bottom-4 z-10 flex flex-wrap gap-2 border bg-background/95 p-3 shadow-sm backdrop-blur">
                <Button onClick={saveModule} disabled={saving}>
                  <SaveIcon className="h-4 w-4" /> {saving ? "Saving..." : "Save Module"}
                </Button>
                <Button type="button" variant="outline" onClick={runPreview}>
                  <TestTubeIcon className="h-4 w-4" /> Test Calculation
                </Button>
                {selectedModule._id && (
                  <Button type="button" variant="destructive" onClick={deleteModule}>
                    <TrashIcon className="h-4 w-4" /> Delete
                  </Button>
                )}
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relationships</CardTitle>
              <CardDescription>Automatically detected from formula outputs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium mb-2">Depends on</p>
                {dependencies.length === 0 ? <p className="text-muted-foreground">No module dependencies.</p> : dependencies.map((dependency) => (
                  <Badge key={`${dependency.moduleId}-${dependency.outputKey}`} variant="secondary" className="mr-2 mb-2">
                    {dependency.outputKey}
                  </Badge>
                ))}
              </div>
              <div>
                <p className="font-medium mb-2">Used by</p>
                {modules.filter((calculationModule) => calculationModule.formula.includes(selectedModule.output.key)).length === 0 ? (
                  <p className="text-muted-foreground">No other modules use this output.</p>
                ) : modules.filter((calculationModule) => calculationModule.formula.includes(selectedModule.output.key)).map((calculationModule) => (
                  <Badge key={calculationModule._id || calculationModule.name} variant="outline" className="mr-2 mb-2">{calculationModule.name}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview Inputs</CardTitle>
              <CardDescription>Test calculations before saving changes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {builtInVariables.map((input) => (
                <Field key={input.key}>
                  <FieldLabel>{input.label}</FieldLabel>
                  <Input value={previewInputs[input.key] || ""} onChange={(event) => setPreviewInputs({ ...previewInputs, [input.key]: event.target.value })} />
                </Field>
              ))}
              {selectedModule.inputs.filter((input) => input.exposed !== false).map((input) => (
                <Field key={input.key}>
                  <FieldLabel>{input.label}</FieldLabel>
                  <Input value={previewInputs[input.key] || ""} onChange={(event) => setPreviewInputs({ ...previewInputs, [input.key]: event.target.value })} />
                </Field>
              ))}
            </CardContent>
          </Card>

          {preview && (
            <Card>
              <CardHeader>
                <CardTitle>Preview Result</CardTitle>
                <CardDescription>Final total: {formatValue(preview.total || 0, "currency")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {preview.results?.map((result: any) => (
                  <div key={result.moduleId} className="flex justify-between border-b pb-2">
                    <span>{result.outputLabel}</span>
                    <span className="font-medium">{formatValue(result.value, result.outputFormat)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </>
      )}
    </div>
  );
}
