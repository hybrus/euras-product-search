"use client";

import Image from "next/image";
import type { Product } from "@/types/product";

type ProductCardProps = {
  product: Product;
  onClick: (product: Product) => void;
};

export function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(product)}
      className="group flex h-full w-full flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-100 text-left"
    >
      <div className="relative aspect-[4/3] bg-slate-100 w-full">
        <Image
          src={product.imageUrl || "/placeholder-product.svg"}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-contain p-5 transition group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          {product.code && (
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {product.code}
            </p>
          )}
          <h2 className="line-clamp-2 text-base font-semibold text-slate-950">
            {product.name}
          </h2>
        </div>
        <p className="mt-auto text-lg font-semibold text-emerald-700">
          {product.price}
        </p>
      </div>
    </button>
  );
}
