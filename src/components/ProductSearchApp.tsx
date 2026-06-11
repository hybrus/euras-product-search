"use client";

import { useEffect, useState } from "react";
import { ProductGrid } from "@/components/ProductGrid";
import { SearchBar } from "@/components/SearchBar";
import { getProductsFromAppApi } from "@/lib/client-products";
import type { Product, ProductPagination } from "@/types/product";

const DEFAULT_QUERY = "HDMI";
const PER_PAGE = 10;

export function ProductSearchApp() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<ProductPagination | null>(null);
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [debouncedQuery, setDebouncedQuery] = useState(DEFAULT_QUERY);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query.trim() || DEFAULT_QUERY);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsLoading(true);
      const result = await getProductsFromAppApi({
        query: debouncedQuery,
        page,
        perPage: PER_PAGE,
      });

      if (!isMounted) {
        return;
      }

      if (result.error !== null) {
        setProducts([]);
        setError(result.error);
        setPagination(null);
      } else {
        setProducts(result.products);
        setError(null);
        setPagination(result.pagination);
      }
      setIsLoading(false);
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, page]);

  function handleQueryChange(value: string) {
    setQuery(value);
    setPage(1);
  }

  return (
    <section className="space-y-6">
      <SearchBar value={query} onChange={handleQueryChange} />

      {isLoading ? <ProductGridSkeleton /> : null}

      {!isLoading && error ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-semibold text-amber-950">
            Products unavailable
          </h2>
          <p className="mt-2 text-sm text-amber-800">{error}</p>
        </div>
      ) : null}

      {!isLoading && !error && products.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="text-lg font-semibold text-slate-950">
            No products found
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Try another name or product code.
          </p>
        </div>
      ) : null}

      {!isLoading && !error && products.length > 0 ? (
        <>
          <ResultSummary pagination={pagination} query={debouncedQuery} />
          <ProductGrid products={products} />
          <PaginationControls
            pagination={pagination}
            onPrevious={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
            onNext={() => setPage((currentPage) => currentPage + 1)}
          />
        </>
      ) : null}
    </section>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-12 animate-pulse rounded-md bg-slate-200" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="h-80 animate-pulse rounded-md bg-slate-200"
          />
        ))}
      </div>
    </div>
  );
}

function ResultSummary({
  pagination,
  query,
}: {
  pagination: ProductPagination | null;
  query: string;
}) {
  if (!pagination) {
    return null;
  }

  return (
    <p className="text-sm text-slate-600">
      Showing page {pagination.page} of {pagination.totalPages} for{" "}
      <span className="font-medium text-slate-950">{query}</span> (
      {pagination.totalResults} results)
    </p>
  );
}

function PaginationControls({
  pagination,
  onPrevious,
  onNext,
}: {
  pagination: ProductPagination | null;
  onPrevious: () => void;
  onNext: () => void;
}) {
  if (!pagination || pagination.totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-6">
      <button
        type="button"
        onClick={onPrevious}
        disabled={pagination.page <= 1}
        className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Previous
      </button>
      <p className="text-sm text-slate-600">
        Page {pagination.page} / {pagination.totalPages}
      </p>
      <button
        type="button"
        onClick={onNext}
        disabled={pagination.page >= pagination.totalPages}
        className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
