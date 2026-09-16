"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ChatInterface from "@/components/ChatInterface";
import OrdersSandboxPanel, {
  SandboxOrder,
} from "@/components/OrdersSandboxPanel";
import SandboxBanner from "@/components/SandboxBanner";
import {
  Package,
  PanelRightClose,
  PanelRightOpen,
  RefreshCw,
  Database,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileTab, setMobileTab] = useState<"chat" | "sandbox">("chat");
  const [lastMutatedOrderNumber, setLastMutatedOrderNumber] = useState<
    string | undefined
  >(undefined);
  const [injectedPrompt, setInjectedPrompt] = useState<string | undefined>(
    undefined
  );

  // TanStack Query for live orders fetching and 3-second background polling
  const { data, isLoading, isFetching } = useQuery<{ orders: SandboxOrder[] }>({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders");
      if (!res.ok) {
        throw new Error("Failed to fetch orders from Supabase");
      }
      return res.json();
    },
    refetchInterval: 3000,
    staleTime: 1000,
  });

  const orders = data?.orders || [];

  const handleResetDemo = async () => {
    try {
      const res = await fetch("/api/orders/reset", { method: "POST" });
      if (res.ok) {
        setLastMutatedOrderNumber(undefined);
        await queryClient.invalidateQueries({ queryKey: ["orders"] });
      }
    } catch (err) {
      console.error("Failed to reset orders:", err);
    }
  };

  const handleOrderMutated = (orderNumber: string) => {
    setLastMutatedOrderNumber(orderNumber);
    queryClient.invalidateQueries({ queryKey: ["orders"] });
  };

  const handleSendPrompt = (prompt: string) => {
    setInjectedPrompt(prompt);
    // If on mobile, automatically switch back to chat view when an order action is tapped
    setMobileTab("chat");
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#09090b] font-sans text-zinc-100 relative">
      {/* Ambient background lighting */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-sky-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px] pointer-events-none" />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-full min-w-0 z-10">
        {/* Top Ambient Sandbox Banner */}
        <SandboxBanner />

        {/* Top Navbar */}
        <header className="h-14 border-b border-white/[0.08] bg-[#0c0c0e]/80 backdrop-blur px-3 sm:px-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 ring-1 ring-white/20">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white">
                  OmniSupport AI
                </span>
                <span className="text-[10px] bg-white/[0.06] text-zinc-300 font-mono px-1.5 py-0.5 rounded border border-white/[0.08] hidden sm:inline">
                  v1.0 MVP
                </span>
              </div>
              <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Supabase PostgreSQL • Gemini Flash</span>
              </div>
            </div>
          </div>

          {/* Mobile Segmented Tab Switcher (< 1024px) */}
          <div className="flex lg:hidden items-center bg-[#18181b] p-1 rounded-xl border border-white/[0.08]">
            <button
              onClick={() => setMobileTab("chat")}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer",
                mobileTab === "chat"
                  ? "bg-sky-500 text-zinc-950 font-bold shadow-sm"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat</span>
            </button>
            <button
              onClick={() => setMobileTab("sandbox")}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer",
                mobileTab === "sandbox"
                  ? "bg-sky-500 text-zinc-950 font-bold shadow-sm"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <Database className="w-3.5 h-3.5" />
              <span>DB ({orders.length})</span>
            </button>
          </div>

          {/* Desktop Controls (>= 1024px) */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["orders"] })}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-[#18181b] hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer"
              title="Force sync database"
            >
              <RefreshCw
                className={cn(
                  "w-3.5 h-3.5",
                  isFetching && "animate-spin text-sky-400"
                )}
              />
              <span>Sync</span>
            </button>

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#18181b] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/[0.08] hover:border-white/[0.15] transition-all cursor-pointer shadow-sm active:scale-95"
            >
              {sidebarOpen ? (
                <>
                  <PanelRightClose className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Collapse Panel</span>
                </>
              ) : (
                <>
                  <PanelRightOpen className="w-3.5 h-3.5 text-zinc-400" />
                  <span>View DB Sandbox</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* View Switcher for Mobile & Desktop */}
        <div className="flex-1 min-h-0 flex relative">
          {/* Chat Container */}
          <div
            className={cn(
              "flex-1 h-full min-w-0 flex flex-col",
              mobileTab === "sandbox" ? "hidden lg:flex" : "flex"
            )}
          >
            <ChatInterface
              onOrderMutated={handleOrderMutated}
              injectedPrompt={injectedPrompt}
              onClearInjectedPrompt={() => setInjectedPrompt(undefined)}
            />
          </div>

          {/* Mobile Sandbox View (when active on < 1024px) */}
          <div
            className={cn(
              "w-full h-full lg:hidden",
              mobileTab === "sandbox" ? "block" : "hidden"
            )}
          >
            <OrdersSandboxPanel
              orders={orders}
              isLoading={isLoading || isFetching}
              onResetDemo={handleResetDemo}
              onSendPrompt={handleSendPrompt}
              lastMutatedOrderNumber={lastMutatedOrderNumber}
            />
          </div>

          {/* Desktop Persistent / Collapsible Sidebar (>= 1024px) */}
          {sidebarOpen && (
            <aside className="hidden lg:block w-[390px] xl:w-[430px] shrink-0 h-full border-l border-white/[0.08] shadow-2xl z-10">
              <OrdersSandboxPanel
                orders={orders}
                isLoading={isLoading || isFetching}
                onResetDemo={handleResetDemo}
                onSendPrompt={handleSendPrompt}
                lastMutatedOrderNumber={lastMutatedOrderNumber}
              />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
