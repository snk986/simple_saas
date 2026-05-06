import {
  buildAnalyzeInputPrompt,
  buildLyricsPrompt,
  type InputAnalysis,
  type LyricsDraft,
} from "./prompts";
import type { SongStyle } from "@/config/styles";

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-3-5-sonnet-latest";

interface ClaudeMessageResponse {
  content?: Array<{ type: string; text?: string }>;
}

class ClaudeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClaudeError";
  }
}

function extractJson<T>(text: string): T {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new ClaudeError("Claude returned a non-JSON response");
  }

  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}

async function requestClaude(prompt: string, attempt = 0): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new ClaudeError("ANTHROPIC_API_KEY is not configured");
  }

  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
      max_tokens: 1800,
      temperature: 0.8,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    if (attempt === 0 && response.status >= 500) {
      return requestClaude(prompt, attempt + 1);
    }

    throw new ClaudeError(`Claude request failed with ${response.status}`);
  }

  const data = (await response.json()) as ClaudeMessageResponse;
  const text = data.content
    ?.filter((item) => item.type === "text")
    .map((item) => item.text ?? "")
    .join("\n")
    .trim();

  if (!text) {
    throw new ClaudeError("Claude returned an empty response");
  }

  return text;
}

export async function analyzeInput(
  userInput: string,
  locale: string,
): Promise<InputAnalysis> {
  const text = await requestClaude(buildAnalyzeInputPrompt(userInput, locale));
  return extractJson<InputAnalysis>(text);
}

export async function generateLyrics(input: {
  userInput: string;
  locale: string;
  analysis: InputAnalysis;
  style: SongStyle;
  previousLyrics?: string;
}): Promise<LyricsDraft> {
  const text = await requestClaude(buildLyricsPrompt(input));
  const draft = extractJson<LyricsDraft>(text);

  return {
    title: draft.title.trim(),
    lyrics: draft.lyrics.trim(),
  };
}
