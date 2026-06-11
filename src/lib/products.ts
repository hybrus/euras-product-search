import type { Product, ProductFetchResult } from "@/types/product";

type JsonRecord = Record<string, unknown>;

const DEFAULT_QUERY = process.env.EURAS_DEFAULT_QUERY ?? "HDMI";
const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 10;

export async function getProducts(options: {
  query?: string;
  page?: number;
  perPage?: number;
} = {}): Promise<ProductFetchResult> {
  const url = buildUrl(options);

  if (!url) {
    return { products: [], error: "EURAS_PRODUCTS_API_URL is not configured." };
  }

  return fetchProducts(url);
}


async function fetchProducts(url: URL): Promise<ProductFetchResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return { products: [], error: `EURAS returned ${res.status} ${res.statusText}.` };
    }

    const body = await res.text();
    const legacyError = parseLegacyError(body);
    if (legacyError) return { products: [], error: legacyError };

    const payload = tryParseJson(body);
    if (!payload) {
      return { products: [], error: "EURAS did not return JSON. Check the endpoint URL." };
    }

    const apiError = parseApiError(payload);
    if (apiError) return { products: [], error: apiError };

    const products = extractProducts(payload);
    return { products, error: null, pagination: getPagination(payload, products.length) };
  } catch (err) {
    return {
      products: [],
      error: err instanceof Error && err.name === "AbortError"
        ? "EURAS request timed out."
        : "Could not reach EURAS. Check the endpoint URL and credentials.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

function buildUrl(options: { query?: string; page?: number; perPage?: number } = {}): URL | null {
  const endpoint = process.env.EURAS_PRODUCTS_API_URL;
  if (!endpoint) return null;

  try {
    const url = new URL(endpoint);

    url.searchParams.set("format", "json");
    url.searchParams.set("art", "artikelsuche");
    url.searchParams.set("sessionid", url.searchParams.get("sessionid") ?? "auto");
    url.searchParams.set("suchbg", options.query ?? DEFAULT_QUERY);
    url.searchParams.set("anzahl", String(toInt(options.perPage, DEFAULT_PER_PAGE)));
    url.searchParams.set("seite", String(toInt(options.page, DEFAULT_PAGE)));

    if (process.env.EURAS_EED_ID) url.searchParams.set("id", process.env.EURAS_EED_ID);
    url.searchParams.set("shopurl", process.env.EURAS_SHOP_URL ?? "http://localhost:3000/");
    if (process.env.EURAS_CUSTOMER_IP_HASH) url.searchParams.set("customerip", process.env.EURAS_CUSTOMER_IP_HASH);

    return url;
  } catch {
    return null;
  }
}

function extractProducts(payload: unknown): Product[] {
  if (!isRecord(payload)) return [];

  for (const key of ["treffer", "products", "items", "data", "results"]) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value.filter(isRecord).map(normalizeProduct).filter(Boolean) as Product[];
    }
    if (isRecord(value)) {
      return Object.values(value).filter(isRecord).map(normalizeProduct).filter(Boolean) as Product[];
    }
  }

  return [];
}

function normalizeProduct(raw: JsonRecord): Product | null {
  const code = firstString(raw, ["artikelnummer", "code", "sku"]);
  const id = firstString(raw, ["id", "productId"]) ?? code;
  const name = firstString(raw, ["artikelbezeichnung", "name", "title"]);

  if (!id || !name) return null;

  return {
    id,
    name,
    code,
    price: formatPrice(firstValue(raw, ["preis", "price", "ekpreis"])),
    imageUrl: firstString(raw, ["bigPicture", "imageUrl", "image", "thumbnailurl"]),
    description: firstString(raw, ["longDescription", "descriptionText"]),
    category: firstString(raw, ["vgruppenname", "category"]),
    brand: firstString(raw, ["artikelhersteller", "brand", "manufacturer"]),
    details: buildDetails(raw),
  };
}

function buildDetails(raw: JsonRecord): Record<string, string> {
  const keys = ["vgruppenname", "lieferzeit", "bestellbar", "EAN", "availability", "stock"];
  const details: Record<string, string> = {};

  for (const key of keys) {
    const value = raw[key];
    if (typeof value === "string" && value.trim()) details[toLabel(key)] = value.trim();
    else if (typeof value === "number" || typeof value === "boolean") details[toLabel(key)] = String(value);
  }

  return details;
}

function getPagination(payload: unknown, resultCount: number) {
  if (!isRecord(payload)) {
    return { page: DEFAULT_PAGE, perPage: resultCount, totalPages: resultCount > 0 ? 1 : 0, totalResults: resultCount };
  }

  return {
    page: toInt(payload.seite, DEFAULT_PAGE),
    perPage: toInt(payload.trefferproseite, resultCount),
    totalPages: toInt(payload.anzahlseiten, resultCount > 0 ? 1 : 0),
    totalResults: toInt(payload.gesamtanzahltreffer, resultCount),
  };
}

function parseApiError(payload: unknown): string | null {
  if (!isRecord(payload)) return null;
  const code = String(payload.fehlernummer ?? "");
  if (!code || code === "0") return null;
  if (code === "78457849") return "The EURAS test account only supports searches for SONY, AEG, or HDMI.";
  if (code === "78457846") return "The EURAS test account only supports detail lookup for its predefined test articles.";
  return firstString(payload, ["fehlermeldung", "error"]) ?? `EURAS returned error ${code}.`;
}

function parseLegacyError(body: string): string | null {
  const [prefix, code, message] = body.split(";");
  if (prefix !== "ERROR") return null;
  if (code === "78457849") return "The EURAS test account only supports searches for SONY, AEG, or HDMI.";
  if (code === "78457846") return "The EURAS test account only supports detail lookup for its predefined test articles.";
  return message ? `EURAS error ${code}: ${message}` : `EURAS error ${code}.`;
}

function tryParseJson(body: string): unknown {
  try { return JSON.parse(body); } catch { return null; }
}

function formatPrice(value: unknown): string {
  const num =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? parseFloat(value.trim().replace(",", "."))
        : NaN;

  if (!isNaN(num)) {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(num);
  }

  return "Price unavailable";
}

function firstString(raw: JsonRecord, keys: string[]): string | undefined {
  const value = firstValue(raw, keys);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function firstValue(raw: JsonRecord, keys: string[]): unknown {
  for (const key of keys) {
    const value = raw[key];
    if (value !== null && value !== undefined && value !== "") return value;
  }
  return undefined;
}

function toInt(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function toLabel(key: string): string {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
