import { prisma } from "./db";

type NotifyPayload = {
  email: string;
  title: string;
  body: string;
  orderId?: string;
  orderNumber?: string;
  customerName?: string;
  status?: string;
};

export async function sendOrderNotification(payload: NotifyPayload) {
  const { email, title, body, orderId, orderNumber, customerName = "Customer", status } = payload;

  // Always store in-app notification
  await prisma.notification.create({
    data: { email, title, body, orderId, orderNumber },
  });

  // Send email if Resend API key is configured
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const statusEmoji: Record<string, string> = {
      confirmed: "✅", shipped: "🚚", delivered: "🎉", cancelled: "❌",
    };
    const emoji = status ? (statusEmoji[status] ?? "📦") : "📦";

    const html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a2744">
        <div style="background:#1a2744;padding:24px 28px;border-radius:12px 12px 0 0">
          <div style="color:#c9a84c;font-size:22px;font-weight:bold">Akanadehye</div>
        </div>
        <div style="background:#fff;padding:28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
          <h2 style="margin:0 0 8px;font-size:20px">${emoji} ${title}</h2>
          <p style="color:#6b7280;margin:0 0 20px">${body.replace(/\n/g, "<br>")}</p>
          ${orderNumber ? `
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 18px;margin-bottom:20px">
              <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;font-weight:600">Order number</div>
              <div style="font-size:18px;font-weight:bold;font-family:monospace;margin-top:4px">${orderNumber}</div>
            </div>
          ` : ""}
          <a href="${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/account"
             style="display:inline-block;background:#1a2744;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px">
            View my orders →
          </a>
          <p style="margin-top:24px;font-size:12px;color:#9ca3af">
            Hi ${customerName}, this email was sent to ${email} because you have an order with Akanadehye.
          </p>
        </div>
      </div>
    `;

    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Akanadehye <orders@akanadehye.com>",
          to: [email],
          subject: title,
          html,
        }),
      });
    } catch {
      // Email failure is non-fatal — in-app notification already saved
    }
  }
}
