#!/bin/bash
# TrustMRR Daily Analysis - 每天早上8点抓取并分析

OUTPUT_FILE="/root/.openclaw/workspace/reports/trustmrr-$(date +%Y-%m-%d).md"
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

# 抓取网页
CONTENT=$(curl -s "https://trustmrr.com" 2>/dev/null)

if [ $? -ne 0 ]; then
    echo "Failed to fetch TrustMRR" >&2
    exit 1
fi

# 提取关键数据（简化版：提取前50个项目的名称和MRR）
echo "# TrustMRR 每日分析报告" > "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "**生成时间**: $TIMESTAMP" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "## 今日热门SaaS项目" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# 用grep+sed提取项目名和MRR（简化处理）
echo "$CONTENT" | grep -oP '\$\d{1,3}(,\d{3})*|\(\$[^)]+\)' | head -30 >> "$OUTPUT_FILE"

echo "" >> "$OUTPUT_FILE"
echo "## 分析结论" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "- 数据来源: TrustMRR verified startup revenue" >> "$OUTPUT_FILE"
echo "- 今日数据已抓取" >> "$OUTPUT_FILE"
echo "- 完整分析需要进一步处理" >> "$OUTPUT_FILE"

echo "TrustMRR analysis completed: $OUTPUT_FILE"
