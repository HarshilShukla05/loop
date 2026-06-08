import { useState, type ReactNode } from "react";
import { api } from "../api/client";
import { PostPicker } from "./PostPicker";

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
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-neutral-900">New automation</h2>

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
          <Choice checked={triggerMode === "keywords"} onClick={() => setTriggerMode("keywords")} label="On specific keyword(s)" />
          <Choice checked={triggerMode === "any"} onClick={() => setTriggerMode("any")} label="On any comment" />
          {triggerMode === "keywords" && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-2">
                {keywords.map((k) => (
                  <span key={k} className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-sm">
                    {k}
                    <button onClick={() => setKeywords(keywords.filter((x) => x !== k))} className="text-neutral-400 hover:text-neutral-700">
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addKeyword();
                  }
                }}
                placeholder="Type a keyword, press Enter"
                className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
          )}
        </Section>

        <Section title="Reply">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="The DM we'll send…"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Link to share (optional)"
            className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </Section>

        <Section title="Options (coming soon)">
          <Toggle checked={requireFollow} onChange={setRequireFollow} label="Only reply if they follow me" />
          <Toggle checked={captureEmail} onChange={setCaptureEmail} label="Capture their email" />
        </Section>

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-gradient-to-r from-fuchsia-600 to-orange-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save automation"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-5">
      <h3 className="text-sm font-medium text-neutral-500">{title}</h3>
      <div className="mt-2 space-y-1.5">{children}</div>
    </div>
  );
}

function Choice({ checked, onClick, label }: { checked: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm ${checked ? "border-fuchsia-600 bg-fuchsia-50" : "border-neutral-200"}`}
    >
      <span className={`h-3.5 w-3.5 rounded-full border ${checked ? "border-fuchsia-600 bg-fuchsia-600" : "border-neutral-400"}`} />
      {label}
    </button>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm">
      <span className="text-neutral-700">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}
