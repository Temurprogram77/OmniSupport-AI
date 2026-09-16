"use client";

import React, { useState } from "react";
import {
  Package,
  RotateCcw,
  Truck,
  MapPin,
  Sparkles,
  Database,
  ArrowRight,
  MapPinOff,
  Edit3,
  XCircle,
  Copy,
  CheckCheck,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface SandboxOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  shippingStreet: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;
  cancelReason?: string | null;
  items: Array<{
    id: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
  }>;
  tracking?: {
    courierName: string;
    trackingNumber: string;
    currentStatus: string;
    currentLocation: string;
    estimatedDelivery: string;
  } | null;
  courierTracking?: {
    courierName: string;
    trackingNumber: string;
    currentStatus: string;
    currentLocation: string;
    estimatedDelivery: string;
  } | null;
  auditLogs?: Array<{
    id: string;
    action: string;
    details: string;
    performedBy: string;
    createdAt: string;
  }>;
}

interface OrdersSandboxPanelProps {
  orders: SandboxOrder[];
  isLoading: boolean;
  onResetDemo: () => Promise<void>;
  onSendPrompt: (prompt: string) => void;
  lastMutatedOrderNumber?: string;
}

export default function OrdersSandboxPanel({
  orders,
  isLoading,
  onResetDemo,
  onSendPrompt,
  lastMutatedOrderNumber,
}: OrdersSandboxPanelProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyOrderNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedId(num);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PROCESSING":
      case "PENDING":
        return "bg-amber-500/10 text-amber-300 border-amber-500/30";
      case "SHIPPED":
      case "OUT_FOR_DELIVERY":
        return "bg-sky-500/10 text-sky-300 border-sky-500/30";
      case "DELIVERED":
        return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
      case "CANCELLED":
        return "bg-rose-500/10 text-rose-300 border-rose-500/30";
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#09090b] text-zinc-100 relative">
      {/* Top Header */}
      <div className="p-4 border-b border-white/[0.08] bg-[#0c0c0e]/90 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Live DB Sandbox
                </h2>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-300 font-mono font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Supabase
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Customer: Sarah Jenkins · 4 Active Orders
              </p>
            </div>
          </div>

          <button
            onClick={onResetDemo}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#18181b] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/[0.08] hover:border-white/[0.15] transition-all duration-200 cursor-pointer disabled:opacity-50 active:scale-95 shadow-sm"
            title="Reset database to initial demo state"
          >
            <RotateCcw
              className={cn("w-3.5 h-3.5", isLoading && "animate-spin text-sky-400")}
            />
            <span className="hidden sm:inline">Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 custom-scrollbar">
        {orders.map((ord) => {
          const isJustMutated = lastMutatedOrderNumber === ord.orderNumber;
          const trackingInfo = ord.courierTracking || ord.tracking;

          return (
            <div
              key={ord.id}
              className={cn(
                "rounded-2xl border transition-all duration-500 bg-[#121215] p-4 shadow-xl relative overflow-hidden",
                isJustMutated
                  ? "animate-mutation-flash border-emerald-500/80"
                  : "border-white/[0.08] hover:border-white/[0.15]"
              )}
            >
              {/* Order Top Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-white tracking-wide">
                    {ord.orderNumber}
                  </span>
                  <button
                    onClick={() => copyOrderNumber(ord.orderNumber)}
                    className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white transition-colors cursor-pointer"
                    title="Copy Order ID"
                  >
                    {copiedId === ord.orderNumber ? (
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {isJustMutated && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/40 animate-pulse">
                      MUTATED LIVE
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-semibold px-2.5 py-0.5 rounded-full border",
                    getStatusColor(ord.status)
                  )}
                >
                  {ord.status}
                </span>
              </div>

              {/* Items Preview */}
              <div className="py-2.5 text-xs space-y-1">
                {ord.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center text-zinc-300"
                  >
                    <span className="truncate max-w-[210px] text-zinc-300 font-medium">
                      {item.quantity}× {item.productName}
                    </span>
                    <span className="font-mono text-zinc-400 text-[11px] shrink-0">
                      ${(item.unitPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold pt-1.5 border-t border-white/[0.05] text-zinc-200">
                  <span className="text-zinc-400">Total Charged</span>
                  <span className="text-amber-300 font-mono">
                    ${ord.totalAmount.toFixed(2)} {ord.currency}
                  </span>
                </div>
              </div>

              {/* Real-Time Shipping Address Container */}
              <div
                className={cn(
                  "p-2.5 rounded-xl border text-xs transition-all duration-500 mt-1",
                  isJustMutated
                    ? "bg-emerald-950/20 border-emerald-500/40 ring-1 ring-emerald-500/20"
                    : "bg-[#18181b] border-white/[0.05]"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>Shipping Address</span>
                  </div>
                  {isJustMutated && (
                    <span className="text-[10px] text-emerald-400 font-mono font-medium">
                      Live sync confirmed
                    </span>
                  )}
                </div>
                <div className="text-white font-medium truncate">
                  {ord.shippingStreet}
                </div>
                <div className="text-zinc-400 text-[11px] mt-0.5">
                  {ord.shippingCity}, {ord.shippingState} {ord.shippingPostalCode},{" "}
                  {ord.shippingCountry}
                </div>
              </div>

              {/* Courier Tracking snippet if available */}
              {trackingInfo && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-sky-950/20 border border-sky-500/20 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-sky-500/20 text-sky-400">
                      <Truck className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-sky-300">
                        {trackingInfo.courierName}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        {trackingInfo.trackingNumber}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-emerald-400">
                      {trackingInfo.currentStatus}
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      {trackingInfo.estimatedDelivery}
                    </div>
                  </div>
                </div>
              )}

              {/* Cancellation Reason if cancelled */}
              {ord.status === "CANCELLED" && ord.cancelReason && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/25 text-xs text-rose-300">
                  <span className="font-bold block text-[10px] uppercase tracking-wider text-rose-400">
                    Cancellation Note:
                  </span>
                  <span className="text-[11px] text-zinc-300 mt-0.5 block">
                    {ord.cancelReason}
                  </span>
                </div>
              )}

              {/* Quick AI Action Triggers */}
              <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex flex-wrap gap-1.5">
                <button
                  onClick={() =>
                    onSendPrompt(`What is the status and details of ${ord.orderNumber}?`)
                  }
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#18181b] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/[0.06] hover:border-white/[0.15] transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-1"
                >
                  <Search className="w-3 h-3" /> Status
                </button>

                {trackingInfo && (
                  <button
                    onClick={() =>
                      onSendPrompt(`Track courier shipment for ${ord.orderNumber}`)
                    }
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-sky-950/40 hover:bg-sky-900/60 text-sky-300 border border-sky-500/25 transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-1"
                  >
                    <Truck className="w-3 h-3" /> Track
                  </button>
                )}

                {ord.status === "PROCESSING" && (
                  <>
                    <button
                      onClick={() =>
                        onSendPrompt(
                          `Please change the delivery address for order ${ord.orderNumber} to 742 Evergreen Terrace, Springfield, OR 97477`
                        )
                      }
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/25 transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" /> Edit Address
                    </button>
                    <button
                      onClick={() =>
                        onSendPrompt(
                          `I want to cancel order ${ord.orderNumber} because I ordered by mistake`
                        )
                      }
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/25 transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-1"
                    >
                      <XCircle className="w-3 h-3" /> Cancel
                    </button>
                  </>
                )}

                {ord.status === "SHIPPED" && (
                  <button
                    onClick={() =>
                      onSendPrompt(`Please cancel order ${ord.orderNumber}`)
                    }
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-500/25 transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-1"
                  >
                    <XCircle className="w-3 h-3" /> Test Guardrail
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info Banner */}
      <div className="p-3.5 bg-[#0c0c0e]/95 border-t border-white/[0.08] text-[11px] text-zinc-400 flex items-center justify-between shrink-0">
        <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          Autonomous Tool Calling
        </span>
        <span className="text-zinc-500 font-mono text-[10px]">
          Live Polling: 3s
        </span>
      </div>
    </div>
  );
}
