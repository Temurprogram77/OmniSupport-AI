"use client";

import React, { useState, useEffect, useCallback } from "react";
import ChatInterface from "@/components/ChatInterface";
import OrdersSandboxPanel, {
  SandboxOrder,
} from "@/components/OrdersSandboxPanel";
import { Package, PanelRightClose, PanelRightOpen, RefreshCw } from "lucide-react";

export default function Home() {
  const [orders, setOrders] = useState<SandboxOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [lastMutatedOrderNumber, setLastMutatedOrderNumber] = useState<
    string | undefined
  >(undefined);
  const [injectedPrompt, setInjectedPrompt] = useState<string | undefined>(
    undefined
  );

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleResetDemo = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/orders/reset", { method: "POST" });
      if (res.ok) {
        await fetchOrders();
        setLastMutatedOrderNumber(undefined);
      }
    } catch (err) {
      console.error("Failed to reset orders:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderMutated = (orderNumber: string) => {
    setLastMutatedOrderNumber(orderNumber);
    fetchOrders();
  };

  const handleSendPrompt = (prompt: string) => {
    setInjectedPrompt(prompt);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 h-full min-w-0">
        {/* Top Navbar */}
        <header className="h-14 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white">
                OmniSupport AI
              </span>
              <span className="text-[11px] text-slate-400 ml-2 hidden sm:inline">
                Autonomous Logistics Support
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            >
              {sidebarOpen ? (
                <>
                  <PanelRightClose className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Hide Sandbox</span>
                </>
              ) : (
                <>
                  <PanelRightOpen className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Show Sandbox</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Chat Component */}
        <div className="flex-1 min-h-0">
          <ChatInterface
            onOrderMutated={handleOrderMutated}
            injectedPrompt={injectedPrompt}
            onClearInjectedPrompt={() => setInjectedPrompt(undefined)}
          />
        </div>
      </div>

      {/* Orders Sandbox Drawer / Sidebar */}
      {sidebarOpen && (
        <aside className="w-full sm:w-[380px] md:w-[420px] lg:w-[460px] shrink-0 h-full border-l border-slate-800 shadow-2xl">
          <OrdersSandboxPanel
            orders={orders}
            isLoading={isLoading}
            onResetDemo={handleResetDemo}
            onSendPrompt={handleSendPrompt}
            lastMutatedOrderNumber={lastMutatedOrderNumber}
          />
        </aside>
      )}
    </div>
  );
}
