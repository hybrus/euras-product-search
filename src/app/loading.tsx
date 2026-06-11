export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-3">
          <div className="h-9 w-72 max-w-full animate-pulse rounded bg-slate-200" />
          <div className="h-5 w-96 max-w-full animate-pulse rounded bg-slate-200" />
        </div>
        <div className="h-12 animate-pulse rounded-md bg-slate-200" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div
              key={index}
              className="h-80 animate-pulse rounded-md bg-slate-200"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
