import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WifiOff, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <WifiOff className="w-8 h-8 text-gray-600" />
          </div>
          <CardTitle className="text-2xl">You're Offline</CardTitle>
          <CardDescription>
            It looks like you've lost your internet connection. Some features
            may not be available until you're back online.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>Available Offline:</strong>
            </p>
            <ul className="text-left space-y-1">
              <li>• View existing invoices</li>
              <li>• View tenant information</li>
              <li>• Access cached data</li>
            </ul>
            <p>
              <strong>Requires Internet:</strong>
            </p>
            <ul className="text-left space-y-1">
              <li>• Create new invoices</li>
              <li>• Update tenant data</li>
              <li>• Sync with database</li>
            </ul>
          </div>
          <Button asChild className="w-full">
            <Link href="/">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
