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
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://njxjuvxosvwvluxefrzg.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qeGp1dnhvc3Z3dmx1eGVmcnpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MjkyNTUsImV4cCI6MjA4NzQwNTI1NX0.FqfMyI3uSkiHVepWVccxFU4ie5RU00VVdrF-aOr9LjI";
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
  status: "ok" | "error" | "running" | "idle" | "disabled";
  lastRun: string | null;
  lastDuration: string | null;
  nextRun: string | null;
  errorCount: number;
  tokenUsage: number;
  updatedAt?: string | null;
}

interface TokenTrendPoint {
  date: string;
  totalTokens: number;
  taskBreakdown: Record<string, number>;
}

interface TokenTrendRangePoint extends TokenTrendPoint {
  agentBreakdown: Record<string, number>;
}

function addDaysToDateKey(dateKey: string, delta: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().split('T')[0];
}

function buildContinuousTrend(
  points: TokenTrendRangePoint[],
  range: 7 | 14 | 30,
  endDate?: string
): TokenTrendRangePoint[] {
  if (!points.length) return [];

  const finalDate = endDate || points[points.length - 1]?.date;
  if (!finalDate) return [];

  const byDate = new Map(points.map((point) => [point.date, point]));
  const startDate = addDaysToDateKey(finalDate, -(range - 1));

  return Array.from({ length: range }, (_, index) => {
    const date = addDaysToDateKey(startDate, index);
    return (
      byDate.get(date) || {
        date,
        totalTokens: 0,
        taskBreakdown: {},
        agentBreakdown: {},
      }
    );
  });
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
    tokenUsage: 0,
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
    tokenUsage: 0,
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
    tokenUsage: 0,
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
    tokenUsage: 0,
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
    tokenUsage: 0,
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
    tokenUsage: 0,
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
    tokenUsage: 0,
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
    tokenUsage: 0,
  },
];

// Agent 类型定义
interface Agent {
  id: string;
  name: string;
  description: string;
  status: "ok" | "error" | "running" | "idle" | "disabled";
  model: string;
  tasks: number;
  completedTasks: number;
  failedTasks: number;
  tokenUsage: number;
  lastRun: string;
}

// Agent 模拟数据
const agentDefinitions = [
  {
    id: "coding",
    name: "Coding Agent",
    description: "负责代码开发、重构、调试、技术架构与Skill进化",
    model: "MiniMax M2.5",
    taskIds: ["task-evolution"],
  },
  {
    id: "content",
    name: "Content Agent",
    description: "负责AI日报、内容发布、KOL追踪",
    model: "Kimi K2.5",
    taskIds: ["task-ai-daily", "task-content-publish", "task-kol"],
  },
  {
    id: "growth",
    name: "Growth Agent",
    description: "负责OpenClaw动态监控",
    model: "Kimi K2.5",
    taskIds: ["task-seo"],
  },
  {
    id: "product",
    name: "Product Agent",
    description: "负责竞品分析和产品规划",
    model: "Kimi K2.5",
    taskIds: ["task-product"],
  },
  {
    id: "chief",
    name: "Chief Agent",
    description: "负责每晚 Chief Agent 工作总结报告与系统巡检",
    model: "GPT-5.4",
    taskIds: ["task-chief", "task-health"],
  },
];

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};

const formatFullDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
};

const safeText = (value: unknown) => (typeof value === "string" ? value : "");
const matchesQuery = (query: string, ...fields: unknown[]) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;
  return fields.some((field) => safeText(field).toLowerCase().includes(normalizedQuery));
};

const normalizeTask = (row: any): Task => ({
  id: row.id,
  name: row.name,
  schedule: row.schedule,
  status: row.status || "idle",
  lastRun: row.last_run || null,
  lastDuration: row.last_duration || null,
  nextRun: row.next_run || null,
  errorCount: row.error_count || 0,
  tokenUsage: row.token_usage || 0,
  updatedAt: row.updated_at || null,
});

const agentColorMap: Record<string, string> = {
  total: "#facc15",
  content: "#60a5fa",
  growth: "#34d399",
  product: "#f97316",
  chief: "#a78bfa",
  evo: "#f472b6",
};

type TabType = "home" | "memories" | "documents" | "tasks" | "agents" | "team" | "office";

export default function SecondBrain() {
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [draftSearchQuery, setDraftSearchQuery] = useState("");
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
  const [tokenTrend, setTokenTrend] = useState<TokenTrendPoint[]>([]);
  const [trendRange, setTrendRange] = useState<7 | 14 | 30>(14);

  // 从Supabase获取数据
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [memRes, docRes, taskRes, trendRes] = await Promise.all([
          supabase.from("memories").select("*").order("date", { ascending: false }),
          supabase.from("documents").select("*").order("date", { ascending: false }),
          supabase.from("tasks").select("*"),
          fetch("/api/token-trend").then((res) => res.json()).catch(() => ({ trend: [] })),
        ]);

        if (memRes.data) setMemories(memRes.data as Memory[]);
        if (docRes.data) setDocuments(docRes.data as Document[]);
        if (taskRes.data) setTasks(taskRes.data.map(normalizeTask));
        if (trendRes?.trend) setTokenTrend(trendRes.trend as TokenTrendPoint[]);
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
        !dateRange.start ||
        !dateRange.end ||
        (m.date >= dateRange.start && m.date <= dateRange.end)) &&
      matchesQuery(searchQuery, m.title, m.content)
  );

  const filteredDocuments = documents.filter(
    (d) =>
      (!dateRange.start || !dateRange.end || (d.date >= dateRange.start && d.date <= dateRange.end)) &&
      matchesQuery(searchQuery, d.title, d.path, d.type)
  );

  const filteredTasks = tasks.filter((t) => matchesQuery(searchQuery, t.name, t.schedule, t.status));

  const searchedMemories = memories.filter((m) => matchesQuery(searchQuery, m.title, m.content));
  const searchedDocuments = documents.filter((d) => matchesQuery(searchQuery, d.title, d.path, d.type));
  const searchedTasks = tasks.filter((t) => matchesQuery(searchQuery, t.name, t.schedule, t.status));

  // 统计
  const stats = {
    totalMemories: memories.length,
    totalDocuments: documents.length,
    activeTasks: tasks.filter((t) => t.status === "ok" || t.status === "running").length,
    errorTasks: tasks.filter((t) => t.status === "error").length,
  };

  const agentCards = agentDefinitions.map((agent) => {
    const agentTasks = tasks.filter((task) => agent.taskIds.includes(task.id));
    const lastRunTimestamps = agentTasks
      .map((task) => (task.lastRun ? new Date(task.lastRun).getTime() : 0))
      .filter((value) => value > 0);

    const status = agentTasks.some((task) => task.status === "running")
      ? "running"
      : agentTasks.some((task) => task.status === "error")
      ? "error"
      : agentTasks.some((task) => task.status === "ok")
      ? "ok"
      : "idle";

    return {
      ...agent,
      status,
      tasks: agentTasks.length,
      completedTasks: agentTasks.filter((task) => task.status === "ok").length,
      failedTasks: agentTasks.filter((task) => task.status === "error").length,
      tokenUsage: agentTasks.reduce((sum, task) => sum + task.tokenUsage, 0),
      lastRun: lastRunTimestamps.length
        ? formatDateTime(new Date(Math.max(...lastRunTimestamps)).toISOString())
        : "—",
    };
  });

  const taskToAgent = Object.fromEntries(
    agentDefinitions.flatMap((agent) => agent.taskIds.map((taskId) => [taskId, agent.id]))
  ) as Record<string, string>;

  const trendData: TokenTrendRangePoint[] = tokenTrend.map((point) => {
    const agentBreakdown: Record<string, number> = {};
    Object.entries(point.taskBreakdown || {}).forEach(([taskId, value]) => {
      const agentId = taskToAgent[taskId] || "unknown";
      agentBreakdown[agentId] = (agentBreakdown[agentId] || 0) + value;
    });
    return { ...point, agentBreakdown };
  });

  const todayDate = new Date().toISOString().split('T')[0];
  const latestTrendDate = trendData[trendData.length - 1]?.date;
  const trendEndDate = latestTrendDate && latestTrendDate > todayDate ? latestTrendDate : todayDate;
  const displayTrend = buildContinuousTrend(trendData, trendRange, trendEndDate);
  const totalRangeTokens = displayTrend.reduce((sum, point) => sum + point.totalTokens, 0);
  const rangeTokenUsageByAgent = Object.fromEntries(
    agentDefinitions.map((agent) => [
      agent.id,
      displayTrend.reduce((sum, point) => sum + (point.agentBreakdown[agent.id] || 0), 0),
    ])
  ) as Record<string, number>;
  const tokenTrendMax = Math.max(...displayTrend.map((point) => point.totalTokens), 1);
  const lineSeries = [
    {
      key: "total",
      label: "总Token",
      color: agentColorMap.total,
      values: displayTrend.map((point) => point.totalTokens),
    },
    ...agentDefinitions.map((agent) => ({
      key: agent.id,
      label: agent.name,
      color: agentColorMap[agent.id] || "#94a3b8",
      values: displayTrend.map((point) => point.agentBreakdown[agent.id] || 0),
    })),
  ];

  const tokenDistribution = agentCards
    .map((agent) => ({
      id: agent.id,
      label: agent.name,
      value: rangeTokenUsageByAgent[agent.id] || 0,
      color: agentColorMap[agent.id] || "#94a3b8",
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const tokenDistributionMax = Math.max(...tokenDistribution.map((item) => item.value), 1);
  const latestSupabaseSyncAt = tasks.reduce<string | null>((latest, task) => {
    if (!task.updatedAt) return latest;
    if (!latest) return task.updatedAt;
    return new Date(task.updatedAt).getTime() > new Date(latest).getTime() ? task.updatedAt : latest;
  }, null);

  const handleSearchInputChange = (value: string) => {
    setDraftSearchQuery(value);
    if (!value.trim()) {
      setSearchQuery("");
    }
  };

  const commitSearch = () => {
    setSearchQuery(draftSearchQuery.trim());
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      commitSearch();
    }
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
      case "idle":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "disabled":
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
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
          <li>
            <button
              onClick={() => setActiveTab("team")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === "team"
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-[#a1a1aa] hover:bg-[#27272a] hover:text-white"
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
                activeTab === "office"
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-[#a1a1aa] hover:bg-[#27272a] hover:text-white"
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

  // Agent 状态类型
  type AgentStatus = 'active' | 'idle' | 'offline' | 'communicating' | 'busy';
  
  interface TeamAgent {
    id: string;
    name: string;
    role: string;
    icon: string;
    status: AgentStatus;
    lastActive: string;
    currentTask: string;
    taskProgress: number;
    tasksToday: number;
    conversationsToday: number;
    collaborationsToday: number;
    isExternal?: boolean;
  }

  // 模拟 Agent 数据（实际应该从 API 获取）
  const [teamAgents, setTeamAgents] = useState<TeamAgent[]>([
    {
      id: 'chief',
      name: 'Chief Agent',
      role: '主 Agent',
      icon: '👑',
      status: 'active',
      lastActive: '刚刚',
      currentTask: '协调各 Agent 工作',
      taskProgress: 75,
      tasksToday: 12,
      conversationsToday: 28,
      collaborationsToday: 5,
    },
    {
      id: 'content',
      name: 'Content Agent',
      role: '内容创作',
      icon: '📝',
      status: 'active',
      lastActive: '1分钟前',
      currentTask: '撰写 AI 日报',
      taskProgress: 60,
      tasksToday: 8,
      conversationsToday: 15,
      collaborationsToday: 3,
    },
    {
      id: 'growth',
      name: 'Growth Agent',
      role: '增长营销',
      icon: '📈',
      status: 'idle',
      lastActive: '5分钟前',
      currentTask: '等待任务',
      taskProgress: 0,
      tasksToday: 5,
      conversationsToday: 10,
      collaborationsToday: 2,
    },
    {
      id: 'coding',
      name: 'Coding Agent',
      role: '技术开发',
      icon: '💻',
      status: 'active',
      lastActive: '刚刚',
      currentTask: '开发 Team 页面',
      taskProgress: 45,
      tasksToday: 10,
      conversationsToday: 20,
      collaborationsToday: 4,
    },
    {
      id: 'product',
      name: 'Product Agent',
      role: '产品经理',
      icon: '🎯',
      status: 'busy',
      lastActive: '2分钟前',
      currentTask: 'PRD 撰写',
      taskProgress: 80,
      tasksToday: 6,
      conversationsToday: 12,
      collaborationsToday: 3,
    },
    {
      id: 'finance',
      name: 'Finance Agent',
      role: '财务管理',
      icon: '💰',
      status: 'idle',
      lastActive: '10分钟前',
      currentTask: '等待任务',
      taskProgress: 0,
      tasksToday: 3,
      conversationsToday: 5,
      collaborationsToday: 1,
    },
    {
      id: 'abby',
      name: '阿比',
      role: '个人生活助理',
      icon: '🤖',
      status: 'active',
      lastActive: '刚刚',
      currentTask: '日常助理服务',
      taskProgress: 100,
      tasksToday: 20,
      conversationsToday: 30,
      collaborationsToday: 0,
      isExternal: true,
    },
  ]);

  // 状态映射
  const statusMap: Record<AgentStatus, { label: string; color: string; bgColor: string; icon: string }> = {
    active: { label: '工作中', color: 'text-green-400', bgColor: 'bg-green-500', icon: '🟢' },
    idle: { label: '闲置', color: 'text-yellow-400', bgColor: 'bg-yellow-500', icon: '🟡' },
    offline: { label: '离线', color: 'text-red-400', bgColor: 'bg-red-500', icon: '🔴' },
    communicating: { label: '沟通中', color: 'text-blue-400', bgColor: 'bg-blue-500', icon: '🔵' },
    busy: { label: '忙碌', color: 'text-orange-400', bgColor: 'bg-orange-500', icon: '🟠' },
  };

  // 获取状态样式
  const getStatusStyle = (status: AgentStatus) => statusMap[status] || statusMap.idle;

  // 渲染 Agent 卡片
  const renderAgentCard = (agent: TeamAgent, size: 'large' | 'medium' | 'small' = 'medium') => {
    const statusStyle = getStatusStyle(agent.status);
    const cardWidth = size === 'large' ? 'w-72' : size === 'medium' ? 'w-56' : 'w-48';
    
    return (
      <div
        key={agent.id}
        className={`${cardWidth} bg-[#141416] rounded-xl border-2 ${
          agent.isExternal ? 'border-dashed border-[#3f3f46]' : 'border-[#27272a]'
        } hover:border-purple-500/50 transition-all cursor-pointer group relative`}
      >
        {/* 状态徽章 */}
        <div className={`absolute -top-2 -right-2 ${statusStyle.bgColor} rounded-full px-2 py-0.5 text-xs flex items-center gap-1`}>
          <span>{statusStyle.icon}</span>
          <span className="text-white text-xs">{statusStyle.label}</span>
        </div>
        
        <div className="p-4">
          {/* Agent 图标和名称 */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{agent.icon}</span>
            <div>
              <h3 className="font-semibold text-white">{agent.name}</h3>
              <p className="text-xs text-[#71717a]">{agent.role}</p>
            </div>
          </div>
          
          {/* 分隔线 */}
          <div className="border-t border-[#27272a] my-3"></div>
          
          {/* 状态信息 */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#71717a]">状态</span>
              <span className={statusStyle.color}>{statusStyle.icon} {statusStyle.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#71717a]">最后活跃</span>
              <span className="text-[#a1a1aa]">{agent.lastActive}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#71717a]">当前任务</span>
              <span className="text-[#a1a1aa] truncate max-w-[120px]">{agent.currentTask}</span>
            </div>
          </div>
          
          {/* 悬停显示任务详情 */}
          <div className="absolute left-full top-0 ml-2 w-64 bg-[#1a1a1c] rounded-xl border border-[#27272a] p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
            <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
              📋 正在执行的任务
            </h4>
            <div className="border-t border-[#27272a] my-2"></div>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs text-[#71717a]">任务名称</p>
                <p className="text-sm text-white">{agent.currentTask}</p>
              </div>
              
              {agent.taskProgress > 0 && (
                <div>
                  <p className="text-xs text-[#71717a] mb-1">进度</p>
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
                <p className="text-xs text-[#71717a]">预计剩余</p>
                <p className="text-sm text-white">
                  {agent.status === 'idle' ? '等待中' : 
                   agent.taskProgress > 0 ? `${Math.round((100 - agent.taskProgress) * 2)}分钟` : '-'}
                </p>
              </div>
              
              <div className="border-t border-[#27272a] my-2"></div>
              
              <div>
                <p className="text-xs text-[#71717a] mb-1">📊 今日统计</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-[#27272a] rounded py-1">
                    <p className="text-lg font-bold text-white">{agent.tasksToday}</p>
                    <p className="text-[10px] text-[#71717a]">处理任务</p>
                  </div>
                  <div className="bg-[#27272a] rounded py-1">
                    <p className="text-lg font-bold text-white">{agent.conversationsToday}</p>
                    <p className="text-[10px] text-[#71717a]">对话交互</p>
                  </div>
                  <div className="bg-[#27272a] rounded py-1">
                    <p className="text-lg font-bold text-white">{agent.collaborationsToday}</p>
                    <p className="text-[10px] text-[#71717a]">协作请求</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 指向箭头 */}
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#1a1a1c] border-l-0 border-b-0 border-[#27272a] rotate-45"></div>
          </div>
        </div>
      </div>
    );
  };

  // 渲染 Team 页面
  const renderTeam = () => (
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

      {/* 架构图 */}
      <div className="flex flex-col items-center gap-8">
        {/* Chief Agent */}
        <div className="flex flex-col items-center">
          {renderAgentCard(teamAgents.find(a => a.id === 'chief')!, 'large')}
        </div>

        {/* 连接线 */}
        <div className="flex items-center justify-center w-full max-w-4xl">
          <div className="h-8 w-px bg-gradient-to-b from-purple-500 to-transparent"></div>
        </div>

        {/* 第一层 Sub Agents */}
        <div className="flex flex-wrap justify-center gap-6 w-full max-w-4xl">
          {renderAgentCard(teamAgents.find(a => a.id === 'content')!, 'medium')}
          {renderAgentCard(teamAgents.find(a => a.id === 'growth')!, 'medium')}
          {renderAgentCard(teamAgents.find(a => a.id === 'coding')!, 'medium')}
        </div>

        {/* 连接线 */}
        <div className="flex items-center justify-center w-full max-w-4xl">
          <div className="h-8 w-px bg-gradient-to-b from-blue-500 to-transparent"></div>
        </div>

        {/* 第二层 Sub Agents */}
        <div className="flex flex-wrap justify-center gap-6 w-full max-w-4xl">
          {renderAgentCard(teamAgents.find(a => a.id === 'product')!, 'medium')}
          {renderAgentCard(teamAgents.find(a => a.id === 'finance')!, 'medium')}
        </div>

        {/* 外部 Agent - 并行显示 */}
        <div className="mt-8">
          <p className="text-center text-xs text-[#71717a] mb-2">并行关系（外部 Agent）</p>
          {renderAgentCard(teamAgents.find(a => a.id === 'abby')!, 'small')}
        </div>
      </div>

      {/* 外部 Agent 提示 */}
      <div className="mt-8 p-4 bg-[#141416] rounded-xl border border-[#27272a]">
        <div className="flex items-center gap-2 text-yellow-400">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span className="font-semibold">注意</span>
        </div>
        <p className="text-sm text-[#a1a1aa] mt-2">
          阿比（外部 Agent）部署在外部服务器，状态可能不可达。此处显示的状态为默认状态或缓存数据。
        </p>
      </div>

      {/* 图例 */}
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

  // 渲染 Office 页面
  const renderOffice = () => (
    <div className="p-8 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <svg className="w-7 h-7 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 21h18" />
            <path d="M5 21V7l8-4v18" />
            <path d="M19 21V11l-6-4" />
            <path d="M9 9v.01" />
            <path d="M9 12v.01" />
            <path d="M9 15v.01" />
            <path d="M9 18v.01" />
          </svg>
          Second Brain Office
        </h2>
      </div>

      {/* 办公空间布局 */}
      <div className="bg-[#0a0a0c] rounded-2xl border border-[#27272a] p-6 overflow-auto">
        {/* 顶部：休闲区 */}
        <div className="bg-[#141416] rounded-xl border border-[#27272a] p-4 mb-6">
          <h3 className="text-sm font-semibold text-[#a1a1aa] mb-3 flex items-center gap-2">
            ☕ 公共休闲区
          </h3>
          <div className="flex justify-around items-center py-4">
            <div className="text-center">
              <div className="text-2xl mb-1">🛋️</div>
              <p className="text-xs text-[#71717a]">沙发</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🍵</div>
              <p className="text-xs text-[#71717a]">喝茶</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">☕</div>
              <p className="text-xs text-[#71717a]">咖啡</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">📰</div>
              <p className="text-xs text-[#71717a]">阅读</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🌵</div>
              <p className="text-xs text-[#71717a]">盆栽</p>
            </div>
          </div>
          <p className="text-xs text-center text-[#71717a]">🚶 Agent 闲置时随机出现</p>
        </div>

        {/* 中间：主要办公区 */}
        <div className="flex gap-4 mb-6">
          {/* 左侧：Chief 工位 + 储物间 */}
          <div className="flex flex-col gap-4">
            {/* Chief 工位 */}
            <div className="bg-[#141416] rounded-xl border border-purple-500/30 p-4 w-72">
              <h3 className="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
                👑 Chief Agent 工位
              </h3>
              <div className="flex items-center gap-4">
                <div className="text-4xl">🖥️</div>
                <div className="flex-1">
                  <p className="text-sm text-white">大型工作台</p>
                  <p className="text-xs text-[#71717a]">双屏显示器 + 绿植</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-xs text-green-400">工作中</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 储物间 */}
            <div className="bg-[#141416] rounded-xl border border-[#27272a] p-4 w-72">
              <h3 className="text-sm font-semibold text-[#71717a] mb-2 flex items-center gap-2">
                📦 储物间
              </h3>
              <p className="text-xs text-[#71717a]">收纳柜、备用物品</p>
            </div>
          </div>

          {/* 中间：Sub Agent 工位区 */}
          <div className="flex-1 bg-[#141416] rounded-xl border border-[#27272a] p-4">
            <h3 className="text-sm font-semibold text-[#a1a1aa] mb-4 flex items-center gap-2">
              Sub Agent 工作区
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {['Content', 'Growth', 'Coding', 'Product', 'Finance'].map((agent, idx) => {
                const agentData = teamAgents.find(a => a.name.includes(agent));
                const statusStyle = agentData ? getStatusStyle(agentData.status) : statusMap.offline;
                
                return (
                  <div key={agent} className="bg-[#1a1a1c] rounded-lg p-3 text-center border border-[#27272a]">
                    <div className="text-2xl mb-1">
                      {agent === 'Content' ? '📝' : 
                       agent === 'Growth' ? '📈' : 
                       agent === 'Coding' ? '💻' : 
                       agent === 'Product' ? '🎯' : '💰'}
                    </div>
                    <p className="text-xs text-white font-medium">{agent}</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <span className={`w-2 h-2 rounded-full ${statusStyle.bgColor}`}></span>
                      <span className={`text-[10px] ${statusStyle.color}`}>{statusStyle.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-center text-[#71717a] mt-4">小工位 + 收纳盒 + 台灯</p>
          </div>

          {/* 右侧：会议室 */}
          <div className="bg-[#141416] rounded-xl border border-[#27272a] p-4 w-56">
            <h3 className="text-sm font-semibold text-[#a1a1aa] mb-3 flex items-center gap-2">
              🚪 会议室
            </h3>
            <div className="bg-[#1a1a1c] rounded-lg p-4 mb-3">
              <div className="flex justify-center gap-2 mb-2">
                <span>🤝</span>
                <span>💬</span>
                <span>💬</span>
              </div>
              <p className="text-xs text-center text-[#71717a]">Agent A ↔ B</p>
              <p className="text-xs text-center text-[#71717a]">📄 文档传输</p>
            </div>
            <div className="flex items-center justify-between text-xs text-[#71717a]">
              <span>📺 白板</span>
              <span>⏱️ 计时器</span>
            </div>
          </div>
        </div>
      </div>

      {/* Agent 状态图例 */}
      <div className="mt-6 flex flex-wrap justify-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-xl">💻</span>
          <span className="text-[#a1a1aa]">工作中</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-xl">🤝</span>
          <span className="text-[#a1a1aa]">沟通协作</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-xl">🚶</span>
          <span className="text-[#a1a1aa]">闲置</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-xl">⌨️</span>
          <span className="text-[#a1a1aa]">忙碌</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-xl">🏠</span>
          <span className="text-[#a1a1aa]">离线</span>
        </div>
      </div>
    </div>
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
          placeholder="搜索记忆（按回车执行）..."
          value={draftSearchQuery}
          onChange={(e) => handleSearchInputChange(e.target.value)}
          onKeyDown={handleSearchKeyDown}
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
          placeholder="搜索文档（按回车执行）..."
          value={draftSearchQuery}
          onChange={(e) => handleSearchInputChange(e.target.value)}
          onKeyDown={handleSearchKeyDown}
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

  const renderTokenTrendChart = () => {
    if (!displayTrend.length) {
      return (
        <div className="bg-[#141416] rounded-xl border border-[#27272a] p-6 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h3 className="font-semibold">Token 日趋势</h3>
          </div>
          <p className="text-sm text-[#71717a]">暂无可用的历史 token 数据，下面仍会显示当前 Agent 的 token 分布。</p>
        </div>
      );
    }

    const chartWidth = 920;
    const chartHeight = 280;
    const paddingX = 28;
    const paddingY = 20;
    const innerWidth = chartWidth - paddingX * 2;
    const innerHeight = chartHeight - paddingY * 2;
    const xFor = (index: number) =>
      displayTrend.length === 1 ? chartWidth / 2 : paddingX + (index / (displayTrend.length - 1)) * innerWidth;
    const yFor = (value: number) => paddingY + innerHeight - (value / tokenTrendMax) * innerHeight;
    const buildPolyline = (values: number[]) =>
      values.map((value, index) => `${xFor(index)},${yFor(value)}`).join(" ");

    return (
      <div className="bg-[#141416] rounded-xl border border-[#27272a] p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Token 日趋势
            </h3>
            <p className="text-xs text-[#71717a] mt-1">
              按日查看总 Token 折线与各 Agent 消耗拆解（最近 {trendRange} 个自然日，含无数据日期）
            </p>
            <p className="text-xs text-cyan-300 mt-1">
              Token 数据截止：{formatFullDateTime(latestSupabaseSyncAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-[#71717a]">近 {trendRange} 天总量</p>
              <p className="text-xl font-bold text-yellow-400">{(totalRangeTokens / 1000).toFixed(1)}k</p>
            </div>
            <div className="flex bg-[#0f0f10] border border-[#27272a] rounded-lg p-1">
              {[7, 14, 30].map((range) => (
                <button
                  key={range}
                  onClick={() => setTrendRange(range as 7 | 14 | 30)}
                  className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                    trendRange === range ? "bg-yellow-500/20 text-yellow-300" : "text-[#a1a1aa] hover:text-white"
                  }`}
                >
                  {range}天
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#0f0f10] rounded-xl border border-[#27272a] p-4">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-[320px] overflow-visible">
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = paddingY + innerHeight - innerHeight * ratio;
              return (
                <g key={ratio}>
                  <line x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke="#27272a" strokeWidth="1" strokeDasharray="4 4" />
                  <text x={6} y={y + 4} fill="#71717a" fontSize="10">
                    {Math.round((tokenTrendMax * ratio) / 1000)}k
                  </text>
                </g>
              );
            })}

            {displayTrend.map((point, index) => (
              <text key={point.date} x={xFor(index)} y={chartHeight - 4} textAnchor="middle" fill="#a1a1aa" fontSize="10">
                {point.date.slice(5)}
              </text>
            ))}

            {lineSeries.map((series) => (
              <g key={series.key}>
                <polyline
                  fill="none"
                  stroke={series.color}
                  strokeWidth={series.key === "total" ? 3 : 2}
                  points={buildPolyline(series.values)}
                  opacity={series.key === "total" ? 1 : 0.85}
                />
                {series.values.map((value, index) => (
                  <circle
                    key={`${series.key}-${index}`}
                    cx={xFor(index)}
                    cy={yFor(value)}
                    r={series.key === "total" ? 4 : 2.5}
                    fill={series.color}
                  >
                    <title>{`${series.label} · ${displayTrend[index].date} · ${value.toLocaleString()} tokens`}</title>
                  </circle>
                ))}
              </g>
            ))}
          </svg>

          <div className="mt-4 flex flex-wrap gap-3">
            {lineSeries.map((series) => (
              <div key={series.key} className="flex items-center gap-2 text-xs text-[#d4d4d8] bg-[#141416] rounded-lg px-3 py-1.5 border border-[#27272a]">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: series.color }} />
                <span>{series.label}</span>
                <span className="text-[#71717a]">{(series.values.reduce((sum, value) => sum + value, 0) / 1000).toFixed(1)}k</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderTokenDistributionChart = () => {
    return (
      <div className="bg-[#141416] rounded-xl border border-[#27272a] p-6 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-orange-400" />
          <h3 className="font-semibold">Token 分布（近 {trendRange} 天）</h3>
        </div>
        <p className="text-xs text-[#71717a] mb-4">基于当前所选时间范围内的历史 Token 聚合，和上方趋势图保持同一时间维度。</p>

        {!tokenDistribution.length ? (
          <p className="text-sm text-[#71717a]">暂无可展示的 token 数据。</p>
        ) : (
          <div className="space-y-4">
            {tokenDistribution.map((item) => (
              <div key={item.id}>
                <div className="flex items-center justify-between text-sm mb-2">
                  <div className="flex items-center gap-2 text-[#d4d4d8]">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-[#f4f4f5] font-medium">{(item.value / 1000).toFixed(1)}k</span>
                </div>
                <div className="h-3 bg-[#0f0f10] rounded-full overflow-hidden border border-[#27272a]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max((item.value / tokenDistributionMax) * 100, 6)}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // 渲染Agent中心
  const renderAgents = () => {
    const totalTasks = agentCards.reduce((sum, a) => sum + a.tasks, 0);
    const totalCompleted = agentCards.reduce((sum, a) => sum + a.completedTasks, 0);
    const totalFailed = agentCards.reduce((sum, a) => sum + a.failedTasks, 0);
    const totalTokens = totalRangeTokens;

    return (
      <div className="p-8 animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-7 h-7 text-purple-400" />
            Agent中心
          </h2>
        </div>

        {renderTokenTrendChart()}
        {renderTokenDistributionChart()}

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
              <span className="text-[#a1a1aa] text-sm">近{trendRange}天 Token</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{(totalTokens / 1000).toFixed(1)}k</p>
          </div>
        </div>

        {/* Agent列表 */}
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
  };

  // 渲染任务中心
  const renderTasks = () => (
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

      {/* 搜索 */}
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
            {searchedMemories.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-[#a1a1aa] mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  记忆 ({searchedMemories.length})
                </h3>
                <div className="space-y-3">
                  {searchedMemories.map((m) => (
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
            {searchedDocuments.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-[#a1a1aa] mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  文档 ({searchedDocuments.length})
                </h3>
                <div className="space-y-3">
                  {searchedDocuments.map((d) => (
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
            {searchedTasks.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-[#a1a1aa] mb-4 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5" />
                  任务 ({searchedTasks.length})
                </h3>
                <div className="space-y-3">
                  {searchedTasks.map((t) => (
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
            {searchedMemories.length === 0 && searchedDocuments.length === 0 && searchedTasks.length === 0 && (
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
        {activeTab === "team" && renderTeam()}
        {activeTab === "office" && renderOffice()}
          </>
        )}

        {activeTab === "team" && !searchQuery && renderTeam()}
        {activeTab === "office" && !searchQuery && renderOffice()}
      </main>
    </div>
    </AuthCheck>
  );
}
