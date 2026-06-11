"use client";

import { useEffect, useRef, useState } from "react";
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
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const requestedPagesRef = useRef(new Set<string>());

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query.trim() || DEFAULT_QUERY);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      const requestKey = `${debouncedQuery}:${page}`;

      if (requestedPagesRef.current.has(requestKey)) {
        return;
      }

      requestedPagesRef.current.add(requestKey);

      if (page === 1) {
        setIsInitialLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const result = await getProductsFromAppApi({
        query: debouncedQuery,
        page,
        perPage: PER_PAGE,
      });

      if (!isMounted) {
        return;
      }

      if (result.error !== null) {
        if (page === 1) {
          setProducts([]);
          setPagination(null);
        }

        setError(result.error);
      } else {
        setProducts((currentProducts) =>
          page === 1
            ? uniqueProducts(result.products)
            : mergeProducts(currentProducts, result.products),
        );
        setError(null);
        setPagination(result.pagination);
      }

      setIsInitialLoading(false);
      setIsLoadingMore(false);
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, page]);

  useEffect(() => {
    function handleScroll() {
      setShowBackToTop(window.scrollY > 600);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const node = loadMoreRef.current;

    if (!node || isInitialLoading || isLoadingMore || error || !pagination) {
      return;
    }

    if (pagination.page >= pagination.totalPages) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPage((currentPage) => currentPage + 1);
        }
      },
      { rootMargin: "400px" },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [error, isInitialLoading, isLoadingMore, pagination]);

  function handleQueryChange(value: string) {
    requestedPagesRef.current.clear();
    setQuery(value);
    setPage(1);
    setProducts([]);
    setPagination(null);
    setError(null);
  }

  return (
    <section className="space-y-6">
      <SearchBar value={query} onChange={handleQueryChange} />

      {isInitialLoading ? <ProductGridSkeleton count={PER_PAGE} /> : null}

      {!isInitialLoading && error && products.length === 0 ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-semibold text-amber-950">
            Products unavailable
          </h2>
          <p className="mt-2 text-sm text-amber-800">{error}</p>
        </div>
      ) : null}

      {!isInitialLoading && !error && products.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="text-lg font-semibold text-slate-950">
            No products found
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Try another name or product code.
          </p>
        </div>
      ) : null}

      {!isInitialLoading && products.length > 0 ? (
        <>
          <ResultSummary
            loadedCount={products.length}
            pagination={pagination}
            query={debouncedQuery}
          />
          <ProductGrid products={products} />
          <LoadMoreStatus
            ref={loadMoreRef}
            isLoading={isLoadingMore}
            pagination={pagination}
          />
        </>
      ) : null}

      <BackToTopButton isVisible={showBackToTop} />
    </section>
  );
}

function ProductGridSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="h-80 animate-pulse rounded-md bg-slate-200"
        />
      ))}
    </div>
  );
}

function ResultSummary({
  loadedCount,
  pagination,
  query,
}: {
  loadedCount: number;
  pagination: ProductPagination | null;
  query: string;
}) {
  if (!pagination) {
    return null;
  }

  return (
    <p className="text-sm text-slate-600">
      Showing {loadedCount} of {pagination.totalResults} results for{" "}
      <span className="font-medium text-slate-950">{query}</span> (page{" "}
      {pagination.page} of {pagination.totalPages})
    </p>
  );
}

function BackToTopButton({ isVisible }: { isVisible: boolean }) {
  if (!isVisible) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-5 right-5 z-20 rounded-md bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-200"
    >
      Back to top
    </button>
  );
}

function LoadMoreStatus({
  ref,
  isLoading,
  pagination,
}: {
  ref: React.RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  pagination: ProductPagination | null;
}) {
  if (!pagination) {
    return null;
  }

  const hasMore = pagination.page < pagination.totalPages;

  return (
    <div ref={ref} className="border-t border-slate-200 pt-6 text-center">
      {isLoading ? <ProductGridSkeleton count={4} /> : null}
      <p className="mt-4 text-sm text-slate-600">
        {hasMore
          ? isLoading
            ? "Loading more products..."
            : "Scroll to load more products"
          : "All matching products loaded"}
      </p>
    </div>
  );
}

function mergeProducts(currentProducts: Product[], nextProducts: Product[]) {
  return uniqueProducts([...currentProducts, ...nextProducts]);
}

function uniqueProducts(products: Product[]) {
  const seenIds = new Set<string>();

  return products.filter((product) => {
    if (seenIds.has(product.id)) {
      return false;
    }

    seenIds.add(product.id);
    return true;
  });
}
