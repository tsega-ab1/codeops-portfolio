// A skeleton shaped like the content: reserves the space, nothing jumps when data lands.
export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="h-9 w-48 animate-pulse bg-slate-200" />
      <div className="h-[300px] animate-pulse bg-slate-200" />
      <div className="h-[300px] animate-pulse bg-slate-200" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse bg-slate-200" />
        ))}
      </div>
    </main>
  );
}
