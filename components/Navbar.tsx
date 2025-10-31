"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useCallback, memo } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  user?: {
    name: string;
    email: string;
  } | null;
}

const Navbar = memo(({ user }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const handleSignOut = useCallback(async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      window.location.href = "/sign-in";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, []);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/interview", label: "Interview" },
    { href: "/assessment", label: "Assessment" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 mx-auto">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Image
            src="/logo.svg"
            alt="MockMate Logo"
            width={38}
            height={32}
            style={{ width: "auto", height: "auto" }}
            priority
          />
          <h2 className="text-xl font-bold text-primary-100">MockMate</h2>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              prefetch={true}
              className={`text-sm font-medium transition-colors hover:text-primary-100 ${
                pathname === link.href
                  ? "text-primary-100"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* User Menu */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-200 flex items-center justify-center text-sm font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium">{user.name}</span>
              </div>
              <Button onClick={handleSignOut} variant="outline" size="sm">
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/sign-up">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background">
          <div className="container px-4 py-4 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={true}
                className={`block py-2 text-sm font-medium transition-colors hover:text-primary-100 ${
                  pathname === link.href
                    ? "text-primary-100"
                    : "text-muted-foreground"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <div className="pt-4 border-t border-border/40 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-200 flex items-center justify-center text-sm font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {user.email}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="pt-4 border-t border-border/40 space-y-2">
                <Button asChild variant="ghost" size="sm" className="w-full">
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button asChild size="sm" className="w-full">
                  <Link href="/sign-up">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
});

Navbar.displayName = "Navbar";

export default Navbar;
