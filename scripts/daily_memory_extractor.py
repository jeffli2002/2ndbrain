#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Daily Memory Extractor - 每日记忆提炼器
功能: 每2小时自动提炼所有daily memory的核心信息，写入Global memory

用法:
    python3 /root/.openclaw/workspace/scripts/daily_memory_extractor.py
"""

import os
import re
from datetime import datetime, timedelta
from typing import List, Dict, Any

class DailyMemoryExtractor:
    """
    每日记忆提炼器
    1. 读取最近N天的 daily memory
    2. 提炼核心信息
    3. 萃取重要内容
    4. 写入 Global memory
    """
    
    def __init__(self):
        self.workspace = "/root/.openclaw/workspace"
        self.daily_dir = f"{self.workspace}/memory/daily"
        self.global_dir = f"{self.workspace}/memory/global"
        self.strategic_file = f"{self.global_dir}/strategic.md"
        
    def run(self):
        """执行提炼"""
        print(f"🔄 [{datetime.now().isoformat()}] 开始提炼 Daily Memory")
        
        # 1. 读取最近2天的 daily memory
        daily_contents = self._read_recent_daily(2)
        
        if not daily_contents:
            print("  ⚠ 没有找到 Daily Memory 文件")
            return
        
        print(f"  ✓ 读取了 {len(daily_contents)} 天的日记")
        
        # 2. 提炼核心信息
        extracted = self._extract_key_info(daily_contents)
        
        print(f"  ✓ 提炼了 {len(extracted)} 条核心信息")
        
        # 3. 萃取重要内容
        important = self._filter_important(extracted)
        
        print(f"  ✓ 筛选了 {len(important)} 条重要内容")
        
        # 4. 写入 Global memory
        if important:
            self._write_to_strategic(important)
            print(f"  ✓ 已写入 Global memory")
        else:
            print("  ⚠ 没有重要内容需要写入")
            
        return important
    
    def _read_recent_daily(self, days: int) -> List[Dict[str, Any]]:
        """读取最近N天的 daily memory"""
        contents = []
        
        if not os.path.exists(self.daily_dir):
            return contents
        
        # 首先查找所有存在的日记文件
        all_files = []
        if os.path.exists(self.daily_dir):
            for f in os.listdir(self.daily_dir):
                if f.endswith('.md') and f[0].isdigit():
                    # 跳过非日期文件
                    if 'report' not in f and 'lessons' not in f and 'morning' not in f:
                        try:
                            date_str = f.replace('.md', '')
                            if len(date_str) == 10 and date_str[4] == '-':
                                all_files.append((date_str, f))
                        except:
                            pass
        
        # 按日期排序，取最近的days个
        all_files.sort(reverse=True)
        recent_files = all_files[:days]
        
        for date_str, filename in recent_files:
            filepath = os.path.join(self.daily_dir, filename)
            if os.path.exists(filepath):
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                    contents.append({
                        'date': date_str,
                        'content': content
                    })
        
        return contents
    
    def _extract_key_info(self, daily_contents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """提炼核心信息"""
        extracted = []
        
        for daily in daily_contents:
            date = daily['date']
            content = daily['content']
            
            # 提取关键段落
            lines = content.split('\n')
            
            current_section = ""
            current_items = []
            
            for line in lines:
                # 检测章节标题
                if line.startswith('##'):
                    # 保存上一章节
                    if current_items:
                        extracted.append({
                            'date': date,
                            'section': current_section.strip(),
                            'items': current_items.copy()
                        })
                    current_section = line.replace('##', '').strip()
                    current_items = []
                # 提取列表项
                elif line.strip().startswith(('- ', '* ', '• ')):
                    item = line.strip()[2:]
                    if len(item) > 5:  # 过滤太短的项
                        current_items.append(item)
            
            # 保存最后一章
            if current_items:
                extracted.append({
                    'date': date,
                    'section': current_section.strip(),
                    'items': current_items.copy()
                })
        
        return extracted
    
    def _filter_important(self, extracted: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """筛选重要内容"""
        important = []
        
        # 关键词权重
        important_keywords = [
            '决策', '决定', '计划', '目标', '完成', '成功', 
            '重要', '关键', '核心', '战略', '收入', '增长',
            '问题', '解决', 'Bug', '修复', '上线', '发布',
            '学习', '总结', '洞察', '分析'
        ]
        
        for item in extracted:
            score = 0
            section_lower = item['section'].lower()
            items_text = ' '.join(item['items']).lower()
            
            # 计算重要度分数
            for kw in important_keywords:
                if kw in section_lower:
                    score += 3
                if kw in items_text:
                    score += 1
            
            if score >= 2:  # 阈值
                item['score'] = score
                important.append(item)
        
        # 按分数排序
        important.sort(key=lambda x: x['score'], reverse=True)
        
        return important
    
    def _write_to_strategic(self, important: List[Dict[str, Any]]):
        """写入 Global memory (strategic.md)"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M')
        
        # 读取现有内容
        existing = ""
        if os.path.exists(self.strategic_file):
            with open(self.strategic_file, 'r', encoding='utf-8') as f:
                existing = f.read()
        
        # 构建新内容
        new_section = f"""

---

## 📊 Memory 提炼 | {timestamp}

### 核心信息汇总

"""
        
        # 按日期分组
        by_date = {}
        for item in important:
            date = item['date']
            if date not in by_date:
                by_date[date] = []
            by_date[date].append(item)
        
        # 添加内容
        for date, items in by_date.items():
            new_section += f"**{date}**\n"
            for item in items:
                section = item['section']
                new_section += f"- {section}: {', '.join(item['items'][:3])}\n"
            new_section += "\n"
        
        # 追加到文件
        with open(self.strategic_file, 'w', encoding='utf-8') as f:
            f.write(existing + new_section)


def main():
    """主入口"""
    extractor = DailyMemoryExtractor()
    extractor.run()


if __name__ == "__main__":
    main()
