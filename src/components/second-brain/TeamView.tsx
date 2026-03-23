import { AgentCard } from "./AgentCard";
import type { TeamAgent, AgentStatus, StatusStyle } from "./types";

interface TeamViewProps {
  teamAgents: TeamAgent[];
  statusMap: Record<AgentStatus, StatusStyle>;
  getStatusStyle: (status: AgentStatus) => StatusStyle;
}

export function TeamView({ teamAgents, statusMap, getStatusStyle }: TeamViewProps) {
  return (
    <div className="p-8 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <svg className="w-7 h-7 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Team 架构
        </h2>
        <div className="flex items-center gap-2 text-sm text-[#71717a]">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span>10秒轮询更新</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-8">
        <div className="flex flex-col items-center">
          <AgentCard agent={teamAgents.find((a) => a.id === "chief")!} statusStyle={getStatusStyle(teamAgents.find((a) => a.id === "chief")!.status)} size="large" />
        </div>

        <div className="flex items-center justify-center w-full max-w-4xl">
          <div className="h-8 w-px bg-gradient-to-b from-purple-500 to-transparent"></div>
        </div>

        <div className="flex flex-wrap justify-center gap-6 w-full max-w-4xl">
          {(["content", "growth", "coding"] as const).map((id) => {
            const agent = teamAgents.find((a) => a.id === id)!;
            return <AgentCard key={id} agent={agent} statusStyle={getStatusStyle(agent.status)} size="medium" />;
          })}
        </div>

        <div className="flex items-center justify-center w-full max-w-4xl">
          <div className="h-8 w-px bg-gradient-to-b from-blue-500 to-transparent"></div>
        </div>

        <div className="flex flex-wrap justify-center gap-6 w-full max-w-4xl">
          {(["product", "finance"] as const).map((id) => {
            const agent = teamAgents.find((a) => a.id === id)!;
            return <AgentCard key={id} agent={agent} statusStyle={getStatusStyle(agent.status)} size="medium" />;
          })}
        </div>

        <div className="mt-8">
          <p className="text-center text-xs text-[#71717a] mb-2">并行关系（外部 Agent）</p>
          <AgentCard agent={teamAgents.find((a) => a.id === "abby")!} statusStyle={getStatusStyle(teamAgents.find((a) => a.id === "abby")!.status)} size="small" />
        </div>
      </div>

      <div className="mt-8 p-4 bg-[#141416] rounded-xl border border-[#27272a]">
        <div className="flex items-center gap-2 text-yellow-400">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span className="font-semibold">注意</span>
        </div>
        <p className="text-sm text-[#a1a1aa] mt-2">阿比（外部 Agent）部署在外部服务器，状态可能不可达。此处显示的状态为默认状态或缓存数据。</p>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-4">
        {Object.entries(statusMap).map(([status, style]) => (
          <div key={status} className="flex items-center gap-2 text-sm">
            <span className={`w-3 h-3 rounded-full ${style.bgColor}`}></span>
            <span className="text-[#a1a1aa]">{style.icon} {style.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
