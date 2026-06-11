import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
      <div className="text-center space-y-4">
        <p className="text-5xl font-semibold text-slate-950">404</p>
        <p className="text-base text-slate-600">This page does not exist.</p>
        <Link href="/" className="inline-flex text-sm font-medium text-emerald-700 hover:text-emerald-800">
          Back to products
        </Link>
      </div>
    </main>
  );
}
