import { Creem } from "creem";

const isTestMode = process.env.CREEM_TEST_MODE === "true";

export const creem = new Creem({
  apiKey: process.env.CREEM_API_KEY!,
  serverIdx: isTestMode ? 1 : 0,
});
