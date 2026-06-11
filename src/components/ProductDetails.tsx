import Image from "next/image";
import type { Product } from "@/types/product";

type ProductDetailsProps = {
  product: Product;
};

export function ProductDetails({ product }: ProductDetailsProps) {
  const details = Object.entries(product.details);

  return (
    <article className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-slate-200 bg-white">
        <Image
          src={product.imageUrl || "/placeholder-product.svg"}
          alt={product.name}
          fill
          priority
          sizes="(min-width: 1024px) 45vw, 100vw"
          className="object-contain p-8"
        />
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          {product.code ? (
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
              {product.code}
            </p>
          ) : null}
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {product.name}
          </h1>
          <p className="text-2xl font-semibold text-emerald-700">
            {product.price}
          </p>
        </div>

        {product.description ? (
          <p className="max-w-2xl text-base leading-7 text-slate-700">
            {product.description}
          </p>
        ) : null}

        <dl className="grid gap-3 rounded-md border border-slate-200 bg-white p-5 sm:grid-cols-2">
          <DetailItem label="Product ID" value={product.id} />
          {product.code ? (
            <DetailItem label="Product code" value={product.code} />
          ) : null}
          {product.brand ? <DetailItem label="Brand" value={product.brand} /> : null}
          {product.category ? (
            <DetailItem label="Category" value={product.category} />
          ) : null}
          {details.map(([label, value]) => (
            <DetailItem key={label} label={label} value={value} />
          ))}
        </dl>
      </div>
    </article>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium text-slate-950">
        {value}
      </dd>
    </div>
  );
}
