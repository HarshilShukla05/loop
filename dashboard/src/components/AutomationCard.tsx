import { useState } from "react";
import { ExternalLink, Trash2 } from "lucide-react";
import { api, type Rule } from "../api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function AutomationCard({ rule, onDeleted }: { rule: Rule; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);

  const remove = async () => {
    setDeleting(true);
    await api.DELETE("/rules/{id}", { params: { path: { id: rule.id } } });
    onDeleted();
  };

  const scope = rule.mediaId ? "One post" : "All posts";

  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-input">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="font-medium text-foreground">{scope}</span>
          <span className="text-muted-foreground">·</span>
          {rule.keywords.length === 0 ? (
            <span className="text-muted-foreground">any comment</span>
          ) : (
            rule.keywords.map((k) => (
              <Badge key={k} variant="accent">
                {k}
              </Badge>
            ))
          )}
        </div>
        <p className="mt-2 truncate text-sm text-muted-foreground">{rule.responseMessage}</p>
        {rule.responseLink && (
          <a
            href={rule.responseLink}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-sm text-primary hover:underline"
          >
            <ExternalLink className="size-3 shrink-0" />
            <span className="truncate">{rule.responseLink}</span>
          </a>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant={rule.status === "active" ? "success" : "warning"}>
            {rule.status === "active" ? "Active" : rule.status}
          </Badge>
          {rule.requireFollow && <Badge variant="outline">Followers only</Badge>}
          {rule.captureEmail && <Badge variant="outline">Email capture</Badge>}
        </div>
      </div>
      <Button
        variant="destructive"
        size="icon"
        onClick={remove}
        disabled={deleting}
        aria-label="Delete automation"
        className="shrink-0"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
