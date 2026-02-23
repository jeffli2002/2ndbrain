"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  Brain,
  FileText,
  CheckSquare,
  Search,
  Home,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  BookOpen,
  Activity,
  Zap,
} from "lucide-react";

// Supabase 配置
const supabaseUrl = "https://njxjuvxosvwvluxefrzg.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qeGp1dnhvc3Z3dmx1eGVmcnpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MjkyNTUsImV4cCI6MjA4NzQwNTI1NX0.FqfMyI3uSkiHVepVVccxFU4ie5RU00VVdrF-aOr9LjI";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 类型定义
interface Memory {
  id: string;
  title: string;
  content: string;
  date: string;
  type: "long-term" | "daily" | "evolution";
}

interface Document {
  id: string;
  title: string;
  path: string;
  type: string;
  date: string;
  size: number;
}

interface Task {
  id: string;
  name: string;
  schedule: string;
  status: "ok" | "error" | "running";
  lastRun: string;
  lastDuration: string;
  nextRun: string;
  errorCount: number;
}

// 认证检查组件
function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = localStorage.getItem("secondbrain_auth");
    if (auth !== "true") {
      router.push("/login");
    } else {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
        <div className="text-white">加载中...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

// 模拟数据 - 实际应该从API获取
const mockMemories: Memory[] = [
  {
    id: "1",
    title: "2026-02-23 工作日志",
    content: "今天完成了第二大脑系统的初步架构设计...",
    date: "2026-02-23",
    type: "daily",
  },
  {
    id: "2",
    title: "2026-02-22 工作日志",
    content: "修复了日报格式问题，开始使用四大板块规范...",
    date: "2026-02-22",
    type: "daily",
  },
  {
    id: "3",
    title: "长期记忆：日报格式规范",
    content: "四大板块：今日完成、进行中、反思与改进、明日计划",
    date: "2026-02-16",
    type: "long-term",
  },
  {
    id: "4",
    title: "2026-02-22 进化报告",
    content: " EvoMap信号检测、候选方案分析...",
    date: "2026-02-22",
    type: "evolution",
  },
];

const mockDocuments: Document[] = [
  {
    id: "1",
    title: "MEMORY.md",
    path: "/root/.openclaw/workspace/MEMORY.md",
    type: "memory",
    date: "2026-02-23",
    size: 13075,
  },
  {
    id: "2",
    title: "每日工作报告 20260222",
    path: "/root/.openclaw/workspace/memory/daily_report_20260222.md",
    type: "report",
    date: "2026-02-22",
    size: 1636,
  },
  {
    id: "3",
    title: "AI日报 20260217",
    path: "/root/.openclaw/workspace/memory/ai-daily-20260217-v4.md",
    type: "newsletter",
    date: "2026-02-17",
    size: 5038,
  },
  {
    id: "4",
    title: "一人公司架构设计",
    path: "/root/.openclaw/workspace/ai-one-person-company-agent-architecture.md",
    type: "plan",
    date: "2026-02-15",
    size: 12848,
  },
  {
    id: "5",
    title: "OpenClaw课程 Phase1-2",
    path: "/root/.openclaw/workspace/memory/openclaw-course-phase1-2.md",
    type: "course",
    date: "2026-02-17",
    size: 9337,
  },
];

const mockTasks: Task[] = [
  {
    id: "1",
    name: "ai-daily-newsletter",
    schedule: "7:30 每天",
    status: "ok",
    lastRun: "2026-02-23 07:30",
    lastDuration: "159s",
    nextRun: "2026-02-24 07:30",
    errorCount: 0,
  },
  {
    id: "2",
    name: "daily-content-publish",
    schedule: "9:00 每天",
    status: "ok",
    lastRun: "2026-02-23 09:00",
    lastDuration: "44s",
    nextRun: "2026-02-24 09:00",
    errorCount: 0,
  },
  {
    id: "3",
    name: "growth-seo-keywords",
    schedule: "10:00 每天",
    status: "ok",
    lastRun: "2026-02-23 10:00",
    lastDuration: "114s",
    nextRun: "2026-02-24 10:00",
    errorCount: 0,
  },
  {
    id: "4",
    name: "ai-kol-daily-newsletter",
    schedule: "11:00 每天",
    status: "ok",
    lastRun: "2026-02-23 11:00",
    lastDuration: "122s",
    nextRun: "2026-02-24 11:00",
    errorCount: 0,
  },
  {
    id: "5",
    name: "product-competitor-analysis",
    schedule: "14:00 每天",
    status: "ok",
    lastRun: "2026-02-23 14:00",
    lastDuration: "110s",
    nextRun: "2026-02-24 14:00",
    errorCount: 0,
  },
  {
    id: "6",
    name: "chief-daily-report",
    schedule: "19:30 每天",
    status: "error",
    lastRun: "2026-02-22 19:30",
    lastDuration: "59s",
    nextRun: "2026-02-23 19:30",
    errorCount: 4,
  },
  {
    id: "7",
    name: "daily-skill-evolution",
    schedule: "22:00 每天",
    status: "ok",
    lastRun: "2026-02-22 22:00",
    lastDuration: "50s",
    nextRun: "2026-02-23 22:00",
    errorCount: 0,
  },
  {
    id: "8",
    name: "gateway-health-backup",
    schedule: "每5分钟",
    status: "error",
    lastRun: "2026-02-23 15:50",
    lastDuration: "29s",
    nextRun: "2026-02-23 15:55",
    errorCount: 23,
  },
];

// Agent 类型定义
interface Agent {
  id: string;
  name: string;
  description: string;
  status: "ok" | "error" | "running";
  model: string;
  tasks: number;
  completedTasks: number;
  failedTasks: number;
  tokenUsage: number;
  lastRun: string;
}

// Agent 模拟数据
const mockAgents: Agent[] = [
  {
    id: "1",
    name: "Content Agent",
    description: "负责AI日报、内容发布、KOL追踪",
    status: "ok",
    model: "Kimi K2.5",
    tasks: 3,
    completedTasks: 3,
    failedTasks: 0,
    tokenUsage: 125000,
    lastRun: "2026-02-23 11:00",
  },
  {
    id: "2",
    name: "Coding Agent",
    description: "负责代码开发、项目修复、功能实现",
    status: "ok",
    model: "MiniMax M2.5",
    tasks: 5,
    completedTasks: 4,
    failedTasks: 1,
    tokenUsage: 89000,
    lastRun: "2026-02-23 20:30",
  },
  {
    id: "3",
    name: "Growth Agent",
    description: "负责SEO和关键词分析",
    status: "ok",
    model: "Kimi K2.5",
    tasks: 1,
    completedTasks: 1,
    failedTasks: 0,
    tokenUsage: 45000,
    lastRun: "2026-02-23 10:00",
  },
  {
    id: "4",
    name: "Product Agent",
    description: "负责竞品分析和产品规划",
    status: "ok",
    model: "Kimi K2.5",
    tasks: 1,
    completedTasks: 1,
    failedTasks: 0,
    tokenUsage: 38000,
    lastRun: "2026-02-23 14:00",
  },
  {
    id: "5",
    name: "Chief Agent",
    description: "负责生成每日工作报告",
    status: "error",
    model: "MiniMax M2.5",
    tasks: 1,
    completedTasks: 0,
    failedTasks: 1,
    tokenUsage: 15000,
    lastRun: "2026-02-22 19:30",
  },
  {
    id: "6",
    name: "Evo Agent",
    description: "负责自我进化和技能演进",
    status: "ok",
    model: "MiniMax M2.5",
    tasks: 1,
    completedTasks: 1,
    failedTasks: 0,
    tokenUsage: 22000,
    lastRun: "2026-02-22 22:00",
  },
];

type TabType = "home" | "memories" | "documents" | "tasks" | "agents";

export default function SecondBrain() {
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<Memory | Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{start: string; end: string}>({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // 真实数据状态
  const [memories, setMemories] = useState<Memory[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  // 从Supabase获取数据
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [memRes, docRes, taskRes] = await Promise.all([
          supabase.from("memories").select("*").order("date", { ascending: false }),
          supabase.from("documents").select("*").order("date", { ascending: false }),
          supabase.from("tasks").select("*"),
        ]);
        
        if (memRes.data) setMemories(memRes.data as Memory[]);
        if (docRes.data) setDocuments(docRes.data as Document[]);
        if (taskRes.data) setTasks(taskRes.data as Task[]);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // 获取今天的日期
  const getToday = () => new Date().toISOString().split('T')[0];
  
  // 获取本周第一天
  const getWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    return new Date(now.setDate(diff)).toISOString().split('T')[0];
  };
  
  // 获取本月第一天
  const getMonthStart = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  };

  // 过滤数据 - 按日期范围筛选 (空范围=显示全部)
  const filteredMemories = memories.filter(
    (m) =>
      (m.type === "long-term" || 
       !dateRange.start || !dateRange.end ||
       (m.date >= dateRange.start && m.date <= dateRange.end)) &&
      (m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredDocuments = documents.filter(
    (d) =>
      (!dateRange.start || !dateRange.end ||
       (d.date >= dateRange.start && d.date <= dateRange.end)) &&
      (d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.path.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredTasks = tasks.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 统计
  const stats = {
    totalMemories: memories.length,
    totalDocuments: documents.length,
    activeTasks: tasks.filter((t) => t.status === "ok").length,
    errorTasks: tasks.filter((t) => t.status === "error").length,
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ok":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "running":
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  // 获取记忆类型图标
  const getMemoryTypeIcon = (type: string) => {
    switch (type) {
      case "long-term":
        return <Brain className="w-4 h-4 text-purple-400" />;
      case "daily":
        return <Calendar className="w-4 h-4 text-blue-400" />;
      case "evolution":
        return <Activity className="w-4 h-4 text-green-400" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  // 获取文档类型图标
  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case "memory":
        return <Brain className="w-4 h-4 text-purple-400" />;
      case "report":
        return <FileText className="w-4 h-4 text-blue-400" />;
      case "newsletter":
        return <BookOpen className="w-4 h-4 text-green-400" />;
      case "plan":
        return <FileText className="w-4 h-4 text-orange-400" />;
      case "course":
        return <BookOpen className="w-4 h-4 text-yellow-400" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  // 格式化文件大小
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // 渲染侧边栏
  const renderSidebar = () => (
    <aside className="w-64 bg-[#141416] border-r border-[#27272a] flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-[#27272a]">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Brain className="w-6 h-6 text-blue-500" />
          第二大脑
        </h1>
        <p className="text-xs text-[#a1a1aa] mt-1">知识管理 · 记忆提取 · 任务追踪</p>
      </div>

      {/* 日期筛选 */}
      <div className="p-4 border-b border-[#27272a]">
        <label className="text-xs text-[#a1a1aa] block mb-2">日期范围</label>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              max={dateRange.end}
              className="flex-1 bg-[#27272a] border border-[#3f3f46] rounded-lg px-2 py-2 text-white text-xs"
            />
            <span className="text-[#71717a] self-center">-</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              min={dateRange.start}
              max={getToday()}
              className="flex-1 bg-[#27272a] border border-[#3f3f46] rounded-lg px-2 py-2 text-white text-xs"
            />
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setDateRange({start: getToday(), end: getToday()})}
              className="flex-1 bg-blue-500/20 text-blue-400 px-2 py-1.5 rounded text-xs hover:bg-blue-500/30"
            >
              今天
            </button>
            <button
              onClick={() => setDateRange({start: getWeekStart(), end: getToday()})}
              className="flex-1 bg-purple-500/20 text-purple-400 px-2 py-1.5 rounded text-xs hover:bg-purple-500/30"
            >
              本周
            </button>
            <button
              onClick={() => setDateRange({start: getMonthStart(), end: getToday()})}
              className="flex-1 bg-green-500/20 text-green-400 px-2 py-1.5 rounded text-xs hover:bg-green-500/30"
            >
              本月
            </button>
            <button
              onClick={() => setDateRange({start: "", end: ""})}
              className="flex-1 bg-[#27272a] text-[#71717a] px-2 py-1.5 rounded text-xs hover:bg-[#3f3f46]"
            >
              清除
            </button>
          </div>
        </div>
      </div>

      {/* 导航 */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => setActiveTab("home")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === "home"
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-[#a1a1aa] hover:bg-[#27272a] hover:text-white"
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
                activeTab === "memories"
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-[#a1a1aa] hover:bg-[#27272a] hover:text-white"
              }`}
            >
              <Brain className="w-5 h-5" />
              <span>记忆库</span>
              <span className="ml-auto bg-[#27272a] px-2 py-0.5 rounded text-xs">
                {stats.totalMemories}
              </span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab("documents")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === "documents"
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-[#a1a1aa] hover:bg-[#27272a] hover:text-white"
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>文档库</span>
              <span className="ml-auto bg-[#27272a] px-2 py-0.5 rounded text-xs">
                {stats.totalDocuments}
              </span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab("tasks")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === "tasks"
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-[#a1a1aa] hover:bg-[#27272a] hover:text-white"
              }`}
            >
              <CheckSquare className="w-5 h-5" />
              <span>任务中心</span>
              {stats.errorTasks > 0 && (
                <span className="ml-auto bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs">
                  {stats.errorTasks}
                </span>
              )}
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab("agents")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === "agents"
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-[#a1a1aa] hover:bg-[#27272a] hover:text-white"
              }`}
            >
              <Activity className="w-5 h-5" />
              <span>Agent中心</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* 底部状态 */}
      <div className="p-4 border-t border-[#27272a]">
        <div className="flex items-center gap-2 text-xs text-[#a1a1aa]">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>系统正常运行</span>
        </div>
      </div>
    </aside>
  );

  // 渲染首页
  const renderHome = () => (
    <div className="p-8 animate-fadeIn">
      <h2 className="text-2xl font-bold mb-6">仪表盘概览</h2>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#141416] p-6 rounded-xl border border-[#27272a]">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-5 h-5 text-purple-400" />
            <span className="text-[#a1a1aa]">记忆总数</span>
          </div>
          <p className="text-3xl font-bold">{stats.totalMemories}</p>
        </div>
        <div className="bg-[#141416] p-6 rounded-xl border border-[#27272a]">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <span className="text-[#a1a1aa]">文档总数</span>
          </div>
          <p className="text-3xl font-bold">{stats.totalDocuments}</p>
        </div>
        <div className="bg-[#141416] p-6 rounded-xl border border-[#27272a]">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-[#a1a1aa]">运行中任务</span>
          </div>
          <p className="text-3xl font-bold">{stats.activeTasks}</p>
        </div>
        <div className="bg-[#141416] p-6 rounded-xl border border-[#27272a]">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="w-5 h-5 text-red-400" />
            <span className="text-[#a1a1aa]">异常任务</span>
          </div>
          <p className="text-3xl font-bold">{stats.errorTasks}</p>
        </div>
      </div>

      {/* 最近活动 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近记忆 */}
        <div className="bg-[#141416] rounded-xl border border-[#27272a]">
          <div className="p-4 border-b border-[#27272a] flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              最近记忆
            </h3>
            <button
              onClick={() => setActiveTab("memories")}
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              查看全部 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            {memories.slice(0, 3).map((memory) => (
              <div
                key={memory.id}
                className="p-3 bg-[#1f1f22] rounded-lg hover:bg-[#27272a] cursor-pointer transition-colors"
                onClick={() => {
                  setSelectedItem(memory);
                  setActiveTab("memories");
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  {getMemoryTypeIcon(memory.type)}
                  <span className="text-sm font-medium">{memory.title}</span>
                </div>
                <p className="text-xs text-[#a1a1aa] line-clamp-2">{memory.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 最近任务 */}
        <div className="bg-[#141416] rounded-xl border border-[#27272a]">
          <div className="p-4 border-b border-[#27272a] flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-blue-400" />
              任务状态
            </h3>
            <button
              onClick={() => setActiveTab("tasks")}
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              查看全部 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            {tasks.slice(0, 4).map((task) => (
              <div
                key={task.id}
                className="p-3 bg-[#1f1f22] rounded-lg flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(task.status)}
                  <span className="text-sm font-medium">{task.name}</span>
                </div>
                <span className="text-xs text-[#a1a1aa]">{task.schedule}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // 渲染记忆库
  const renderMemories = () => (
    <div className="p-8 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="w-7 h-7 text-purple-400" />
          记忆库
        </h2>
      </div>

      {/* 搜索 */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a1a1aa]" />
        <input
          type="text"
          placeholder="搜索记忆..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#141416] border border-[#27272a] rounded-lg pl-12 pr-4 py-3 text-white placeholder-[#a1a1aa] focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* 记忆列表 */}
      <div className="space-y-3">
        {filteredMemories.map((memory) => (
          <div
            key={memory.id}
            className="bg-[#141416] p-4 rounded-xl border border-[#27272a] hover:border-purple-500/50 cursor-pointer transition-colors"
            onClick={() => setSelectedItem(memory)}
          >
            <div className="flex items-center gap-3 mb-2">
              {getMemoryTypeIcon(memory.type)}
              <h3 className="font-semibold">{memory.title}</h3>
              <span className="text-xs text-[#a1a1aa] ml-auto">{memory.date}</span>
            </div>
            <p className="text-sm text-[#a1a1aa] line-clamp-2">{memory.content}</p>
          </div>
        ))}
      </div>

      {/* 详情模态框 - 记忆 */}
      {selectedItem && "content" in selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#141416] rounded-xl border border-[#27272a] max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-[#27272a] flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                {"type" in selectedItem && getMemoryTypeIcon(selectedItem.type)}
                {selectedItem.title}
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-[#a1a1aa] hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {/* 元信息 */}
              <div className="flex gap-4 mb-4 text-sm">
                <span className="text-[#71717a]">
                  类型: {"type" in selectedItem && (
                    <span className="text-blue-400">{selectedItem.type === 'long-term' ? '长期记忆' : selectedItem.type === 'daily' ? '日记' : '进化'}</span>
                  )}
                </span>
                <span className="text-[#71717a]">
                  日期: <span className="text-white">{selectedItem.date}</span>
                </span>
              </div>
              {/* 详细内容 */}
              <div className="border-t border-[#27272a] pt-4">
                <pre className="text-[#d4d4d8] whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {selectedItem.content}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // 渲染文档库
  const renderDocuments = () => (
    <div className="p-8 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-7 h-7 text-blue-400" />
          文档库
        </h2>
      </div>

      {/* 搜索 */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a1a1aa]" />
        <input
          type="text"
          placeholder="搜索文档..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#141416] border border-[#27272a] rounded-lg pl-12 pr-4 py-3 text-white placeholder-[#a1a1aa] focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* 文档列表 */}
      <div className="space-y-3">
        {filteredDocuments.map((doc) => (
          <div
            key={doc.id}
            className="bg-[#141416] p-4 rounded-xl border border-[#27272a] hover:border-blue-500/50 cursor-pointer transition-colors"
            onClick={() => setSelectedItem(doc)}
          >
            <div className="flex items-center gap-3 mb-2">
              {getDocumentTypeIcon(doc.type)}
              <h3 className="font-semibold">{doc.title}</h3>
              <span className="text-xs bg-[#27272a] px-2 py-1 rounded text-[#a1a1aa]">
                {doc.type}
              </span>
              <span className="text-xs text-[#a1a1aa] ml-auto">{doc.date}</span>
            </div>
            <p className="text-xs text-[#a1a1aa] truncate">{doc.path}</p>
            <p className="text-xs text-[#a1a1aa] mt-1">{formatSize(doc.size)}</p>
          </div>
        ))}
      </div>

      {/* 详情模态框 - 文档 */}
      {selectedItem && "path" in selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#141416] rounded-xl border border-[#27272a] max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-[#27272a] flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                {"type" in selectedItem && getDocumentTypeIcon(selectedItem.type)}
                {selectedItem.title}
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-[#a1a1aa] hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {/* 元信息 */}
              <div className="bg-[#0a0a0c] rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[#71717a] text-xs">文件路径</p>
                    <p className="text-[#d4d4d8] truncate mt-1">{selectedItem.path}</p>
                  </div>
                  <div>
                    <p className="text-[#71717a] text-xs">文件类型</p>
                    <p className="text-blue-400 mt-1">{selectedItem.type}</p>
                  </div>
                  <div>
                    <p className="text-[#71717a] text-xs">文件大小</p>
                    <p className="text-white mt-1">{formatSize(selectedItem.size)}</p>
                  </div>
                  <div>
                    <p className="text-[#71717a] text-xs">创建日期</p>
                    <p className="text-white mt-1">{selectedItem.date}</p>
                  </div>
                </div>
              </div>
              {/* 提示 */}
              <p className="text-xs text-[#71717a] text-center">
                文件预览功能开发中...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // 渲染Agent中心
  const renderAgents = () => {
    const totalTasks = mockAgents.reduce((sum, a) => sum + a.tasks, 0);
    const totalCompleted = mockAgents.reduce((sum, a) => sum + a.completedTasks, 0);
    const totalFailed = mockAgents.reduce((sum, a) => sum + a.failedTasks, 0);
    const totalTokens = mockAgents.reduce((sum, a) => sum + a.tokenUsage, 0);

    return (
      <div className="p-8 animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-7 h-7 text-purple-400" />
            Agent中心
          </h2>
        </div>

        {/* 统计卡片 */}
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
              <span className="text-[#a1a1aa] text-sm">Token消耗</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{(totalTokens / 1000).toFixed(1)}k</p>
          </div>
        </div>

        {/* Agent列表 */}
        <div className="space-y-4">
          {mockAgents.map((agent) => (
            <div
              key={agent.id}
              className="bg-[#141416] p-5 rounded-xl border border-[#27272a] hover:border-purple-500/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-white">{agent.name}</h3>
                  {agent.status === "ok" ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : agent.status === "running" ? (
                    <Activity className="w-4 h-4 text-blue-400 animate-pulse" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
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
                  <p className="text-[#71717a] text-xs">Token</p>
                  <p className="text-yellow-400">{(agent.tokenUsage / 1000).toFixed(1)}k</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染任务中心
  const renderTasks = () => (
    <div className="p-8 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <CheckSquare className="w-7 h-7 text-green-400" />
          任务中心
        </h2>
      </div>

      {/* 搜索 */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a1a1aa]" />
        <input
          type="text"
          placeholder="搜索任务..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#141416] border border-[#27272a] rounded-lg pl-12 pr-4 py-3 text-white placeholder-[#a1a1aa] focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* 任务统计 */}
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

      {/* 任务列表 */}
      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className={`bg-[#141416] p-4 rounded-xl border transition-colors ${
              task.status === "error"
                ? "border-red-500/30 hover:border-red-500/50"
                : "border-[#27272a] hover:border-green-500/50"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {getStatusIcon(task.status)}
                <h3 className="font-semibold">{task.name}</h3>
                {task.errorCount > 0 && (
                  <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs">
                    {task.errorCount}次错误
                  </span>
                )}
              </div>
              <span className="text-xs text-[#a1a1aa] bg-[#27272a] px-2 py-1 rounded">
                {task.schedule}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-[#a1a1aa] text-xs">上次运行</p>
                <p className="text-white">{task.lastRun}</p>
              </div>
              <div>
                <p className="text-[#a1a1aa] text-xs">运行时长</p>
                <p className="text-white">{task.lastDuration}</p>
              </div>
              <div>
                <p className="text-[#a1a1aa] text-xs">下次运行</p>
                <p className="text-white">{task.nextRun}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <AuthCheck>
    <div className="flex min-h-screen bg-[#0a0a0b]">
      {renderSidebar()}
      <main className="flex-1 overflow-y-auto">
        {/* 全局搜索区域 */}
        {searchQuery && (
          <div className="p-8 animate-fadeIn">
            <div className="mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                <Search className="w-7 h-7 text-blue-400" />
                搜索结果
              </h2>
              <p className="text-[#71717a]">关键词: "{searchQuery}"</p>
            </div>

            {/* 记忆搜索结果 */}
            {memories.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.content?.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-[#a1a1aa] mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  记忆 ({memories.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.content?.toLowerCase().includes(searchQuery.toLowerCase())).length})
                </h3>
                <div className="space-y-3">
                  {memories.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.content?.toLowerCase().includes(searchQuery.toLowerCase())).map(m => (
                    <div key={m.id} onClick={() => {setSelectedItem(m); setActiveTab("memories");}} className="bg-[#141416] p-4 rounded-xl border border-[#27272a] hover:border-purple-500/50 cursor-pointer">
                      <div className="flex items-center gap-2 mb-2">
                        {getMemoryTypeIcon(m.type)}
                        <span className="font-semibold">{m.title}</span>
                        <span className="text-xs text-[#71717a] ml-auto">{m.date}</span>
                      </div>
                      <p className="text-sm text-[#a1a1aa] line-clamp-2">{m.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 文档搜索结果 */}
            {documents.filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.path.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-[#a1a1aa] mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  文档 ({documents.filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.path.toLowerCase().includes(searchQuery.toLowerCase())).length})
                </h3>
                <div className="space-y-3">
                  {documents.filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.path.toLowerCase().includes(searchQuery.toLowerCase())).map(d => (
                    <div key={d.id} onClick={() => {setSelectedItem(d); setActiveTab("documents");}} className="bg-[#141416] p-4 rounded-xl border border-[#27272a] hover:border-blue-500/50 cursor-pointer">
                      <div className="flex items-center gap-2 mb-2">
                        {getDocumentTypeIcon(d.type)}
                        <span className="font-semibold">{d.title}</span>
                        <span className="text-xs text-[#71717a] ml-auto">{d.date}</span>
                      </div>
                      <p className="text-sm text-[#a1a1aa] truncate">{d.path}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 任务搜索结果 */}
            {tasks.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-[#a1a1aa] mb-4 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5" />
                  任务 ({tasks.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())).length})
                </h3>
                <div className="space-y-3">
                  {tasks.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())).map(t => (
                    <div key={t.id} onClick={() => setActiveTab("tasks")} className="bg-[#141416] p-4 rounded-xl border border-[#27272a] hover:border-green-500/50 cursor-pointer">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(t.status)}
                        <span className="font-semibold">{t.name}</span>
                        <span className="text-xs text-[#71717a] ml-auto">{t.schedule}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 无结果 */}
            {memories.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.content?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 &&
             documents.filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.path.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 &&
             tasks.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-[#3f3f46] mx-auto mb-4" />
                <p className="text-[#71717a]">未找到相关结果</p>
              </div>
            )}
          </div>
        )}

        {!searchQuery && (
          <>
        {activeTab === "home" && renderHome()}
        {activeTab === "memories" && renderMemories()}
        {activeTab === "documents" && renderDocuments()}
        {activeTab === "tasks" && renderTasks()}
        {activeTab === "agents" && renderAgents()}
          </>
        )}
      </main>
    </div>
    </AuthCheck>
  );
}
