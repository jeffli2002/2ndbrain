#!/usr/bin/env python3
"""
小米蒸锅控制脚本 v1.0
已配置设备信息，等待Token后启用
"""

import sys
import argparse
from miio import Device

# ============ 已配置信息 ============
DEVICE_IP = "192.168.0.100"      # 固定IP地址
DEVICE_TOKEN = "REPLACE_WITH_TOKEN"  # ⚠️ 请填入Token
# ==================================

def turn_on():
    """打开蒸锅"""
    if DEVICE_TOKEN == "REPLACE_WITH_TOKEN":
        print("❌ 请先配置Token！")
        return False
    
    try:
        dev = Device(DEVICE_IP, DEVICE_TOKEN)
        result = dev.send("set_power", ["on"])
        print(f"✅ 蒸锅已开启: {result}")
        return True
    except Exception as e:
        print(f"❌ 开启失败: {e}")
        return False

def turn_off():
    """关闭蒸锅"""
    if DEVICE_TOKEN == "REPLACE_WITH_TOKEN":
        print("❌ 请先配置Token！")
        return False
    
    try:
        dev = Device(DEVICE_IP, DEVICE_TOKEN)
        result = dev.send("set_power", ["off"])
        print(f"✅ 蒸锅已关闭: {result}")
        return True
    except Exception as e:
        print(f"❌ 关闭失败: {e}")
        return False

def status():
    """查看状态"""
    if DEVICE_TOKEN == "REPLACE_WITH_TOKEN":
        print("❌ 请先配置Token！")
        return False
    
    try:
        dev = Device(DEVICE_IP, DEVICE_TOKEN)
        result = dev.send("get_status")
        print(f"📊 蒸锅状态: {result}")
        return True
    except Exception as e:
        print(f"❌ 查询失败: {e}")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="小米蒸锅控制")
    parser.add_argument("action", choices=["on", "off", "status"], 
                        help="操作: on=开启, off=关闭, status=查看状态")
    
    args = parser.parse_args()
    
    if args.action == "on":
        turn_on()
    elif args.action == "off":
        turn_off()
    elif args.action == "status":
        status()
