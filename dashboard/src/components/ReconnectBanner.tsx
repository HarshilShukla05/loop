import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReconnectBanner({ onReconnect }: { onReconnect: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3">
      <div className="flex items-center gap-3">
        <TriangleAlert className="size-4 shrink-0 text-warning" />
        <p className="text-sm text-warning">
          Your account isn't fully activated yet. Reconnect to start receiving comment events.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onReconnect} className="shrink-0">
        Reconnect
      </Button>
    </div>
  );
}
