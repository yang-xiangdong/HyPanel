"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#fef2f2] flex items-center justify-center">
          <span className="text-[#ef4444] text-lg font-semibold">!</span>
        </div>
        <h2 className="text-base font-semibold text-[#0a0a0a] mb-1">
          出错了
        </h2>
        <p className="text-sm text-[#737373] mb-6">
          {error.message || "页面发生了意外错误"}
        </p>
        <button
          onClick={reset}
          className="h-9 px-4 bg-[#0a0a0a] text-white text-sm font-medium rounded-lg hover:bg-[#1a1a1a] transition-colors cursor-pointer"
        >
          重试
        </button>
      </div>
    </div>
  );
}
