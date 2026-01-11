import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UsersIcon, FileTextIcon } from "lucide-react"

export default function Page() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Rent Invoice Generator</h1>
        <p className="text-muted-foreground">
          Manage tenants and generate rent invoices with automatic electricity calculations
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded">
                <UsersIcon className="size-6 text-primary" />
              </div>
              <CardTitle>Tenant Management</CardTitle>
            </div>
            <CardDescription>
              Add, edit, and manage your tenants. Set base rent for each tenant.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/tenants">
              <Button className="w-full">Manage Tenants</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded">
                <FileTextIcon className="size-6 text-primary" />
              </div>
              <CardTitle>Generate Invoice</CardTitle>
            </div>
            <CardDescription>
              Create rent invoices with automatic electricity cost calculations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/invoice">
              <Button className="w-full">Create Invoice</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How it works</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Add your tenants with their base rent in the Tenant Management section</li>
            <li>Generate invoices by selecting a tenant and entering meter readings</li>
            <li>Previous month reading is auto-populated from the last invoice</li>
            <li>Electricity cost is automatically calculated at Rs. 15 per unit</li>
            <li>Print or copy invoice screenshot to share with tenants</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
