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
} from "lucide-react";
import * as React from "react";

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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ">
      <div className="container flex mx-auto h-14 items-center">
        <div className="mr-4 flex ">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <FileTextIcon className="size-5" />
            <span className="font-bold">Rent Invoice</span>
          </Link>
        </div>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link
            href="/"
            className={`transition-colors hover:text-foreground/80 ${
              isActive("/") ? "text-foreground" : "text-foreground/60"
            }`}
          >
            <div className="flex items-center gap-2">
              <HomeIcon className="size-4" />
              <span>Home</span>
            </div>
          </Link>
          <Link
            href="/tenants"
            className={`transition-colors hover:text-foreground/80 ${
              isActive("/tenants") ? "text-foreground" : "text-foreground/60"
            }`}
          >
            <div className="flex items-center gap-2">
              <UsersIcon className="size-4" />
              <span>Tenants</span>
            </div>
          </Link>
          <Link
            href="/invoice"
            className={`transition-colors hover:text-foreground/80 ${
              isActive("/invoice") ? "text-foreground" : "text-foreground/60"
            }`}
          >
            <div className="flex items-center gap-2">
              <FileTextIcon className="size-4" />
              <span>Invoice</span>
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
                <SunIcon className="size-4" />
              ) : (
                <MoonIcon className="size-4" />
              )
            ) : (
              <MoonIcon className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
