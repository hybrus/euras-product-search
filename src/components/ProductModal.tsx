"use client";

import { useEffect } from "react";
import Image from "next/image";
import type { Product } from "@/types/product";

export function ProductModal({ product, onClose }: { product: Product; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const details = Object.entries(product.details);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-md p-1 text-slate-500 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        <div className="grid gap-6 p-6 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-slate-200 bg-slate-50">
            <Image
              src={product.imageUrl || "/placeholder-product.svg"}
              alt={product.name}
              fill
              priority
              sizes="(min-width: 1024px) 40vw, 90vw"
              className="object-contain p-6"
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              {product.code && (
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {product.code}
                </p>
              )}
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                {product.name}
              </h2>
              <p className="text-xl font-semibold text-emerald-700">{product.price}</p>
            </div>

            {product.description && (
              <p className="text-sm leading-6 text-slate-600">{product.description}</p>
            )}

            <dl className="grid grid-cols-2 gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm">
              {product.brand && <DetailItem label="Brand" value={product.brand} />}
              {product.category && <DetailItem label="Category" value={product.category} />}
              {details.map(([label, value]) => (
                <DetailItem key={label} label={label} value={value} />
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 break-words font-medium text-slate-950">{value}</dd>
    </div>
  );
}
