"use client";

import React, { useState } from "react";
import {
  Package,
  MapPin,
  DollarSign,
  XCircle,
  CheckCircle,
  Clock,
  Copy,
  CheckCheck,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface OrderItemData {
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal?: number;
}

export interface OrderData {
  orderNumber: string;
  status: string;
  customerName?: string;
  customerEmail?: string;
  totalAmount: number;
  currency?: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
  };
  items: OrderItemData[];
  createdAt?: string;
  cancelReason?: string | null;
}

export default function OrderCard({ order }: { order: OrderData }) {
  const [copied, setCopied] = useState(false);

  const copyOrderId = () => {
    navigator.clipboard.writeText(order.orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PROCESSING":
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/10">
            <Clock className="w-3 h-3 text-amber-400" /> {status}
          </span>
        );
      case "SHIPPED":
      case "OUT_FOR_DELIVERY":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/30 shadow-sm shadow-sky-500/10">
            <Package className="w-3 h-3 text-sky-400" /> {status}
          </span>
        );
      case "DELIVERED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/10">
            <CheckCircle className="w-3 h-3 text-emerald-400" /> {status}
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30 shadow-sm shadow-rose-500/10">
            <XCircle className="w-3 h-3 text-rose-400" /> {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-2xl my-3 space-y-3.5 text-zinc-100 backdrop-blur relative overflow-hidden">
      {/* Subtle top hairline highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />

      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-sm font-bold text-white tracking-wide">
                {order.orderNumber}
              </span>
              <button
                onClick={copyOrderId}
                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Copy order number"
              >
                {copied ? (
                  <CheckCheck className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
            <div className="text-[11px] text-zinc-400 font-sans">
              Order Record Snapshot
            </div>
          </div>
        </div>

        <div>{getStatusBadge(order.status)}</div>
      </div>

      {/* Items Section */}
      <div className="space-y-1.5">
        <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
          Order Items ({order.items.length})
        </div>
        <div className="divide-y divide-white/[0.05] bg-[#18181b] rounded-xl p-3 border border-white/[0.05]">
          {order.items.map((item, idx) => (
            <div
              key={idx}
              className={cn(
                "flex items-center justify-between text-xs py-2",
                idx === 0 ? "pt-0" : ""
              )}
            >
              <div className="min-w-0 pr-2">
                <span className="font-medium text-zinc-200 block truncate">
                  {item.productName}
                </span>
                <span className="text-[11px] text-zinc-400 font-mono block mt-0.5">
                  Qty: {item.quantity} · SKU:{" "}
                  <span className="text-zinc-300">{item.sku}</span>
                </span>
              </div>
              <div className="text-right font-mono font-semibold text-zinc-200 shrink-0">
                ${(item.unitPrice * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping Address & Total Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
        <div className="bg-[#18181b] p-3 rounded-xl border border-white/[0.05] flex items-start gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              Shipping Destination
            </div>
            <div className="text-zinc-200 font-semibold truncate mt-0.5">
              {order.shippingAddress.street}
            </div>
            <div className="text-zinc-400 text-[11px] mt-0.5">
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.postalCode}
              {order.shippingAddress.country
                ? `, ${order.shippingAddress.country}`
                : ""}
            </div>
          </div>
        </div>

        <div className="bg-[#18181b] p-3 rounded-xl border border-white/[0.05] flex items-start gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              Order Total
            </div>
            <div className="text-base font-bold text-amber-300 font-mono mt-0.5">
              ${order.totalAmount.toFixed(2)}{" "}
              <span className="text-xs text-zinc-400 font-normal">
                {order.currency || "USD"}
              </span>
            </div>
            <div className="text-[10px] text-emerald-400 font-medium">
              Payment Confirmed
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Notice if applicable */}
      {order.status === "CANCELLED" && order.cancelReason && (
        <div className="bg-rose-950/20 border border-rose-500/30 p-3 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
          <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-rose-200 text-[11px] uppercase tracking-wider">
              Cancellation Reason
            </div>
            <div className="mt-0.5 text-zinc-300">{order.cancelReason}</div>
          </div>
        </div>
      )}
    </div>
  );
}
