import { useState } from "react";
import { api, type Rule } from "../api/client";
import { Pill } from "./Pill";

export function AutomationCard({ rule, onDeleted }: { rule: Rule; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);

  const remove = async () => {
    setDeleting(true);
    await api.DELETE("/rules/{id}", { params: { path: { id: rule.id } } });
    onDeleted();
  };

  const trigger = rule.keywords.length === 0 ? "any comment" : rule.keywords.join(", ");
  const scope = rule.mediaId ? "One post" : "All posts";

  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-neutral-900">
          {scope} · trigger: <span className="text-neutral-600">{trigger}</span>
        </p>
        <p className="mt-1 truncate text-sm text-neutral-600">{rule.responseMessage}</p>
        {rule.responseLink && (
          <a
            href={rule.responseLink}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block truncate text-sm text-fuchsia-600 hover:underline"
          >
            {rule.responseLink}
          </a>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          <Pill label={rule.status} tone={rule.status === "active" ? "good" : "warn"} />
          {rule.requireFollow && <Pill label="follow-gated" tone="warn" />}
          {rule.captureEmail && <Pill label="email capture" tone="warn" />}
        </div>
      </div>
      <button
        onClick={remove}
        disabled={deleting}
        className="shrink-0 text-sm text-neutral-400 hover:text-rose-600 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
