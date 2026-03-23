import type { TeamAgent, StatusStyle } from "./types";

interface AgentCardProps {
  agent: TeamAgent;
  statusStyle: StatusStyle;
  size?: "large" | "medium" | "small";
}

export function AgentCard({ agent, statusStyle, size = "medium" }: AgentCardProps) {
  const cardWidth = size === "large" ? "w-72" : size === "medium" ? "w-56" : "w-48";

  return (
    <div
      className={`${cardWidth} bg-[#141416] rounded-xl border-2 ${
        agent.isExternal ? "border-dashed border-[#3f3f46]" : "border-[#27272a]"
      } hover:border-purple-500/50 transition-all cursor-pointer group relative`}
    >
      <div className={`absolute -top-2 -right-2 ${statusStyle.bgColor} rounded-full px-2 py-0.5 text-xs flex items-center gap-1`}>
        <span>{statusStyle.icon}</span>
        <span className="text-white text-xs">{statusStyle.label}</span>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">{agent.icon}</span>
          <div>
            <h3 className="font-semibold text-white">{agent.name}</h3>
            <p className="text-xs text-[#71717a]">{agent.role}</p>
          </div>
        </div>

        <div className="border-t border-[#27272a] my-3"></div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[#71717a]">状态</span>
            <span className={statusStyle.color}>{statusStyle.icon} {statusStyle.label}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#71717a]">最后活跃</span>
            <span className="text-[#a1a1aa]">{agent.lastActive}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-[#71717a] shrink-0">状态摘要</span>
            <span className="text-[#a1a1aa] truncate max-w-[120px] text-right">{agent.currentTask}</span>
          </div>
        </div>

        <div className="absolute left-full top-0 ml-2 w-64 bg-[#1a1a1c] rounded-xl border border-[#27272a] p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
          <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
            {agent.isExternal ? "📋 外部 Agent" : "📋 OpenClaw 实时状态"}
          </h4>
          <div className="border-t border-[#27272a] my-2"></div>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-[#71717a]">状态摘要</p>
              <p className="text-sm text-white">{agent.currentTask}</p>
            </div>

            {!agent.isExternal && agent.totalTasks > 0 && (
              <div>
                <p className="text-xs text-[#71717a] mb-1">正常率</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-[#27272a] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                      style={{ width: `${agent.taskProgress}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-[#a1a1aa]">{agent.taskProgress}%</span>
                </div>
              </div>
            )}

            <div>
              <p className="text-xs text-[#71717a]">运行中 cron</p>
              <p className="text-sm text-white">{agent.isExternal ? "不适用" : `${agent.runningTasks} 个`}</p>
            </div>

            <div className="border-t border-[#27272a] my-2"></div>

            <div>
              <p className="text-xs text-[#71717a] mb-1">📊 当前统计</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#27272a] rounded py-1">
                  <p className="text-lg font-bold text-white">{agent.totalTasks}</p>
                  <p className="text-[10px] text-[#71717a]">绑定 cron</p>
                </div>
                <div className="bg-[#27272a] rounded py-1">
                  <p className="text-lg font-bold text-white">{agent.okTasks}</p>
                  <p className="text-[10px] text-[#71717a]">正常</p>
                </div>
                <div className="bg-[#27272a] rounded py-1">
                  <p className="text-lg font-bold text-white">{agent.errorTasks}</p>
                  <p className="text-[10px] text-[#71717a]">异常</p>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#1a1a1c] border-l-0 border-b-0 border-[#27272a] rotate-45"></div>
        </div>
      </div>
    </div>
  );
}
