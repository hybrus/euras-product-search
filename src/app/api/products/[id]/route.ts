import { NextResponse } from "next/server";
import { getProductById } from "@/lib/products";

type ProductRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: ProductRouteContext) {
  const { id } = await context.params;
  const result = await getProductById(id);

  if (result.error) {
    return NextResponse.json(result, { status: 502 });
  }

  if (!result.product) {
    return NextResponse.json(result, { status: 404 });
  }

  return NextResponse.json(result);
}
