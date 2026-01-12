"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
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
import { PlusIcon, TrashIcon, EditIcon } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import type { Tenant } from "@/lib/types";

export default function TenantsPage() {
  const { data: session } = useSession();
  const [tenants, setTenants] = React.useState<Tenant[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingTenant, setEditingTenant] = React.useState<Tenant | null>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    baseRent: "",
    contact: "",
  });

  // Load tenants
  React.useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    if (!session?.user?.id) {
      toast.error("User not authenticated");
      return;
    }

    try {
      const response = await fetch(`/api/tenants?userId=${session.user.id}`);
      const data = await response.json();
      setTenants(data);
    } catch (error) {
      console.error("Error loading tenants:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user?.id) {
      toast.error("User not authenticated");
      return;
    }

    try {
      if (editingTenant) {
        // Update existing tenant
        const response = await fetch("/api/tenants", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: editingTenant._id,
            userId: session.user.id,
            name: formData.name,
            baseRent: parseFloat(formData.baseRent),
            contact: formData.contact || undefined,
          }),
        });

        if (response.ok) {
          await loadTenants();
          resetForm();
          toast.success("Tenant updated successfully");
        } else {
          toast.error("Failed to update tenant");
        }
      } else {
        // Create new tenant
        const response = await fetch("/api/tenants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: session.user.id,
            name: formData.name,
            baseRent: parseFloat(formData.baseRent),
            contact: formData.contact || undefined,
          }),
        });

        if (response.ok) {
          await loadTenants();
          resetForm();
          toast.success("Tenant created successfully");
        } else {
          toast.error("Failed to create tenant");
        }
      }
    } catch (error) {
      console.error("Error saving tenant:", error);
      toast.error("An error occurred while saving tenant");
    }
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormData({
      name: tenant.name,
      baseRent: tenant.baseRent.toString(),
      contact: tenant.contact || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/tenants?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadTenants();
        toast.success("Tenant deleted successfully");
      } else {
        toast.error("Failed to delete tenant");
      }
    } catch (error) {
      console.error("Error deleting tenant:", error);
      toast.error("An error occurred while deleting tenant");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", baseRent: "", contact: "" });
    setEditingTenant(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tenant Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your tenants and their base rent
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <PlusIcon />
          Add Tenant
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {editingTenant ? "Edit Tenant" : "Add New Tenant"}
            </CardTitle>
            <CardDescription>
              {editingTenant
                ? "Update tenant information"
                : "Enter tenant details"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Tenant Name *</FieldLabel>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    placeholder="Enter tenant name"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="baseRent">Base Rent (Rs.) *</FieldLabel>
                  <Input
                    id="baseRent"
                    type="number"
                    step="0.01"
                    value={formData.baseRent}
                    onChange={(e) =>
                      setFormData({ ...formData, baseRent: e.target.value })
                    }
                    required
                    placeholder="Enter base rent"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="contact">Contact (Optional)</FieldLabel>
                  <Input
                    id="contact"
                    value={formData.contact}
                    onChange={(e) =>
                      setFormData({ ...formData, contact: e.target.value })
                    }
                    placeholder="Phone number or email"
                  />
                </Field>
                <Field orientation="horizontal">
                  <Button type="submit">
                    {editingTenant ? "Update" : "Add"} Tenant
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {tenants.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>No tenants yet. Add your first tenant to get started.</p>
            </CardContent>
          </Card>
        ) : (
          tenants.map((tenant) => (
            <Card key={tenant._id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{tenant.name}</CardTitle>
                    <CardDescription>
                      Base Rent: Rs. {tenant.baseRent.toLocaleString()}
                      {tenant.contact && ` • ${tenant.contact}`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(tenant)}
                    >
                      <EditIcon />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <TrashIcon />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Tenant</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {tenant.name}? This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(tenant._id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
