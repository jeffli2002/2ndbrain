import { CheckSquare, Search, CheckCircle, XCircle, Clock } from "lucide-react";
import type { Task } from "./types";

interface TasksViewProps {
  latestSupabaseSyncAt: string | null;
  formatFullDateTime: (value?: string | null) => string;
  draftSearchQuery: string;
  handleSearchInputChange: (value: string) => void;
  handleSearchKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  stats: { activeTasks: number; errorTasks: number };
  tasks: Task[];
  filteredTasks: Task[];
  getStatusIcon: (status: Task["status"]) => React.ReactNode;
  formatDateTime: (value?: string | null) => string;
}

export function TasksView({
  latestSupabaseSyncAt,
  formatFullDateTime,
  draftSearchQuery,
  handleSearchInputChange,
  handleSearchKeyDown,
  stats,
  tasks,
  filteredTasks,
  getStatusIcon,
  formatDateTime,
}: TasksViewProps) {
  return (
    <div className="p-8 animate-fadeIn">
      <div className="flex items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <CheckSquare className="w-7 h-7 text-green-400" />
          任务中心
        </h2>
        <div className="text-right">
          <p className="text-xs text-[#71717a]">Supabase 最近同步</p>
          <p className="text-sm text-cyan-300 font-medium">{formatFullDateTime(latestSupabaseSyncAt)}</p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a1a1aa]" />
        <input
          type="text"
          placeholder="搜索任务（按回车执行）..."
          value={draftSearchQuery}
          onChange={(e) => handleSearchInputChange(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="w-full bg-[#141416] border border-[#27272a] rounded-lg pl-12 pr-4 py-3 text-white placeholder-[#a1a1aa] focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#141416] p-4 rounded-xl border border-[#27272a] flex items-center gap-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
          <div>
            <p className="text-2xl font-bold">{stats.activeTasks}</p>
            <p className="text-xs text-[#a1a1aa]">正常运行</p>
          </div>
        </div>
        <div className="bg-[#141416] p-4 rounded-xl border border-[#27272a] flex items-center gap-4">
          <XCircle className="w-8 h-8 text-red-500" />
          <div>
            <p className="text-2xl font-bold">{stats.errorTasks}</p>
            <p className="text-xs text-[#a1a1aa]">异常任务</p>
          </div>
        </div>
        <div className="bg-[#141416] p-4 rounded-xl border border-[#27272a] flex items-center gap-4">
          <Clock className="w-8 h-8 text-blue-500" />
          <div>
            <p className="text-2xl font-bold">{tasks.length}</p>
            <p className="text-xs text-[#a1a1aa]">总任务数</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className={`bg-[#141416] p-4 rounded-xl border transition-colors ${
              task.status === "error" ? "border-red-500/30 hover:border-red-500/50" : "border-[#27272a] hover:border-green-500/50"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {getStatusIcon(task.status)}
                <h3 className="font-semibold">{task.name}</h3>
                {task.errorCount > 0 && (
                  <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs">{task.errorCount}次错误</span>
                )}
              </div>
              <span className="text-xs text-[#a1a1aa] bg-[#27272a] px-2 py-1 rounded">{task.schedule}</span>
            </div>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-[#a1a1aa] text-xs">上次运行</p>
                <p className="text-white">{formatDateTime(task.lastRun)}</p>
              </div>
              <div>
                <p className="text-[#a1a1aa] text-xs">运行时长</p>
                <p className="text-white">{task.lastDuration || "—"}</p>
              </div>
              <div>
                <p className="text-[#a1a1aa] text-xs">下次运行</p>
                <p className="text-white">{formatDateTime(task.nextRun)}</p>
              </div>
              <div>
                <p className="text-[#a1a1aa] text-xs">Token</p>
                <p className="text-yellow-400">{task.tokenUsage.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
