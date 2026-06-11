import type { Product, ProductFetchResult } from "@/types/product";

type ProductDetailsFetchResult =
  | {
      product: Product;
      error: null;
    }
  | {
      product: null;
      error: string | null;
    };

type ProductApiParams = {
  query?: string;
  page?: number;
  perPage?: number;
};

export async function getProductsFromAppApi({
  query,
  page,
  perPage,
}: ProductApiParams = {}): Promise<ProductFetchResult> {
  try {
    const params = new URLSearchParams();

    if (query) {
      params.set("q", query);
    }

    if (page) {
      params.set("page", String(page));
    }

    if (perPage) {
      params.set("perPage", String(perPage));
    }

    const response = await fetch(`/api/products?${params.toString()}`, {
      headers: {
        Accept: "application/json",
      },
    });
    const result = (await response.json()) as ProductFetchResult;

    if (!response.ok && !result.error) {
      return {
        products: [],
        error: `Product API returned ${response.status} ${response.statusText}.`,
      };
    }

    return result;
  } catch {
    return {
      products: [],
      error: "Could not reach the product API route.",
    };
  }
}

export async function getProductByIdFromAppApi(
  id: string,
): Promise<ProductDetailsFetchResult> {
  try {
    const response = await fetch(`/api/products/${encodeURIComponent(id)}`, {
      headers: {
        Accept: "application/json",
      },
    });
    const result = (await response.json()) as ProductDetailsFetchResult;

    if (!response.ok && !result.error) {
      return {
        product: null,
        error: `Product API returned ${response.status} ${response.statusText}.`,
      };
    }

    return result;
  } catch {
    return {
      product: null,
      error: "Could not reach the product API route.",
    };
  }
}
