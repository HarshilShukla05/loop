import { useEffect, useState } from "react";
import { api, type Media } from "../api/client";

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

  if (error) return <p className="text-sm text-rose-600">{error}</p>;
  if (!media) return <p className="text-sm text-neutral-500">Loading posts…</p>;
  if (media.length === 0) return <p className="text-sm text-neutral-500">No posts found on your account.</p>;

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
            className={`relative aspect-square overflow-hidden rounded-lg border-2 ${selected ? "border-fuchsia-600" : "border-neutral-200"}`}
          >
            {thumb ? (
              <img src={thumb} alt={m.caption ?? ""} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-xs text-neutral-400">
                {m.mediaType}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
