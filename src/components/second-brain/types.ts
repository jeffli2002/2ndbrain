export type MemoryType = "long-term" | "daily" | "evolution";

export interface Memory {
  id: string;
  title: string;
  content: string;
  date: string;
  type: MemoryType;
}

export interface Document {
  id: string;
  title: string;
  path: string;
  type: string;
  date: string;
  size: number;
}

export interface Task {
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

export interface TokenTrendPoint {
  date: string;
  totalTokens: number;
  taskBreakdown: Record<string, number>;
}

export interface TokenTrendRangePoint extends TokenTrendPoint {
  agentBreakdown: Record<string, number>;
}

export type MemorySectionKey = "what" | "decisions" | "insights";

export interface MemoryDigest {
  headline: string;
  what: string[];
  decisions: string[];
  insights: string[];
  excerpt: string;
}

export interface MemoryTimelineEntry {
  id: string;
  timeLabel: string;
  title: string;
  summary: MemoryDigest;
}

export type TabType = "home" | "memories" | "documents" | "tasks" | "agents" | "team" | "office";

export type AgentStatus = "running" | "ok" | "error" | "idle" | "loading" | "external";

export interface TeamAgent {
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

export interface OfficeActivity {
  id: string;
  agentId: string;
  agentName: string;
  agentIcon: string;
  status: AgentStatus;
  message: string;
  timestamp: string;
}

export interface StatusStyle {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}
