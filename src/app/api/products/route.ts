import { NextResponse } from "next/server";
import { getProducts } from "@/lib/products";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const result = await getProducts({
    query: searchParams.get("q") ?? undefined,
    page: parseIntegerParam(searchParams.get("page")),
    perPage: parseIntegerParam(searchParams.get("perPage")),
  });

  return NextResponse.json(result, {
    status: result.error ? 502 : 200,
  });
}

function parseIntegerParam(value: string | null) {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}
