---
name: feishu-calendar-invite
description: "Create Feishu calendar events and invite users through the Feishu Calendar API. Use when someone asks to create a 飞书日历 event, send a calendar invite, add an attendee, put something on their Feishu calendar, or test whether OpenClaw can schedule meetings via Feishu. Supports two paths: write directly to the user's primary calendar when the app has writer/owner access, or fall back to an app-owned shared calendar, grant the user access, and create the event there."
---

# Feishu Calendar Invite

Create a Feishu calendar event through API and make sure the target user can see it in Feishu Calendar.

## Workflow

1. Read the target user's `open_id`.
2. Run `scripts/create_event.js`.
3. Let the script decide the delivery path:
   - **Primary calendar**: use it when the app has `writer` or `owner` access.
   - **Shared calendar fallback**: create/reuse an app-owned shared calendar, add the user as calendar member, create the event there, and add the user as attendee.
4. Return the event link and clearly say which path was used.

## Command

```bash
node /root/.openclaw/workspace/skills/feishu-calendar-invite/scripts/create_event.js \
  --user-open-id ou_xxx \
  --title "健身" \
  --start "2026-03-11T16:00:00+08:00" \
  --duration-minutes 60 \
  --description "虾仔代创建" \
  --json
```

## Parameters

- `--user-open-id`: target Feishu user open_id
- `--title`: event title
- `--start`: ISO datetime with timezone offset
- `--end`: optional ISO end datetime
- `--duration-minutes`: default `60` when `--end` is omitted
- `--timezone`: default `Asia/Shanghai`
- `--description`: optional event description
- `--shared-calendar-name`: optional override for fallback shared calendar name
- `--json`: print structured JSON for downstream use

## Output handling

Report these fields back to the user when useful:

- `mode`: `primary-calendar` or `shared-calendar-fallback`
- `calendar.id`
- `event.id`
- `event.appLink`

## Notes

- If the app only has `reader` on the user's primary calendar, direct write will fail with `no calendar access_role`. The fallback shared-calendar path is the intended recovery.
- Reuse the same fallback shared calendar for the same user when possible; do not create a brand-new calendar every time unless needed.
- Prefer `--json` when another script or agent needs to parse the result.
