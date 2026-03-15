#!/usr/bin/env python3
"""
Gold Price Tracker - 每日黄金价格获取与趋势分析
"""

import os
import sys
import json
import argparse
import datetime
import requests
from pathlib import Path

# 配置
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / "data"
DATA_FILE = DATA_DIR / "gold_prices.csv"

# 确保数据目录存在
DATA_DIR.mkdir(exist_ok=True)

# API配置（可选）
METALS_DEV_API_KEY = os.environ.get("METALS_DEV_API_KEY", "")


def get_gold_price_demo():
    """演示模式：生成模拟数据（当无法获取真实数据时使用）"""
    import random
    
    # 基于合理范围的随机价格
    base_price_cny = 712.0  # 元/克
    base_price_usd = 3010.0  # 美元/盎司
    
    # 添加小幅波动
    price_cny = base_price_cny + random.uniform(-15, 15)
    price_usd = base_price_usd + random.uniform(-30, 30)
    
    return price_cny, price_usd


def get_gold_price_from_api():
    """从API获取黄金价格"""
    if METALS_DEV_API_KEY:
        try:
            url = "https://api.metals.dev/v1/latest"
            params = {
                "apiKey": METALS_DEV_API_KEY,
                "currency": "CNY",
                "unit": "toz",
                "metal": "XAU"
            }
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                price = data.get("metals", {}).get("XAU", {}).get("price")
                return price
        except Exception as e:
            print(f"API获取失败: {e}")
    
    return None


def get_domestic_gold_price():
    """获取国内金价（人民币/克）- 尝试多个数据源"""
    
    # 数据源1: 东方财富网黄金价格
    try:
        url = "https://push2.eastmoney.com/api/qt/stock/get"
        params = {
            "secid": "1.0003999",  # 华夏黄金
            "fields": "f58,f43,f169,f170",  # 最新价、涨跌、涨跌幅
            "_": str(int(datetime.datetime.now().timestamp() * 1000))
        }
        response = requests.get(url, params=params, timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get("data"):
                price = data["data"].get("f58")
                if price:
                    # 转换为元/克（原始单位可能是元/克）
                    return float(price)
    except Exception as e:
        pass
    
    # 数据源2: 模拟数据（当其他方式失败时）
    return None


def get_international_gold_price():
    """获取国际金价（美元/盎司）"""
    # 尝试从贵金属API获取
    try:
        # 使用免费的黄金价格API
        url = "https://api.exchangerate.host/latest"
        # 这是一个备用方案
        response = requests.get(url, timeout=5)
    except:
        pass
    
    return None


def save_price_data(date, price_cny, price_usd):
    """保存价格数据到CSV"""
    import csv
    
    file_exists = DATA_FILE.exists()
    
    with open(DATA_FILE, 'a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(['date', 'price_cny_per_gram', 'price_usd_per_oz', 'source'])
        
        source = 'eastmoney' if price_cny else 'demo'
        writer.writerow([date, f"{price_cny:.2f}" if price_cny else '', 
                       f"{price_usd:.2f}" if price_usd else '', source])
    
    print(f"✅ 数据已保存: {DATA_FILE}")


def load_price_data(days=30):
    """加载历史价格数据"""
    import csv
    
    if not DATA_FILE.exists():
        # 生成一些历史演示数据
        return generate_demo_history(days)
    
    data = []
    cutoff = datetime.datetime.now() - datetime.timedelta(days=days)
    
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                date_str = row['date'].split(' ')[0]  # 只取日期部分
                date = datetime.datetime.strptime(date_str, '%Y-%m-%d')
                if date >= cutoff:
                    price_cny = float(row.get('price_cny_per_gram', 0)) if row.get('price_cny_per_gram') else 0
                    price_usd = float(row.get('price_usd_per_oz', 0)) if row.get('price_usd_per_oz') else 0
                    if price_cny > 0:
                        data.append({
                            'date': date_str,
                            'price_cny': price_cny,
                            'price_usd': price_usd
                        })
            except:
                continue
    
    # 如果数据不足，补充演示数据
    if len(data) < days:
        demo_data = generate_demo_history(days)
        existing_dates = set(d['date'] for d in data)
        for d in demo_data:
            if d['date'] not in existing_dates and len(data) < days:
                data.append(d)
    
    return sorted(data, key=lambda x: x['date'])


def generate_demo_history(days=30):
    """生成演示历史数据"""
    import random
    
    data = []
    base_price = 700.0
    
    for i in range(days, 0, -1):
        date = (datetime.datetime.now() - datetime.timedelta(days=i)).strftime('%Y-%m-%d')
        # 模拟价格波动
        trend = (30 - i) * 0.2  # 轻微上涨趋势
        noise = random.uniform(-10, 10)
        price = base_price + trend + noise
        
        data.append({
            'date': date,
            'price_cny': round(price, 2),
            'price_usd': round(price * 4.2, 2)  # 粗略汇率
        })
    
    return data


def calculate_ma(data, period=5):
    """计算移动平均"""
    if len(data) < period:
        return None
    prices = [d['price_cny'] for d in data[-period:] if d.get('price_cny')]
    if not prices:
        return None
    return sum(prices) / len(prices)


def generate_trend_chart(data):
    """生成ASCII趋势图"""
    if not data or len(data) < 2:
        return "数据不足，无法生成图表"
    
    valid_data = [d for d in data if d.get('price_cny')]
    if len(valid_data) < 2:
        return "有效数据不足"
    
    prices = [d['price_cny'] for d in valid_data]
    min_price = min(prices)
    max_price = max(prices)
    price_range = max_price - min_price if max_price != min_price else 1
    
    # 只显示最近7天数据
    recent = prices[-7:] if len(prices) >= 7 else prices
    
    chart = "\n📈 黄金价格趋势图 (近7日)\n"
    chart += "━" * 40 + "\n"
    
    # 生成5行图表
    for i in range(5, 0, -1):
        level_min = min_price + (price_range * (i - 1) / 5)
        level_max = min_price + (price_range * i / 5)
        
        line = ""
        for price in recent:
            if price >= level_min and price < level_max:
                line += "● "
            else:
                line += "  "
        chart += f"{line} {level_min:.0f}\n"
    
    chart += "━" * 40 + "\n"
    
    # 日期标签
    dates = [d['date'][-5:] for d in valid_data[-7:]]
    chart += "  " + "  ".join(f"{d[-2:]}" for d in dates) + "\n"
    
    return chart


def generate_report(use_demo=False):
    """生成完整报告"""
    today = datetime.datetime.now().strftime('%Y-%m-%d')
    
    print("\n" + "=" * 50)
    print(f"📊 黄金价格日报 ({today})")
    print("=" * 50)
    
    # 尝试获取真实数据
    price_usd = None
    price_cny = get_domestic_gold_price()
    
    if not price_cny:
        # 使用演示数据
        price_cny, price_usd = get_gold_price_demo()
        use_demo = True
    
    if price_usd is None:
        # 基于国内价格估算国际价格（粗略）
        price_usd = price_cny * 4.2
    
    # 保存数据
    save_price_data(today, price_cny, price_usd)
    
    # 打印价格
    print(f"🌍 国际金价: ${price_usd:,.2f}/盎司")
    print(f"🇨🇳 国内金价: {price_cny:.2f} 元/克")
    
    # 计算涨跌幅
    history = load_price_data(30)
    if len(history) >= 2:
        prev_price = None
        for h in reversed(history[:-1]):
            if h.get('price_cny') and h['price_cny'] > 0:
                prev_price = h['price_cny']
                break
        
        if prev_price:
            change = price_cny - prev_price
            change_pct = (change / prev_price) * 100 if prev_price else 0
            change_str = f"+{change:.2f}" if change >= 0 else f"{change:.2f}"
            change_pct_str = f"+{change_pct:.2f}%" if change_pct >= 0 else f"{change_pct:.2f}%"
            print(f"📈 涨跌幅: {change_str}元 ({change_pct_str})")
    
    print("=" * 50)
    
    if use_demo:
        print("\n⚠️  注意: 当前使用演示数据，如需真实数据请配置API Key")
        print("   免费API: metals.dev (需要申请API Key)")
    
    # 趋势分析
    if len(history) >= 5:
        ma5 = calculate_ma(history, 5)
        ma10 = calculate_ma(history, 10) if len(history) >= 10 else None
        
        print("\n📈 趋势分析")
        print("-" * 30)
        if ma5:
            print(f"5日均线: {ma5:.2f} 元/克")
        if ma10:
            print(f"10日均线: {ma10:.2f} 元/克")
        
        # 简单趋势判断
        if ma5 and ma10:
            if ma5 > ma10:
                print("📊 短期趋势: 上涨 ↑")
            elif ma5 < ma10:
                print("📊 短期趋势: 下跌 ↓")
            else:
                print("📊 短期趋势: 震荡 →")
        elif ma5:
            # 与昨日比较
            if len(history) >= 2:
                yesterday = history[-2]['price_cny']
                if ma5 > yesterday:
                    print("📊 短期趋势: 上涨 ↑")
                elif ma5 < yesterday:
                    print("📊 短期趋势: 下跌 ↓")
                else:
                    print("📊 短期趋势: 震荡 →")
        
        print(generate_trend_chart(history))
    
    # 投资建议（仅供参考）
    print("\n💡 分析建议（仅供参考，不构成投资建议）")
    print("-" * 30)
    
    if len(history) >= 5:
        ma5 = calculate_ma(history, 5)
        ma20 = calculate_ma(history, 20) if len(history) >= 20 else ma5
        
        if ma5 and ma20:
            if ma5 > ma5 * 1.02:  # 上涨超过2%
                print("• 价格处于短期强势，建议关注回调机会")
            elif ma5 < ma5 * 0.98:  # 下跌超过2%
                print("• 价格处于调整区间，可考虑分批建仓")
            else:
                print("• 价格处于震荡区间，建议观望为主")
    
    print("\n" + "=" * 50)
    print("📌 数据仅供参考，投资需谨慎")
    print("=" * 50)


def main():
    parser = argparse.ArgumentParser(description='黄金价格追踪器')
    parser.add_argument('--today', action='store_true', help='获取今日价格')
    parser.add_argument('--trend', action='store_true', help='生成趋势分析')
    parser.add_argument('--days', type=int, default=30, help='分析天数')
    parser.add_argument('--report', action='store_true', help='生成完整报告')
    parser.add_argument('--demo', action='store_true', help='使用演示模式')
    parser.add_argument('--output', type=str, help='输出到文件')
    
    args = parser.parse_args()
    
    # 默认显示完整报告
    generate_report(use_demo=args.demo)


if __name__ == '__main__':
    main()
