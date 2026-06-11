export type Product = {
  id: string;
  name: string;
  price: string;
  code?: string;
  imageUrl?: string;
  description?: string;
  category?: string;
  brand?: string;
  details: Record<string, string>;
};

export type ProductPagination = {
  page: number;
  perPage: number;
  totalPages: number;
  totalResults: number;
};

export type ProductFetchResult =
  | {
      products: Product[];
      error: null;
      pagination: ProductPagination;
    }
  | {
      products: [];
      error: string;
      pagination?: never;
    };
