import { cn } from "@/lib/utils";

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display text-2xl lowercase leading-none text-foreground", className)}>
      loop<span className="text-primary">.</span>
    </span>
  );
}
