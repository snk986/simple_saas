import type { SongStyle } from "@/config/styles";

export interface InputAnalysis {
  flagged: boolean;
  reason?: string;
  emotion: string;
  theme: string;
  title_seed: string;
  style_key?: string;
  perspective: "first_person" | "second_person" | "third_person";
}

export interface LyricsDraft {
  title: string;
  lyrics: string;
  suno_style_prompt?: string;
  style_params?: SongStyle["params"];
  style_tags?: string[];
  vocal_casting?: string;
  generation_notes?: string;
}

export interface JudgeReportPromptInput {
  title: string;
  lyrics: string;
  userInput: string;
  styleParams: Record<string, unknown>;
  styleTags: string[];
  locale: string;
}

export function buildAnalyzeInputPrompt(userInput: string, locale: string) {
  return `Analyze this user story for an AI song creation flow.

Return only valid JSON with this shape:
{
  "flagged": boolean,
  "reason": string,
  "emotion": string,
  "theme": string,
  "title_seed": string,
  "style_key": "heartbreak" | "joy" | "nostalgia" | "empowerment" | "chill",
  "perspective": "first_person" | "second_person" | "third_person"
}

If the story contains hateful, sexual content involving minors, coercive sexual content, exploitative content, graphic violent instructions, self-harm instructional content, or otherwise disallowed content, set flagged to true and provide a brief reason. Adult explicit language or mature consensual adult themes are allowed unless they contain those disallowed elements. Otherwise set flagged to false.

Locale for output lyrics later: ${locale}

Story:
${userInput}`;
}

export function buildLyricsPrompt(input: {
  userInput: string;
  locale: string;
  analysis: InputAnalysis;
  style: SongStyle;
  previousLyrics?: string;
}) {
  const previous = input.previousLyrics
    ? `Avoid repeating this previous draft too closely:\n${input.previousLyrics}`
    : "This is the first draft.";

  return `You are a professional English songwriter, topliner, and Suno production prompt designer.

Create one complete, commercially compelling song from the user's story. The result should feel strong enough that an independent musician would want to generate and demo it immediately.

Return only valid JSON with this shape:
{
  "title": string,
  "lyrics": string,
  "suno_style_prompt": string,
  "style_params": {
    "genre": string,
    "bpm": number,
    "instruments": string[],
    "vocals": string,
    "mood": string
  },
  "style_tags": string[],
  "vocal_casting": string,
  "generation_notes": string
}

Rules:
- Write the first production version in polished English unless the user explicitly asks for another language. The app locale is "${input.locale}".
- Write one song only.
- Prioritize a powerful hook, natural phrasing, concrete imagery, and a strong vocal concept.
- Aim for a complete song arc rather than a short jingle. Let the structure serve the idea, but avoid underdeveloped drafts that would naturally end around 90 seconds.
- Choose the structure organically from the song concept. A full song may use variations of intro, verses, hook/chorus, bridge, breakdown, final lift, or outro, but do not force every section when it hurts the song.
- For rap or pop-rap songs, give the rap verses enough substance to establish character, story, and rhythm pocket. Let the hook return only as often as the song naturally needs.
- Use clear Suno-friendly section labels. Combine performance cues into the same bracket when useful, e.g. [Chorus - Female Sung Hook, harmonies], not stacked tags on separate lines.
- Use 4 to 8 enriched section cues total. Do not over-tag.
- Verses need specific images, objects, places, actions, or emotional details from the user's input. Avoid vague filler.
- The chorus must be short, repeatable, easy to sing, and should include the title phrase or a close variation.
- Write lines to be sung, not just read. Avoid awkward stress, clunky grammar, and overlong lines.
- Choose the best vocal architecture for the song. Do not default to one formula.
- Possible vocal architectures include solo female pop lead, solo male pop lead, intimate singer-songwriter lead, male rap lead with female sung hook, female rap lead with sung hook, duet conversation, R&B lead with harmony stacks, rock band lead vocal, group chant, choir response, or spoken intro plus sung chorus.
- Use male rap lead + female sung hook only when the story and genre clearly benefit from contrast between rap/spoken narrative and sung emotional release.
- If the user asks for explicit language or mature adult themes, allow tasteful explicit lyrics. Do not include sexual content involving minors, coercion, hate, threats, or graphic violence.
- Do not imitate or name any real artist. Translate any artist-like request into genre, vocal, instrumentation, and production traits.
- Do not mention AI, prompts, platforms, or that this is generated.
- Do not include markdown fences.
- Keep the title under 8 words.

Suno style prompt rules:
- Make "suno_style_prompt" optimized for Suno custom mode while staying compatible with minimax-music/v2.
- Keep it compact: 180 to 300 characters.
- Start with one clear genre anchor, then modifiers.
- Include plausible BPM and key.
- Include vocal identity/casting, not just "male/female vocal".
- Include at least one or two instruments with roles, e.g. "muted guitar chops carry groove".
- Include production texture and arrangement motion.
- Avoid incompatible genre stacks, abstract adjective piles, too many negative instructions, and direct artist references.
- For minimax-music/v2 compatibility, keep the prompt musical and concrete rather than relying only on Suno-specific tags.

Quality bar:
- The song should feel more like a real topline demo than generic AI lyrics.
- Prefer fresh titles and hook phrases over common phrases like "never let go", "in the night", "feel alive", unless made specific.
- Make the user feel: "I want to hear this generated right now."

Context:
The app may pass a short user idea plus optional requested style/title. Treat weak inputs as a creative brief and complete missing details yourself.

Base musical direction to consider, but improve when the song needs a stronger concept:
${input.style.prompt}

${previous}

User story / brief:
${input.userInput}

Input analysis:
${JSON.stringify(input.analysis)}

Return valid JSON only.`;
}

export function buildJudgeReportPrompt(input: JudgeReportPromptInput) {
  return `Create an AI music report that first feels like a real friend understood the songwriter.

The user's deeper motivation is often not only to get a song, but to feel seen and understood. Before giving professional feedback, speak to the songwriter like a close friend who has been through a similar feeling and is standing on their side.

Return only valid JSON with this exact shape:
{
  "total_score": number,
  "dimensions": [
    {
      "dimension": "melody_potential" | "lyric_quality" | "emotional_resonance" | "commercial_appeal" | "originality",
      "score": number,
      "comment": string
    }
  ],
  "emotional_mirror": string,
  "what_you_captured": string,
  "most_touching_moment": string,
  "listener_feeling": string,
  "gentle_polish": string,
  "producer_comment": string,
  "emotional_value": string,
  "market_positioning": string,
  "hook_analysis": string,
  "strengths": string[],
  "improvements": string[],
  "recommended_next_steps": string[],
  "share_summary": string,
  "generated_at": string
}

Rules:
- Write the report in locale "${input.locale}".
- Include exactly these five dimensions: melody_potential, lyric_quality, emotional_resonance, commercial_appeal, originality.
- Every score must be an integer from 0 to 100.
- total_score must be an integer from 0 to 100 and should reflect the dimension scores.
- "emotional_mirror" is the emotional heart of the report. Write it as one natural paragraph, 120-220 words.
- The voice of "emotional_mirror" should feel like the songwriter's good friend, not a judge, therapist, marketer, or report writer.
- Do not structure "emotional_mirror" like analysis, advice, or bullet points. It should read like something a real person would say directly to the songwriter.
- Start from the songwriter's side. First interpret what the lyrics are really saying, then show you understand the feeling behind them, then gently encourage or praise them.
- It can sound conversational, e.g. "I get it", "you say you're fine, but...", "honestly, this feels like...", "that part is real because...". Keep it warm and grounded, not cheesy.
- Use second person where natural. Make the user feel: "someone gets me."
- Praise must be specific to details in the story, lyrics, title, emotional arc, or style. Do not use empty praise.
- Name the underlying feeling, not only the surface topic. For example: pride disguised as chill, grief made danceable, loneliness turned into motion, longing kept dignified, joy used as self-protection.
- "what_you_captured", "most_touching_moment", "listener_feeling", and "gentle_polish" should still be filled, but keep them short and supportive because the page may mainly show emotional_mirror.
- Keep the professional sections useful for a songwriter or producer.
- Do not make medical, legal, financial, or guaranteed commercial success claims.
- Do not mention prompts, API calls, hidden scoring logic, or that this is generated.
- Do not include markdown fences.
- Use generated_at as an ISO timestamp.

Song title:
${input.title}

Original user story:
${input.userInput}

Lyrics:
${input.lyrics}

Style params:
${JSON.stringify(input.styleParams)}

Style tags:
${input.styleTags.join(", ")}`;
}
