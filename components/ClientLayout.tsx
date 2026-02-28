"use client";

import dynamic from "next/dynamic";

const Providers = dynamic(
  () => import("@/config/providers").then((m) => m.Providers),
  { ssr: false }
);

const Navbar = dynamic(
  () => import("@/components/Navbar").then((m) => m.Navbar),
  { ssr: false }
);

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <Navbar />
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {children}
      </main>
    </Providers>
  );
}
