"use client";

import React from "react";
import {
  Package,
  RotateCcw,
  User,
  Truck,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ExternalLink,
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
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PROCESSING":
      case "PENDING":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "SHIPPED":
      case "OUT_FOR_DELIVERY":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "DELIVERED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "CANCELLED":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-100">
      {/* Panel Top Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                Live Database Orders
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-1.5 py-0.5 rounded border border-emerald-500/30">
                  Prisma ORM
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Customer: Sarah Jenkins (Demo Sandbox)
              </p>
            </div>
          </div>

          <button
            onClick={onResetDemo}
            disabled={isLoading}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            title="Reset database to demo initial state"
          >
            <RotateCcw
              className={cn("w-3.5 h-3.5", isLoading && "animate-spin")}
            />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Orders List Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {orders.map((ord) => {
          const isJustMutated = lastMutatedOrderNumber === ord.orderNumber;

          return (
            <div
              key={ord.id}
              className={cn(
                "rounded-xl border p-3.5 transition-all duration-500 bg-slate-950/60 shadow-md",
                isJustMutated
                  ? "border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-950/10"
                  : "border-slate-800/80 hover:border-slate-700"
              )}
            >
              {/* Order Top Bar */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-white">
                    {ord.orderNumber}
                  </span>
                  {isJustMutated && (
                    <span className="text-[10px] bg-emerald-500 text-black font-bold px-1.5 py-0.2 rounded animate-pulse">
                      UPDATED
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-[11px] font-semibold px-2 py-0.5 rounded-full border",
                    getStatusColor(ord.status)
                  )}
                >
                  {ord.status}
                </span>
              </div>

              {/* Items Summary */}
              <div className="py-2 text-xs space-y-1">
                {ord.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between text-slate-300"
                  >
                    <span className="truncate max-w-[200px]">
                      {item.quantity}x {item.productName}
                    </span>
                    <span className="font-mono text-slate-400">
                      ${(item.unitPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold pt-1 border-t border-slate-800/40 text-slate-200">
                  <span>Total Amount</span>
                  <span className="text-amber-400 font-mono">
                    ${ord.totalAmount.toFixed(2)} {ord.currency}
                  </span>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="mt-1 p-2 rounded-lg bg-slate-900/60 border border-slate-800/60 text-xs">
                <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>Current Shipping Destination</span>
                </div>
                <div className="text-slate-200 font-medium truncate">
                  {ord.shippingStreet}
                </div>
                <div className="text-slate-400 text-[11px]">
                  {ord.shippingCity}, {ord.shippingState} {ord.shippingPostalCode},{" "}
                  {ord.shippingCountry}
                </div>
              </div>

              {/* Courier Tracking snippet if available */}
              {ord.tracking && (
                <div className="mt-2 p-2 rounded-lg bg-indigo-950/20 border border-indigo-800/30 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-indigo-400" />
                    <div>
                      <div className="text-[11px] font-semibold text-indigo-300">
                        {ord.tracking.courierName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {ord.tracking.trackingNumber}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-semibold text-emerald-400">
                      {ord.tracking.currentStatus}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {ord.tracking.estimatedDelivery}
                    </div>
                  </div>
                </div>
              )}

              {/* Cancellation Reason if cancelled */}
              {ord.status === "CANCELLED" && ord.cancelReason && (
                <div className="mt-2 p-2 rounded-lg bg-rose-950/20 border border-rose-800/30 text-xs text-rose-300">
                  <span className="font-semibold block text-[10px] uppercase tracking-wider">
                    Cancelled Note:
                  </span>
                  <span className="text-[11px]">{ord.cancelReason}</span>
                </div>
              )}

              {/* Quick AI Action Triggers */}
              <div className="mt-3 pt-2 border-t border-slate-800/60 flex flex-wrap gap-1.5">
                <button
                  onClick={() =>
                    onSendPrompt(`What is the status and details of ${ord.orderNumber}?`)
                  }
                  className="px-2 py-1 rounded text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Status
                </button>

                {ord.tracking && (
                  <button
                    onClick={() =>
                      onSendPrompt(`Track courier shipment for ${ord.orderNumber}`)
                    }
                    className="px-2 py-1 rounded text-[11px] bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/40 transition-colors cursor-pointer"
                  >
                    Track Courier
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
                      className="px-2 py-1 rounded text-[11px] bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/40 transition-colors cursor-pointer"
                    >
                      Update Address
                    </button>
                    <button
                      onClick={() =>
                        onSendPrompt(
                          `I want to cancel order ${ord.orderNumber} because I ordered by mistake`
                        )
                      }
                      className="px-2 py-1 rounded text-[11px] bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/40 transition-colors cursor-pointer"
                    >
                      Cancel Order
                    </button>
                  </>
                )}

                {ord.status === "SHIPPED" && (
                  <button
                    onClick={() =>
                      onSendPrompt(`Can I cancel order ${ord.orderNumber}?`)
                    }
                    className="px-2 py-1 rounded text-[11px] bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800/40 transition-colors cursor-pointer"
                  >
                    Test Cancel In-Transit
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Info Banner */}
      <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1 text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          Autonomous Tool Calling active
        </span>
        <span className="text-slate-500 font-mono">Gemini 2.0 Flash</span>
      </div>
    </div>
  );
}
