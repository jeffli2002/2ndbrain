"use client";

import { useState, useEffect, useRef } from "react";
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
import { Sidebar } from "@/components/second-brain/Sidebar";
import { HomeView } from "@/components/second-brain/HomeView";
import { MemoriesView } from "@/components/second-brain/MemoriesView";
import { DocumentsView } from "@/components/second-brain/DocumentsView";
import { AgentsView } from "@/components/second-brain/AgentsView";
import { TasksView } from "@/components/second-brain/TasksView";
import { TeamView } from "@/components/second-brain/TeamView";
import { OfficeView } from "@/components/second-brain/OfficeView";
import { RdMemosView } from "@/components/second-brain/RdMemosView";

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

type MemorySectionKey = "what" | "decisions" | "insights";

interface MemoryDigest {
  headline: string;
  what: string[];
  decisions: string[];
  insights: string[];
  excerpt: string;
}

interface MemoryTimelineEntry {
  id: string;
  timeLabel: string;
  title: string;
  summary: MemoryDigest;
}

const MEMORY_SECTION_LABELS: Record<MemorySectionKey, string[]> = {
  what: ["what", "发生了什么", "做了什么", "进展", "内容", "事项", "摘要", "总结"],
  decisions: ["decisions", "decision", "决策", "决定", "判断", "取舍", "行动决策"],
  insights: ["key insights", "insights", "insight", "洞察", "反思", "经验", "启发", "学习", "结论"],
};

const DECISION_KEYWORDS = ["决定", "改为", "采用", "切换", "选择", "上线", "发布", "修复", "重置", "推送", "调整"];
const INSIGHT_KEYWORDS = ["经验", "发现", "说明", "意味着", "提醒", "风险", "洞察", "反思", "以后", "下一次", "注意"];

function stripMarkdownLine(value: string) {
  return value
    .replace(/^\s*[-*+]\s+/, "")
    .replace(/^\s*\d+[.)]\s+/, "")
    .replace(/^\s*>\s?/, "")
    .replace(/^\s*#{1,6}\s*/, "")
    .trim();
}

function toDisplayType(type: Memory["type"]) {
  if (type === "long-term") return "长期记忆";
  if (type === "daily") return "Daily Memory";
  return "进化记录";
}

function formatMemoryDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function formatMemoryDateMeta(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

function takeMeaningfulLines(text: string) {
  return text
    .split(/\n+/)
    .map(stripMarkdownLine)
    .filter(Boolean);
}

function makeHeadline(rawTitle: string, content: string) {
  const cleanedTitle = stripMarkdownLine(rawTitle)
    .replace(/^\d{4}-\d{2}-\d{2}\s*/, "")
    .replace(/工作日志|日报|日记|长期记忆[:：]?/g, "")
    .trim();

  if (cleanedTitle) return cleanedTitle.slice(0, 42);

  const candidate = takeMeaningfulLines(content).find((line) => line.length > 6) || "Memory Snapshot";
  return candidate.slice(0, 42);
}

function normalizeSectionKey(line: string): MemorySectionKey | null {
  const normalized = stripMarkdownLine(line).toLowerCase().replace(/[：:]/g, "").trim();
  for (const key of Object.keys(MEMORY_SECTION_LABELS) as MemorySectionKey[]) {
    if (MEMORY_SECTION_LABELS[key].some((label) => normalized === label || normalized.startsWith(`${label} `))) {
      return key;
    }
  }
  return null;
}

function classifyMemoryLines(lines: string[]) {
  const buckets: Record<MemorySectionKey, string[]> = { what: [], decisions: [], insights: [] };
  let currentSection: MemorySectionKey = "what";

  for (const rawLine of lines) {
    const sectionKey = normalizeSectionKey(rawLine);
    if (sectionKey) {
      currentSection = sectionKey;
      continue;
    }

    const line = stripMarkdownLine(rawLine);
    if (!line) continue;

    if (currentSection !== "what") {
      buckets[currentSection].push(line);
      continue;
    }

    if (DECISION_KEYWORDS.some((keyword) => line.includes(keyword))) {
      buckets.decisions.push(line);
      continue;
    }

    if (INSIGHT_KEYWORDS.some((keyword) => line.includes(keyword))) {
      buckets.insights.push(line);
      continue;
    }

    buckets.what.push(line);
  }

  if (!buckets.decisions.length && buckets.what.length > 1) {
    buckets.decisions.push(buckets.what[1]);
  }

  if (!buckets.insights.length) {
    const fallbackInsight = buckets.what.find((line, index) => index > 0 && line.length > 18) || buckets.decisions[0];
    if (fallbackInsight) buckets.insights.push(fallbackInsight);
  }

  return {
    what: buckets.what.slice(0, 3),
    decisions: buckets.decisions.slice(0, 2),
    insights: buckets.insights.slice(0, 2),
  };
}

function buildMemoryDigest(rawTitle: string, content: string): MemoryDigest {
  const lines = takeMeaningfulLines(content);
  const sections = classifyMemoryLines(lines);
  const excerptSource = [...sections.what, ...sections.decisions, ...sections.insights].join(" · ") || content;

  return {
    headline: makeHeadline(rawTitle, content),
    what: sections.what.length ? sections.what : [excerptSource.slice(0, 120)],
    decisions: sections.decisions,
    insights: sections.insights,
    excerpt: excerptSource.slice(0, 180),
  };
}

function mergeMemorySummaryLines(summary: MemoryDigest) {
  return [...summary.what, ...summary.decisions, ...summary.insights].filter(
    (item, index, source) => item && source.indexOf(item) === index
  );
}

function isDuplicateDailyIntroLine(line: string, memory: Memory) {
  const normalized = stripMarkdownLine(line)
    .replace(/[（）()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const normalizedTitle = stripMarkdownLine(memory.title)
    .replace(/[（）()]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return false;
  if (normalized === memory.date) return true;
  if (normalized === normalizedTitle) return true;
  if (normalized === `${memory.date} 工作日志`) return true;
  if (normalized === `${memory.date} 日志`) return true;
  if (normalized === `${memory.date} 日报`) return true;

  return false;
}

function trimLeadingDailyIntro(lines: string[], memory: Memory) {
  const trimmed = [...lines];
  while (trimmed.length && isDuplicateDailyIntroLine(trimmed[0], memory)) {
    trimmed.shift();
  }
  return trimmed;
}

function splitMemoryIntoBlocks(memory: Memory) {
  const sanitizedLines = trimLeadingDailyIntro(memory.content.split("\n"), memory);
  const blocks: Array<{ title: string; body: string; timeLabel?: string }> = [];
  let currentTitle = memory.title;
  let currentLines: string[] = [];

  const pushCurrent = () => {
    const body = trimLeadingDailyIntro(currentLines, memory).join("\n").trim();
    if (body) blocks.push({ title: currentTitle, body });
  };

  for (const line of sanitizedLines) {
    const headingMatch = line.match(/^\s*#{2,4}\s+(.+)$/);
    if (headingMatch) {
      pushCurrent();
      currentTitle = headingMatch[1].trim();
      currentLines = [];
      continue;
    }

    currentLines.push(line);
  }

  pushCurrent();

  if (blocks.length) {
    return blocks;
  }

  const timePattern = /^\s*(?:[-*+•]\s*)?(\d{1,2}:\d{2}(?:\s?[AP]M)?)\s*(?:[-–—:：]\s*)?(.*)$/i;
  const timeBlocks: Array<{ title: string; body: string; timeLabel?: string }> = [];
  let currentTimeBlock: { timeLabel?: string; title: string; lines: string[] } | null = null;
  const prefaceLines: string[] = [];

  const pushTimeBlock = () => {
    if (!currentTimeBlock) return;
    const body = trimLeadingDailyIntro(currentTimeBlock.lines, memory).join("\n").trim();
    if (body) {
      timeBlocks.push({
        title: currentTimeBlock.title,
        body,
        timeLabel: currentTimeBlock.timeLabel,
      });
    }
  };

  for (const line of sanitizedLines) {
    const matched = line.match(timePattern);
    if (matched) {
      pushTimeBlock();
      const [, timeLabel, remainder] = matched;
      const cleanRemainder = stripMarkdownLine(remainder);
      currentTimeBlock = {
        timeLabel: timeLabel.toUpperCase(),
        title: cleanRemainder || `${memory.title} / ${timeLabel}`,
        lines: cleanRemainder ? [cleanRemainder] : [],
      };
      continue;
    }

    if (currentTimeBlock) {
      currentTimeBlock.lines.push(line);
    } else if (!isDuplicateDailyIntroLine(line, memory)) {
      prefaceLines.push(line);
    }
  }

  pushTimeBlock();

  if (timeBlocks.length) {
    if (prefaceLines.length) {
      timeBlocks[0].body = `${prefaceLines.join("\n").trim()}\n${timeBlocks[0].body}`.trim();
    }
    return timeBlocks;
  }

  const paragraphs = trimLeadingDailyIntro(sanitizedLines, memory)
    .join("\n")
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && !isDuplicateDailyIntroLine(part, memory));

  return paragraphs.map((paragraph, index) => ({
    title: index === 0 ? memory.title : `${memory.title} / ${index + 1}`,
    body: paragraph,
  }));
}

function extractTimeLabel(title: string, index: number) {
  const matched = title.match(/(\d{1,2}:\d{2}(?:\s?[AP]M)?)/i);
  if (matched) return matched[1].toUpperCase();
  return `${String(index + 1).padStart(2, "0")}`;
}

function buildDailyTimeline(memory: Memory): MemoryTimelineEntry[] {
  return splitMemoryIntoBlocks(memory)
    .map((block, index) => ({
      id: `${memory.id}-${index}`,
      timeLabel: block.timeLabel || extractTimeLabel(block.title, index),
      title: makeHeadline(block.title, block.body),
      summary: buildMemoryDigest(block.title, block.body),
    }))
    .filter((entry) => entry.summary.excerpt.trim().length > 0);
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

  const dailyMemories = filteredMemories
    .filter((memory) => memory.type === "daily")
    .sort((a, b) => b.date.localeCompare(a.date));
  const longTermMemories = filteredMemories
    .filter((memory) => memory.type === "long-term")
    .sort((a, b) => b.date.localeCompare(a.date));
  const evolutionMemories = filteredMemories
    .filter((memory) => memory.type === "evolution")
    .sort((a, b) => b.date.localeCompare(a.date));
  const dailyTimelineGroups = dailyMemories
    .reduce<Array<{ date: string; memories: Memory[]; entries: MemoryTimelineEntry[] }>>((groups, memory) => {
      const existingGroup = groups.find((group) => group.date === memory.date);
      const entries = buildDailyTimeline(memory);

      if (existingGroup) {
        existingGroup.memories.push(memory);
        existingGroup.entries.push(...entries);
      } else {
        groups.push({
          date: memory.date,
          memories: [memory],
          entries: [...entries],
        });
      }

      return groups;
    }, [])
    .sort((a, b) => b.date.localeCompare(a.date));
  const selectedMemory = selectedItem && "content" in selectedItem ? selectedItem : null;
  const selectedMemoryTimeline = selectedMemory ? buildDailyTimeline(selectedMemory) : [];
  const selectedMemoryDigest = selectedMemory ? buildMemoryDigest(selectedMemory.title, selectedMemory.content) : null;

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

  // Agent 状态类型（真实来源：OpenClaw cron）
  type AgentStatus = 'running' | 'ok' | 'error' | 'idle' | 'loading' | 'external';

  interface TeamAgent {
    id: string;
    name: string;
    role: string;
    icon: string;
    status: AgentStatus;
    lastActive: string;
    lastActiveAt?: string | null;
    currentTask: string;
    taskProgress: number;
    totalTasks: number;
    okTasks: number;
    errorTasks: number;
    runningTasks: number;
    isExternal?: boolean;
  }

  interface TeamAgentDefinition {
    id: string;
    name: string;
    role: string;
    icon: string;
    isExternal?: boolean;
  }

  interface AgentStatusApiAgent {
    id: string;
    status: 'running' | 'ok' | 'error' | 'idle';
    tasks: number;
    cronTasks?: number;
    manualTasks?: number;
    completedTasks: number;
    failedTasks: number;
    runningTasks: number;
    idleTasks: number;
    lastRun: string | null;
    lastActiveAt?: string | null;
    currentTask?: string | null;
  }

  interface AgentStatusApiResponse {
    source?: string;
    timestamp?: string;
    agents?: AgentStatusApiAgent[];
    activeSessions?: Array<{ agentId?: string; ageMs?: number; key?: string }>;
    activeCollaborations?: OfficeCollaboration[];
  }

  interface OfficeCollaboration {
    id: string;
    room: 'meeting-a' | 'meeting-b';
    roomName: string;
    agentIds: string[];
    label: string;
    lastUpdatedAt: string;
    sessionKeys: string[];
    detectedFrom?: string;
  }

  interface OfficeActivity {
    id: string;
    agentId: string;
    agentName: string;
    agentIcon: string;
    status: AgentStatus;
    message: string;
    timestamp: string;
  }

  const TEAM_AGENT_DEFINITIONS: TeamAgentDefinition[] = [
    { id: 'chief', name: 'Chief Agent', role: '主 Agent', icon: '👑' },
    { id: 'content', name: 'Content Agent', role: '内容创作', icon: '📝' },
    { id: 'growth', name: 'Growth Agent', role: '增长营销', icon: '📈' },
    { id: 'coding', name: 'Coding Agent', role: '技术开发', icon: '💻' },
    { id: 'product', name: 'Product Agent', role: '产品经理', icon: '🎯' },
    { id: 'finance', name: 'Finance Agent', role: '财务管理', icon: '💰' },
    { id: 'abby', name: '阿比', role: '个人生活助理', icon: '🤖', isExternal: true },
  ];

  function formatRelativeTime(value?: string | null) {
    if (!value) return '从未运行';

    const timestamp = new Date(value).getTime();
    if (Number.isNaN(timestamp)) return '时间未知';

    const diffMs = Date.now() - timestamp;
    if (diffMs < 60 * 1000) return '刚刚';

    const diffMinutes = Math.floor(diffMs / (60 * 1000));
    if (diffMinutes < 60) return `${diffMinutes}分钟前`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}小时前`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}天前`;
  }

  function buildCurrentTaskSummary(agent?: AgentStatusApiAgent) {
    if (!agent) return '暂无状态';
    if (agent.currentTask) return agent.currentTask;
    if (agent.tasks === 0) return '暂无绑定 cron 任务';
    if (agent.status === 'running') return `${agent.runningTasks} 个 cron 正在运行`;
    if (agent.status === 'error') return `${agent.failedTasks} 个 cron 异常`;
    if (agent.status === 'ok') return `${agent.completedTasks}/${agent.tasks} 个 cron 正常`;
    return `${agent.idleTasks || 0} 个 cron 等待执行`;
  }

  function buildOfficeActivityMessage(agent: TeamAgent) {
    if (agent.isExternal) {
      return '外部通道在线，负责个人生活与外部协作事项';
    }

    if (agent.status === 'running') {
      return `正在执行：${agent.currentTask}`;
    }

    if (agent.status === 'error') {
      return `需要处理：${agent.currentTask}`;
    }

    if (agent.status === 'ok') {
      return `执行正常：${agent.currentTask}`;
    }

    if (agent.status === 'idle') {
      return `待命中：${agent.currentTask}`;
    }

    return agent.currentTask;
  }

  function createOfficeActivity(agent: TeamAgent): OfficeActivity {
    return {
      id: `${agent.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      agentId: agent.id,
      agentName: agent.name,
      agentIcon: agent.icon,
      status: agent.status,
      message: buildOfficeActivityMessage(agent),
      timestamp: new Date().toISOString(),
    };
  }

  function createInitialTeamAgents(): TeamAgent[] {
    return TEAM_AGENT_DEFINITIONS.map((agent) => {
      if (agent.isExternal) {
        return {
          ...agent,
          status: 'external' as AgentStatus,
          lastActive: '外部系统',
          lastActiveAt: null,
          currentTask: '不受 OpenClaw cron 管理',
          taskProgress: 0,
          totalTasks: 0,
          okTasks: 0,
          errorTasks: 0,
          runningTasks: 0,
        };
      }

      return {
        ...agent,
        status: 'loading' as AgentStatus,
        lastActive: '同步中',
        lastActiveAt: null,
        currentTask: '正在读取 OpenClaw 实时状态',
        taskProgress: 0,
        totalTasks: 0,
        okTasks: 0,
        errorTasks: 0,
        runningTasks: 0,
      };
    });
  }

  const [teamAgents, setTeamAgents] = useState<TeamAgent[]>(createInitialTeamAgents);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [selectedOfficeAgentId, setSelectedOfficeAgentId] = useState('chief');
  const [activeCollaborations, setActiveCollaborations] = useState<OfficeCollaboration[]>([]);
  const [officeActivities, setOfficeActivities] = useState<OfficeActivity[]>([]);
  const [officeStatusSource, setOfficeStatusSource] = useState<string>('unknown');
  const officeActivitySnapshotRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    let cancelled = false;

    const refreshAgentStatus = async () => {
      try {
        const response = await fetch('/api/agent-status', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`status api failed: ${response.status}`);
        }

        const data = (await response.json()) as AgentStatusApiResponse;
        const apiAgents = ((data.agents || []) as AgentStatusApiAgent[]);
        const agentsById = new Map<string, AgentStatusApiAgent>(apiAgents.map((agent) => [agent.id, agent]));
        setOfficeStatusSource(data.source || 'unknown');

        // 获取活跃的 subagent 会话（仅信任 20 分钟窗口内的会话）
        const activeSessions = (data.activeSessions || []).filter((s) => (s.ageMs ?? Number.POSITIVE_INFINITY) <= 20 * 60 * 1000);
        const activeAgentIds = new Set(activeSessions.map((s: any) => s.agentId));
        const nextActiveCollaborations = ((data.activeCollaborations || []) as OfficeCollaboration[]).filter(
          (collaboration) => collaboration.agentIds.length >= 2
        );

        if (cancelled) return;

        setActiveCollaborations(nextActiveCollaborations);

        setTeamAgents(
          TEAM_AGENT_DEFINITIONS.map((agent) => {
            if (agent.isExternal) {
              return {
                ...agent,
                status: 'external' as AgentStatus,
                lastActive: '外部系统',
                lastActiveAt: null,
                currentTask: '不受 OpenClaw cron 管理',
                taskProgress: 0,
                totalTasks: 0,
                okTasks: 0,
                errorTasks: 0,
                runningTasks: 0,
              };
            }

            const realAgent = agentsById.get(agent.id);
            const totalTasks = realAgent?.tasks || 0;
            const okTasks = realAgent?.completedTasks || 0;
            const errorTasks = realAgent?.failedTasks || 0;
            const runningTasks = realAgent?.runningTasks || 0;
            const lastActiveAt = realAgent?.lastActiveAt || realAgent?.lastRun || null;
            
            // 如果有活跃的 subagent 会话，状态为 running
            const isSubAgentRunning = activeAgentIds.has(agent.id);
            const status = isSubAgentRunning ? 'running' : (realAgent?.status || 'idle');

            return {
              ...agent,
              status: status as AgentStatus,
              lastActive: formatRelativeTime(lastActiveAt),
              lastActiveAt,
              currentTask: isSubAgentRunning 
                ? `活跃会话: ${activeSessions.find((s: any) => s.agentId === agent.id)?.key?.split(':').pop() || '工作中'}`
                : buildCurrentTaskSummary(realAgent),
              taskProgress: totalTasks > 0 ? Math.round((okTasks / totalTasks) * 100) : 0,
              totalTasks,
              okTasks,
              errorTasks,
              runningTasks: isSubAgentRunning ? runningTasks + 1 : runningTasks,
            };
          })
        );
      } catch (error) {
        console.error('Failed to refresh agent status:', error);
        if (cancelled) return;

        setOfficeStatusSource('error');
        setActiveCollaborations([]);
        setTeamAgents(
          TEAM_AGENT_DEFINITIONS.map((agent) => {
            if (agent.isExternal) {
              return {
                ...agent,
                status: 'external' as AgentStatus,
                lastActive: '外部系统',
                lastActiveAt: null,
                currentTask: '不受 OpenClaw cron 管理',
                taskProgress: 0,
                totalTasks: 0,
                okTasks: 0,
                errorTasks: 0,
                runningTasks: 0,
              };
            }

            return {
              ...agent,
              status: 'loading' as AgentStatus,
              lastActive: '状态获取失败',
              lastActiveAt: null,
              currentTask: '无法连接 /api/agent-status',
              taskProgress: 0,
              totalTasks: 0,
              okTasks: 0,
              errorTasks: 0,
              runningTasks: 0,
            };
          })
        );
      } finally {
        if (!cancelled) {
          setIsLoadingAgents(false);
        }
      }
    };

    refreshAgentStatus();
    const intervalId = window.setInterval(refreshAgentStatus, 10_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (isLoadingAgents || teamAgents.length === 0) {
      return;
    }

    const nextSnapshot = new Map<string, string>();
    const changedActivities: OfficeActivity[] = [];

    teamAgents.forEach((agent) => {
      const signature = [
        agent.status,
        agent.currentTask,
        agent.runningTasks,
        agent.errorTasks,
        agent.okTasks,
        agent.totalTasks,
      ].join('|');

      nextSnapshot.set(agent.id, signature);

      const previousSignature = officeActivitySnapshotRef.current.get(agent.id);
      if (previousSignature && previousSignature !== signature) {
        changedActivities.push(createOfficeActivity(agent));
      }
    });

    officeActivitySnapshotRef.current = nextSnapshot;

    setOfficeActivities((previous) => {
      if (previous.length === 0) {
        return [...teamAgents]
          .sort((a, b) => {
            const priority = { running: 0, error: 1, ok: 2, idle: 3, loading: 4, external: 5 } as const;
            return priority[a.status] - priority[b.status];
          })
          .map((agent) => createOfficeActivity(agent))
          .slice(0, 12);
      }

      if (changedActivities.length === 0) {
        return previous;
      }

      return [...changedActivities.reverse(), ...previous].slice(0, 18);
    });
  }, [teamAgents, isLoadingAgents]);

  // 状态映射
  const statusMap: Record<AgentStatus, { label: string; color: string; bgColor: string; icon: string }> = {
    running: { label: 'working', color: 'text-green-300', bgColor: 'bg-green-500', icon: '🟢' },
    ok: { label: 'ready', color: 'text-emerald-300', bgColor: 'bg-emerald-500', icon: '🟢' },
    error: { label: 'error', color: 'text-red-400', bgColor: 'bg-red-500', icon: '🔴' },
    idle: { label: 'idle', color: 'text-yellow-300', bgColor: 'bg-yellow-500', icon: '🟡' },
    loading: { label: '同步中', color: 'text-purple-400', bgColor: 'bg-purple-500', icon: '🟣' },
    external: { label: 'external', color: 'text-slate-400', bgColor: 'bg-slate-500', icon: '⚪️' },
  };

  // 获取状态样式
  const getStatusStyle = (status: AgentStatus) => statusMap[status] || statusMap.loading;

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





  return (
    <AuthCheck>
      <div className="flex min-h-screen bg-[#0a0a0b]">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          dateRange={dateRange}
          setDateRange={setDateRange}
          getToday={getToday}
          getWeekStart={getWeekStart}
          getMonthStart={getMonthStart}
          stats={stats}
        />
        <main className="flex-1 overflow-y-auto">
          {searchQuery && (
            <div className="p-8 animate-fadeIn">
              <div className="mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                  <Search className="w-7 h-7 text-blue-400" />
                  搜索结果
                </h2>
                <p className="text-[#71717a]">关键词: "{searchQuery}"</p>
              </div>

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

              {searchedMemories.length === 0 && searchedDocuments.length === 0 && searchedTasks.length === 0 && (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-[#3f3f46] mx-auto mb-4" />
                  <p className="text-[#71717a]">未找到相关结果</p>
                </div>
              )}
            </div>
          )}

          {!searchQuery && activeTab === "home" && (
            <HomeView
              stats={stats}
              memories={memories}
              tasks={tasks}
              setActiveTab={setActiveTab}
              setSelectedItem={(item) => setSelectedItem(item)}
              getMemoryTypeIcon={getMemoryTypeIcon}
              getStatusIcon={getStatusIcon}
            />
          )}

          {!searchQuery && activeTab === "memories" && (
            <MemoriesView
              filteredMemories={filteredMemories}
              dailyTimelineGroups={dailyTimelineGroups}
              longTermMemories={longTermMemories}
              dailyMemories={dailyMemories}
              evolutionMemories={evolutionMemories}
              draftSearchQuery={draftSearchQuery}
              handleSearchInputChange={handleSearchInputChange}
              handleSearchKeyDown={handleSearchKeyDown}
              mergeMemorySummaryLines={mergeMemorySummaryLines}
              setSelectedItem={(item) => setSelectedItem(item)}
              buildMemoryDigest={buildMemoryDigest}
              selectedMemory={selectedMemory}
              selectedMemoryDigest={selectedMemoryDigest}
              selectedMemoryTimeline={selectedMemoryTimeline}
              getMemoryTypeIcon={getMemoryTypeIcon}
              toDisplayType={toDisplayType}
              formatMemoryDateLabel={formatMemoryDateLabel}
              formatMemoryDateMeta={formatMemoryDateMeta}
            />
          )}

          {!searchQuery && activeTab === "documents" && (
            <DocumentsView
              filteredDocuments={filteredDocuments}
              draftSearchQuery={draftSearchQuery}
              handleSearchInputChange={handleSearchInputChange}
              handleSearchKeyDown={handleSearchKeyDown}
              setSelectedItem={(item) => setSelectedItem(item)}
              selectedItem={selectedItem && "path" in selectedItem ? selectedItem : null}
              getDocumentTypeIcon={getDocumentTypeIcon}
              formatSize={formatSize}
            />
          )}

          {!searchQuery && activeTab === "tasks" && (
            <TasksView
              latestSupabaseSyncAt={latestSupabaseSyncAt}
              formatFullDateTime={formatFullDateTime}
              draftSearchQuery={draftSearchQuery}
              handleSearchInputChange={handleSearchInputChange}
              handleSearchKeyDown={handleSearchKeyDown}
              stats={stats}
              tasks={tasks}
              filteredTasks={filteredTasks}
              getStatusIcon={getStatusIcon}
              formatDateTime={formatDateTime}
            />
          )}

          {!searchQuery && activeTab === "agents" && (
            <AgentsView
              agentCards={agentCards}
              totalRangeTokens={totalRangeTokens}
              trendRange={trendRange}
              rangeTokenUsageByAgent={rangeTokenUsageByAgent}
              getStatusIcon={getStatusIcon}
              tokenTrendChart={renderTokenTrendChart()}
              tokenDistributionChart={renderTokenDistributionChart()}
            />
          )}

          {!searchQuery && activeTab === "team" && (
            <TeamView teamAgents={teamAgents} statusMap={statusMap} getStatusStyle={getStatusStyle} />
          )}

          {!searchQuery && activeTab === "office" && (
            <OfficeView
              teamAgents={teamAgents}
              isLoadingAgents={isLoadingAgents}
              selectedOfficeAgentId={selectedOfficeAgentId}
              setSelectedOfficeAgentId={setSelectedOfficeAgentId}
              activeCollaborations={activeCollaborations}
              officeActivities={officeActivities}
              officeStatusSource={officeStatusSource}
              statusMap={statusMap}
              getStatusStyle={getStatusStyle}
              formatRelativeTime={formatRelativeTime}
            />
          )}
          {!searchQuery && activeTab === "rd" && <RdMemosView />}
        </main>
      </div>
    </AuthCheck>
  );
}
