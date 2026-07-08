export default function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-[2px] overflow-hidden border border-black/5 dark:border-white/5 bg-zinc-100 dark:bg-zinc-800 animate-pulse ${className}`}
      aria-hidden="true"
    >
      <div className="p-8 flex flex-col justify-between h-full">
        {/* Bundle label skeleton */}
        <div className="w-16 h-2.5 rounded-[2px] bg-zinc-200 dark:bg-zinc-700" />
        {/* Title skeleton */}
        <div className="mt-auto space-y-2.5">
          <div className="w-3/4 h-5 rounded-[2px] bg-zinc-200 dark:bg-zinc-700" />
          <div className="w-full h-3 rounded-[2px] bg-zinc-200 dark:bg-zinc-700" />
          <div className="w-2/3 h-3 rounded-[2px] bg-zinc-200 dark:bg-zinc-700" />
        </div>
      </div>
    </div>
  );
}
