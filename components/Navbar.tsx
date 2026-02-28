"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { createPublicClient, http, formatEther } from "viem";
import { monadTestnet } from "@/config/chain";

export function Navbar() {
  const pathname = usePathname();
  const { login, logout, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const [balance, setBalance] = useState<string | null>(null);

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

  const shortAddress = address
    ? address.slice(0, 6) + "..." + address.slice(-4)
    : null;

  const navLinks = [
    { href: "/", label: "Game" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/leaderboard", label: "Leaderboard" },
  ];

  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-[#0f1923] border-b border-[#1e2d3d]">
      {/* Logo */}
      <div className="flex items-center gap-8">
        <span className="text-white font-bold text-xl tracking-tight">
          <span className="text-[#836EF9]">Monad</span> Plinko
        </span>

        {/* Nav links */}
        <div className="flex gap-1">
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

      {/* Right: wallet info */}
      <div className="flex items-center gap-3">
        {authenticated && address ? (
          <>
            <div className="flex items-center gap-2 bg-[#1e2d3d] rounded-lg px-3 py-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-white text-sm font-mono">{shortAddress}</span>
              {balance !== null && (
                <span className="text-[#836EF9] text-sm font-semibold">{balance} MON</span>
              )}
            </div>
            <button
              onClick={logout}
              className="text-gray-400 hover:text-white text-sm px-3 py-2 rounded-md hover:bg-[#1e2d3d] transition-colors"
            >
              Disconnect
            </button>
          </>
        ) : (
          <button
            onClick={login}
            className="bg-[#836EF9] hover:bg-[#6d58d9] text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </nav>
  );
}
