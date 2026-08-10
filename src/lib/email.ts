import { adminNotificationEmail, emailFrom, resendApiKey } from "@/lib/env";

type NotificationEmail = {
  to?: string | null;
  subject: string;
  title: string;
  replyTo?: string | null;
  intro?: string;
  rows?: { label: string; value: string | null | undefined }[];
  actionUrl?: string | null;
  actionLabel?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function notificationHtml({ title, intro, rows = [], actionUrl, actionLabel = "Open" }: NotificationEmail) {
  const safeRows = rows.filter((row) => row.value);

  return `
    <div style="font-family: Inter, Segoe UI, sans-serif; background:#faf8f2; padding:32px;">
      <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e7e0d2; border-radius:18px; padding:28px;">
        <p style="margin:0 0 10px; color:#4f6f52; font-size:12px; font-weight:700; letter-spacing:.04em; text-transform:uppercase;">Bansko NOW</p>
        <h1 style="margin:0; color:#171611; font-family: Georgia, serif; font-size:32px; line-height:1.15;">${escapeHtml(title)}</h1>
        ${intro ? `<p style="margin:18px 0 0; color:#5f5a50; font-size:16px; line-height:1.6;">${escapeHtml(intro)}</p>` : ""}
        ${
          safeRows.length
            ? `<table style="width:100%; margin-top:24px; border-collapse:collapse;">
                ${safeRows
                  .map(
                    (row) => `
                      <tr>
                        <td style="width:34%; padding:10px 0; border-top:1px solid #f2eadb; color:#7a7469; font-size:13px;">${escapeHtml(row.label)}</td>
                        <td style="padding:10px 0; border-top:1px solid #f2eadb; color:#171611; font-size:14px; font-weight:600;">${escapeHtml(row.value || "")}</td>
                      </tr>
                    `
                  )
                  .join("")}
              </table>`
            : ""
        }
        ${
          actionUrl
            ? `<p style="margin:26px 0 0;"><a href="${escapeHtml(actionUrl)}" style="display:inline-block; background:#183b2a; color:#fff; padding:12px 18px; border-radius:999px; font-size:14px; font-weight:700; text-decoration:none;">${escapeHtml(actionLabel)}</a></p>`
            : ""
        }
      </div>
    </div>
  `;
}

export async function sendNotificationEmail(message: NotificationEmail) {
  const to = message.to || adminNotificationEmail;

  if (!resendApiKey || !to) {
    console.warn("[email skipped] Missing RESEND_API_KEY or notification recipient", { subject: message.subject });
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: emailFrom,
        to,
        reply_to: message.replyTo || undefined,
        subject: message.subject,
        html: notificationHtml(message)
      })
    });

    if (!response.ok) {
      const details = await response.text();
      console.error("[email rejected]", { status: response.status, subject: message.subject, details });
      return false;
    }

    return true;
  } catch (error) {
    console.error("[email failed]", error);
    return false;
  }
}
