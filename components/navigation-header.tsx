"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useSession, signOut } from "next-auth/react";
import {
  SunIcon,
  MoonIcon,
  HomeIcon,
  UsersIcon,
  FileTextIcon,
  HistoryIcon,
  SettingsIcon,
  LogOutIcon,
  UserIcon,
  MenuIcon,
  XIcon,
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
  const { data: session, status } = useSession();
  const [mounted, setMounted] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (path: string) => pathname === path;

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/signin" });
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileLinkClick = () => {
    setMobileMenuOpen(false);
  };

  // Don't show navigation on auth pages
  if (pathname.startsWith("/auth")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      {/* Main Header Bar */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center">
          {/* Brand Section */}
          <section className="mr-4 flex shrink-0">
            <Link
              href="/"
              className="mr-6 flex items-center space-x-2"
              onClick={handleMobileLinkClick}
            >
              <SafeIcon icon={FileTextIcon} className="size-5" />
              <span className="font-bold">Rent Invoice</span>
            </Link>
          </section>

          {/* Desktop Navigation Section */}
          <section className="hidden lg:flex items-center gap-6 text-sm font-medium flex-1">
            <nav className="flex items-center gap-6">
              <Link
                href="/"
                className={`transition-all duration-200 hover:text-foreground hover:bg-accent hover:scale-105 px-3 py-2 rounded-md ${
                  isActive("/")
                    ? "text-foreground bg-accent"
                    : "text-foreground/60"
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
          </section>

          {/* Actions Section */}
          <section className="flex items-center justify-end gap-2 ml-auto">
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              {mounted && status === "authenticated" && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground px-3 py-2 lg:max-w-40 xl:max-w-48 max-w-32">
                    <SafeIcon icon={UserIcon} className="size-4 shrink-0" />
                    <span className="truncate">{session.user?.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSignOut}
                    aria-label="Sign out"
                  >
                    <SafeIcon icon={LogOutIcon} className="size-4" />
                  </Button>
                </div>
              )}
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

            {/* Tablet & Mobile Actions */}
            <div className="flex md:hidden items-center gap-2">
              {mounted && status === "authenticated" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  aria-label="Sign out"
                  className="lg:hidden"
                >
                  <SafeIcon icon={LogOutIcon} className="size-4" />
                </Button>
              )}
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
              <Button
                variant="ghost"
                size="icon"
                onClick={handleMobileMenuToggle}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <SafeIcon icon={XIcon} className="size-4" />
                ) : (
                  <SafeIcon icon={MenuIcon} className="size-4" />
                )}
              </Button>
            </div>
          </section>
        </div>

        {/* Tablet Navigation (md-lg) */}
        <div className="hidden md:flex lg:hidden border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          <nav className="flex items-center justify-center gap-6 px-4 sm:px-6 lg:px-8 py-3 text-sm font-medium w-full">
            <Link
              href="/"
              onClick={handleMobileLinkClick}
              className={`flex flex-col items-center gap-1 transition-all duration-200 hover:text-foreground hover:bg-accent px-4 py-2 rounded-md min-w-0 flex-1 ${
                isActive("/")
                  ? "text-foreground bg-accent"
                  : "text-foreground/60"
              }`}
            >
              <SafeIcon icon={HomeIcon} className="size-5" />
              <span className="text-xs leading-tight">Home</span>
            </Link>
            <Link
              href="/tenants"
              onClick={handleMobileLinkClick}
              className={`flex flex-col items-center gap-1 transition-all duration-200 hover:text-foreground hover:bg-accent px-4 py-2 rounded-md min-w-0 flex-1 ${
                isActive("/tenants")
                  ? "text-foreground bg-accent"
                  : "text-foreground/60"
              }`}
            >
              <SafeIcon icon={UsersIcon} className="size-5" />
              <span className="text-xs leading-tight">Tenants</span>
            </Link>
            <Link
              href="/invoice"
              onClick={handleMobileLinkClick}
              className={`flex flex-col items-center gap-1 transition-all duration-200 hover:text-foreground hover:bg-accent px-4 py-2 rounded-md min-w-0 flex-1 ${
                isActive("/invoice")
                  ? "text-foreground bg-accent"
                  : "text-foreground/60"
              }`}
            >
              <SafeIcon icon={FileTextIcon} className="size-5" />
              <span className="text-xs leading-tight">Invoice</span>
            </Link>
            <Link
              href="/invoices"
              onClick={handleMobileLinkClick}
              className={`flex flex-col items-center gap-1 transition-all duration-200 hover:text-foreground hover:bg-accent px-4 py-2 rounded-md min-w-0 flex-1 ${
                isActive("/invoices")
                  ? "text-foreground bg-accent"
                  : "text-foreground/60"
              }`}
            >
              <SafeIcon icon={HistoryIcon} className="size-5" />
              <span className="text-xs leading-tight">History</span>
            </Link>
            <Link
              href="/settings"
              onClick={handleMobileLinkClick}
              className={`flex flex-col items-center gap-1 transition-all duration-200 hover:text-foreground hover:bg-accent px-4 py-2 rounded-md min-w-0 flex-1 ${
                isActive("/settings")
                  ? "text-foreground bg-accent"
                  : "text-foreground/60"
              }`}
            >
              <SafeIcon icon={SettingsIcon} className="size-5" />
              <span className="text-xs leading-tight">Settings</span>
            </Link>
          </nav>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-2">
            <div className="space-y-1">
              <Link
                href="/"
                onClick={handleMobileLinkClick}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  isActive("/")
                    ? "text-foreground bg-accent"
                    : "text-foreground/60 hover:text-foreground hover:bg-accent"
                }`}
              >
                <SafeIcon icon={HomeIcon} className="size-4" />
                <span>Home</span>
              </Link>
              <Link
                href="/tenants"
                onClick={handleMobileLinkClick}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  isActive("/tenants")
                    ? "text-foreground bg-accent"
                    : "text-foreground/60 hover:text-foreground hover:bg-accent"
                }`}
              >
                <SafeIcon icon={UsersIcon} className="size-4" />
                <span>Tenants</span>
              </Link>
              <Link
                href="/invoice"
                onClick={handleMobileLinkClick}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  isActive("/invoice")
                    ? "text-foreground bg-accent"
                    : "text-foreground/60 hover:text-foreground hover:bg-accent"
                }`}
              >
                <SafeIcon icon={FileTextIcon} className="size-4" />
                <span>Invoice</span>
              </Link>
              <Link
                href="/invoices"
                onClick={handleMobileLinkClick}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  isActive("/invoices")
                    ? "text-foreground bg-accent"
                    : "text-foreground/60 hover:text-foreground hover:bg-accent"
                }`}
              >
                <SafeIcon icon={HistoryIcon} className="size-4" />
                <span>History</span>
              </Link>
              <Link
                href="/settings"
                onClick={handleMobileLinkClick}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  isActive("/settings")
                    ? "text-foreground bg-accent"
                    : "text-foreground/60 hover:text-foreground hover:bg-accent"
                }`}
              >
                <SafeIcon icon={SettingsIcon} className="size-4" />
                <span>Settings</span>
              </Link>
            </div>

            {mounted && status === "authenticated" && (
              <div className="pt-4 border-t space-y-1">
                <div className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground">
                  <SafeIcon icon={UserIcon} className="size-4 shrink-0" />
                  <span className="truncate max-w-48">
                    {session.user?.name}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    handleSignOut();
                    handleMobileLinkClick();
                  }}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-foreground/60 hover:text-foreground hover:bg-accent w-full justify-start"
                >
                  <SafeIcon icon={LogOutIcon} className="size-4" />
                  <span>Sign Out</span>
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
