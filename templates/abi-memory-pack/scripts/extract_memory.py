#!/usr/bin/env python3
from __future__ import annotations
from datetime import datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DAILY_DIR = ROOT / 'memory' / 'daily'
STRATEGIC = ROOT / 'memory' / 'global' / 'strategic.md'

HEADER = '\n## Memory 提炼 | {ts}\n\n'


def read_day(day: str) -> str:
    path = DAILY_DIR / f'{day}.md'
    if not path.exists():
        return ''
    return path.read_text(encoding='utf-8').strip()


def summarize_block(text: str) -> list[str]:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip().startswith('- ')]
    candidates = []
    for ln in lines:
        body = ln[2:].strip()
        if any(k in body for k in ['长期', '规则', '机制', '稳定', '复用', '风险', '必须', '不要']):
            candidates.append(body)
    return candidates[:8]


def main() -> None:
    today = datetime.now().date()
    days = [today, today - timedelta(days=1)]
    found = []
    for d in days:
        found.extend(summarize_block(read_day(d.strftime('%Y-%m-%d'))))

    found = list(dict.fromkeys(found))
    if not found:
        print('No long-term memory candidates found.')
        return

    if not STRATEGIC.exists():
        STRATEGIC.write_text('# Strategic Memory\n', encoding='utf-8')

    ts = datetime.now().strftime('%Y-%m-%d %H:%M')
    block = HEADER.format(ts=ts)
    block += '### 自动提炼候选\n\n'
    for item in found:
        block += f'- {item}\n'

    with STRATEGIC.open('a', encoding='utf-8') as f:
        f.write(block)

    print(f'Updated: {STRATEGIC}')


if __name__ == '__main__':
    main()
