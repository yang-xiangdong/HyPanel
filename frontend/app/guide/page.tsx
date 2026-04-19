"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Copy,
  ClipboardPaste,
  CheckCircle2,
  Monitor,
  Smartphone,
  Tablet,
  Apple,
  ExternalLink,
} from "lucide-react";
import { Logo } from "../components/logo";

const platforms = [
  { name: "Windows", icon: Monitor },
  { name: "macOS", icon: Apple },
  { name: "Linux", icon: Monitor },
  { name: "iOS", icon: Smartphone },
  { name: "Android", icon: Tablet },
];

const steps = [
  {
    number: 1,
    icon: Download,
    title: "下载 Clash Mi",
    description:
      "前往 Clash Mi 官网下载对应平台的客户端。支持 Windows、macOS、Linux、iOS、Android 五个平台。",
    action: {
      label: "前往下载",
      url: "https://clashmi.app/download",
    },
  },
  {
    number: 2,
    icon: Copy,
    title: "复制订阅链接",
    description:
      '登录 HyPanel 个人中心，在「订阅地址」区域点击「复制」按钮，将订阅链接复制到剪贴板。',
  },
  {
    number: 3,
    icon: ClipboardPaste,
    title: "导入到 Clash Mi",
    description:
      "打开 Clash Mi，在配置/订阅管理页面粘贴订阅链接并保存。应用会自动拉取你的专属配置。",
  },
  {
    number: 4,
    icon: CheckCircle2,
    title: "启用代理",
    description:
      "选中刚导入的配置，打开系统代理开关即可。所有平台使用同一份订阅配置，无需分别设置。",
  },
];

export default function GuidePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#fafafa]">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-[#e5e5e5]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={28} />
            <span className="text-sm font-semibold">HyPanel</span>
          </div>
          <button
            onClick={() => router.push("/me")}
            className="h-8 px-3 text-xs font-medium border border-[#e5e5e5] rounded-md hover:bg-[#f5f5f5] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft size={14} />
            返回
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-xl font-semibold tracking-tight text-[#0a0a0a]">
            操作指南
          </h1>
          <p className="text-sm text-[#737373] mt-1">
            使用 Clash Mi 客户端，快速完成代理配置
          </p>
        </div>

        {/* Platform badges */}
        <div className="bg-white border border-[#e5e5e5] rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-[#0a0a0a] mb-3">
            支持平台
          </h2>
          <div className="flex flex-wrap gap-2">
            {platforms.map((p) => {
              const Icon = p.icon;
              return (
                <span
                  key={p.name}
                  className="inline-flex items-center gap-1.5 h-8 px-3 bg-[#fafafa] border border-[#f0f0f0] rounded-lg text-xs font-medium text-[#525252]"
                >
                  <Icon size={14} className="text-[#a3a3a3]" />
                  {p.name}
                </span>
              );
            })}
          </div>
          <p className="text-xs text-[#a3a3a3] mt-3">
            所有平台共用一份订阅配置，无需分别设置
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="bg-white border border-[#e5e5e5] rounded-xl p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#0a0a0a] text-white shrink-0">
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-semibold text-[#a3a3a3]">
                        步骤 {step.number}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-[#0a0a0a] mb-1.5">
                      {step.title}
                    </h3>
                    <p className="text-sm text-[#737373] leading-relaxed">
                      {step.description}
                    </p>
                    {step.action && (
                      <a
                        href={step.action.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-3 h-8 px-3 text-xs font-medium bg-[#0a0a0a] text-white rounded-md hover:bg-[#1a1a1a] transition-colors"
                      >
                        {step.action.label}
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="bg-white border border-[#e5e5e5] rounded-xl p-5 mt-6">
          <h2 className="text-sm font-semibold text-[#0a0a0a] mb-4">
            常见问题
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-[#0a0a0a]">
                订阅链接可以分享给别人吗？
              </h3>
              <p className="text-sm text-[#737373] mt-1">
                不可以。订阅链接包含你的专属认证信息，分享会导致流量被他人消耗。
              </p>
            </div>
            <div className="border-t border-[#f0f0f0] pt-4">
              <h3 className="text-sm font-medium text-[#0a0a0a]">
                更换设备后需要重新配置吗？
              </h3>
              <p className="text-sm text-[#737373] mt-1">
                只需在新设备上安装 Clash Mi 并导入同一个订阅链接即可，配置会自动同步。
              </p>
            </div>
            <div className="border-t border-[#f0f0f0] pt-4">
              <h3 className="text-sm font-medium text-[#0a0a0a]">
                流量每月什么时候重置？
              </h3>
              <p className="text-sm text-[#737373] mt-1">
                每月 1 日自动重置，重置后已用流量清零。
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
