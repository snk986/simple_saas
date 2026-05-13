const DEFAULT_TEST_API_URL = "https://test-api.creem.io/v1";
const DEFAULT_PROD_API_URL = "https://api.creem.io/v1";

function getCreemConfig() {
  const isTestMode = process.env.CREEM_TEST_MODE === "true";
  const apiKey = process.env.CREEM_API_KEY;

  if (!apiKey) {
    throw new Error("CREEM_API_KEY is not configured");
  }

  const baseUrl = (
    process.env.CREEM_API_URL ??
    (isTestMode ? DEFAULT_TEST_API_URL : DEFAULT_PROD_API_URL)
  ).replace(/\/$/, "");

  return { apiKey, baseUrl };
}

async function postJson(path: string, body: Record<string, unknown>) {
  const { apiKey, baseUrl } = getCreemConfig();
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Creem API ${response.status}: ${text || response.statusText}`);
  }

  return response.json();
}

export const creem = {
  checkouts: {
    create(payload: {
      productId: string;
      customer: { email?: string | null };
      successUrl: string;
      metadata?: Record<string, unknown>;
    }) {
      return postJson("/checkouts", payload);
    },
  },
  customers: {
    generateBillingLinks(payload: { customerId: string }) {
      return postJson("/customers/billing", payload);
    },
  },
};
