import { Brain, Search, ChevronRight } from "lucide-react";
import type { Memory, MemoryDigest, MemoryTimelineEntry } from "./types";

interface DailyTimelineGroup {
  date: string;
  memories: Memory[];
  entries: MemoryTimelineEntry[];
}

interface MemoriesViewProps {
  filteredMemories: Memory[];
  dailyTimelineGroups: DailyTimelineGroup[];
  longTermMemories: Memory[];
  dailyMemories: Memory[];
  evolutionMemories: Memory[];
  draftSearchQuery: string;
  handleSearchInputChange: (value: string) => void;
  handleSearchKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  mergeMemorySummaryLines: (summary: MemoryDigest) => string[];
  setSelectedItem: (item: Memory | null) => void;
  buildMemoryDigest: (rawTitle: string, content: string) => MemoryDigest;
  selectedMemory: Memory | null;
  selectedMemoryDigest: MemoryDigest | null;
  selectedMemoryTimeline: MemoryTimelineEntry[];
  getMemoryTypeIcon: (type: Memory["type"]) => React.ReactNode;
  toDisplayType: (type: Memory["type"]) => string;
  formatMemoryDateLabel: (date: string) => string;
  formatMemoryDateMeta: (date: string) => string;
}

export function MemoriesView({
  filteredMemories,
  dailyTimelineGroups,
  longTermMemories,
  dailyMemories,
  evolutionMemories,
  draftSearchQuery,
  handleSearchInputChange,
  handleSearchKeyDown,
  mergeMemorySummaryLines,
  setSelectedItem,
  buildMemoryDigest,
  selectedMemory,
  selectedMemoryDigest,
  selectedMemoryTimeline,
  getMemoryTypeIcon,
  toDisplayType,
  formatMemoryDateLabel,
  formatMemoryDateMeta,
}: MemoriesViewProps) {
  return (

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
}
