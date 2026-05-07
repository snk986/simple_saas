import "server-only";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type ResendError = {
  message?: string;
  error?: string;
};

const RESEND_API_URL = "https://api.resend.com/emails";
const DEFAULT_FROM = "Hit-Song <noreply@hit-song.ai>";

function getFromAddress() {
  return process.env.RESEND_FROM_EMAIL ?? process.env.EMAIL_FROM ?? DEFAULT_FROM;
}

async function sendEmailOnce(input: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("Email provider is not configured");
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getFromAddress(),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    let providerError: ResendError | null = null;

    try {
      providerError = (await response.json()) as ResendError;
    } catch {
      providerError = null;
    }

    throw new Error(
      providerError?.message ??
        providerError?.error ??
        `Email provider returned ${response.status}`,
    );
  }
}

export async function sendEmail(input: SendEmailInput) {
  try {
    await sendEmailOnce(input);
  } catch (error) {
    if (error instanceof Error && error.message === "Email provider is not configured") {
      throw error;
    }

    await sendEmailOnce(input);
  }
}
