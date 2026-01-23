"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "@repo/convex";

export function Navigation() {
  const pathname = usePathname();
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.currentUser);

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(path) && path !== "/dashboard";
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: "◈" },
    { href: "/organizations", label: "Organizations", icon: "⬡" },
    { href: "/tournaments", label: "Tournaments", icon: "◎" },
    { href: "/teams", label: "Teams", icon: "◇" },
  ];

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "?";

  return (
    <nav className="fixed top-0 left-0 right-0 z-[1000] bg-[rgba(3,3,5,0.85)] backdrop-blur-[20px] border-b border-border">
      <div className="flex items-center justify-between h-[var(--nav-height)] px-6 max-w-[1600px] mx-auto">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 transition-transform hover:-translate-y-0.5"
        >
          <span className="text-2xl text-accent drop-shadow-[0_0_8px_var(--accent-glow)] animate-glow">
            ⚡
          </span>
          <span className="font-display text-[22px] font-bold tracking-widest text-text-primary hidden md:block">
            SCOREFORGE
          </span>
        </Link>

        {/* Main Navigation */}
        <Authenticated>
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                  isActive(link.href)
                    ? "text-accent bg-accent/10"
                    : "text-text-secondary hover:text-text-primary hover:bg-white/5"
                }`}
              >
                <span
                  className={`text-base transition-opacity ${isActive(link.href) ? "opacity-100" : "opacity-70"}`}
                >
                  {link.icon}
                </span>
                <span className="tracking-wide">{link.label}</span>
                {isActive(link.href) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-accent rounded shadow-[0_0_8px_var(--accent-glow)]" />
                )}
              </Link>
            ))}
          </div>
        </Authenticated>

        {/* Right section */}
        <div className="flex items-center gap-4">
          <AuthLoading>
            <div className="w-8 h-8 rounded-full bg-bg-card animate-pulse" />
          </AuthLoading>

          <Unauthenticated>
            <Link
              href="/sign-in"
              className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-2 font-display text-xs font-semibold tracking-widest uppercase text-bg-void bg-accent rounded-lg hover:bg-accent-bright hover:-translate-y-0.5 hover:shadow-glow transition-all"
            >
              Get Started
            </Link>
          </Unauthenticated>

          <Authenticated>
            <div className="relative group">
              <div className="w-[38px] h-[38px] flex items-center justify-center font-display text-sm font-semibold tracking-wide text-bg-void bg-gradient-to-br from-accent to-gold rounded-full cursor-pointer transition-all hover:scale-105 hover:shadow-[0_0_20px_var(--accent-glow)]">
                {initials}
              </div>
              <div className="absolute top-full right-0 mt-2 w-60 p-2 bg-bg-elevated border border-border rounded-xl shadow-lg opacity-0 invisible -translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all">
                <div className="px-3 py-2">
                  {user?.name && (
                    <span className="block font-semibold text-text-primary mb-0.5">
                      {user.name}
                    </span>
                  )}
                  <span className="block text-sm text-text-muted">{user?.email}</span>
                </div>
                <div className="h-px bg-border my-2" />
                <Link
                  href="/settings"
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary rounded-lg hover:text-text-primary hover:bg-white/5 transition-colors"
                >
                  <span className="opacity-70">⚙</span> Settings
                </Link>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary text-left rounded-lg hover:text-text-primary hover:bg-white/5 transition-colors"
                >
                  <span className="opacity-70">↩</span> Sign Out
                </button>
              </div>
            </div>
          </Authenticated>
        </div>
      </div>

      {/* Accent line */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-30" />
    </nav>
  );
}
