"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { createPublicClient, http, formatEther } from "viem";
import { monadTestnet } from "@/config/chain";

export function Navbar() {
  const pathname = usePathname();
  const { login, logout, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [balance, setBalance] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Prefer MetaMask / external wallet over Privy embedded wallet
  const activeWallet =
    wallets?.find((w) => w.walletClientType !== "privy") ?? wallets?.[0];
  const address = activeWallet?.address;

  useEffect(() => {
    if (!address) { setBalance(null); return; }
    const client = createPublicClient({ chain: monadTestnet, transport: http("https://testnet-rpc.monad.xyz") });
    client.getBalance({ address: address as `0x${string}` }).then((b) => {
      setBalance(parseFloat(formatEther(b)).toFixed(3));
    });
  }, [address]);

  // Close mobile menu when route changes
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const shortAddress = address
    ? address.slice(0, 6) + "..." + address.slice(-4)
    : null;

  const navLinks = [
    { href: "/", label: "Game" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/leaderboard", label: "Leaderboard" },
  ];

  return (
    <nav className="bg-[#0f1923] border-b border-[#1e2d3d]">
      <div className="flex items-center justify-between px-4 md:px-6 py-3">
        {/* Logo */}
        <div className="flex items-center gap-4 md:gap-8">
          <span className="text-white font-bold text-lg md:text-xl tracking-tight shrink-0">
            <span className="text-[#836EF9]">Monad</span> Plinko
          </span>

          {/* Nav links — hidden on mobile, visible on md+ */}
          <div className="hidden md:flex gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-[#1e2d3d] text-white"
                    : "text-gray-400 hover:text-white hover:bg-[#1e2d3d]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Wallet info — always visible */}
          {authenticated && address ? (
            <>
              <div className="flex items-center gap-2 bg-[#1e2d3d] rounded-lg px-2 md:px-3 py-2">
                <div className="w-2 h-2 bg-green-400 rounded-full shrink-0" />
                <span className="text-white text-xs md:text-sm font-mono">{shortAddress}</span>
                {balance !== null && (
                  <span className="hidden sm:inline text-[#836EF9] text-sm font-semibold">{balance} MON</span>
                )}
              </div>
              <button
                onClick={logout}
                className="hidden md:block text-gray-400 hover:text-white text-sm px-3 py-2 rounded-md hover:bg-[#1e2d3d] transition-colors"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={login}
              className="bg-[#836EF9] hover:bg-[#6d58d9] text-white font-semibold px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm transition-colors"
            >
              Connect
            </button>
          )}

          {/* Hamburger — visible only on mobile */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-[#1e2d3d] transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              // X icon
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              // Hamburger icon
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-[#1e2d3d] px-4 py-3 flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "bg-[#1e2d3d] text-white"
                  : "text-gray-400 hover:text-white hover:bg-[#1e2d3d]"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {authenticated && (
            <button
              onClick={logout}
              className="mt-1 text-left px-4 py-2 rounded-md text-sm text-gray-400 hover:text-white hover:bg-[#1e2d3d] transition-colors"
            >
              Disconnect
            </button>
          )}
          {balance !== null && (
            <div className="px-4 py-1 text-xs text-[#836EF9] font-semibold">{balance} MON</div>
          )}
        </div>
      )}
    </nav>
  );
}
