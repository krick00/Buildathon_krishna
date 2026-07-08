"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Avatar from "./Avatar";
import { logoutAction } from "@/app/actions";
import type { CurrentUser } from "@/lib/auth/currentUser";

const DESKTOP_LINKS = [
  { href: "/home", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/search", label: "Search" },
  { href: "/library", label: "Library" },
  { href: "/diary", label: "Diary" },
  { href: "/quotes", label: "Quotes" },
  { href: "/lists", label: "Lists" },
  { href: "/stats", label: "Stats" },
];

const MOBILE_LINKS = [
  { href: "/home", label: "Home", icon: "🏠" },
  { href: "/search", label: "Search", icon: "🔍" },
  { href: "/library", label: "Library", icon: "📚" },
  { href: "/diary", label: "Diary", icon: "📓" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Nav({ user }: { user: CurrentUser | null }) {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-ink-line bg-ink/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
          <Link href={user ? "/home" : "/"} className="flex items-center gap-2 text-lg font-semibold text-cream">
            <span className="text-accent">◆</span>
            <span>Booklog</span>
          </Link>

          {user && (
            <nav className="hidden flex-1 items-center gap-1 md:flex" aria-label="Primary">
              {DESKTOP_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                    isActive(pathname, l.href)
                      ? "bg-ink-soft text-cream"
                      : "text-cream/60 hover:text-cream"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          )}

          <div className="ml-auto flex items-center gap-3">
            {user ? (
              <>
                <form action={logoutAction}>
                  <button type="submit" className="text-xs text-cream/50 hover:text-cream">
                    Log out
                  </button>
                </form>
                <Link href={`/u/${user.username}`} aria-label="Your profile" className="flex items-center gap-2">
                  <Avatar src={user.avatar_url} name={user.display_name} size={32} />
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-ghost !px-3 !py-1.5 text-sm">
                  Log in
                </Link>
                <Link href="/signup" className="btn-primary !px-3 !py-1.5 text-sm">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {user && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-ink-line bg-ink/95 backdrop-blur md:hidden"
          aria-label="Mobile"
        >
          {MOBILE_LINKS.slice(0, 2).map((l) => (
            <MobileLink key={l.href} {...l} active={isActive(pathname, l.href)} />
          ))}
          <Link href="/search" className="flex flex-col items-center justify-center py-2" aria-label="Log a book">
            <span className="-mt-4 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-xl text-ink shadow-lg">
              ✎
            </span>
          </Link>
          {MOBILE_LINKS.slice(2).map((l) => (
            <MobileLink key={l.href} {...l} active={isActive(pathname, l.href)} />
          ))}
        </nav>
      )}
    </>
  );
}

function MobileLink({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] ${
        active ? "text-accent" : "text-cream/60"
      }`}
    >
      <span className="text-lg" aria-hidden>
        {icon}
      </span>
      {label}
    </Link>
  );
}
