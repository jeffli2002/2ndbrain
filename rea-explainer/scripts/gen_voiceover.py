"""Generate per-scene Chinese voiceover with edge-tts and write durations to src/voiceover.json."""
import asyncio
import json
import pathlib
import re
import subprocess

import edge_tts

ROOT = pathlib.Path(__file__).resolve().parent.parent
VOICE = "zh-CN-YunxiNeural"
RATE = "+6%"

SCENES = [
    ("intro", "在别人的 App 里，看到一个特别酷的功能，好想知道它是怎么做出来的？可问题是，你手里没有一行源代码。"),
    ("layers", "这时候就需要逆向工程：从软件表面的行为出发，一层层往下挖，穿过代码模块、汇编指令，一直挖到最底层的二进制。过去，这是少数专家的硬核手艺。"),
    ("setup", "REA，全称 Reverse Engineer Anything，把这门手艺交给了 AI 智能体。它是一个 MCP 服务，一行命令，就能接入 Claude Code、Codex、Cursor 等智能体。"),
    ("loop", "它的原理是一个调查闭环。智能体先提出问题，通过 MCP 调用 REA；REA 在你的电脑本地，驱动 Hopper、Ghidra、IDA 这些专业引擎，去检查和追踪目标；再把代码、引用和未知项，作为证据交回给智能体。智能体据此解释原理、继续追问，甚至直接写出实现并测试。"),
    ("targets", "能分析的目标非常广：原生二进制、Electron 和网页应用、.NET 程序集、安卓 APK、固件，甚至智能合约字节码。"),
    ("evidence", "关键在于证据。每一个结论，都附带伪代码、调用关系和局限说明，而不是 AI 凭空猜测。比如在 DX-Ball 游戏案例里，重建出的函数通过了三千二百零五个原始测试，完整复现了全部六十三个字节。"),
    ("impact", "这就是智能体加硬核工程的威力：它比聊天套壳更有分量，也会让自动化漏洞挖掘和攻防对抗的强度，整体抬高一个台阶。"),
    ("compliance", "也正因为强大，技术演示和商业使用必须分开讲合规。只分析你有权分析的软件，遵守许可协议和当地法律；发现漏洞，走负责任披露。"),
    ("outro", "REA，看见一个功能，就能读懂它的底层。开源，MIT 协议，一行命令就能开始。"),
]


PUNCT = re.compile(r"[，。；：？！、\s]")


def clean(s: str) -> str:
    return PUNCT.sub("", s)


def build_cues(text: str, words: list[tuple[float, str]]) -> list[dict]:
    """Time each punctuation-delimited chunk by the first TTS word boundary inside it."""
    stream = clean(text)
    char_time: list[float | None] = [None] * len(stream)
    ptr = 0
    for start, word in words:
        w = clean(word)
        idx = stream.find(w, ptr) if w else -1
        if idx < 0:
            continue
        for k in range(idx, idx + len(w)):
            char_time[k] = start
        ptr = idx + len(w)
    chunks: list[str] = []
    for chunk in re.split(r"[，。；：？！]", text):
        chunks.extend(chunk.split("、") if len(chunk) > 18 else [chunk])
    cues, offset = [], 0
    for chunk in chunks:
        c = clean(chunk)
        if not c:
            continue
        start = next((tm for tm in char_time[offset:] if tm is not None), None)
        cues.append({"text": chunk.strip(), "start": round(start or 0.0, 3)})
        offset += len(c)
    return cues


async def synth(scene_id: str, text: str) -> tuple[float, list[dict]]:
    out = ROOT / "public" / "vo" / f"{scene_id}.mp3"
    out.parent.mkdir(parents=True, exist_ok=True)
    words: list[tuple[float, str]] = []
    with open(out, "wb") as f:
        async for chunk in edge_tts.Communicate(text, VOICE, rate=RATE, boundary="WordBoundary").stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                words.append((chunk["offset"] / 1e7, chunk["text"]))
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(out)],
        capture_output=True, text=True, check=True,
    )
    return float(probe.stdout.strip()), build_cues(text, words)


async def main() -> None:
    result = []
    for scene_id, text in SCENES:
        duration, cues = await synth(scene_id, text)
        result.append({"id": scene_id, "text": text, "duration": round(duration, 3), "cues": cues})
        print(f"{scene_id}: {duration:.2f}s")
    (ROOT / "src" / "voiceover.json").write_text(json.dumps(result, ensure_ascii=False, indent=2))


asyncio.run(main())
