const MAX_CODE_LENGTH = 20000;

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Vercel parses JSON bodies, but be defensive in case it arrives as a string.
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (_) { body = {}; }
  }

  const code = body && typeof body.code === "string" ? body.code : "";
  const language = body && typeof body.language === "string" ? body.language : "Other";

  if (!code.trim()) {
    return res.status(400).json({ error: "No code provided." });
  }

  if (code.length > MAX_CODE_LENGTH) {
    return res.status(400).json({
      error: `Your code is a bit too long. Please keep it under ${MAX_CODE_LENGTH.toLocaleString()} characters.`,
    });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server configuration error." });
  }

  const prompt = `You are a code-to-HTML converter tool. Your job is to take a student's code and produce a clean, complete HTML webpage that visually represents what the code does — its output, logic flow, or purpose — without changing anything about the code's behavior or logic.

Rules:
- Output ONLY raw HTML. No markdown, no code fences, no explanation, no comments outside the HTML.
- The HTML must be a complete document (<!DOCTYPE html>, <html>, <head>, <body>).
- Represent the code's output or behavior visually on the page (e.g. if it's a calculator, show a calculator UI; if it prints text, show that text nicely).
- Keep the look clean, modern, and student-friendly.
- Do NOT mention AI, machine learning, or any conversion tool anywhere in the HTML.
- Do NOT add any features or logic the original code doesn't have.
- The page should feel like the student built it themselves.

Language: ${language}

Code:
\`\`\`
${code}
\`\`\`

Respond with only the complete HTML document, nothing else.`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 8192,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Groq error:", response.status, err);
      return res.status(500).json({ error: "Conversion failed. Please try again." });
    }

    const data = await response.json();
    let html = data?.choices?.[0]?.message?.content || "";

    // Strip any accidental markdown code fences
    html = html
      .replace(/^\s*```[a-z]*\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "")
      .trim();

    if (!html) {
      return res.status(500).json({ error: "Conversion failed. Please try again." });
    }

    return res.status(200).json({ html });
  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};
