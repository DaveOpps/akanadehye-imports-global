import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let body: Record<string, string>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 }); }

  const { action, provider } = body;

  // ── Twilio ──────────────────────────────────────────────────────────────────
  if (provider === "twilio") {
    const sid = body.accountSid?.trim();
    const token = body.authToken?.trim();
    if (!sid || !token) return NextResponse.json({ ok: false, error: "accountSid and authToken required" }, { status: 400 });

    if (action === "validate") {
      try {
        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
          headers: {
            Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
          },
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { message?: string };
          return NextResponse.json({ ok: false, error: err.message ?? `Twilio error ${res.status}` });
        }
        const data = await res.json() as { friendly_name?: string; status?: string; date_created?: string };
        return NextResponse.json({
          ok: true,
          account: {
            name: data.friendly_name ?? sid,
            status: data.status ?? "active",
            created: data.date_created,
          },
        });
      } catch {
        return NextResponse.json({ ok: false, error: "Twilio API unreachable" }, { status: 502 });
      }
    }
  }

  // ── Meta Cloud API ───────────────────────────────────────────────────────────
  if (provider === "meta") {
    const token = body.accessToken?.trim();
    const phoneNumberId = body.phoneNumberId?.trim();

    if (action === "validate") {
      if (!token) return NextResponse.json({ ok: false, error: "accessToken required" }, { status: 400 });
      try {
        const res = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${token}`);
        const data = await res.json() as { id?: string; name?: string; error?: { message: string } };
        if (data.error) return NextResponse.json({ ok: false, error: data.error.message });
        return NextResponse.json({ ok: true, account: { id: data.id, name: data.name } });
      } catch {
        return NextResponse.json({ ok: false, error: "Meta API unreachable" }, { status: 502 });
      }
    }

    if (action === "validatePhone") {
      if (!token || !phoneNumberId) return NextResponse.json({ ok: false, error: "accessToken and phoneNumberId required" }, { status: 400 });
      try {
        const res = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}?access_token=${token}`);
        const data = await res.json() as { display_phone_number?: string; verified_name?: string; quality_rating?: string; error?: { message: string } };
        if (data.error) return NextResponse.json({ ok: false, error: data.error.message });
        return NextResponse.json({
          ok: true,
          phone: {
            number: data.display_phone_number,
            name: data.verified_name,
            quality: data.quality_rating,
          },
        });
      } catch {
        return NextResponse.json({ ok: false, error: "Meta API unreachable" }, { status: 502 });
      }
    }
  }

  return NextResponse.json({ ok: false, error: "Unknown action or provider" }, { status: 400 });
}
