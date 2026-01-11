"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import {
  SunIcon,
  MoonIcon,
  HomeIcon,
  UsersIcon,
  FileTextIcon,
  HistoryIcon,
  SettingsIcon,
} from "lucide-react";
import * as React from "react";

// Wrapper component to suppress hydration warnings for Lucide icons
const SafeIcon = ({
  icon: Icon,
  ...props
}: React.ComponentProps<typeof FileTextIcon> & {
  icon: React.ComponentType<any>;
}) => <Icon suppressHydrationWarning {...props} />;

export function NavigationHeader() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 ">
      <div className="container flex mx-auto h-14 items-center">
        <div className="mr-4 flex ">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <SafeIcon icon={FileTextIcon} className="size-5" />
            <span className="font-bold">Rent Invoice</span>
          </Link>
        </div>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link
            href="/"
            className={`transition-all duration-200 hover:text-foreground hover:bg-accent hover:scale-105 px-3 py-2 rounded-md ${
              isActive("/") ? "text-foreground bg-accent" : "text-foreground/60"
            }`}
          >
            <div className="flex items-center gap-2">
              <SafeIcon icon={HomeIcon} className="size-4" />
              <span>Home</span>
            </div>
          </Link>
          <Link
            href="/tenants"
            className={`transition-all duration-200 hover:text-foreground hover:bg-accent hover:scale-105 px-3 py-2 rounded-md ${
              isActive("/tenants")
                ? "text-foreground bg-accent"
                : "text-foreground/60"
            }`}
          >
            <div className="flex items-center gap-2">
              <SafeIcon icon={UsersIcon} className="size-4" />
              <span>Tenants</span>
            </div>
          </Link>
          <Link
            href="/invoice"
            className={`transition-all duration-200 hover:text-foreground hover:bg-accent hover:scale-105 px-3 py-2 rounded-md ${
              isActive("/invoice")
                ? "text-foreground bg-accent"
                : "text-foreground/60"
            }`}
          >
            <div className="flex items-center gap-2">
              <SafeIcon icon={FileTextIcon} className="size-4" />
              <span>Invoice</span>
            </div>
          </Link>
          <Link
            href="/invoices"
            className={`transition-all duration-200 hover:text-foreground hover:bg-accent hover:scale-105 px-3 py-2 rounded-md ${
              isActive("/invoices")
                ? "text-foreground bg-accent"
                : "text-foreground/60"
            }`}
          >
            <div className="flex items-center gap-2">
              <SafeIcon icon={HistoryIcon} className="size-4" />
              <span>History</span>
            </div>
          </Link>
          <Link
            href="/settings"
            className={`transition-all duration-200 hover:text-foreground hover:bg-accent hover:scale-105 px-3 py-2 rounded-md ${
              isActive("/settings")
                ? "text-foreground bg-accent"
                : "text-foreground/60"
            }`}
          >
            <div className="flex items-center gap-2">
              <SafeIcon icon={SettingsIcon} className="size-4" />
              <span>Settings</span>
            </div>
          </Link>
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const newTheme = theme === "dark" ? "light" : "dark";
              setTheme(newTheme);
            }}
            aria-label="Toggle theme"
          >
            {mounted ? (
              theme === "dark" ? (
                <SafeIcon icon={SunIcon} className="size-4" />
              ) : (
                <SafeIcon icon={MoonIcon} className="size-4" />
              )
            ) : (
              <SafeIcon icon={MoonIcon} className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
