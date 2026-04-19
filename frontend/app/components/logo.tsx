import { Zap } from "lucide-react";

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
      <Zap
        size={size * 0.5}
        className="text-white"
        strokeWidth={2.5}
        fill="currentColor"
      />
    </div>
  );
}
