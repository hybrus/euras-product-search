import {
  BackLink,
  ProductDetailsClient,
} from "@/components/ProductDetailsClient";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <BackLink />
        <ProductDetailsClient id={id} />
      </div>
    </main>
  );
}
