export function ReconnectBanner({ onReconnect }: { onReconnect: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="text-sm text-amber-800">
        Your account isn't fully activated yet. Reconnect to start receiving comment events.
      </p>
      <button
        onClick={onReconnect}
        className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
      >
        Reconnect
      </button>
    </div>
  );
}
