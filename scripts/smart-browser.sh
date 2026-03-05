#!/bin/bash
# Smart Browser Ultimate - 智能浏览器调度器 v2.0
# 整合 browser-use + agent-browser + Agent-Reach
# 根据场景自动选择最佳工具

# 配置
BROWSER_USE_API_KEY="bu_asA1iDkZjaZlZoWaGoWJrh-ocb3ZyiygObrc1XFx5Jo"
LOG_FILE="/tmp/smart-browser.log"
SESSION_FILE="/tmp/smart-browser.session"

# Twitter Cookie (可选)
XREACH_AUTH_TOKEN="41d25c54e34668229d0356c04221d4058f0761b7"
XREACH_CT0="24a15787d231809f64a14dc33ce3624bd2da7e68150db25bc9f72a05f219d8983e6ed506ec9064c53fbe609b90ee0a9acd4923a10b7b5170e3bf9024aa141ed94f9a36f018eb8a2891412be5ce1b08a6"

export BROWSER_USE_API_KEY XREACH_AUTH_TOKEN XREACH_CT0

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# 错误处理
error_exit() {
    log "ERROR: $1"
    echo "❌ Error: $1"
    exit 1
}

# 检查依赖
check_dependencies() {
    command -v browser-use &> /dev/null || error_exit "browser-use not installed"
    command -v yt-dlp &> /dev/null || log "WARNING: yt-dlp not installed (YouTube功能不可用)"
}

# 判断是否有本地GUI
has_gui() {
    [ -n "$DISPLAY" ] || [ -n "$WAYLAND_DISPLAY" ]
}

# ========== Agent-Reach 功能 ==========

# YouTube/B站 提取
do_youtube() {
    local url="$1"
    log "YouTube: $url"
    echo "📺 提取YouTube: $url"
    
    if command -v yt-dlp &> /dev/null; then
        yt-dlp --dump-subs --no-download "$url" 2>&1 | head -50 || echo "无法提取字幕"
    else
        echo "yt-dlp未安装"
    fi
}

# Twitter/X 搜索
do_twitter() {
    local query="$*"
    log "Twitter: $query"
    echo "🐦 Twitter搜索: $query"
    
    export PATH="$PATH:/root/.nvm/versions/node/v22.22.0/bin"
    xreach --auth-token "$XREACH_AUTH_TOKEN" --ct0 "$XREACH_CT0" search "$query" -n 10 2>&1 | head -30
}

# GitHub 搜索
do_github() {
    local query="$*"
    log "GitHub: $query"
    echo "🐙 GitHub搜索: $query"
    
    curl -s "https://api.github.com/search/repositories?q=$query&per_page=5" 2>&1 | python3 -c "
import json,sys
data=json.load(sys.stdin)
for item in data.get('items',[])[:5]:
    print(f\"★ {item['full_name']}\")
    print(f\"  {item['description'] or 'No description'}\")
    print(f\"  ⭐ {item['stargazers_count']} | 🔀 {item['forks_count']}\")
    print()
" 2>/dev/null || echo "GitHub API调用失败"
}

# RSS 订阅
do_rss() {
    local url="$1"
    log "RSS: $url"
    echo "📡 RSS订阅: $url"
    curl -s "$url" 2>&1 | python3 -c "
from xml.etree import ElementTree as ET
import sys
try:
    for item in ET.fromstring(sys.stdin.read()).findall('.//item')[:5]:
        print(f\"• {item.find('title').text}\")
except: print('解析失败')
" 2>/dev/null || echo "无法解析RSS"
}

# 网页读取 (Jina)
do_read() {
    local url="$1"
    log "Read: $url"
    echo "🌐 读取网页: $url"
    curl -s "https://r.jina.ai/$url" 2>&1 | head -50
}

# 自动路由判断
analyze_task() {
    local task="$1"
    local lower=$(echo "$task" | tr '[:upper:]' '[:lower:]')
    
    # Agent-Reach 专长
    if echo "$lower" | grep -qE "youtube|视频|字幕|b站|bilibili"; then
        echo "youtube"
    elif echo "$lower" | grep -qE "twitter|推特|tweet"; then
        echo "twitter"
    elif echo "$lower" | grep -qE "github|代码|仓库|repo"; then
        echo "github"
    elif echo "$lower" | grep -qE "rss|订阅"; then
        echo "rss"
    elif echo "$lower" | grep -qE "读取|看看这个|这个网页"; then
        echo "read"
    # browser-use 专长
    elif echo "$lower" | grep -qE "打开|登录|点击|填表|自动化"; then
        echo "browser"
    # 通用搜索
    else
        echo "search"
    fi
}

# 获取会话
get_session() {
    if [ -f "$SESSION_FILE" ]; then
        cat "$SESSION_FILE"
    fi
}

# 主路由
route_browser() {
    local task="$*"
    local mode=$(analyze_task "$task")
    
    log "Task: $task | Mode: $mode"
    
    case $mode in
        youtube)
            do_youtube "$task"
            ;;
        twitter)
            do_twitter "$task"
            ;;
        github)
            do_github "$task"
            ;;
        rss)
            do_rss "$task"
            ;;
        read)
            do_read "$task"
            ;;
        browser)
            # 使用 browser-use
            if ! has_gui; then
                browser-use --browser remote run "$task" 2>&1
            else
                agent-browser "$task" 2>&1
            fi
            ;;
        search)
            # 通用搜索
            if ! has_gui; then
                browser-use --browser remote run "$task" 2>&1
            else
                agent-browser "$task" 2>&1
            fi
            ;;
    esac
}

# 帮助
show_help() {
    cat << EOF
🤖 Smart Browser Ultimate v2.0 - 智能浏览器调度器

用法: smart-browser <command> [args...]

命令:
  <任务描述>           自动分析并执行

自动路由:
  YouTube/B站        → Agent-Reach (yt-dlp)
  Twitter/推特       → Agent-Reach (xreach)
  GitHub代码         → Agent-Reach (API)
  RSS订阅            → Agent-Reach (curl)
  网页读取           → Agent-Reach (Jina)
  打开/登录/点击     → browser-use
  其他任务           → browser-use

示例:
  smart-browser "YouTube视频 https://youtube.com/watch?v=xxx"
  smart-browser "Twitter AI news"
  smart-browser "GitHub openclaw"
  smart-browser "打开google.com"
  smart-browser "搜索AI最新资讯"
EOF
}

main() {
    check_dependencies
    
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi
    
    route_browser "$@"
}

main "$@"
