import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { api, type Media } from "../api/client";
import { cn } from "@/lib/utils";

export function PostPicker({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [media, setMedia] = useState<Media[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .GET("/media")
      .then(({ data, error, response }) => {
        if (response.status === 200 && data) setMedia(data.items);
        else setError(error?.error ?? "Could not load posts.");
      })
      .catch(() => setError("Could not load posts."));
  }, []);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!media) return <p className="text-sm text-muted-foreground">Loading posts…</p>;
  if (media.length === 0)
    return <p className="text-sm text-muted-foreground">No posts found on your account.</p>;

  return (
    <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto">
      {media.map((m) => {
        const thumb = m.thumbnailUrl || m.mediaUrl;
        const selected = m.id === selectedId;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onSelect(m.id)}
            className={cn(
              "relative aspect-square overflow-hidden rounded-lg border-2 transition-colors",
              selected ? "border-primary" : "border-border hover:border-input",
            )}
          >
            {thumb ? (
              <img src={thumb} alt={m.caption ?? ""} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-secondary text-xs text-muted-foreground">
                {m.mediaType}
              </div>
            )}
            {selected && (
              <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-3" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
