"use client";

import React from "react";
import { Package, MapPin, DollarSign, Calendar, XCircle, CheckCircle, Clock } from "lucide-react";
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
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PROCESSING":
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" /> {status}
          </span>
        );
      case "SHIPPED":
      case "OUT_FOR_DELIVERY":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Package className="w-3 h-3" /> {status}
          </span>
        );
      case "DELIVERED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle className="w-3 h-3" /> {status}
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3" /> {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/30">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg my-3 space-y-3 text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-md">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Order Number</div>
            <div className="text-sm font-bold text-white tracking-wide">
              {order.orderNumber}
            </div>
          </div>
        </div>
        <div>{getStatusBadge(order.status)}</div>
      </div>

      {/* Items list */}
      <div className="space-y-1.5">
        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
          Items Ordered
        </div>
        <div className="divide-y divide-slate-800/60 bg-slate-950/50 rounded-lg p-2.5 border border-slate-800/60">
          {order.items.map((item, idx) => (
            <div
              key={idx}
              className={cn(
                "flex items-center justify-between text-xs py-1.5",
                idx === 0 ? "pt-0" : ""
              )}
            >
              <div>
                <span className="font-medium text-slate-200">
                  {item.productName}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  Qty: {item.quantity} · SKU: {item.sku}
                </span>
              </div>
              <div className="text-right font-medium text-indigo-300">
                ${(item.unitPrice * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping Address & Total */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
        <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60 flex items-start gap-2">
          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase">
              Shipping Destination
            </div>
            <div className="text-slate-200 font-medium">
              {order.shippingAddress.street}
            </div>
            <div className="text-slate-400 text-[11px]">
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.postalCode}
              {order.shippingAddress.country
                ? `, ${order.shippingAddress.country}`
                : ""}
            </div>
          </div>
        </div>

        <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60 flex items-start gap-2">
          <DollarSign className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase">
              Total Charged
            </div>
            <div className="text-base font-bold text-amber-300">
              ${order.totalAmount.toFixed(2)}{" "}
              <span className="text-xs text-slate-400 font-normal">
                {order.currency || "USD"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cancelled Alert if applicable */}
      {order.status === "CANCELLED" && order.cancelReason && (
        <div className="bg-rose-950/30 border border-rose-800/50 p-2.5 rounded-lg text-xs text-rose-300 flex items-start gap-2">
          <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-rose-200">
              Cancellation Reason
            </div>
            <div>{order.cancelReason}</div>
          </div>
        </div>
      )}
    </div>
  );
}
