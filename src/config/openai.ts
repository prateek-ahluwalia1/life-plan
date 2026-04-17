import OpenAI from "openai";
const openai = new OpenAI({ apiKey: String(process.env.OPENAI_API_KEY) });

export { openai };
