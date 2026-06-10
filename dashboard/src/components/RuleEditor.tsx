import { useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { api } from "../api/client";
import { PostPicker } from "./PostPicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function RuleEditor({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [scope, setScope] = useState<"all" | "specific">("all");
  const [mediaId, setMediaId] = useState<string | null>(null);
  const [triggerMode, setTriggerMode] = useState<"keywords" | "any">("keywords");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [requireFollow, setRequireFollow] = useState(false);
  const [captureEmail, setCaptureEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const addKeyword = () => {
    const k = keywordInput.trim();
    if (k && !keywords.includes(k.toLowerCase())) setKeywords([...keywords, k.toLowerCase()]);
    setKeywordInput("");
  };

  const save = async () => {
    setError(null);
    if (scope === "specific" && !mediaId) return setError("Pick a post, or choose all posts.");
    if (triggerMode === "keywords" && keywords.length === 0)
      return setError("Add at least one keyword, or switch to 'any comment'.");
    if (!message.trim()) return setError("Add a reply message.");

    setSaving(true);
    const { data, error: apiErr, response } = await api.POST("/rules", {
      body: {
        mediaId: scope === "all" ? null : mediaId,
        keywords: triggerMode === "any" ? [] : keywords,
        responseMessage: message,
        responseLink: link.trim() || null,
        requireFollow,
        captureEmail,
      },
    });
    setSaving(false);
    if (response.status === 201 && data) return onCreated();
    setError(apiErr?.error ?? "Could not create the automation.");
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogTitle>New automation</DialogTitle>
        <DialogDescription>
          When someone comments your keyword, we DM them your message instantly.
        </DialogDescription>

        <Section title="Apply to">
          <Choice checked={scope === "all"} onClick={() => setScope("all")} label="All posts (and future)" />
          <Choice checked={scope === "specific"} onClick={() => setScope("specific")} label="A specific post" />
          {scope === "specific" && (
            <div className="mt-3">
              <PostPicker selectedId={mediaId} onSelect={setMediaId} />
            </div>
          )}
        </Section>

        <Section title="Trigger">
          <Choice
            checked={triggerMode === "keywords"}
            onClick={() => setTriggerMode("keywords")}
            label="On specific keyword(s)"
          />
          <Choice checked={triggerMode === "any"} onClick={() => setTriggerMode("any")} label="On any comment" />
          {triggerMode === "keywords" && (
            <div className="mt-3">
              {keywords.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {keywords.map((k) => (
                    <Badge key={k} variant="accent">
                      {k}
                      <button
                        onClick={() => setKeywords(keywords.filter((x) => x !== k))}
                        className="text-accent-foreground/60 transition-colors hover:text-accent-foreground"
                        aria-label={`Remove keyword ${k}`}
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addKeyword();
                  }
                }}
                placeholder="Type a keyword, press Enter"
              />
            </div>
          )}
        </Section>

        <Section title="Reply">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="The DM we'll send…"
          />
          <Input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Link to share (optional)"
            className="mt-2"
          />
        </Section>

        {/* Hidden until the webhook→DM path enforces these flags — the
            recorded review UI must only show working features. */}
        {import.meta.env.VITE_SHOW_UPCOMING_OPTIONS === "true" && (
          <Section title="Options (coming soon)">
            <Toggle checked={requireFollow} onChange={setRequireFollow} label="Only reply if they follow me" />
            <Toggle checked={captureEmail} onChange={setCaptureEmail} label="Capture their email" />
          </Section>
        )}

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save automation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-5">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="mt-2 space-y-1.5">{children}</div>
    </div>
  );
}

function Choice({ checked, onClick, label }: { checked: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
        checked
          ? "border-primary/60 bg-accent text-foreground"
          : "border-border text-muted-foreground hover:border-input hover:text-foreground",
      )}
    >
      <span
        className={cn(
          "size-3.5 rounded-full border-2 transition-colors",
          checked ? "border-primary bg-primary" : "border-input",
        )}
      />
      {label}
    </button>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm">
      <span className="text-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
