import { GoogleGenAI } from "@google/genai";
import type { Commentary, MatchStats } from "@/lib/types";

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    segments: {
      type: "array",
      minItems: 6,
      maxItems: 6,
      items: {
        type: "object",
        properties: {
          minute: { type: "string", description: "Match minute marker like \"1'\", \"45+2'\", \"90'\"" },
          title: { type: "string", description: "Segment title, e.g. KICKOFF, HALFTIME PUNDIT ANALYSIS" },
          text: { type: "string", description: "2-4 sentences of dramatic football commentary" },
        },
        required: ["minute", "title", "text"],
      },
    },
    playerCard: {
      type: "object",
      properties: {
        position: { type: "string", description: "Football/dev hybrid position, e.g. Box-to-Box Fullstack" },
        rating: { type: "integer", minimum: 40, maximum: 99 },
        playingStyle: { type: "string" },
        signatureMove: { type: "string" },
        topSkills: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
      },
      required: ["position", "rating", "playingStyle", "signatureMove", "topSkills"],
    },
  },
  required: ["segments", "playerCard"],
};

const SYSTEM = `You are the world's most passionate football (soccer) commentator, hired to narrate a
developer's GitHub year as if it were a World Cup final. You receive their real GitHub statistics.

Rules:
- Produce EXACTLY 6 segments in order: Kickoff (early minutes), First Half, Halftime Pundit Analysis,
  Second Half, Extra Time, Final Whistle.
- Reference the REAL numbers from the stats (commits, streaks, languages, stars, busiest day,
  night-owl percentage). Never invent statistics.
- Full football drama: GOOOAL calls for big days, VAR checks for force-push energy, crowd noise,
  rivalry tension. Halftime segment is calm tactical pundit analysis of their language choices.
- Playful, celebratory, never mean. A quiet year is an underdog story, not a failure.
- Player card position must fuse football and dev vocabulary (e.g. "Box-to-Box Fullstack",
  "Deep-Lying Backend Playmaker"). Rating reflects activity level honestly but generously.`;

export async function generateCommentary(stats: MatchStats): Promise<Commentary> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    contents: `Here are the player's GitHub stats for the season:\n${JSON.stringify(stats, null, 2)}`,
    config: {
      systemInstruction: SYSTEM,
      temperature: 1.0,
      responseMimeType: "application/json",
      responseJsonSchema: RESPONSE_SCHEMA,
    },
  });
  const text = response.text;
  if (!text) throw new Error("Empty Gemini response");
  return JSON.parse(text) as Commentary;
}
