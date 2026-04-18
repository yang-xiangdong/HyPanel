export function Logo({
  size = 40,
  dark = false,
}: {
  size?: number;
  dark?: boolean;
}) {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl ${
        dark ? "bg-white/10 border border-white/10" : "bg-[#0a0a0a]"
      }`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke={dark ? "#ffffff" : "#ffffff"}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={3}
        style={{ width: size * 0.55, height: size * 0.55 }}
      >
        <rect x="2" y="2" width="44" height="44" rx="12" />
        <path d="M14 14h20l-12 20h12" />
      </svg>
    </div>
  );
}
