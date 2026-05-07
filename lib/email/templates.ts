import "server-only";

import enMessages from "@/messages/en.json";
import esMessages from "@/messages/es.json";
import jaMessages from "@/messages/ja.json";
import koMessages from "@/messages/ko.json";
import ptMessages from "@/messages/pt.json";
import { defaultLocale, isLocale, type Locale } from "@/i18n/routing";
import type { RecallScenario } from "@/lib/recall/types";

type RecallTemplateInput = {
  locale: string;
  scenario: RecallScenario;
  songTitle?: string;
  ctaUrl: string;
};

type RecallTemplate = {
  subject: string;
  preheader: string;
  title: string;
  body: string;
  cta: string;
  footer: string;
};

const messagesByLocale = {
  en: enMessages,
  es: esMessages,
  pt: ptMessages,
  ja: jaMessages,
  ko: koMessages,
} satisfies Record<Locale, typeof enMessages>;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function replaceVars(value: string, variables: Record<string, string>) {
  return Object.entries(variables).reduce(
    (text, [key, replacement]) => text.replaceAll(`{${key}}`, replacement),
    value,
  );
}

function resolveLocale(locale: string): Locale {
  return isLocale(locale) ? locale : defaultLocale;
}

export function buildRecallEmail(input: RecallTemplateInput) {
  const locale = resolveLocale(input.locale);
  const messages = messagesByLocale[locale];
  const template = messages.email.recall[input.scenario] as RecallTemplate;
  const songTitle = input.songTitle ?? messages.email.recall.fallbackSongTitle;
  const variables = { songTitle };

  const subject = replaceVars(template.subject, variables);
  const preheader = replaceVars(template.preheader, variables);
  const title = replaceVars(template.title, variables);
  const body = replaceVars(template.body, variables);
  const cta = replaceVars(template.cta, variables);
  const footer = replaceVars(template.footer, variables);

  const html = `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;background:#f8fafc;color:#111827;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</div>
    <main style="max-width:560px;margin:0 auto;padding:32px 20px;">
      <section style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:28px;">
        <p style="margin:0 0 18px;color:#6b7280;font-size:14px;">Hit-Song</p>
        <h1 style="margin:0 0 16px;color:#111827;font-size:24px;line-height:1.25;">${escapeHtml(title)}</h1>
        <p style="margin:0 0 24px;color:#374151;font-size:16px;line-height:1.6;">${escapeHtml(body)}</p>
        <a href="${escapeHtml(input.ctaUrl)}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;border-radius:6px;padding:12px 18px;font-weight:700;">${escapeHtml(cta)}</a>
        <p style="margin:28px 0 0;color:#6b7280;font-size:12px;line-height:1.5;">${escapeHtml(footer)}</p>
      </section>
    </main>
  </body>
</html>`;

  const text = `${title}\n\n${body}\n\n${cta}: ${input.ctaUrl}\n\n${footer}`;

  return { subject, html, text };
}
