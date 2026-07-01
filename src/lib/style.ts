export const STYLE_TAGS = [
  "Minimalist",
  "Abstract",
  "Realism",
  "Impressionist",
  "Line Art",
  "Pop Art",
  "Photography",
  "Sketch",
  "Digital Art",
  "Surreal",
] as const;

export const UNCATEGORIZED = "Uncategorized";

export async function classifyStyle(
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return UNCATEGORIZED;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 20,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: contentType,
                  data: buffer.toString("base64"),
                },
              },
              {
                type: "text",
                text: `Classify this artwork's dominant visual style as exactly one of: ${STYLE_TAGS.join(
                  ", "
                )}. Reply with only the single matching tag, nothing else.`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) return UNCATEGORIZED;

    const data = await response.json();
    const text = (data?.content?.[0]?.text ?? "").trim().toLowerCase();
    const match = STYLE_TAGS.find((tag) => tag.toLowerCase() === text);
    return match ?? UNCATEGORIZED;
  } catch {
    return UNCATEGORIZED;
  }
}
