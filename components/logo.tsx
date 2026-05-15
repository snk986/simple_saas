import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
    >
      <div className="relative h-9 w-9 overflow-hidden rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-600 to-cyan-400 shadow-[0_0_32px_rgba(139,92,246,0.32)]">
        <div className="absolute inset-y-2 left-2.5 w-1 rounded-full bg-white/95" />
        <div className="absolute inset-y-2 right-2.5 w-1 rounded-full bg-white/60" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-black tracking-normal text-foreground">
          Calyra AI
        </span>
        <span className="hidden text-xs font-bold uppercase tracking-normal text-muted-foreground sm:inline">
          AI Music
        </span>
      </div>
    </Link>
  );
}
