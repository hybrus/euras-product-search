import type { ProductFetchResult } from "@/types/product";

export async function getProductsFromAppApi({
  query,
  page,
  perPage,
}: { query?: string; page?: number; perPage?: number } = {}): Promise<ProductFetchResult> {
  try {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (page) params.set("page", String(page));
    if (perPage) params.set("perPage", String(perPage));

    const res = await fetch(`/api/products?${params}`, {
      headers: { Accept: "application/json" },
    });
    const result = (await res.json()) as ProductFetchResult;

    if (!res.ok && !result.error) {
      return { products: [], error: `API returned ${res.status} ${res.statusText}.` };
    }

    return result;
  } catch {
    return { products: [], error: "Could not reach the product API." };
  }
}
