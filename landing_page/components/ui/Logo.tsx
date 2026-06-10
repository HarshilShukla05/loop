export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <span className="relative flex h-7 w-7 items-center justify-center">
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className="h-7 w-7"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="loopGrad" x1="0" y1="0" x2="32" y2="32">
              <stop offset="0" stopColor="#E8A23D" />
              <stop offset="0.5" stopColor="#E85D3D" />
              <stop offset="1" stopColor="#C2402A" />
            </linearGradient>
          </defs>
          <path
            d="M11 16a5 5 0 1 1 5 5 5 5 0 0 1-5-5Zm5-5a5 5 0 1 0 5 5"
            stroke="url(#loopGrad)"
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </span>
      <span className="text-[19px] font-semibold tracking-tightest text-ink">
        loop
      </span>
    </span>
  );
}
