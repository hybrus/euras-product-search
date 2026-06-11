"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductDetails } from "@/components/ProductDetails";
import { getProductByIdFromAppApi } from "@/lib/client-products";
import type { Product } from "@/types/product";

type ProductDetailsClientProps = {
  id: string;
};

export function ProductDetailsClient({ id }: ProductDetailsClientProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      setIsLoading(true);
      const cachedProduct = getCachedProduct(id);
      const result = await getProductByIdFromAppApi(id);

      if (!isMounted) {
        return;
      }

      if (result.product) {
        setProduct(result.product);
        setError(null);
      } else if (cachedProduct && isTestModeDetailRestriction(result.error)) {
        setProduct(cachedProduct);
        setError(null);
      } else {
        setProduct(null);
        setError(result.error);
      }
      setIsLoading(false);
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return <ProductDetailsSkeleton />;
  }

  if (error) {
    return (
      <StateMessage title="Product details unavailable" message={error} />
    );
  }

  if (!product) {
    return (
      <StateMessage
        title="Product not found"
        message="The selected product is not available in the current EURAS response."
      />
    );
  }

  return <ProductDetails product={product} />;
}

function getCachedProduct(id: string) {
  try {
    const value = window.sessionStorage.getItem(`euras-product:${id}`);

    if (!value) {
      return null;
    }

    return JSON.parse(value) as Product;
  } catch {
    return null;
  }
}

function isTestModeDetailRestriction(error: string | null) {
  return Boolean(error?.includes("78457846"));
}

export function BackLink() {
  return (
    <Link
      href="/"
      className="inline-flex text-sm font-medium text-emerald-700 hover:text-emerald-800"
    >
      Back to products
    </Link>
  );
}

function StateMessage({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-6">
      <h1 className="text-lg font-semibold text-amber-950">{title}</h1>
      <p className="mt-2 text-sm text-amber-800">{message}</p>
    </div>
  );
}

function ProductDetailsSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="aspect-[4/3] animate-pulse rounded-md bg-slate-200" />
      <div className="space-y-5">
        <div className="h-5 w-28 animate-pulse rounded bg-slate-200" />
        <div className="h-10 w-full max-w-xl animate-pulse rounded bg-slate-200" />
        <div className="h-8 w-32 animate-pulse rounded bg-slate-200" />
        <div className="h-32 animate-pulse rounded-md bg-slate-200" />
      </div>
    </div>
  );
}
