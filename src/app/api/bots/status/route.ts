import { NextResponse } from "next/server";
import { claudeStatus } from "@/lib/claudeBot";

/**
 * Bot connection status.
 *
 * Reads server-side env vars to determine whether each bot channel is wired
 * up, and whether the brain is Claude-powered or pattern-matching fallback.
 */
export type BotStatus = {
  telegram: {
    configured: boolean;
    /** Last 6 chars of the bot token so user can tell which one is wired */
    hint: string | null;
  };
  whatsapp: {
    twilio: boolean;
    meta: boolean;
    /** Aggregate — true if either path is configured */
    configured: boolean;
  };
  claude: {
    configured: boolean;
    /** Model in use when configured (defaults to claude-opus-4-8) */
    model: string | null;
  };
};

export async function GET() {
  const tgToken = process.env.TELEGRAM_BOT_TOKEN ?? "";
  const twilioAccount = process.env.TWILIO_ACCOUNT_SID ?? "";
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN ?? "";
  const metaToken = process.env.META_WHATSAPP_TOKEN ?? "";

  const status: BotStatus = {
    telegram: {
      configured: tgToken.length > 10,
      hint: tgToken.length > 10 ? `••• ${tgToken.slice(-6)}` : null,
    },
    whatsapp: {
      twilio: twilioAccount.length > 0 && twilioAuth.length > 0,
      meta: metaToken.length > 10,
      configured:
        (twilioAccount.length > 0 && twilioAuth.length > 0) || metaToken.length > 10,
    },
    claude: claudeStatus(),
  };

  return NextResponse.json(status);
}
