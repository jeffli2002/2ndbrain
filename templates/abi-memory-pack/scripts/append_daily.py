#!/usr/bin/env python3
from __future__ import annotations
import argparse
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DAILY_DIR = ROOT / 'memory' / 'daily'
DAILY_DIR.mkdir(parents=True, exist_ok=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--title', required=True)
    parser.add_argument('--body', required=True)
    args = parser.parse_args()

    now = datetime.now()
    day = now.strftime('%Y-%m-%d')
    path = DAILY_DIR / f'{day}.md'

    if not path.exists():
        path.write_text(f'# 今日工作日志\n\n## {day}\n', encoding='utf-8')

    entry = f"\n### {now.strftime('%H:%M')} {args.title}\n\n- {args.body.strip()}\n"
    with path.open('a', encoding='utf-8') as f:
        f.write(entry)

    print(path)


if __name__ == '__main__':
    main()
