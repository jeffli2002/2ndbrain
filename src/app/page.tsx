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

  // Agent 状态类型（真实来源：OpenClaw cron）
  type AgentStatus = 'running' | 'ok' | 'error' | 'idle' | 'loading' | 'external';

  interface TeamAgent {
    id: string;
    name: string;
    role: string;
    icon: string;
    status: AgentStatus;
    lastActive: string;
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
    completedTasks: number;
    failedTasks: number;
    runningTasks: number;
    idleTasks: number;
    lastRun: string | null;
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
    if (!agent || agent.tasks === 0) return '暂无绑定 cron 任务';
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
  const [officeActivities, setOfficeActivities] = useState<OfficeActivity[]>([]);
  const officeActivitySnapshotRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    let cancelled = false;

    const refreshAgentStatus = async () => {
      try {
        const response = await fetch('/api/agent-status', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`status api failed: ${response.status}`);
        }

        const data = await response.json();
        const apiAgents = ((data.agents || []) as AgentStatusApiAgent[]);
        const agentsById = new Map<string, AgentStatusApiAgent>(apiAgents.map((agent) => [agent.id, agent]));
        
        // 获取活跃的 subagent 会话
        const activeSessions = data.activeSessions || [];
        const activeAgentIds = new Set(activeSessions.map((s: any) => s.agentId));

        if (cancelled) return;

        setTeamAgents(
          TEAM_AGENT_DEFINITIONS.map((agent) => {
            if (agent.isExternal) {
              return {
                ...agent,
                status: 'external' as AgentStatus,
                lastActive: '外部系统',
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
            
            // 如果有活跃的 subagent 会话，状态为 running
            const isSubAgentRunning = activeAgentIds.has(agent.id);
            const status = isSubAgentRunning ? 'running' : (realAgent?.status || 'idle');

            return {
              ...agent,
              status: status as AgentStatus,
              lastActive: formatRelativeTime(realAgent?.lastRun),
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

        setTeamAgents(
          TEAM_AGENT_DEFINITIONS.map((agent) => {
            if (agent.isExternal) {
              return {
                ...agent,
                status: 'external' as AgentStatus,
                lastActive: '外部系统',
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
            <div className="flex justify-between gap-2">
              <span className="text-[#71717a] shrink-0">状态摘要</span>
              <span className="text-[#a1a1aa] truncate max-w-[120px] text-right">{agent.currentTask}</span>
            </div>
          </div>

          {/* 悬停显示任务详情 */}
          <div className="absolute left-full top-0 ml-2 w-64 bg-[#1a1a1c] rounded-xl border border-[#27272a] p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
            <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
              {agent.isExternal ? '📋 外部 Agent' : '📋 OpenClaw 实时状态'}
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
                <p className="text-sm text-white">{agent.isExternal ? '不适用' : `${agent.runningTasks} 个`}</p>
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
  const renderOffice = () => {
    const svgWidth = 1280;
    const svgHeight = 760;

    const officeAgentThemes: Record<
      string,
      {
        surface: string;
        border: string;
        text: string;
        accent: string;
      }
    > = {
      chief: { surface: 'bg-violet-500/10', border: 'border-violet-400/30', text: 'text-violet-200', accent: '#8b5cf6' },
      content: { surface: 'bg-sky-500/10', border: 'border-sky-400/30', text: 'text-sky-200', accent: '#38bdf8' },
      growth: { surface: 'bg-emerald-500/10', border: 'border-emerald-400/30', text: 'text-emerald-200', accent: '#10b981' },
      coding: { surface: 'bg-cyan-500/10', border: 'border-cyan-400/30', text: 'text-cyan-200', accent: '#06b6d4' },
      product: { surface: 'bg-amber-500/10', border: 'border-amber-400/30', text: 'text-amber-200', accent: '#f59e0b' },
      finance: { surface: 'bg-lime-500/10', border: 'border-lime-400/30', text: 'text-lime-200', accent: '#84cc16' },
      abby: { surface: 'bg-rose-500/10', border: 'border-rose-400/30', text: 'text-rose-200', accent: '#f43f5e' },
    };

    type HairStyle = 'bun' | 'bob' | 'spiky' | 'side-part' | 'curly' | 'ponytail' | 'waves';
    type AvatarAccessory = 'tie' | 'scarf' | 'hoodie' | 'badge' | 'glasses' | 'apron' | 'headset';
    type OfficePose = 'desk' | 'walk' | 'sit' | 'reception' | 'stand';

    interface AvatarProfile {
      hairStyle: HairStyle;
      hairColor: string;
      outfit: string;
      secondary: string;
      accent: string;
      accessory: AvatarAccessory;
      label: string;
    }

    interface OfficePlacement {
      zone: string;
      x: number;
      y: number;
      pose: OfficePose;
      onDesk?: boolean;
    }

    interface DeskAnchor {
      ownerId: string;
      label: string;
      x: number;
      y: number;
    }

    interface SceneSpot {
      zone: string;
      x: number;
      y: number;
      pose: OfficePose;
    }

    const avatarProfiles: Record<string, AvatarProfile> = {
      chief: {
        hairStyle: 'bun',
        hairColor: '#312e81',
        outfit: '#7c3aed',
        secondary: '#a78bfa',
        accent: '#fbbf24',
        accessory: 'tie',
        label: 'Chief',
      },
      content: {
        hairStyle: 'bob',
        hairColor: '#082f49',
        outfit: '#0ea5e9',
        secondary: '#7dd3fc',
        accent: '#fda4af',
        accessory: 'scarf',
        label: 'Content',
      },
      growth: {
        hairStyle: 'waves',
        hairColor: '#14532d',
        outfit: '#10b981',
        secondary: '#6ee7b7',
        accent: '#fde68a',
        accessory: 'badge',
        label: 'Growth',
      },
      coding: {
        hairStyle: 'spiky',
        hairColor: '#083344',
        outfit: '#0891b2',
        secondary: '#67e8f9',
        accent: '#1e293b',
        accessory: 'hoodie',
        label: 'Coding',
      },
      product: {
        hairStyle: 'side-part',
        hairColor: '#78350f',
        outfit: '#f59e0b',
        secondary: '#fcd34d',
        accent: '#fb7185',
        accessory: 'glasses',
        label: 'Product',
      },
      finance: {
        hairStyle: 'ponytail',
        hairColor: '#365314',
        outfit: '#84cc16',
        secondary: '#bef264',
        accent: '#0f172a',
        accessory: 'headset',
        label: 'Finance',
      },
      abby: {
        hairStyle: 'curly',
        hairColor: '#4c0519',
        outfit: '#f43f5e',
        secondary: '#fda4af',
        accent: '#fde68a',
        accessory: 'apron',
        label: 'Abby',
      },
    };

    const deskAnchors: DeskAnchor[] = [
      { ownerId: 'chief', label: 'Desk A1', x: 780, y: 360 },
      { ownerId: 'content', label: 'Desk A2', x: 940, y: 360 },
      { ownerId: 'growth', label: 'Desk A3', x: 1100, y: 360 },
      { ownerId: 'coding', label: 'Desk B1', x: 780, y: 560 },
      { ownerId: 'product', label: 'Desk B2', x: 940, y: 560 },
      { ownerId: 'finance', label: 'Desk B3', x: 1100, y: 560 },
    ];

    const walkingSpots: SceneSpot[] = [
      { zone: 'Central Aisle · Walk Loop', x: 540, y: 360, pose: 'walk' },
      { zone: 'Central Aisle · Walk Loop', x: 600, y: 540, pose: 'walk' },
      { zone: 'Meeting Hall · Walk Loop', x: 720, y: 215, pose: 'walk' },
      { zone: 'Coffee Bar · Walk Loop', x: 365, y: 585, pose: 'walk' },
    ];

    const restingSpots: SceneSpot[] = [
      { zone: 'Break Area · Sofa Left', x: 155, y: 474, pose: 'sit' },
      { zone: 'Break Area · Sofa Center', x: 235, y: 474, pose: 'sit' },
      { zone: 'Break Area · Sofa Right', x: 315, y: 474, pose: 'sit' },
      { zone: 'Break Area · Lounge Chair', x: 410, y: 520, pose: 'sit' },
    ];

    const fallbackSpots: SceneSpot[] = [
      { zone: 'Collab Corner', x: 650, y: 250, pose: 'stand' },
      { zone: 'Printer Area', x: 180, y: 205, pose: 'stand' },
    ];

    const findOfficeAgent = (agentId: string) => teamAgents.find((agent) => agent.id === agentId);

    const getOfficeStatusColor = (status: AgentStatus) => {
      switch (status) {
        case 'running':
          return '#4ade80';
        case 'ok':
          return '#34d399';
        case 'error':
          return '#f87171';
        case 'idle':
          return '#fde047';
        case 'external':
          return '#cbd5e1';
        default:
          return '#c084fc';
      }
    };

    const relaxingAgents = teamAgents.filter(
      (agent) => !agent.isExternal && (agent.status === 'idle' || agent.status === 'ok')
    );
    const walkingTarget = Math.ceil(relaxingAgents.length / 2);
    const walkingAgentIds = new Set(relaxingAgents.slice(0, walkingTarget).map((agent) => agent.id));
    const restingAgentIds = new Set(relaxingAgents.slice(walkingTarget).map((agent) => agent.id));

    const officePlacementMap = new Map<string, OfficePlacement>();

    deskAnchors.forEach((anchor) => {
      const agent = findOfficeAgent(anchor.ownerId);
      if (!agent || agent.isExternal) return;
      if (walkingAgentIds.has(agent.id) || restingAgentIds.has(agent.id)) return;
      officePlacementMap.set(agent.id, {
        zone: `Open Workspace · ${anchor.label}`,
        x: anchor.x,
        y: anchor.y,
        pose: 'desk',
        onDesk: true,
      });
    });

    let walkingIndex = 0;
    let restingIndex = 0;
    let fallbackIndex = 0;

    teamAgents.forEach((agent) => {
      if (officePlacementMap.has(agent.id)) return;

      if (agent.id === 'abby') {
        officePlacementMap.set(agent.id, {
          zone: 'Reception · Front Desk',
          x: 255,
          y: 664,
          pose: 'reception',
        });
        return;
      }

      if (walkingAgentIds.has(agent.id)) {
        const spot = walkingSpots[walkingIndex % walkingSpots.length];
        walkingIndex += 1;
        officePlacementMap.set(agent.id, { ...spot });
        return;
      }

      if (restingAgentIds.has(agent.id)) {
        const spot = restingSpots[restingIndex % restingSpots.length];
        restingIndex += 1;
        officePlacementMap.set(agent.id, { ...spot });
        return;
      }

      const fallback = fallbackSpots[fallbackIndex % fallbackSpots.length];
      fallbackIndex += 1;
      officePlacementMap.set(agent.id, { ...fallback });
    });

    const renderZoneLabel = (x: number, y: number, title: string, subtitle: string) => (
      <g transform={`translate(${x} ${y})`}>
        <rect x={0} y={0} width={132} height={42} rx={18} fill="rgba(12,14,18,0.88)" stroke="rgba(255,255,255,0.08)" />
        <text x={14} y={16} fill="#e2e8f0" fontSize="10" letterSpacing="2.8" fontWeight="700">
          {title}
        </text>
        <text x={14} y={30} fill="#71717a" fontSize="11">
          {subtitle}
        </text>
      </g>
    );

    const renderRollingChair = (x: number, y: number, rotate = 0, accent = '#cbd5e1', scale = 1) => (
      <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
        <ellipse cx="0" cy="22" rx="26" ry="7" fill="rgba(0,0,0,0.2)" />
        <rect x="-16" y="-22" width="32" height="22" rx="10" fill={accent} opacity="0.95" />
        <rect x="-12" y="-48" width="24" height="28" rx="9" fill={accent} opacity="0.82" />
        <rect x="-3.5" y="0" width="7" height="18" rx="3.5" fill="rgba(226,232,240,0.7)" />
        <line x1="0" y1="18" x2="-18" y2="30" stroke="rgba(226,232,240,0.7)" strokeWidth="4" strokeLinecap="round" />
        <line x1="0" y1="18" x2="18" y2="30" stroke="rgba(226,232,240,0.7)" strokeWidth="4" strokeLinecap="round" />
        <line x1="0" y1="18" x2="0" y2="34" stroke="rgba(226,232,240,0.7)" strokeWidth="4" strokeLinecap="round" />
        <circle cx="-20" cy="31" r="4.5" fill="#0f172a" />
        <circle cx="20" cy="31" r="4.5" fill="#0f172a" />
        <circle cx="0" cy="35" r="4.5" fill="#0f172a" />
      </g>
    );

    const renderMeetingTable = (x: number, y: number, variant: 'small' | 'large') => {
      const width = variant === 'large' ? 248 : 176;
      const height = variant === 'large' ? 110 : 84;
      const chairOffsets =
        variant === 'large'
          ? [
              { x: -138, y: 0, r: -10 },
              { x: -78, y: -66, r: -30 },
              { x: 0, y: -86, r: 0 },
              { x: 78, y: -66, r: 30 },
              { x: 138, y: 0, r: 10 },
              { x: 0, y: 88, r: 180 },
            ]
          : [
              { x: -102, y: 0, r: -10 },
              { x: 0, y: -72, r: 0 },
              { x: 102, y: 0, r: 10 },
              { x: 0, y: 74, r: 180 },
            ];

      return (
        <g transform={`translate(${x} ${y})`}>
          <ellipse cx="0" cy="0" rx={width / 2 + 16} ry={height / 2 + 14} fill="rgba(0,0,0,0.14)" />
          {chairOffsets.map((chair, index) => (
            <g key={`${variant}-chair-${index}`} transform={`translate(${chair.x} ${chair.y}) rotate(${chair.r})`}>
              {renderRollingChair(0, 0, 0, '#dbeafe', variant === 'large' ? 0.72 : 0.62)}
            </g>
          ))}
          <ellipse cx="0" cy="8" rx={width / 2} ry={height / 2} fill="rgba(15,23,42,0.55)" />
          <ellipse cx="0" cy="0" rx={width / 2} ry={height / 2} fill="url(#meetingTableTop)" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
          <ellipse cx="0" cy="4" rx={width / 2 - 22} ry={height / 2 - 18} fill="rgba(255,255,255,0.05)" />
          <rect x="-10" y={height / 2 - 4} width="20" height="52" rx="10" fill="rgba(226,232,240,0.55)" />
          <ellipse cx="0" cy={height / 2 + 56} rx="66" ry="18" fill="rgba(148,163,184,0.38)" />
        </g>
      );
    };

    const renderSofa = () => (
      <g transform="translate(232 456)">
        <ellipse cx="0" cy="70" rx="150" ry="18" fill="rgba(0,0,0,0.18)" />
        <rect x="-118" y="-12" width="236" height="58" rx="24" fill="url(#sofaBase)" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
        <rect x="-128" y="-4" width="30" height="50" rx="14" fill="rgba(255,255,255,0.14)" />
        <rect x="98" y="-4" width="30" height="50" rx="14" fill="rgba(255,255,255,0.14)" />
        <rect x="-108" y="-50" width="216" height="44" rx="18" fill="rgba(255,255,255,0.1)" />
        <rect x="-103" y="2" width="64" height="30" rx="14" fill="rgba(255,255,255,0.08)" />
        <rect x="-30" y="2" width="60" height="30" rx="14" fill="rgba(255,255,255,0.08)" />
        <rect x="40" y="2" width="62" height="30" rx="14" fill="rgba(255,255,255,0.08)" />
      </g>
    );

    const renderCoffeeTable = () => (
      <g transform="translate(314 538)">
        <ellipse cx="0" cy="44" rx="60" ry="12" fill="rgba(0,0,0,0.16)" />
        <ellipse cx="0" cy="0" rx="72" ry="24" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
        <ellipse cx="0" cy="4" rx="60" ry="16" fill="rgba(255,255,255,0.05)" />
        <rect x="-6" y="12" width="12" height="28" rx="6" fill="rgba(226,232,240,0.55)" />
      </g>
    );

    const renderReceptionDesk = () => (
      <g transform="translate(238 666)">
        <ellipse cx="0" cy="40" rx="132" ry="16" fill="rgba(0,0,0,0.18)" />
        <path d="M -118 14 Q -96 -18 -20 -22 L 110 -16 Q 122 -14 122 -2 L 122 24 Q 122 38 104 40 L -104 40 Q -124 38 -124 22 Z" fill="url(#receptionDesk)" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
        <rect x="-60" y="-14" width="46" height="12" rx="6" fill="rgba(255,255,255,0.12)" />
        <rect x="0" y="-10" width="34" height="18" rx="6" fill="rgba(15,23,42,0.82)" />
      </g>
    );

    const renderPrinterArea = () => (
      <g>
        <g transform="translate(128 165)">
          <rect x="-58" y="-30" width="116" height="60" rx="18" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
          <rect x="-34" y="-42" width="56" height="24" rx="8" fill="rgba(15,23,42,0.88)" />
          <rect x="-28" y="-10" width="44" height="16" rx="6" fill="rgba(255,255,255,0.16)" />
          <rect x="-40" y="12" width="52" height="10" rx="5" fill="rgba(255,255,255,0.08)" />
        </g>
        <g transform="translate(222 148)">
          <rect x="-42" y="-24" width="84" height="108" rx="18" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
          <rect x="-22" y="0" width="44" height="12" rx="6" fill="rgba(250,204,21,0.16)" />
          <rect x="-22" y="24" width="44" height="12" rx="6" fill="rgba(56,189,248,0.18)" />
          <rect x="-22" y="48" width="44" height="12" rx="6" fill="rgba(196,181,253,0.2)" />
        </g>
      </g>
    );

    const renderHair = (profile: AvatarProfile, headY: number) => {
      switch (profile.hairStyle) {
        case 'bun':
          return (
            <g>
              <path d={`M -18 ${headY - 6} Q 0 ${headY - 26} 18 ${headY - 6} L 16 ${headY + 6} Q 0 ${headY - 2} -16 ${headY + 6} Z`} fill={profile.hairColor} />
              <circle cx="10" cy={headY - 18} r="6.5" fill={profile.hairColor} />
            </g>
          );
        case 'bob':
          return (
            <path d={`M -19 ${headY - 2} Q -14 ${headY - 24} 0 ${headY - 26} Q 16 ${headY - 24} 19 ${headY - 2} L 18 ${headY + 11} Q 0 ${headY + 18} -18 ${headY + 11} Z`} fill={profile.hairColor} />
          );
        case 'spiky':
          return (
            <polygon points={`-18,${headY - 3} -10,${headY - 25} -2,${headY - 12} 6,${headY - 28} 12,${headY - 10} 18,${headY - 4} 18,${headY + 8} -18,${headY + 8}`} fill={profile.hairColor} />
          );
        case 'side-part':
          return (
            <path d={`M -18 ${headY + 2} Q -12 ${headY - 24} 8 ${headY - 26} Q 20 ${headY - 22} 18 ${headY - 6} Q 7 ${headY - 12} -18 ${headY + 2} Z`} fill={profile.hairColor} />
          );
        case 'curly':
          return (
            <g fill={profile.hairColor}>
              <circle cx="-12" cy={headY - 10} r="8" />
              <circle cx="0" cy={headY - 18} r="10" />
              <circle cx="12" cy={headY - 10} r="8" />
              <circle cx="-6" cy={headY} r="9" />
              <circle cx="8" cy={headY + 2} r="8" />
            </g>
          );
        case 'ponytail':
          return (
            <g>
              <path d={`M -17 ${headY + 2} Q -12 ${headY - 24} 0 ${headY - 26} Q 15 ${headY - 24} 17 ${headY + 2} Z`} fill={profile.hairColor} />
              <path d={`M 14 ${headY - 6} Q 24 ${headY + 6} 12 ${headY + 16}`} fill="none" stroke={profile.hairColor} strokeWidth="8" strokeLinecap="round" />
            </g>
          );
        case 'waves':
          return (
            <path d={`M -19 ${headY - 1} Q -12 ${headY - 24} 0 ${headY - 24} Q 15 ${headY - 22} 19 ${headY - 2} Q 12 ${headY + 10} 4 ${headY + 12} Q -4 ${headY + 16} -19 ${headY + 8} Z`} fill={profile.hairColor} />
          );
        default:
          return null;
      }
    };

    const renderAccessory = (profile: AvatarProfile, bodyY: number) => {
      switch (profile.accessory) {
        case 'tie':
          return <path d={`M 0 ${bodyY + 6} L 4 ${bodyY + 16} L 0 ${bodyY + 31} L -4 ${bodyY + 16} Z`} fill={profile.accent} />;
        case 'scarf':
          return <path d={`M -14 ${bodyY + 8} Q 0 ${bodyY + 2} 14 ${bodyY + 8} L 10 ${bodyY + 12} Q 0 ${bodyY + 8} -10 ${bodyY + 12} Z`} fill={profile.accent} />;
        case 'hoodie':
          return <path d={`M -16 ${bodyY + 8} Q 0 ${bodyY - 8} 16 ${bodyY + 8}`} fill="none" stroke={profile.accent} strokeWidth="4" strokeLinecap="round" />;
        case 'badge':
          return <circle cx="10" cy={bodyY + 14} r="4" fill={profile.accent} />;
        case 'glasses':
          return (
            <g stroke="#1f2937" strokeWidth="2" fill="none">
              <circle cx="-7" cy="-40" r="5" />
              <circle cx="7" cy="-40" r="5" />
              <line x1="-2" y1="-40" x2="2" y2="-40" />
            </g>
          );
        case 'apron':
          return <rect x="-12" y={bodyY + 10} width="24" height="22" rx="8" fill={profile.accent} opacity="0.95" />;
        case 'headset':
          return (
            <g stroke={profile.accent} strokeWidth="2.5" fill="none" strokeLinecap="round">
              <path d="M -14 -40 Q 0 -54 14 -40" />
              <line x1="14" y1="-40" x2="14" y2="-31" />
              <circle cx="16" cy="-28" r="2" fill={profile.accent} stroke="none" />
            </g>
          );
        default:
          return null;
      }
    };

    const renderOfficeAvatar = (agent: TeamAgent, placement: OfficePlacement, scale = 1) => {
      const profile = avatarProfiles[agent.id] || avatarProfiles.chief;
      const theme = officeAgentThemes[agent.id] || officeAgentThemes.chief;
      const statusColor = getOfficeStatusColor(agent.status);
      const selected = selectedOfficeAgentId === agent.id;
      const seated = placement.pose === 'sit' || placement.pose === 'desk';
      const walking = placement.pose === 'walk';
      const bodyY = seated ? -14 : -20;
      const headY = seated ? -44 : -52;
      const animationClass =
        placement.pose === 'walk'
          ? 'office-anim-anchor animate-office-walk'
          : placement.pose === 'sit' || placement.pose === 'reception'
          ? 'office-anim-anchor animate-office-rest'
          : '';
      const chestLetter = (profile.label || agent.name).slice(0, 1).toUpperCase();

      return (
        <g
          transform={`translate(${placement.x} ${placement.y}) scale(${scale})`}
          className={animationClass}
          onClick={() => setSelectedOfficeAgentId(agent.id)}
          style={{ cursor: 'pointer' }}
        >
          {selected && <circle cx="0" cy="-18" r="38" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeDasharray="6 5" />}
          <ellipse cx="0" cy="16" rx="22" ry="7" fill="rgba(0,0,0,0.22)" />

          {renderHair(profile, headY)}
          <circle cx="0" cy={headY} r="14" fill="#fde7d3" />
          <circle cx="-5" cy={headY - 2} r="1.2" fill="#1f2937" />
          <circle cx="5" cy={headY - 2} r="1.2" fill="#1f2937" />
          <path d={`M -4 ${headY + 6} Q 0 ${headY + 9} 4 ${headY + 6}`} stroke="#b45309" strokeWidth="1.5" fill="none" strokeLinecap="round" />

          <rect x="-17" y={bodyY} width="34" height="36" rx="13" fill={profile.outfit} />
          <rect x="-17" y={bodyY + 18} width="34" height="10" rx="5" fill={profile.secondary} opacity="0.5" />
          {renderAccessory(profile, bodyY)}
          <text x="0" y={bodyY + 23} textAnchor="middle" fill="rgba(255,255,255,0.92)" fontSize="11" fontWeight="700">
            {chestLetter}
          </text>

          {seated ? (
            <g stroke="#1f2937" strokeWidth="4.5" strokeLinecap="round">
              <line x1="-8" y1={bodyY + 28} x2="-20" y2={bodyY + 18} />
              <line x1="8" y1={bodyY + 28} x2="20" y2={bodyY + 18} />
              <line x1="-20" y1={bodyY + 18} x2="-18" y2={bodyY + 34} />
              <line x1="20" y1={bodyY + 18} x2="18" y2={bodyY + 34} />
            </g>
          ) : walking ? (
            <g stroke="#1f2937" strokeWidth="4.5" strokeLinecap="round">
              <line x1="-12" y1={bodyY + 8} x2="-22" y2={bodyY + 20} />
              <line x1="12" y1={bodyY + 8} x2="24" y2={bodyY + 16} />
              <line x1="-6" y1={bodyY + 30} x2="-20" y2={bodyY + 48} />
              <line x1="6" y1={bodyY + 30} x2="18" y2={bodyY + 38} />
            </g>
          ) : (
            <g stroke="#1f2937" strokeWidth="4.5" strokeLinecap="round">
              <line x1="-14" y1={bodyY + 10} x2="-24" y2={bodyY + 22} />
              <line x1="14" y1={bodyY + 10} x2="24" y2={bodyY + 22} />
              <line x1="-6" y1={bodyY + 30} x2="-8" y2={bodyY + 48} />
              <line x1="6" y1={bodyY + 30} x2="8" y2={bodyY + 48} />
            </g>
          )}

          <circle cx="24" cy={headY - 8} r="5" fill={statusColor} stroke="rgba(255,255,255,0.9)" strokeWidth="2" />
          <g transform="translate(0 40)">
            <rect x="-30" y="0" width="60" height="16" rx="8" fill="rgba(15,23,42,0.82)" stroke={theme.accent} strokeWidth="1" />
            <text x="0" y="11" textAnchor="middle" fill="#f8fafc" fontSize="9.5" fontWeight="700">
              {profile.label}
            </text>
          </g>
        </g>
      );
    };

    const renderDeskUnit = (anchor: DeskAnchor) => {
      const owner = findOfficeAgent(anchor.ownerId);
      if (!owner) return null;

      const placement = officePlacementMap.get(anchor.ownerId);
      const theme = officeAgentThemes[anchor.ownerId] || officeAgentThemes.chief;
      const occupied = !!placement?.onDesk;
      const selected = selectedOfficeAgentId === anchor.ownerId;

      return (
        <g
          key={anchor.ownerId}
          transform={`translate(${anchor.x} ${anchor.y})`}
          onClick={() => setSelectedOfficeAgentId(anchor.ownerId)}
          style={{ cursor: 'pointer' }}
        >
          {selected && <rect x="-86" y="-94" width="172" height="152" rx="26" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="2.5" />}
          <ellipse cx="0" cy="58" rx="88" ry="18" fill="rgba(0,0,0,0.16)" />
          <rect x="-72" y="-34" width="144" height="18" rx="9" fill="rgba(148,163,184,0.48)" />
          <rect x="-76" y="-48" width="152" height="20" rx="10" fill="url(#deskTop)" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
          <rect x="-64" y="-46" width="128" height="10" rx="6" fill="rgba(255,255,255,0.06)" />
          <rect x="-58" y="-28" width="10" height="72" rx="5" fill="rgba(226,232,240,0.32)" />
          <rect x="48" y="-28" width="10" height="72" rx="5" fill="rgba(226,232,240,0.32)" />
          <rect x="-20" y="-88" width="40" height="28" rx="6" fill="rgba(15,23,42,0.88)" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
          <rect x="-8" y="-60" width="16" height="10" rx="4" fill="rgba(226,232,240,0.5)" />
          <rect x="-26" y="-16" width="52" height="6" rx="3" fill="rgba(226,232,240,0.45)" />
          {renderRollingChair(0, 28, 0, occupied ? '#93c5fd' : '#cbd5e1', 0.82)}

          <g transform="translate(-72 -84)">
            <rect x="0" y="0" width="46" height="16" rx="8" fill="rgba(15,23,42,0.76)" stroke={theme.accent} strokeWidth="1" />
            <text x="23" y="11" textAnchor="middle" fill="#f8fafc" fontSize="9" fontWeight="700">
              {anchor.label}
            </text>
          </g>

          {!occupied && (
            <g transform="translate(0 2)">
              <rect x="-24" y="-10" width="48" height="20" rx="10" fill="rgba(15,23,42,0.84)" stroke={theme.accent} strokeWidth="1" />
              <text x="0" y="4" textAnchor="middle" fill="#e2e8f0" fontSize="9.5" fontWeight="700">
                Away
              </text>
            </g>
          )}

          {occupied && placement && renderOfficeAvatar(owner, placement, 0.92)}
        </g>
      );
    };

    const selectedOfficeAgent = teamAgents.find((agent) => agent.id === selectedOfficeAgentId) ?? teamAgents[0];
    const selectedPlacement = officePlacementMap.get(selectedOfficeAgent?.id || 'chief');
    const selectedTheme = officeAgentThemes[selectedOfficeAgent?.id || 'chief'] || officeAgentThemes.chief;
    const selectedOfficeStatusStyle = selectedOfficeAgent ? getStatusStyle(selectedOfficeAgent.status) : statusMap.loading;

    const seatedDeskCount = Array.from(officePlacementMap.values()).filter((placement) => placement.onDesk).length;
    const walkingCount = Array.from(officePlacementMap.values()).filter((placement) => placement.pose === 'walk').length;
    const restingCount = Array.from(officePlacementMap.values()).filter((placement) => placement.pose === 'sit').length;
    const errorCount = teamAgents.filter((agent) => !agent.isExternal && agent.status === 'error').length;

    const presenceCards = teamAgents.map((agent) => ({
      agent,
      placement: officePlacementMap.get(agent.id),
    }));

    return (
      <div className="p-6 lg:p-8 pb-12 animate-fadeIn">
        <div className="flex flex-col gap-4 mb-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
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
            <p className="text-sm text-[#71717a] mt-2 max-w-4xl leading-6">
              Office 视图现在改成单列全宽：删除右侧 Selected Agent 面板，把办公室主画布拉满。空闲中的 Agent 会自动分流——一半在中央过道走动，一半在休息区落座。
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <div className="px-3 py-2 rounded-xl border border-[#27272a] bg-[#141416] text-[#a1a1aa]">Full Width Canvas</div>
            <div className="px-3 py-2 rounded-xl border border-[#27272a] bg-[#141416] text-[#a1a1aa]">SVG Furniture + Cartoon Agents</div>
            <div className="px-3 py-2 rounded-xl border border-green-500/20 bg-green-500/10 text-green-200">{walkingCount} walking · {restingCount} resting</div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-[#27272a] bg-[#101012] p-4 sm:p-5 shadow-[0_24px_60px_rgba(0,0,0,0.32)]">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-semibold text-white">SVG Office Overview</h3>
                <p className="text-xs text-[#71717a] mt-1 leading-5">
                  用 SVG 重画了真实桌子、椭圆会议桌、三人沙发、茶几、带轮办公椅和差异化人物形象；点击人物或工位即可查看详情。
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#71717a]">
                <span className={`w-2 h-2 rounded-full ${isLoadingAgents ? 'bg-purple-500' : 'bg-green-500'} ${isLoadingAgents ? '' : 'animate-pulse'}`}></span>
                <span>{isLoadingAgents ? '同步中' : '10 秒轮询更新'}</span>
              </div>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-[#1f1f22] bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.07),transparent_26%),linear-gradient(180deg,#0b0b0d_0%,#111216_100%)]">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto block">
                <defs>
                  <linearGradient id="deskTop" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#1f2937" />
                    <stop offset="100%" stopColor="#475569" />
                  </linearGradient>
                  <linearGradient id="meetingTableTop" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#475569" />
                    <stop offset="100%" stopColor="#1e293b" />
                  </linearGradient>
                  <linearGradient id="sofaBase" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#334155" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>
                  <linearGradient id="receptionDesk" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#334155" />
                  </linearGradient>
                </defs>

                <rect x="24" y="24" width="1232" height="712" rx="34" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" />
                <path d="M 506 120 L 640 120 L 640 642 L 506 642 Q 470 642 470 606 L 470 156 Q 470 120 506 120 Z" fill="rgba(255,255,255,0.018)" stroke="rgba(255,255,255,0.06)" strokeDasharray="10 12" />
                <path d="M 82 82 H 432 V 270 H 82 Z" fill="rgba(255,255,255,0.018)" stroke="rgba(255,255,255,0.05)" />
                <path d="M 710 82 H 1196 V 286 H 710 Z" fill="rgba(255,255,255,0.018)" stroke="rgba(255,255,255,0.05)" />

                {renderZoneLabel(78, 68, 'PRINT / STORAGE', '打印与储物')}
                {renderZoneLabel(462, 64, 'MEETING B', '小型讨论')}
                {renderZoneLabel(858, 64, 'MEETING A', '评审与会议')}
                {renderZoneLabel(112, 350, 'BREAK AREA', '沙发与咖啡')}
                {renderZoneLabel(486, 650, 'CENTRAL AISLE', '走动留白')}
                {renderZoneLabel(824, 294, 'OPEN WORKSPACE', '工作工位')}
                {renderZoneLabel(104, 622, 'RECEPTION', 'Abby 前台')}
                {renderZoneLabel(1108, 610, 'WC', '洗手间')}
                {renderZoneLabel(70, 606, 'ENTRANCE', '访客入口')}

                {renderPrinterArea()}
                {renderMeetingTable(555, 190, 'small')}
                {renderMeetingTable(936, 188, 'large')}
                {renderSofa()}
                {renderCoffeeTable()}
                {renderRollingChair(418, 524, -24, '#e2e8f0', 0.95)}
                <text x="430" y="474" fill="#fef3c7" fontSize="22">☕</text>
                <text x="378" y="424" fill="#86efac" fontSize="26">🌿</text>
                {renderReceptionDesk()}
                <path d="M 82 666 h 86" stroke="rgba(250,204,21,0.7)" strokeWidth="4" strokeLinecap="round" strokeDasharray="6 8" />
                <path d="M 164 656 l 18 10 l -18 10" fill="none" stroke="rgba(250,204,21,0.7)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="1110" y="612" width="92" height="118" rx="24" fill="rgba(255,255,255,0.045)" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
                <rect x="1134" y="628" width="44" height="30" rx="12" fill="rgba(255,255,255,0.08)" />
                <ellipse cx="1156" cy="643" rx="16" ry="8" fill="#020617" />
                <rect x="1128" y="678" width="56" height="26" rx="12" fill="rgba(255,255,255,0.06)" />

                {deskAnchors.map((anchor) => renderDeskUnit(anchor))}

                {presenceCards
                  .filter(({ placement }) => placement && !placement.onDesk)
                  .map(({ agent, placement }) =>
                    placement ? <g key={`${agent.id}-presence`}>{renderOfficeAvatar(agent, placement, agent.id === 'abby' ? 1.06 : 1)}</g> : null
                  )}
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-[#27272a] bg-[#141416] p-4">
              <p className="text-xs text-[#71717a] mb-2">工位占用</p>
              <p className="text-2xl font-semibold text-white">{seatedDeskCount}/6</p>
              <p className="text-xs text-[#a1a1aa] mt-2">running / error / loading 的 Agent 会回到工位前。</p>
            </div>
            <div className="rounded-2xl border border-[#27272a] bg-[#141416] p-4">
              <p className="text-xs text-[#71717a] mb-2">闲置走动</p>
              <p className="text-2xl font-semibold text-white">{walkingCount}</p>
              <p className="text-xs text-[#a1a1aa] mt-2">空闲中的一半 Agent 在中央过道做 walk 动画。</p>
            </div>
            <div className="rounded-2xl border border-[#27272a] bg-[#141416] p-4">
              <p className="text-xs text-[#71717a] mb-2">休息区落座</p>
              <p className="text-2xl font-semibold text-white">{restingCount}</p>
              <p className="text-xs text-[#a1a1aa] mt-2">另一半 Agent 会坐在沙发或休息椅上做轻微休息动画。</p>
            </div>
            <div className="rounded-2xl border border-[#27272a] bg-[#141416] p-4">
              <p className="text-xs text-[#71717a] mb-2">异常处理</p>
              <p className="text-2xl font-semibold text-red-300">{errorCount}</p>
              <p className="text-xs text-[#a1a1aa] mt-2">红灯代表正在处理错误或阻塞任务。</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6 items-start">
            <div className={`rounded-3xl border overflow-hidden ${selectedTheme.border} bg-[#141416] shadow-[0_24px_60px_rgba(0,0,0,0.32)]`}>
              <div className="p-5 border-b border-[#27272a]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#71717a]">Selected Agent</p>
                    <h3 className="text-lg font-semibold text-white mt-2">{selectedOfficeAgent?.name || 'Agent'}</h3>
                    <p className="text-xs text-[#a1a1aa] mt-1">{selectedPlacement?.zone || 'Office floor'}</p>
                  </div>
                  <div className="shrink-0 rounded-2xl border border-white/10 bg-[#101012] px-3 py-2">
                    <div className={`text-xs ${selectedOfficeStatusStyle.color}`}>{selectedOfficeStatusStyle.icon} {selectedOfficeStatusStyle.label}</div>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="rounded-2xl border border-[#27272a] bg-[#101012] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#71717a] mb-2">Current Task</p>
                  <p className="text-sm text-[#e4e4e7] leading-6">{selectedOfficeAgent?.currentTask || '暂无任务信息'}</p>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4"><span className="text-[#71717a]">角色</span><span className="text-[#e4e4e7] text-right">{selectedOfficeAgent?.role || '-'}</span></div>
                  <div className="flex items-center justify-between gap-4"><span className="text-[#71717a]">最后活跃</span><span className="text-[#e4e4e7] text-right">{selectedOfficeAgent?.lastActive || '-'}</span></div>
                  <div className="flex items-center justify-between gap-4"><span className="text-[#71717a]">当前区域</span><span className="text-[#e4e4e7] text-right max-w-[58%]">{selectedPlacement?.zone || 'Office floor'}</span></div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl border border-[#27272a] bg-[#101012] p-3">
                    <div className="text-lg font-semibold text-white">{selectedOfficeAgent?.totalTasks || 0}</div>
                    <div className="text-[11px] text-[#71717a] mt-1">任务数</div>
                  </div>
                  <div className="rounded-2xl border border-[#27272a] bg-[#101012] p-3">
                    <div className="text-lg font-semibold text-green-300">{selectedOfficeAgent?.runningTasks || 0}</div>
                    <div className="text-[11px] text-[#71717a] mt-1">运行中</div>
                  </div>
                  <div className="rounded-2xl border border-[#27272a] bg-[#101012] p-3">
                    <div className="text-lg font-semibold text-red-300">{selectedOfficeAgent?.errorTasks || 0}</div>
                    <div className="text-[11px] text-[#71717a] mt-1">异常</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#27272a] bg-[#141416] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
              <div className="p-5 border-b border-[#27272a] flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">Live Activities</h3>
                  <p className="text-xs text-[#71717a] mt-1">根据状态变化自动生成，保留最近 18 条。</p>
                </div>
                <div className="text-right text-xs text-[#71717a]">
                  <div>{isLoadingAgents ? '同步中' : 'Auto Refresh'}</div>
                  <div className="mt-1">10 sec</div>
                </div>
              </div>

              <div className="max-h-[420px] overflow-auto divide-y divide-[#27272a]">
                {officeActivities.map((activity) => {
                  const activityStatusStyle = getStatusStyle(activity.status);
                  const activityTheme = officeAgentThemes[activity.agentId] || officeAgentThemes.chief;
                  return (
                    <div key={activity.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 shrink-0 rounded-2xl border flex items-center justify-center text-xl ${activityTheme.border} ${activityTheme.surface}`}>
                          {activity.agentIcon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-white truncate">{activity.agentName}</p>
                            <span className={`text-[11px] ${activityStatusStyle.color}`}>{formatRelativeTime(activity.timestamp)}</span>
                          </div>
                          <p className="text-sm text-[#cbd5e1] leading-6 mt-1">{activity.message}</p>
                          <div className="mt-2 flex items-center gap-2 text-[11px] text-[#71717a]">
                            <span>{activityStatusStyle.icon}</span>
                            <span>{activityStatusStyle.label}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-4 mb-3">
              <h3 className="text-lg font-semibold text-white">Agent Roster</h3>
              <p className="text-xs text-[#71717a]">列表已改成全宽，不再被右侧详情面板挤压。</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
              {presenceCards.map(({ agent, placement }) => {
                const theme = officeAgentThemes[agent.id] || officeAgentThemes.chief;
                const statusStyle = getStatusStyle(agent.status);
                const isSelected = selectedOfficeAgentId === agent.id;
                return (
                  <button
                    key={`presence-card-${agent.id}`}
                    type="button"
                    onClick={() => setSelectedOfficeAgentId(agent.id)}
                    className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                      isSelected ? `${theme.surface} ${theme.border} ring-2 ring-white/15` : 'border-[#27272a] bg-[#141416] hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{agent.icon}</span>
                          <p className="text-sm font-medium text-white truncate">{agent.name}</p>
                        </div>
                        <p className="text-[11px] text-[#71717a] mt-2 truncate">{placement?.zone || agent.role}</p>
                      </div>
                      <span className={`text-[11px] shrink-0 ${statusStyle.color}`}>{statusStyle.icon} {statusStyle.label}</span>
                    </div>
                    <p className="text-[11px] text-[#a1a1aa] mt-3 line-clamp-2">{agent.currentTask}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };


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
      <div className="mb-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Brain className="w-8 h-8 text-purple-400" />
              Memory Journal
            </h2>
            <p className="text-sm text-[#a1a1aa] mt-2 max-w-3xl">
              把长期记忆与 Daily Memory 分开管理：左侧是按天整合的 journal timeline，右侧保留长期原则与演化沉淀。
            </p>
          </div>
          <div className="text-sm text-[#71717a] lg:text-right">
            <p>共 {filteredMemories.length} 条记忆</p>
            <p>最近更新：{dailyTimelineGroups[0]?.date ? formatMemoryDateMeta(dailyTimelineGroups[0].date) : "—"}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <div className="bg-[#141416] border border-[#27272a] rounded-2xl p-4 xl:col-span-2">
          <p className="text-xs uppercase tracking-[0.2em] text-[#71717a] mb-2">Overview</p>
          <p className="text-3xl font-semibold text-white">{filteredMemories.length}</p>
          <p className="text-sm text-[#a1a1aa] mt-1">Memory records in current view</p>
        </div>
        <div className="bg-[#141416] border border-[#27272a] rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-purple-300 mb-2">Long</p>
          <p className="text-2xl font-semibold text-white">{longTermMemories.length}</p>
          <p className="text-xs text-[#71717a] mt-1">长期原则 / 规范</p>
        </div>
        <div className="bg-[#141416] border border-[#27272a] rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-blue-300 mb-2">Daily</p>
          <p className="text-2xl font-semibold text-white">{dailyMemories.length}</p>
          <p className="text-xs text-[#71717a] mt-1">按天沉淀的工作日志</p>
        </div>
        <div className="bg-[#141416] border border-[#27272a] rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300 mb-2">Evolution</p>
          <p className="text-2xl font-semibold text-white">{evolutionMemories.length}</p>
          <p className="text-xs text-[#71717a] mt-1">进化与经验回收</p>
        </div>
        <div className="bg-gradient-to-br from-[#171725] to-[#111118] border border-[#2a2a38] rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-yellow-200 mb-2">Timeline</p>
          <p className="text-lg font-semibold text-white">One Day · One Container</p>
          <p className="text-xs text-[#a1a1aa] mt-1">同一天内容合并进一个可滚动的日记容器</p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a1a1aa]" />
        <input
          type="text"
          placeholder="搜索记忆（按回车执行）..."
          value={draftSearchQuery}
          onChange={(e) => handleSearchInputChange(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="w-full bg-[#141416] border border-[#27272a] rounded-2xl pl-12 pr-4 py-3 text-white placeholder-[#a1a1aa] focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.7fr)_380px] gap-6">
        <div className="space-y-6">
          <div className="bg-[#141416] border border-[#27272a] rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-blue-300 mb-2">Daily Memory</p>
                <h3 className="text-xl font-semibold text-white">Journal Timeline</h3>
              </div>
              <div className="text-xs text-[#71717a]">Grouped by date</div>
            </div>

            {!dailyTimelineGroups.length ? (
              <div className="rounded-2xl border border-dashed border-[#3a3a3f] px-6 py-12 text-center text-[#71717a]">
                当前筛选范围内没有 daily memory。
              </div>
            ) : (
              <div className="space-y-8">
                {dailyTimelineGroups.map((group) => (
                  <section key={group.date} id={`memory-day-${group.date}`} className="rounded-[28px] border border-[#27272a] bg-[#111114] overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#222228] bg-[#101014] px-5 py-4">
                      <div>
                        <p className="text-lg font-semibold text-white">{formatMemoryDateLabel(group.date)}</p>
                        <p className="text-xs text-[#71717a] mt-1">{formatMemoryDateMeta(group.date)} · {group.memories.length} memories · {group.entries.length} timeline points</p>
                      </div>
                    </div>

                    <div className="max-h-[860px] overflow-y-auto">
                      <div className="relative">
                        <div className="absolute left-6 top-6 bottom-6 w-px bg-gradient-to-b from-blue-500/60 via-purple-500/25 to-transparent" />
                        {group.entries.map((entry, index) => {
                          const mergedLines = mergeMemorySummaryLines(entry.summary);
                          const summaryLine = mergedLines[0] || entry.summary.excerpt || entry.title;
                          const detailLines = mergedLines.slice(1);
                          return (
                            <div
                              key={entry.id}
                              className={`relative pl-12 pr-5 py-5 ${index !== group.entries.length - 1 ? "border-b border-[#222228]" : ""}`}
                            >
                              <div className="absolute left-[19px] top-7 w-4 h-4 rounded-full border-4 border-[#111114] bg-blue-400 shadow-[0_0_0_4px_rgba(96,165,250,0.14)]" />
                              <div className="min-w-0">
                                <div className="flex items-start gap-3 md:gap-4">
                                  <div className="w-14 md:w-16 shrink-0 pt-0.5">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#71717a]">{entry.timeLabel}</p>
                                  </div>
                                  <div className="min-w-0 flex-1 pt-0.5">
                                    <p className="text-sm leading-6 text-[#d4d4d8]">
                                      <span className="font-semibold text-white">{summaryLine}</span>
                                    </p>
                                  </div>
                                </div>

                                {detailLines.length ? (
                                  <div className="ml-[3.5rem] md:ml-20 mt-2 space-y-2 text-sm leading-7 text-[#cbd5e1]">
                                    {detailLines.map((item) => (
                                      <p key={item}>{item}</p>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border-t border-[#222228] bg-[#101014] px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] uppercase tracking-[0.22em] text-[#71717a] mr-2">Source memories</span>
                        {group.memories.map((memory) => (
                          <button
                            key={memory.id}
                            onClick={() => setSelectedItem(memory)}
                            className="rounded-full border border-[#31313a] bg-[#18181c] px-3 py-1.5 text-xs text-[#d4d4d8] hover:border-blue-500/40 hover:text-white transition-colors"
                          >
                            {memory.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 self-start">
          <div className="bg-[#141416] border border-[#27272a] rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-purple-300 mb-2">Long Memory</p>
                <h3 className="text-lg font-semibold text-white">Durable Knowledge</h3>
              </div>
              <span className="text-xs text-[#71717a]">{longTermMemories.length} items</span>
            </div>
            <div className="space-y-3">
              {longTermMemories.length ? longTermMemories.map((memory) => {
                const digest = buildMemoryDigest(memory.title, memory.content);
                return (
                  <button
                    key={memory.id}
                    onClick={() => setSelectedItem(memory)}
                    className="w-full text-left rounded-2xl border border-[#27272a] bg-[#101014] p-4 hover:border-purple-500/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 text-white font-medium">
                        <Brain className="w-4 h-4 text-purple-400" />
                        <span>{digest.headline}</span>
                      </div>
                      <span className="text-[11px] text-[#71717a] whitespace-nowrap">{memory.date}</span>
                    </div>
                    <p className="text-sm text-[#a1a1aa] leading-relaxed">{digest.excerpt || memory.content.slice(0, 140)}</p>
                  </button>
                );
              }) : (
                <p className="text-sm text-[#71717a]">当前筛选下没有长期记忆。</p>
              )}
            </div>
          </div>

          <div className="bg-[#141416] border border-[#27272a] rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-emerald-300 mb-2">Evolution</p>
                <h3 className="text-lg font-semibold text-white">Signals & Learnings</h3>
              </div>
              <span className="text-xs text-[#71717a]">{evolutionMemories.length} items</span>
            </div>
            <div className="space-y-3">
              {evolutionMemories.length ? evolutionMemories.slice(0, 6).map((memory) => {
                const digest = buildMemoryDigest(memory.title, memory.content);
                return (
                  <button
                    key={memory.id}
                    onClick={() => setSelectedItem(memory)}
                    className="w-full text-left rounded-2xl border border-[#27272a] bg-[#101014] p-4 hover:border-emerald-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="text-sm font-medium text-white">{digest.headline}</span>
                      <span className="text-[11px] text-[#71717a]">{memory.date}</span>
                    </div>
                    <p className="text-sm text-[#a1a1aa]">{digest.excerpt || memory.content.slice(0, 120)}</p>
                  </button>
                );
              }) : (
                <p className="text-sm text-[#71717a]">暂无 evolution 记录。</p>
              )}
            </div>
          </div>

          <div className="bg-[#141416] border border-[#27272a] rounded-3xl p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-blue-300 mb-2">Daily Index</p>
            <h3 className="text-lg font-semibold text-white mb-4">Recent Journal Days</h3>
            <div className="space-y-2">
              {dailyTimelineGroups.slice(0, 8).map((group) => (
                <a
                  key={group.date}
                  href={`#memory-day-${group.date}`}
                  className="flex items-center justify-between rounded-2xl border border-[#27272a] bg-[#101014] px-4 py-3 hover:border-blue-500/40 transition-colors"
                >
                  <div>
                    <p className="text-sm text-white">{formatMemoryDateLabel(group.date)}</p>
                    <p className="text-xs text-[#71717a]">{group.memories.length} memories · {group.entries.length} points</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#71717a]" />
                </a>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {selectedMemory && selectedMemoryDigest && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[#141416] rounded-3xl border border-[#27272a] max-w-4xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 z-20 flex justify-end p-4 bg-gradient-to-b from-[#141416] via-[#141416]/95 to-transparent backdrop-blur-sm">
              <button
                onClick={() => setSelectedItem(null)}
                className="w-10 h-10 rounded-full border border-[#34343b] bg-[#0f0f10]/95 text-[#d4d4d8] hover:text-white hover:border-white/30 transition-colors shadow-lg"
              >
                ✕
              </button>
            </div>

            <div className="px-6 pb-6 space-y-6 -mt-3">
              <div className="pb-6 border-b border-[#27272a] pr-12">
                <div className="flex items-center gap-3 mb-3">
                  {getMemoryTypeIcon(selectedMemory.type)}
                  <span className="text-xs uppercase tracking-[0.22em] text-[#71717a]">{toDisplayType(selectedMemory.type)}</span>
                </div>
                <h3 className="text-2xl font-bold text-white">{selectedMemory.title}</h3>
                <p className="text-sm text-[#71717a] mt-2">{formatMemoryDateLabel(selectedMemory.date)} · {formatMemoryDateMeta(selectedMemory.date)}</p>
              </div>

              <div className="rounded-3xl border border-[#27272a] bg-[#101014] p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-[#71717a] mb-2">Summary</p>
                <h4 className="text-xl font-semibold text-white">{selectedMemoryDigest.headline}</h4>
                <p className="text-sm text-[#a1a1aa] mt-2 leading-relaxed">{selectedMemoryDigest.excerpt || selectedMemory.content.slice(0, 180)}</p>
              </div>

              <div className="rounded-3xl border border-[#27272a] bg-[#101014] p-5 text-sm leading-7 text-[#e5e7eb]">
                <div className="space-y-1.5">
                  {mergeMemorySummaryLines(selectedMemoryDigest).length ? (
                    mergeMemorySummaryLines(selectedMemoryDigest).map((item) => <p key={item}>• {item}</p>)
                  ) : (
                    <p className="text-[#8a8a93]">暂无可展示摘要。</p>
                  )}
                </div>
              </div>

              {selectedMemory.type === "daily" && selectedMemoryTimeline.length > 1 && (
                <div className="rounded-3xl border border-[#27272a] bg-[#101014] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-white">Timeline Breakdown</h4>
                    <span className="text-xs text-[#71717a]">{selectedMemoryTimeline.length} summary blocks</span>
                  </div>
                  <div className="space-y-4">
                    {selectedMemoryTimeline.map((entry) => (
                      <div key={entry.id} className="rounded-2xl border border-[#27272a] bg-[#141416] p-4">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <h5 className="font-medium text-white">{entry.title}</h5>
                          <span className="text-xs uppercase tracking-[0.22em] text-[#71717a]">{entry.timeLabel}</span>
                        </div>
                        <p className="text-sm text-[#a1a1aa] leading-relaxed">{entry.summary.excerpt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-3xl border border-[#27272a] bg-[#101014] p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-[#71717a] mb-3">Raw Content</p>
                <pre className="text-[#d4d4d8] whitespace-pre-wrap font-sans text-sm leading-relaxed">{selectedMemory.content}</pre>
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
