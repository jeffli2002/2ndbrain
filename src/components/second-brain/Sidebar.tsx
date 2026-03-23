import { Brain, FileText, CheckSquare, Home, Activity } from "lucide-react";
import type { TabType } from "./types";

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  dateRange: { start: string; end: string };
  setDateRange: (value: { start: string; end: string }) => void;
  getToday: () => string;
  getWeekStart: () => string;
  getMonthStart: () => string;
  stats: {
    totalMemories: number;
    totalDocuments: number;
    activeTasks: number;
    errorTasks: number;
  };
}

export function Sidebar({
  activeTab,
  setActiveTab,
  dateRange,
  setDateRange,
  getToday,
  getWeekStart,
  getMonthStart,
  stats,
}: SidebarProps) {
  return (
    <aside className="w-64 bg-[#141416] border-r border-[#27272a] flex flex-col h-screen">
      <div className="p-6 border-b border-[#27272a]">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Brain className="w-6 h-6 text-blue-500" />
          第二大脑
        </h1>
        <p className="text-xs text-[#a1a1aa] mt-1">知识管理 · 记忆提取 · 任务追踪</p>
      </div>

      <div className="p-4 border-b border-[#27272a]">
        <label className="text-xs text-[#a1a1aa] block mb-2">日期范围</label>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              max={dateRange.end}
              className="flex-1 bg-[#27272a] border border-[#3f3f46] rounded-lg px-2 py-2 text-white text-xs"
            />
            <span className="text-[#71717a] self-center">-</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              min={dateRange.start}
              max={getToday()}
              className="flex-1 bg-[#27272a] border border-[#3f3f46] rounded-lg px-2 py-2 text-white text-xs"
            />
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setDateRange({ start: getToday(), end: getToday() })}
              className="flex-1 bg-blue-500/20 text-blue-400 px-2 py-1.5 rounded text-xs hover:bg-blue-500/30"
            >
              今天
            </button>
            <button
              onClick={() => setDateRange({ start: getWeekStart(), end: getToday() })}
              className="flex-1 bg-purple-500/20 text-purple-400 px-2 py-1.5 rounded text-xs hover:bg-purple-500/30"
            >
              本周
            </button>
            <button
              onClick={() => setDateRange({ start: getMonthStart(), end: getToday() })}
              className="flex-1 bg-green-500/20 text-green-400 px-2 py-1.5 rounded text-xs hover:bg-green-500/30"
            >
              本月
            </button>
            <button
              onClick={() => setDateRange({ start: "", end: "" })}
              className="flex-1 bg-[#27272a] text-[#71717a] px-2 py-1.5 rounded text-xs hover:bg-[#3f3f46]"
            >
              清除
            </button>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => setActiveTab("home")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === "home" ? "bg-blue-500/20 text-blue-400" : "text-[#a1a1aa] hover:bg-[#27272a] hover:text-white"
              }`}
            >
              <Home className="w-5 h-5" />
              <span>仪表盘</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab("memories")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === "memories" ? "bg-blue-500/20 text-blue-400" : "text-[#a1a1aa] hover:bg-[#27272a] hover:text-white"
              }`}
            >
              <Brain className="w-5 h-5" />
              <span>记忆库</span>
              <span className="ml-auto bg-[#27272a] px-2 py-0.5 rounded text-xs">{stats.totalMemories}</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab("documents")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === "documents" ? "bg-blue-500/20 text-blue-400" : "text-[#a1a1aa] hover:bg-[#27272a] hover:text-white"
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>文档库</span>
              <span className="ml-auto bg-[#27272a] px-2 py-0.5 rounded text-xs">{stats.totalDocuments}</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab("tasks")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === "tasks" ? "bg-blue-500/20 text-blue-400" : "text-[#a1a1aa] hover:bg-[#27272a] hover:text-white"
              }`}
            >
              <CheckSquare className="w-5 h-5" />
              <span>任务中心</span>
              {stats.errorTasks > 0 && (
                <span className="ml-auto bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs">{stats.errorTasks}</span>
              )}
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab("agents")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === "agents" ? "bg-blue-500/20 text-blue-400" : "text-[#a1a1aa] hover:bg-[#27272a] hover:text-white"
              }`}
            >
              <Activity className="w-5 h-5" />
              <span>Agent中心</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab("team")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === "team" ? "bg-blue-500/20 text-blue-400" : "text-[#a1a1aa] hover:bg-[#27272a] hover:text-white"
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Team</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab("office")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === "office" ? "bg-blue-500/20 text-blue-400" : "text-[#a1a1aa] hover:bg-[#27272a] hover:text-white"
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 21h18" />
                <path d="M5 21V7l8-4v18" />
                <path d="M19 21V11l-6-4" />
                <path d="M9 9v.01" />
                <path d="M9 12v.01" />
                <path d="M9 15v.01" />
                <path d="M9 18v.01" />
              </svg>
              <span>Office</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab("rd")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === "rd" ? "bg-blue-500/20 text-blue-400" : "text-[#a1a1aa] hover:bg-[#27272a] hover:text-white"
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span>R&D 智囊团</span>
            </button>
          </li>
        </ul>
      </nav>

      <div className="p-4 border-t border-[#27272a]">
        <div className="flex items-center gap-2 text-xs text-[#a1a1aa]">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>系统正常运行</span>
        </div>
      </div>
    </aside>
  );
}
