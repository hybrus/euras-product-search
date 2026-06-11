import type { Product, ProductFetchResult } from "@/types/product";

type JsonRecord = Record<string, unknown>;

const PRODUCT_ARRAY_KEYS = [
  "products",
  "items",
  "data",
  "results",
  "rows",
  "treffer",
];
const EED_DOC_PATH = "/admin/Dok/eed-doku-eng.php";
const EED_ENDPOINT_PATH = "/eed.php";
const DEFAULT_QUERY = "HDMI";
const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 10;
const DETAIL_KEYS = [
  "category",
  "brand",
  "manufacturer",
  "artikelhersteller",
  "vgruppenname",
  "lieferzeit",
  "bestellbar",
  "EAN",
  "availability",
  "stock",
  "status",
  "unit",
  "currency",
];

type FetchOptions = RequestInit & {
  next?: {
    revalidate?: number;
  };
};

type ProductQueryOptions = {
  query?: string;
  page?: number;
  perPage?: number;
};

export async function getProducts(
  options: ProductQueryOptions = {},
): Promise<ProductFetchResult> {
  const url = buildProductsUrl(options);

  if (!url) {
    return {
      products: [],
      error:
        "EURAS_PRODUCTS_API_URL is not configured. Add the EURAS EED endpoint to .env.local to load products.",
    };
  }

  if (url.pathname === EED_DOC_PATH) {
    return {
      products: [],
      error:
        "EURAS_PRODUCTS_API_URL points to the documentation page. Use https://shop.euras.com/eed.php with EED query parameters instead.",
    };
  }

  try {
    return await fetchProducts(url, {
      headers: buildHeaders(),
      next: { revalidate: 300 },
    });
  } catch (error) {
    return getFetchError(error);
  }
}

export async function getProductById(id: string) {
  const url = buildProductDetailsUrl(id);
  const decodedId = decodeURIComponent(id);

  if (!url) {
    return {
      product: null,
      error:
        "EURAS_PRODUCTS_API_URL is not configured. Add the EURAS EED endpoint to .env.local to load product details.",
    };
  }

  try {
    const { products, error } = await fetchProducts(url, {
      headers: buildHeaders(),
      next: { revalidate: 300 },
    });

    if (error) {
      return { product: null, error };
    }

    return {
      product:
        products.find((product) => product.id === decodedId) ??
        products.find((product) => product.code === decodedId) ??
        products[0] ??
        null,
      error: null,
    };
  } catch (error) {
    return {
      product: null,
      error: getFetchError(error).error,
    };
  }
}

function buildHeaders() {
  const headers: HeadersInit = {
    Accept: "application/json",
    "User-Agent":
      "Mozilla/5.0 (compatible; EURAS Product Search/1.0; +https://localhost)",
  };

  return headers;
}

async function fetchProducts(
  url: URL,
  options: FetchOptions = {},
): Promise<ProductFetchResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...options.headers,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        products: [],
        error: `EURAS returned ${response.status} ${response.statusText}.`,
      };
    }

    const body = await response.text();
    const payload = parsePayload(body);
    const legacyError = getLegacyEedError(body);

    if (legacyError) {
      return { products: [], error: legacyError };
    }

    if (!payload) {
      return {
        products: [],
        error:
          "EURAS did not return JSON. Check that the endpoint points to eed.php and includes format=json.",
      };
    }

    const eedError = getEedError(payload);

    if (eedError) {
      return { products: [], error: eedError };
    }

    const products = extractProductArray(payload)
      .map(normalizeProduct)
      .filter((product): product is Product => Boolean(product));

    return {
      products,
      error: null,
      pagination: getPagination(payload, products.length),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function extractProductArray(payload: unknown): JsonRecord[] {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }

  if (!isRecord(payload)) {
    return [];
  }

  for (const key of PRODUCT_ARRAY_KEYS) {
    const value = payload[key];

    if (Array.isArray(value)) {
      return value.filter(isRecord);
    }

    if (isRecord(value)) {
      return Object.values(value).filter(isRecord);
    }
  }

  if (
    firstString(payload, [
      "artikelnummer",
      "code",
      "productCode",
      "id",
      "productId",
    ]) &&
    firstString(payload, [
      "artikelbezeichnung",
      "name",
      "productName",
      "title",
    ])
  ) {
    return [payload];
  }

  return [];
}

function normalizeProduct(raw: JsonRecord): Product | null {
  const code = firstString(raw, [
    "code",
    "productCode",
    "artikelnummer",
    "articleNumber",
    "itemNumber",
    "partNumber",
    "sku",
  ]);
  const id =
    firstString(raw, ["id", "productId", "uid", "uuid"]) ??
    code ??
    firstString(raw, ["slug"]);
  const name = firstString(raw, [
    "name",
    "productName",
    "artikelbezeichnung",
    "title",
    "description",
    "itemName",
  ]);

  if (!id || !name) {
    return null;
  }

  return {
    id,
    name,
    code,
    price: formatPrice(
      firstValue(raw, [
        "price",
        "salesPrice",
        "listPrice",
        "grossPrice",
        "netPrice",
        "ekpreis",
        "preis",
        "amount",
      ]),
      firstString(raw, ["currency", "currencyCode"]),
    ),
    imageUrl: firstString(raw, [
      "imageUrl",
      "image",
      "picture",
      "pictureUrl",
      "thumbnail",
      "thumbnailUrl",
      "thumbnailurl",
      "bigPicture",
      "photo",
    ]),
    description:
      firstString(raw, ["longDescription", "descriptionText", "description"]) ??
      undefined,
    category: firstString(raw, ["category", "group", "productGroup"]),
    brand: firstString(raw, ["brand", "manufacturer", "maker", "artikelhersteller"]),
    details: buildDetails(raw),
  };
}

function buildProductsUrl(options: ProductQueryOptions = {}) {
  return buildEedUrl({
    endpoint: process.env.EURAS_PRODUCTS_API_URL,
    eedId: process.env.EURAS_EED_ID,
    query: options.query ?? process.env.EURAS_DEFAULT_QUERY,
    page: options.page,
    perPage: options.perPage,
    shopUrl: process.env.EURAS_SHOP_URL,
    customerIpHash: process.env.EURAS_CUSTOMER_IP_HASH,
  });
}

function buildProductDetailsUrl(id: string) {
  return buildEedUrl({
    endpoint: process.env.EURAS_PRODUCTS_API_URL,
    eedId: process.env.EURAS_EED_ID,
    command: "artikeldetails",
    articleNumber: decodeURIComponent(id),
    shopUrl: process.env.EURAS_SHOP_URL,
    customerIpHash: process.env.EURAS_CUSTOMER_IP_HASH,
  });
}

function buildEedUrl({
  endpoint,
  eedId,
  query,
  command = "artikelsuche",
  articleNumber,
  page,
  perPage,
  shopUrl,
  customerIpHash,
}: {
  endpoint?: string;
  eedId?: string;
  query?: string;
  command?: "artikelsuche" | "artikeldetails";
  articleNumber?: string;
  page?: number;
  perPage?: number;
  shopUrl?: string;
  customerIpHash?: string;
}) {
  const configuredUrl = endpoint;

  if (!configuredUrl) {
    return null;
  }

  try {
    const url = new URL(configuredUrl);

    if (url.pathname === EED_DOC_PATH) {
      return url;
    }

    if (url.pathname.endsWith(EED_ENDPOINT_PATH)) {
      url.searchParams.set("format", url.searchParams.get("format") ?? "json");
      url.searchParams.set("art", url.searchParams.get("art") ?? command);
      url.searchParams.set("sessionid", url.searchParams.get("sessionid") ?? "auto");

      if (command === "artikelsuche") {
        url.searchParams.set(
          "suchbg",
          url.searchParams.get("suchbg") ?? query ?? DEFAULT_QUERY,
        );
        url.searchParams.set(
          "anzahl",
          url.searchParams.get("anzahl") ??
            String(toPositiveInteger(perPage, DEFAULT_PER_PAGE)),
        );
        url.searchParams.set(
          "seite",
          url.searchParams.get("seite") ??
            String(toPositiveInteger(page, DEFAULT_PAGE)),
        );
      }

      if (command === "artikeldetails" && articleNumber) {
        url.searchParams.set("artnr", url.searchParams.get("artnr") ?? articleNumber);
      }

      if (eedId && !url.searchParams.has("id")) {
        url.searchParams.set("id", eedId);
      }

      if (!url.searchParams.has("shopurl")) {
        url.searchParams.set(
          "shopurl",
          shopUrl ?? "http://localhost:3000/",
        );
      }

      if (!url.searchParams.has("customerip")) {
        if (customerIpHash) {
          url.searchParams.set("customerip", customerIpHash);
        }
      }
    }

    return url;
  } catch {
    return null;
  }
}

function getPagination(payload: unknown, resultCount: number) {
  if (!isRecord(payload)) {
    return {
      page: DEFAULT_PAGE,
      perPage: resultCount,
      totalPages: resultCount > 0 ? 1 : 0,
      totalResults: resultCount,
    };
  }

  const page = toPositiveInteger(payload.seite, DEFAULT_PAGE);
  const perPage = toPositiveInteger(payload.trefferproseite, resultCount);
  const totalPages = toPositiveInteger(
    payload.anzahlseiten,
    resultCount > 0 ? 1 : 0,
  );
  const totalResults = toPositiveInteger(
    payload.gesamtanzahltreffer,
    resultCount,
  );

  return {
    page,
    perPage,
    totalPages,
    totalResults,
  };
}

function toPositiveInteger(value: unknown, fallback: number) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseInt(value, 10)
        : Number.NaN;

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getEedError(payload: unknown) {
  if (!isRecord(payload)) {
    return null;
  }

  const errorNumber = payload.fehlernummer;

  if (String(errorNumber) === "0") {
    return null;
  }

  if (errorNumber !== undefined) {
    const code = String(errorNumber);

    if (code === "78457849") {
      return "The EURAS test account only supports searches for SONY, AEG, or HDMI.";
    }

    if (code === "78457846") {
      return "The EURAS test account only supports detail lookup for its predefined test articles.";
    }

    const message = firstString(payload, ["fehlermeldung", "error", "message"]);
    return message
      ? `EURAS returned error ${code}: ${message}`
      : `EURAS returned error ${code}.`;
  }

  return null;
}

function getLegacyEedError(body: string) {
  const [prefix, code, message] = body.split(";");

  if (prefix !== "ERROR") {
    return null;
  }

  if (code === "78457849") {
    return "The EURAS test account only supports searches for SONY, AEG, or HDMI.";
  }

  if (code === "78457846") {
    return "The EURAS test account only supports detail lookup for its predefined test articles.";
  }

  return message
    ? `EURAS returned error ${code}: ${decodeHtml(message)}`
    : `EURAS returned error ${code}.`;
}

function parsePayload(body: string) {
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return null;
  }
}

function decodeHtml(value: string) {
  return value
    .replaceAll("&uuml;", "ü")
    .replaceAll("&auml;", "ä")
    .replaceAll("&ouml;", "ö")
    .replaceAll("&Uuml;", "Ü")
    .replaceAll("&Auml;", "Ä")
    .replaceAll("&Ouml;", "Ö")
    .replaceAll("&szlig;", "ß")
    .replaceAll("&amp;", "&");
}

function getFetchError(error: unknown): ProductFetchResult {
  return {
    products: [],
    error:
      error instanceof Error && error.name === "AbortError"
        ? "EURAS request timed out after 30 seconds."
        : "Could not reach EURAS from this runtime. Check browser/network access, endpoint URL, and EED credentials.",
  };
}

function firstString(raw: JsonRecord, keys: string[]) {
  const value = firstValue(raw, keys);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function firstValue(raw: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = raw[key];

    if (value !== null && value !== undefined && value !== "") {
      return value;
    }
  }

  return undefined;
}

function formatPrice(value: unknown, currency?: string) {
  if (typeof value === "number") {
    if (currency) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
      }).format(value);
    }

    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return "Price unavailable";
}

function buildDetails(raw: JsonRecord) {
  return DETAIL_KEYS.reduce<Record<string, string>>((details, key) => {
    const value = raw[key];

    if (typeof value === "string" && value.trim()) {
      details[toLabel(key)] = value.trim();
    } else if (typeof value === "number" || typeof value === "boolean") {
      details[toLabel(key)] = String(value);
    }

    return details;
  }, {});
}

function toLabel(value: string) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (match) => match.toUpperCase());
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
