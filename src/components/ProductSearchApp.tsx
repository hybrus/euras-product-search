"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductGrid } from "@/components/ProductGrid";
import { ProductModal } from "@/components/ProductModal";
import { SearchBar } from "@/components/SearchBar";
import { getProductsFromAppApi } from "@/lib/client-products";
import type { Product, ProductPagination } from "@/types/product";

const DEFAULT_QUERY = "HDMI";
const PER_PAGE = 10;

export function ProductSearchApp() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") || DEFAULT_QUERY;

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<ProductPagination | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const fetchedRef = useRef(new Set<string>());
  const isMounted = useRef(false);

  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return; }
    const id = window.setTimeout(() => {
      const next = query.trim() || DEFAULT_QUERY;
      setDebouncedQuery(next);
      router.replace(next === DEFAULT_QUERY ? "/" : `/?q=${encodeURIComponent(next)}`, { scroll: false });
    }, 350);
    return () => window.clearTimeout(id);
  }, [query, router]);

  useEffect(() => {
    const key = `${debouncedQuery}:${page}`;
    if (fetchedRef.current.has(key)) return;
    fetchedRef.current.add(key);

    let active = true;

    page === 1 ? setIsLoading(true) : setIsLoadingMore(true);

    getProductsFromAppApi({ query: debouncedQuery, page, perPage: PER_PAGE }).then(
      (result) => {
        if (!active) return;

        if (result.error) {
          if (page === 1) { setProducts([]); setPagination(null); }
          setError(result.error);
        } else {
          setProducts((prev) =>
            page === 1
              ? deduped(result.products)
              : deduped([...prev, ...result.products]),
          );
          setPagination(result.pagination ?? null);
          setError(null);
        }

        setIsLoading(false);
        setIsLoadingMore(false);
      },
    );

    return () => { active = false; };
  }, [debouncedQuery, page]);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || isLoading || isLoadingMore || error || !pagination) return;
    if (pagination.page >= pagination.totalPages) return;

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setPage((p) => p + 1); },
      { rootMargin: "400px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [error, isLoading, isLoadingMore, pagination]);

  function handleSearch(value: string) {
    fetchedRef.current.clear();
    setQuery(value);
    setPage(1);
    setProducts([]);
    setPagination(null);
    setError(null);
  }

  const allLoaded = !!pagination && pagination.page >= pagination.totalPages;

  return (
    <section className="space-y-6">
      <SearchBar value={query} onChange={handleSearch} />

      {isLoading && <Skeleton count={PER_PAGE} />}

      {!isLoading && error && products.length === 0 && (
        <Notice title="Products unavailable" message={error} />
      )}

      {!isLoading && !error && products.length === 0 && (
        <div className="rounded-md border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="text-lg font-semibold text-slate-950">No products found</h2>
          <p className="mt-2 text-sm text-slate-600">Try another name or product code.</p>
        </div>
      )}

      {!isLoading && products.length > 0 && (
        <>
          <p className="text-sm text-slate-600">
            {allLoaded ? (
              <>{products.length} results for <strong className="text-slate-950">{debouncedQuery}</strong></>
            ) : (
              <>Showing {products.length} results for <strong className="text-slate-950">{debouncedQuery}</strong> — scroll to load more</>
            )}
          </p>

          <ProductGrid products={products} onSelect={setSelected} />

          <div ref={sentinelRef} className="border-t border-slate-200 pt-6 text-center">
            {isLoadingMore && <Skeleton count={4} />}
            <p className="mt-4 text-sm text-slate-600">
              {allLoaded ? "All products loaded" : isLoadingMore ? "Loading…" : "Scroll to load more"}
            </p>
          </div>
        </>
      )}

      {selected && <ProductModal product={selected} onClose={() => setSelected(null)} />}

      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-5 right-5 z-20 rounded-md bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-200"
        >
          Back to top
        </button>
      )}
    </section>
  );
}

function Skeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-80 animate-pulse rounded-md bg-slate-200" />
      ))}
    </div>
  );
}

function Notice({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-6">
      <h2 className="text-lg font-semibold text-amber-950">{title}</h2>
      <p className="mt-2 text-sm text-amber-800">{message}</p>
    </div>
  );
}

function deduped(products: Product[]) {
  const seen = new Set<string>();
  return products.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}
