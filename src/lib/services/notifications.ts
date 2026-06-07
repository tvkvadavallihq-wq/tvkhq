import { isSupabaseConfigured } from "@/lib/env";
import { log } from "@/lib/services/logger";

export type NotificationTarget = {
  name: string;
  phone?: string | null;
  email?: string | null;
};

export type NotificationMessage = {
  subject: string;
  body: string;
  whatsappBody?: string;
};

async function placeholderSend(channel: "whatsapp" | "sms" | "email", target: NotificationTarget, message: NotificationMessage) {
  const providerConfigured =
    process.env.WHATSAPP_API_URL || process.env.SMS_API_URL || process.env.EMAIL_API_URL || process.env.RESEND_API_KEY || process.env.SMTP_HOST;

  if (!isSupabaseConfigured()) {
    return { delivered: false, reason: "Supabase not configured" };
  }

  if (!providerConfigured) {
    log("info", `${channel} placeholder`, { target, subject: message.subject });
    return { delivered: false, reason: "Provider not configured" };
  }

  log("info", `${channel} send queued`, { target, subject: message.subject });
  return { delivered: true };
}

export async function sendWhatsAppMessage(target: NotificationTarget, message: NotificationMessage) {
  return placeholderSend("whatsapp", target, message);
}

export async function sendSmsMessage(target: NotificationTarget, message: NotificationMessage) {
  return placeholderSend("sms", target, message);
}

export async function sendEmailMessage(target: NotificationTarget, message: NotificationMessage) {
  return placeholderSend("email", target, message);
}

export async function notifyComplaintCreated(target: NotificationTarget, trackingId: string, wardLabel: string, categoryNameTa: string) {
  const message: NotificationMessage = {
    subject: `புகார் பதிவு செய்யப்பட்டது ${trackingId}`,
    body: `உங்கள் புகார் ${trackingId} பதிவு செய்யப்பட்டது. ${wardLabel} · ${categoryNameTa}`,
    whatsappBody: `TVK Vadavalli HQ: உங்கள் புகார் ${trackingId} பதிவு செய்யப்பட்டது.`,
  };

  await Promise.all([
    sendWhatsAppMessage(target, message),
    sendSmsMessage(target, message),
    sendEmailMessage(target, message),
  ]);
}

export async function notifyComplaintStatusChange(target: NotificationTarget, trackingId: string, statusText: string) {
  const message: NotificationMessage = {
    subject: `புகார் நிலை புதுப்பிப்பு ${trackingId}`,
    body: `உங்கள் புகார் ${trackingId} இன் நிலை ${statusText} ஆக மாற்றப்பட்டது.`,
    whatsappBody: `TVK Vadavalli HQ: உங்கள் புகார் ${trackingId} → ${statusText}.`,
  };

  await Promise.all([
    sendWhatsAppMessage(target, message),
    sendSmsMessage(target, message),
    sendEmailMessage(target, message),
  ]);
}
