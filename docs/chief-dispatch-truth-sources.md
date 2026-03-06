# Chief Dispatch Truth Sources

Last updated: 2026-03-06

## Single sources of truth

### 1. Runtime binding / model truth
- `/root/.openclaw/openclaw.json`
- Controls real chat/group bindings and runtime model settings.

### 2. Chief private-chat routing truth
- `/root/.openclaw/workspace/config/agent_keyword_router.yaml`
- `/root/.openclaw/workspace/scripts/agent_keyword_router.py`
- Controls how Chief classifies private-chat tasks by domain.

### 3. Worker runtime truth
- `/root/.openclaw/workspace/config/chief_dispatch_workers.yaml`
- Controls which worker model/label/runtime strategy to use.

### 4. Chief executable planning truth
- `/root/.openclaw/workspace/scripts/chief_dispatch.py`
- Converts a user message into a real executable plan:
  - `chief_direct`
  - `triage`
  - `delegate_spawn`

### 5. Result bridge truth
- `/root/.openclaw/workspace/scripts/wait_dispatch_result.py`
- Validates and reads worker result bridges.
- Current default protocol: JSON.

## Deprecated / compatibility-only files

### Deprecated: `agents/config.yaml`
- Historical copy archived at:
  - `/root/.openclaw/workspace/archive/legacy-routing/agents-config.deprecated.yaml`
- Do not treat as runtime truth.

### Deprecated: `config/group_agent_mapping.yaml`
- Historical copy archived at:
  - `/root/.openclaw/workspace/archive/legacy-routing/group_agent_mapping.deprecated.yaml`
- Do not maintain a second live group-binding table there.

### Deprecated compatibility wrapper: `scripts/auto_route.py`
- Kept only so older notes/scripts do not break immediately.
- Real planner is `scripts/chief_dispatch.py`.

## Current real execution flow

```text
Chief receives a private-chat task
-> simple question: Chief handles directly
-> domain task: chief_dispatch.py creates a plan
-> delegate_spawn: sessions_spawn(mode=run)
-> worker writes JSON result bridge
-> Chief reads result via wait_dispatch_result.py
-> if dispatch fails: Chief degraded-mode execution
```
