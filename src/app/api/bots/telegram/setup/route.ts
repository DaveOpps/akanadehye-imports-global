import { NextRequest, NextResponse } from "next/server";

const TG = (token: string, method: string) =>
  `https://api.telegram.org/bot${token}/${method}`;

export async function POST(req: NextRequest) {
  let body: { action?: string; token?: string; webhookUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { action, token, webhookUrl } = body;
  if (!token) return NextResponse.json({ ok: false, error: "token required" }, { status: 400 });

  try {
    if (action === "validate") {
      const res = await fetch(TG(token, "getMe"));
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (action === "getWebhookInfo") {
      const res = await fetch(TG(token, "getWebhookInfo"));
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (action === "setWebhook") {
      if (!webhookUrl) return NextResponse.json({ ok: false, error: "webhookUrl required" }, { status: 400 });
      const res = await fetch(TG(token, "setWebhook"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl, drop_pending_updates: true }),
      });
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (action === "deleteWebhook") {
      const res = await fetch(TG(token, "deleteWebhook"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drop_pending_updates: false }),
      });
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
  } catch {
    return NextResponse.json({ ok: false, error: "Telegram API unreachable" }, { status: 502 });
  }
}
