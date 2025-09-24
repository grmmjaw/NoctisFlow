import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // set in terminal, never hardcode
});

app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are a legal assistant for legal professionals. Provide clear, neutral legal information, but never give direct legal advice.
Always start your response with the following disclaimer:

"⚠️ Disclaimer: I am not providing legal advice. Always consult a licensed attorney for professional legal guidance."
          `,
        },
        { role: "user", content: question },
      ],
    });

    const aiAnswer = response.choices[0].message.content;
    const disclaimer = "⚠️ Disclaimer: I am not providing legal advice. Always consult a licensed attorney for professional legal guidance.\n\n";

    // Prepend disclaimer to guarantee it appears
    res.json({ answer: disclaimer + aiAnswer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});
