import { apiBaseUrl } from "../api/client";

export function Login() {
  const connect = () => window.location.assign(`${apiBaseUrl}/auth/instagram`);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-6">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-neutral-900">Loop</h1>
        <p className="mt-3 text-neutral-600">
          Turn comments into conversations. Auto-DM the right link the moment someone comments your
          keyword — unlimited, flat ₹200/mo.
        </p>
        <button
          onClick={connect}
          className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-fuchsia-600 to-orange-500 px-5 py-3 font-medium text-white shadow-sm transition hover:opacity-95"
        >
          Continue with Instagram
        </button>
        <p className="mt-4 text-xs text-neutral-400">
          You'll connect your Instagram Business or Creator account.
        </p>
      </div>
    </main>
  );
}
