export default function Loading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-7 w-56 rounded-lg bg-surface-sunken" />
      <div className="mt-3 h-4 w-80 max-w-full rounded bg-surface-sunken" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => <div key={i} className="h-36 rounded-xl bg-surface-sunken" />)}
      </div>
    </div>
  );
}
