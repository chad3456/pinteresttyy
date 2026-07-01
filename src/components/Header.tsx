"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <header className="flex items-center justify-between px-6 sm:px-10 py-6">
      <Link
        href="/"
        className="text-xs sm:text-sm tracking-[0.3em] uppercase text-neutral-200 hover:text-white transition-colors"
      >
        Gallery
      </Link>
      <nav className="flex items-center gap-6 text-xs tracking-[0.15em] uppercase text-neutral-400">
        <Link href="/upload" className="hover:text-white transition-colors">
          Upload
        </Link>
        <Link href="/admin" className="hover:text-white transition-colors">
          Admin
        </Link>
        <form action="/api/logout" method="POST">
          <button
            type="submit"
            className="hover:text-white transition-colors cursor-pointer"
          >
            Logout
          </button>
        </form>
      </nav>
    </header>
  );
}
