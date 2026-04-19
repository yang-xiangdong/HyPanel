export default function Loading() {
  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#e5e5e5] border-t-[#0a0a0a] rounded-full animate-spin" />
        <span className="text-sm text-[#737373]">加载中...</span>
      </div>
    </div>
  );
}
