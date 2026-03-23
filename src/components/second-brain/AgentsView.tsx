import { Activity, CheckSquare, CheckCircle, XCircle, Zap } from "lucide-react";

interface AgentCardData {
  id: string;
  name: string;
  description: string;
  model: string;
  status: string;
  lastRun: string;
  tasks: number;
  completedTasks: number;
  failedTasks: number;
}

interface AgentsViewProps {
  agentCards: AgentCardData[];
  totalRangeTokens: number;
  trendRange: 7 | 14 | 30;
  rangeTokenUsageByAgent: Record<string, number>;
  getStatusIcon: (status: string) => React.ReactNode;
  tokenTrendChart: React.ReactNode;
  tokenDistributionChart: React.ReactNode;
}

export function AgentsView({
  agentCards,
  totalRangeTokens,
  trendRange,
  rangeTokenUsageByAgent,
  getStatusIcon,
  tokenTrendChart,
  tokenDistributionChart,
}: AgentsViewProps) {
  const totalTasks = agentCards.reduce((sum, agent) => sum + agent.tasks, 0);
  const totalCompleted = agentCards.reduce((sum, agent) => sum + agent.completedTasks, 0);
  const totalFailed = agentCards.reduce((sum, agent) => sum + agent.failedTasks, 0);

  return (
    <div className="p-8 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="w-7 h-7 text-purple-400" />
          Agent中心
        </h2>
      </div>

      {tokenTrendChart}
      {tokenDistributionChart}

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-[#141416] p-4 rounded-xl border border-[#27272a]">
          <div className="flex items-center gap-3 mb-2">
            <CheckSquare className="w-5 h-5 text-blue-400" />
            <span className="text-[#a1a1aa] text-sm">总任务</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalTasks}</p>
        </div>
        <div className="bg-[#141416] p-4 rounded-xl border border-[#27272a]">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-[#a1a1aa] text-sm">已完成</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{totalCompleted}</p>
        </div>
        <div className="bg-[#141416] p-4 rounded-xl border border-[#27272a]">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="w-5 h-5 text-red-400" />
            <span className="text-[#a1a1aa] text-sm">失败</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{totalFailed}</p>
        </div>
        <div className="bg-[#141416] p-4 rounded-xl border border-[#27272a]">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span className="text-[#a1a1aa] text-sm">近{trendRange}天 Token</span>
          </div>
          <p className="text-2xl font-bold text-yellow-400">{(totalRangeTokens / 1000).toFixed(1)}k</p>
        </div>
      </div>

      <div className="space-y-4">
        {agentCards.map((agent) => (
          <div
            key={agent.id}
            className="bg-[#141416] p-5 rounded-xl border border-[#27272a] hover:border-purple-500/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-white">{agent.name}</h3>
                {getStatusIcon(agent.status)}
              </div>
              <span className="text-xs text-[#71717a]">{agent.lastRun}</span>
            </div>
            <p className="text-sm text-[#a1a1aa] mb-4">{agent.description}</p>
            <div className="grid grid-cols-5 gap-4 text-sm">
              <div>
                <p className="text-[#71717a] text-xs">模型</p>
                <p className="text-blue-400 text-xs">{agent.model}</p>
              </div>
              <div>
                <p className="text-[#71717a] text-xs">任务数</p>
                <p className="text-white">{agent.tasks}</p>
              </div>
              <div>
                <p className="text-[#71717a] text-xs">完成</p>
                <p className="text-green-400">{agent.completedTasks}</p>
              </div>
              <div>
                <p className="text-[#71717a] text-xs">失败</p>
                <p className="text-red-400">{agent.failedTasks}</p>
              </div>
              <div>
                <p className="text-[#71717a] text-xs">近{trendRange}天 Token</p>
                <p className="text-yellow-400">{((rangeTokenUsageByAgent[agent.id] || 0) / 1000).toFixed(1)}k</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
