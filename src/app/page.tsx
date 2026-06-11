import { Suspense } from "react";
import { ProductSearchApp } from "@/components/ProductSearchApp";

export const dynamic = "force-static";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="max-w-3xl space-y-3">
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
            EURAS product search
          </p>
          <p className="text-base leading-7 text-slate-600">
            Find products by name or code
          </p>
        </header>

        <Suspense>
          <ProductSearchApp />
        </Suspense>
      </div>
    </main>
  );
}
