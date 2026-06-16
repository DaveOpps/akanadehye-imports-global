"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { WHATSAPP_ICON } from "@/components/chatbots/shared";

// ── icons ──────────────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ── helpers ────────────────────────────────────────────────────────────────────

function copyText(text: string, setCopied: (v: boolean) => void) {
  navigator.clipboard.writeText(text).then(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  });
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => copyText(text, setCopied)}
      className="text-xs font-semibold px-2.5 py-1 rounded bg-[color:var(--brand-cream)] hover:bg-[color:var(--brand-gold)]/30 transition"
    >
      {copied ? "✓ Copied" : label}
    </button>
  );
}

function Step({ n, title, done, locked, children }: { n: number; title: string; done: boolean; locked: boolean; children: React.ReactNode }) {
  return (
    <div className={`card space-y-4 transition ${locked ? "opacity-40 pointer-events-none select-none" : ""}`}>
      <div className="flex items-center gap-3">
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold shrink-0 ${done ? "bg-green-600 text-white" : "bg-[color:var(--brand-navy)] text-[color:var(--brand-gold)]"}`}>
          {done ? <CheckIcon /> : n}
        </span>
        <h3 className="font-bold text-base">{title}</h3>
        {done && <span className="ml-auto text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">Done</span>}
      </div>
      {children}
    </div>
  );
}

// ── provider choice ────────────────────────────────────────────────────────────

type Provider = "twilio" | "meta" | null;

// ── Twilio flow ────────────────────────────────────────────────────────────────

function TwilioFlow({ webhookUrl }: { webhookUrl: string }) {
  const [sid, setSid] = useState("");
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validated, setValidated] = useState(false);
  const [account, setAccount] = useState<{ name: string; status: string } | null>(null);
  const [error, setError] = useState("");
  const [copiedEnv, setCopiedEnv] = useState(false);

  const envLine = `TWILIO_ACCOUNT_SID=${sid}\nTWILIO_AUTH_TOKEN=${token}`;

  async function validate() {
    setError(""); setLoading(true);
    const res = await fetch("/api/bots/whatsapp/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "validate", provider: "twilio", accountSid: sid, authToken: token }),
    });
    const data = await res.json() as { ok: boolean; account?: { name: string; status: string }; error?: string };
    setLoading(false);
    if (data.ok && data.account) { setValidated(true); setAccount(data.account); }
    else setError(data.error ?? "Validation failed");
  }

  return (
    <div className="space-y-5">
      {/* Step 1 — credentials */}
      <Step n={1} title="Enter your Twilio credentials" done={validated} locked={false}>
        <p className="text-sm text-[color:var(--muted)]">
          Find these in your <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="underline text-[color:var(--brand-navy)]">Twilio Console</a> dashboard.
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Account SID</label>
            <input
              value={sid}
              onChange={e => { setSid(e.target.value); setValidated(false); setError(""); }}
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="input font-mono text-sm w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Auth Token</label>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={token}
                onChange={e => { setToken(e.target.value); setValidated(false); setError(""); }}
                placeholder="Your auth token"
                className="input font-mono text-sm w-full pr-10"
              />
              <button type="button" onClick={() => setShowToken(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--muted)] hover:text-[color:var(--brand-navy)]">
                <EyeIcon open={showToken} />
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
          {validated && account && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
              <CheckIcon />
              <span><strong>{account.name}</strong> — {account.status}</span>
            </div>
          )}
          <button
            onClick={validate}
            disabled={!sid || !token || loading}
            className="btn-gold text-sm disabled:opacity-50"
          >
            {loading ? "Validating…" : validated ? "✓ Validated" : "Validate credentials"}
          </button>
        </div>
      </Step>

      {/* Step 2 — webhook */}
      <Step n={2} title="Set webhook URL in Twilio console" done={false} locked={!validated}>
        <ol className="text-sm space-y-3">
          <li>1. In Twilio Console → <strong>Messaging → Try it out → Send a WhatsApp message</strong></li>
          <li>2. On the <strong>Sandbox Settings</strong> tab, set <em>&ldquo;When a message comes in&rdquo;</em> to:</li>
        </ol>
        <div className="flex items-center gap-2 bg-[color:var(--brand-cream)] rounded-lg px-3 py-2 font-mono text-xs break-all">
          <span className="flex-1">{webhookUrl}</span>
          <CopyButton text={webhookUrl} />
        </div>
        <p className="text-sm text-[color:var(--muted)]">
          <strong>Local dev?</strong> Run <code className="bg-[color:var(--brand-cream)] px-1.5 py-0.5 rounded text-xs">ngrok http 3000</code> and use the ngrok URL instead until you deploy to Vercel.
        </p>
        <p className="text-sm">3. On WhatsApp, send the sandbox join code to Twilio&apos;s number to activate your number in the sandbox.</p>
      </Step>

      {/* Step 3 — env */}
      <Step n={3} title="Save credentials to .env.local" done={false} locked={!validated}>
        <p className="text-sm text-[color:var(--muted)]">Add these two lines to your <code className="bg-[color:var(--brand-cream)] px-1.5 py-0.5 rounded text-xs">.env.local</code> file, then restart <code className="bg-[color:var(--brand-cream)] px-1.5 py-0.5 rounded text-xs">npm run dev</code>.</p>
        <div className="bg-[color:var(--brand-navy)] text-[color:var(--brand-gold)] rounded-xl px-4 py-3 font-mono text-xs space-y-0.5">
          <p>TWILIO_ACCOUNT_SID={sid || "<your-account-sid>"}</p>
          <p>TWILIO_AUTH_TOKEN={token ? "••••••••" : "<your-auth-token>"}</p>
        </div>
        <button
          onClick={() => copyText(envLine, setCopiedEnv)}
          className="text-sm font-semibold text-[color:var(--brand-navy)] hover:text-[color:var(--brand-clay)] transition"
        >
          {copiedEnv ? "✓ Copied to clipboard" : "Copy env lines →"}
        </button>
      </Step>
    </div>
  );
}

// ── Meta flow ──────────────────────────────────────────────────────────────────

function MetaFlow({ webhookUrl }: { webhookUrl: string }) {
  const [accessToken, setAccessToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [verifyToken] = useState("akanadehye-verify-" + Math.random().toString(36).slice(2, 8));
  const [loading, setLoading] = useState(false);
  const [tokenValidated, setTokenValidated] = useState(false);
  const [phoneValidated, setPhoneValidated] = useState(false);
  const [account, setAccount] = useState<{ id?: string; name?: string } | null>(null);
  const [phone, setPhone] = useState<{ number?: string; name?: string; quality?: string } | null>(null);
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [copiedEnv, setCopiedEnv] = useState(false);

  const envLine = `META_WHATSAPP_TOKEN=${accessToken}\nMETA_WHATSAPP_VERIFY_TOKEN=${verifyToken}\nMETA_PHONE_NUMBER_ID=${phoneNumberId}`;

  async function validateToken() {
    setError(""); setLoading(true);
    const res = await fetch("/api/bots/whatsapp/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "validate", provider: "meta", accessToken }),
    });
    const data = await res.json() as { ok: boolean; account?: { id?: string; name?: string }; error?: string };
    setLoading(false);
    if (data.ok) { setTokenValidated(true); setAccount(data.account ?? null); }
    else setError(data.error ?? "Token invalid");
  }

  async function validatePhone() {
    setPhoneError(""); setLoading(true);
    const res = await fetch("/api/bots/whatsapp/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "validatePhone", provider: "meta", accessToken, phoneNumberId }),
    });
    const data = await res.json() as { ok: boolean; phone?: { number?: string; name?: string; quality?: string }; error?: string };
    setLoading(false);
    if (data.ok) { setPhoneValidated(true); setPhone(data.phone ?? null); }
    else setPhoneError(data.error ?? "Phone number ID invalid");
  }

  return (
    <div className="space-y-5">
      {/* Step 1 — access token */}
      <Step n={1} title="Validate your Meta access token" done={tokenValidated} locked={false}>
        <p className="text-sm text-[color:var(--muted)]">
          Get a permanent token from <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" target="_blank" rel="noopener noreferrer" className="underline text-[color:var(--brand-navy)]">Meta for Developers → WhatsApp → API Setup</a>.
        </p>
        <div className="relative">
          <input
            type={showToken ? "text" : "password"}
            value={accessToken}
            onChange={e => { setAccessToken(e.target.value); setTokenValidated(false); setError(""); }}
            placeholder="EAAxxxxxxx…"
            className="input font-mono text-sm w-full pr-10"
          />
          <button type="button" onClick={() => setShowToken(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--muted)] hover:text-[color:var(--brand-navy)]">
            <EyeIcon open={showToken} />
          </button>
        </div>
        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        {tokenValidated && account && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
            <CheckIcon />
            <span>Token valid — <strong>{account.name ?? account.id}</strong></span>
          </div>
        )}
        <button onClick={validateToken} disabled={!accessToken || loading} className="btn-gold text-sm disabled:opacity-50">
          {loading ? "Validating…" : tokenValidated ? "✓ Token valid" : "Validate token"}
        </button>
      </Step>

      {/* Step 2 — phone number ID */}
      <Step n={2} title="Confirm your WhatsApp Phone Number ID" done={phoneValidated} locked={!tokenValidated}>
        <p className="text-sm text-[color:var(--muted)]">
          Find it in Meta → WhatsApp → API Setup → <strong>Phone Number ID</strong> (not the phone number itself).
        </p>
        <input
          value={phoneNumberId}
          onChange={e => { setPhoneNumberId(e.target.value); setPhoneValidated(false); setPhoneError(""); }}
          placeholder="1234567890123456"
          className="input font-mono text-sm w-full"
        />
        {phoneError && <p className="text-sm text-red-600 font-medium">{phoneError}</p>}
        {phoneValidated && phone && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
            <CheckIcon />
            <span><strong>{phone.number}</strong> — {phone.name} · Quality: {phone.quality}</span>
          </div>
        )}
        <button onClick={validatePhone} disabled={!phoneNumberId || loading} className="btn-gold text-sm disabled:opacity-50">
          {loading ? "Checking…" : phoneValidated ? "✓ Verified" : "Verify phone number ID"}
        </button>
      </Step>

      {/* Step 3 — webhook */}
      <Step n={3} title="Register webhook in Meta Developer Console" done={false} locked={!tokenValidated}>
        <p className="text-sm text-[color:var(--muted)]">Go to Meta → WhatsApp → Configuration → Webhooks. Set:</p>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-[color:var(--muted)] uppercase tracking-wider mb-1">Callback URL</p>
            <div className="flex items-center gap-2 bg-[color:var(--brand-cream)] rounded-lg px-3 py-2 font-mono text-xs break-all">
              <span className="flex-1">{webhookUrl}</span>
              <CopyButton text={webhookUrl} />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-[color:var(--muted)] uppercase tracking-wider mb-1">Verify Token</p>
            <div className="flex items-center gap-2 bg-[color:var(--brand-cream)] rounded-lg px-3 py-2 font-mono text-xs">
              <span className="flex-1">{verifyToken}</span>
              <CopyButton text={verifyToken} />
            </div>
          </div>
          <p className="text-sm">Subscribe to the <strong>messages</strong> webhook field and click <strong>Verify and save</strong>.</p>
        </div>
      </Step>

      {/* Step 4 — env */}
      <Step n={4} title="Save credentials to .env.local" done={false} locked={!tokenValidated}>
        <p className="text-sm text-[color:var(--muted)]">Add these to <code className="bg-[color:var(--brand-cream)] px-1.5 py-0.5 rounded text-xs">.env.local</code> then restart <code className="bg-[color:var(--brand-cream)] px-1.5 py-0.5 rounded text-xs">npm run dev</code>.</p>
        <div className="bg-[color:var(--brand-navy)] text-[color:var(--brand-gold)] rounded-xl px-4 py-3 font-mono text-xs space-y-0.5">
          <p>META_WHATSAPP_TOKEN={accessToken ? "••••••••" : "<your-access-token>"}</p>
          <p>META_WHATSAPP_VERIFY_TOKEN={verifyToken}</p>
          <p>META_PHONE_NUMBER_ID={phoneNumberId || "<your-phone-number-id>"}</p>
        </div>
        <button
          onClick={() => copyText(envLine, setCopiedEnv)}
          className="text-sm font-semibold text-[color:var(--brand-navy)] hover:text-[color:var(--brand-clay)] transition"
        >
          {copiedEnv ? "✓ Copied to clipboard" : "Copy env lines →"}
        </button>
      </Step>
    </div>
  );
}

// ── main page ──────────────────────────────────────────────────────────────────

export default function WhatsAppSetupPage() {
  const [host, setHost] = useState("");
  const [provider, setProvider] = useState<Provider>(null);

  useEffect(() => {
    if (typeof window !== "undefined") setHost(window.location.origin);
  }, []);

  const webhookUrl = `${host}/api/bots/whatsapp`;

  return (
    <div>
      <PageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Engage" },
          { label: "Chatbots", href: "/admin/chatbots" },
          { label: "WhatsApp" },
        ]}
        title="WhatsApp Bot Setup"
        subtitle="Connect your store to WhatsApp in minutes — validate credentials, get your webhook URL, and copy your env vars."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">

          {/* Provider choice */}
          <div className="card">
            <h3 className="font-bold text-base mb-1">Choose your WhatsApp provider</h3>
            <p className="text-sm text-[color:var(--muted)] mb-4">Both send messages through the same bot brain. Twilio is easier to test; Meta is cheaper at scale.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                onClick={() => setProvider("twilio")}
                className={`rounded-xl border-2 p-4 text-left transition ${provider === "twilio" ? "border-[color:var(--brand-navy)] bg-[color:var(--brand-cream)]/60" : "border-[color:var(--border)] hover:border-[color:var(--brand-navy)]/40"}`}
              >
                <div className="font-bold text-sm mb-1 flex items-center gap-2">
                  <span className="inline-flex px-2 py-0.5 rounded bg-[color:var(--brand-gold)] text-[color:var(--brand-navy)] text-[10px] font-bold uppercase tracking-wider">Recommended</span>
                  Twilio Sandbox
                </div>
                <p className="text-xs text-[color:var(--muted)]">Free for testing. No Meta app approval needed. Pay per message in production (~$0.005/msg).</p>
              </button>
              <button
                onClick={() => setProvider("meta")}
                className={`rounded-xl border-2 p-4 text-left transition ${provider === "meta" ? "border-[color:var(--brand-navy)] bg-[color:var(--brand-cream)]/60" : "border-[color:var(--border)] hover:border-[color:var(--brand-navy)]/40"}`}
              >
                <div className="font-bold text-sm mb-1">Meta Cloud API</div>
                <p className="text-xs text-[color:var(--muted)]">1,000 free service conversations/month. Requires a verified Facebook Business. Best for production.</p>
              </button>
            </div>
          </div>

          {/* Provider-specific flow */}
          {provider === "twilio" && <TwilioFlow webhookUrl={webhookUrl} />}
          {provider === "meta" && <MetaFlow webhookUrl={webhookUrl} />}

          {!provider && (
            <div className="card text-center text-[color:var(--muted)] py-10">
              <div className="text-4xl mb-3">
                <svg className="mx-auto" width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path d={WHATSAPP_ICON} fill="currentColor" />
                </svg>
              </div>
              <p className="font-semibold text-[color:var(--brand-navy)]">Select a provider above to start</p>
              <p className="text-sm mt-1">Not sure? Pick <strong>Twilio</strong> — you can switch later.</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="card !p-4">
            <h3 className="font-bold text-sm mb-2">Your webhook URL</h3>
            <div className="font-mono text-xs break-all bg-[color:var(--brand-cream)] p-2.5 rounded-lg mb-2">
              {webhookUrl || "http://localhost:3000/api/bots/whatsapp"}
            </div>
            <CopyButton text={webhookUrl} label="Copy URL" />
          </div>

          <div className="card !p-4">
            <h3 className="font-bold text-sm mb-3">Cost comparison</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[color:var(--muted)] border-b border-[color:var(--border)]">
                  <th className="text-left pb-1.5"></th>
                  <th className="text-right pb-1.5">Twilio</th>
                  <th className="text-right pb-1.5">Meta</th>
                </tr>
              </thead>
              <tbody className="space-y-1">
                {[
                  ["Dev / sandbox", "Free", "Free*"],
                  ["Per message", "~$0.005", "Free†"],
                  ["Approval", "None", "Required"],
                  ["Setup time", "5 min", "1–2 days"],
                ].map(([label, twilio, meta]) => (
                  <tr key={label} className="border-b border-[color:var(--border)]/40 last:border-0">
                    <td className="py-1.5 text-[color:var(--muted)]">{label}</td>
                    <td className="py-1.5 text-right font-medium">{twilio}</td>
                    <td className="py-1.5 text-right font-medium">{meta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] text-[color:var(--muted)] mt-2">* Sandbox only. † Within free tier (1k convos/mo).</p>
          </div>

          <div className="card !p-4 bg-[color:var(--brand-cream)]/50">
            <h3 className="font-bold text-sm mb-2">Tips</h3>
            <ul className="text-xs space-y-2 text-[color:var(--muted)]">
              <li>• On localhost, use <strong>ngrok</strong> to get a public URL for Twilio webhooks</li>
              <li>• Once on Vercel, use your <code className="bg-white px-1 rounded">*.vercel.app</code> URL as the webhook</li>
              <li>• Both providers use the same bot brain — your persona and product catalog carry over automatically</li>
              <li>• Test the bot anytime at <a href="/admin/chatbots/test" className="underline text-[color:var(--brand-navy)]">Chatbots → Test</a></li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
