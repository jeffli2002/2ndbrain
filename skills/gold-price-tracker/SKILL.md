---
name: gold-price-tracker
description: 每日黄金价格爬取与趋势分析。当用户提到黄金价格、金价走势、黄金行情、贵金属分析、每日金价报告时触发此Skill。自动从权威金融网站或API获取当日黄金价格，生成价格趋势图表和分析报告。
---

# Gold Price Tracker

每日黄金价格爬取与趋势分析工具。

## 功能概述

1. **实时价格获取** - 从权威金融网站/API获取当日黄金价格
2. **历史数据存储** - 保存历史价格数据用于趋势分析
3. **趋势分析** - 生成价格趋势图表和分析报告
4. **多周期视图** - 支持日/周/月/季度视图

## 数据来源

主要数据源（按优先级）：
1. ** Metals.dev API** - 免费贵金属API（需API Key）
2. **GoldAPI.io** - 免费黄金API（需注册）
3. **网页爬取** - 备份方案，从金融网站爬取

## 使用方法

### 方式1：使用API（推荐）

```bash
# 设置API Key（可选）
export METALS_DEV_API_KEY="your-api-key"

# 运行脚本
python3 scripts/get_gold_price.py
```

### 方式2：直接命令

```bash
# 获取今日金价
python3 scripts/get_gold_price.py --today

# 获取趋势分析
python3 scripts/get_gold_price.py --trend --days 30

# 完整报告
python3 scripts/get_gold_price.py --report
```

## 输出格式

### 今日价格
```
📊 今日黄金价格 (2026-03-15)
━━━━━━━━━━━━━━━━━━━━
🌍 国际金价: $3,014.50/盎司
🇨🇳 国内金价: 712.30 元/克
📈 涨跌幅: +1.23% (+8.68元)
━━━━━━━━━━━━━━━━━━━━
数据来源: Metals.dev
```

### 趋势分析
- 价格走势图（ASCII图表）
- 均线分析（5日、10日、20日）
- 支撑位/阻力位
- 短期预测

### 完整报告
- 今日价格摘要
- 周/月/季度趋势
- 技术指标分析
- 投资建议（可选）

## 脚本说明

### scripts/get_gold_price.py

主脚本，支持以下参数：

| 参数 | 说明 |
|------|------|
| `--today` | 获取今日价格 |
| `--trend` | 生成趋势分析 |
| `--days N` | 分析最近N天数据 |
| `--report` | 生成完整报告 |
| `--output FILE` | 输出到文件 |

### scripts/analyze_trend.py

趋势分析脚本，生成：
- 价格走势图
- 涨跌幅统计
- 均线数据
- 支撑阻力位

## 数据存储

历史数据保存在：
```
data/
├── gold_prices.csv      # 历史价格数据
├── gold_trends.json     # 趋势分析结果
└── reports/            # 报告存档
    └── YYYY-MM-DD.md
```

## 依赖

- Python 3.8+
- requests
- pandas
- matplotlib (可选，用于图表)

## 注意事项

1. 免费API有请求限制，请合理使用
2. 价格数据可能有延迟，以实际交易为准
3. 分析内容仅供参考，不构成投资建议
