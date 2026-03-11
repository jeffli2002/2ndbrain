#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const lark = require('/root/.nvm/versions/node/v22.22.0/lib/node_modules/openclaw/node_modules/@larksuiteoapi/node-sdk');

function parseArgs(argv) {
  const out = {
    durationMinutes: 60,
    timezone: 'Asia/Shanghai',
    description: '',
    sharedCalendarName: '',
    json: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case '--user-open-id':
        out.userOpenId = argv[++i];
        break;
      case '--title':
        out.title = argv[++i];
        break;
      case '--start':
        out.start = argv[++i];
        break;
      case '--end':
        out.end = argv[++i];
        break;
      case '--duration-minutes':
        out.durationMinutes = Number(argv[++i]);
        break;
      case '--timezone':
        out.timezone = argv[++i];
        break;
      case '--description':
        out.description = argv[++i];
        break;
      case '--shared-calendar-name':
        out.sharedCalendarName = argv[++i];
        break;
      case '--json':
        out.json = true;
        break;
      case '-h':
      case '--help':
        out.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return out;
}

function printHelp() {
  console.log(`Feishu Calendar event creator\n\nUsage:\n  node create_event.js --user-open-id <open_id> --title <title> --start <ISO> [options]\n\nRequired:\n  --user-open-id         Target Feishu user open_id\n  --title                Event title\n  --start                ISO datetime, e.g. 2026-03-11T16:00:00+08:00\n\nOptional:\n  --end                  ISO datetime; if omitted, uses --duration-minutes\n  --duration-minutes     Default 60\n  --timezone             Default Asia/Shanghai\n  --description          Event description\n  --shared-calendar-name Override fallback shared calendar name\n  --json                 Output machine-readable JSON\n`);
}

function loadFeishuConfig() {
  const cfgPath = path.join(os.homedir(), '.openclaw', 'openclaw.json');
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  const feishu = cfg?.channels?.feishu;
  if (!feishu?.appId || !feishu?.appSecret) {
    throw new Error('Missing Feishu appId/appSecret in ~/.openclaw/openclaw.json');
  }
  return feishu;
}

function getClient(feishu) {
  return new lark.Client({
    appId: feishu.appId,
    appSecret: feishu.appSecret,
    domain: feishu.domain === 'feishu' ? lark.Domain.Feishu : undefined,
  });
}

function parseDateTime(input) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid datetime: ${input}`);
  }
  return date;
}

async function getPrimaryCalendar(client, openId) {
  const res = await client.calendar.v4.calendar.primarys({
    data: { user_ids: [openId] },
    params: { user_id_type: 'open_id' },
  });
  const record = res?.data?.calendars?.[0];
  return record?.calendar ? record : null;
}

async function listCalendars(client) {
  const items = [];
  let pageToken;
  for (;;) {
    const res = await client.calendar.v4.calendar.list({
      params: { page_size: 100, ...(pageToken ? { page_token: pageToken } : {}) },
    });
    const batch = res?.data?.calendar_list || [];
    items.push(...batch);
    if (!res?.data?.has_more || !res?.data?.page_token) break;
    pageToken = res.data.page_token;
  }
  return items;
}

function sharedCalendarIdentity(openId) {
  return {
    summary: `虾仔日历-${openId.slice(-6)}`,
    description: `OpenClaw managed shared calendar for ${openId}`,
  };
}

async function ensureSharedCalendar(client, openId, customName) {
  const identity = sharedCalendarIdentity(openId);
  const existing = (await listCalendars(client)).find((cal) =>
    cal.type === 'shared' && (cal.description === identity.description || cal.summary === customName || cal.summary === identity.summary)
  );

  if (existing) return existing;

  const res = await client.calendar.v4.calendar.create({
    data: {
      summary: customName || identity.summary,
      description: identity.description,
      permissions: 'private',
    },
  });
  return res?.data?.calendar;
}

async function ensureAcl(client, calendarId, openId) {
  const existing = await client.calendar.v4.calendarAcl.list({
    path: { calendar_id: calendarId },
    params: { user_id_type: 'open_id', page_size: 100 },
  });
  const matched = existing?.data?.acls?.find((acl) => acl?.scope?.user_id === openId);
  if (matched) return matched;

  const created = await client.calendar.v4.calendarAcl.create({
    path: { calendar_id: calendarId },
    params: { user_id_type: 'open_id' },
    data: {
      role: 'writer',
      scope: { type: 'user', user_id: openId },
    },
  });
  return created?.data;
}

async function createEvent(client, calendarId, args) {
  const start = parseDateTime(args.start);
  const end = args.end
    ? parseDateTime(args.end)
    : new Date(start.getTime() + args.durationMinutes * 60 * 1000);
  if (end <= start) {
    throw new Error('Event end time must be later than start time');
  }

  const idem = crypto
    .createHash('sha1')
    .update([calendarId, args.userOpenId, args.title, start.toISOString(), end.toISOString()].join('|'))
    .digest('hex');

  const res = await client.calendar.v4.calendarEvent.create({
    path: { calendar_id: calendarId },
    params: { idempotency_key: idem, user_id_type: 'open_id' },
    data: {
      summary: args.title,
      description: args.description || '',
      need_notification: true,
      start_time: {
        timezone: args.timezone,
        timestamp: String(Math.floor(start.getTime() / 1000)),
      },
      end_time: {
        timezone: args.timezone,
        timestamp: String(Math.floor(end.getTime() / 1000)),
      },
      free_busy_status: 'busy',
      visibility: 'default',
    },
  });
  return res?.data?.event;
}

async function addAttendee(client, calendarId, eventId, openId) {
  const res = await client.calendar.v4.calendarEventAttendee.create({
    path: { calendar_id: calendarId, event_id: eventId },
    params: { user_id_type: 'open_id' },
    data: {
      attendees: [{ type: 'user', user_id: openId }],
      need_notification: true,
    },
  });
  return res?.data?.attendees || [];
}

(async () => {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
      printHelp();
      process.exit(0);
    }
    if (!args.userOpenId || !args.title || !args.start) {
      printHelp();
      throw new Error('Missing required arguments');
    }

    const feishu = loadFeishuConfig();
    const client = getClient(feishu);
    const primaryRecord = await getPrimaryCalendar(client, args.userOpenId);

    let mode = 'shared-calendar-fallback';
    let calendar;
    if (primaryRecord?.calendar && ['writer', 'owner'].includes(primaryRecord.calendar.role)) {
      mode = 'primary-calendar';
      calendar = primaryRecord.calendar;
    } else {
      calendar = await ensureSharedCalendar(client, args.userOpenId, args.sharedCalendarName);
      await ensureAcl(client, calendar.calendar_id, args.userOpenId);
    }

    const event = await createEvent(client, calendar.calendar_id, args);
    let attendees = [];
    if (event?.event_id) {
      attendees = await addAttendee(client, calendar.calendar_id, event.event_id, args.userOpenId);
    }

    const result = {
      ok: true,
      mode,
      calendar: {
        id: calendar?.calendar_id,
        summary: calendar?.summary,
        role: calendar?.role,
        type: calendar?.type,
      },
      event: event
        ? {
            id: event.event_id,
            summary: event.summary,
            appLink: event.app_link,
            start: event.start_time,
            end: event.end_time,
          }
        : null,
      attendees,
    };

    if (args.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`OK: ${result.event.summary}`);
      console.log(`Mode: ${result.mode}`);
      console.log(`Calendar: ${result.calendar.summary} (${result.calendar.id})`);
      console.log(`Event: ${result.event.id}`);
      if (result.event.appLink) console.log(`Link: ${result.event.appLink}`);
    }
  } catch (error) {
    const payload = {
      ok: false,
      error: error?.message || String(error),
    };
    console.error(JSON.stringify(payload, null, 2));
    process.exit(1);
  }
})();
