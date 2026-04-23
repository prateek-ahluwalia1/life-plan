import { openai } from "../config/openai";
import type { WhereIAmNowPayload } from "../types/whereIAmNow";

interface AIQuestion {
  id: string;
  domain: string;
  question: string;
  prompt: string;
  guidance?: string;
  examples: string[];
  core?: string;
}

const validateAIResponse = <T>(
  data: unknown,
  expectedType: "question-array" | "question-object" | "string"
): T | null => {
  try {
    if (expectedType === "question-array" && Array.isArray(data)) {
      const questions = data as any[];
      return questions.every(
        (q) =>
          typeof q.id === "string" &&
          typeof q.domain === "string" &&
          typeof q.question === "string"
      ) ? (questions as T) : null;
    }

    if (expectedType === "question-object" && typeof data === "object" && data !== null) {
      const obj = data as Record<string, any>;
      const domains = ["personal", "family", "church", "vocation", "community"];
      return domains.every((domain) => Array.isArray(obj[domain]))
        ? (data as T)
        : null;
    }

    if (expectedType === "string" && typeof data === "string") {
      return (data as T);
    }

    return null;
  } catch {
    return null;
  }
};

const safeJsonParse = (content: string): unknown => {
  try {
    return JSON.parse(content);
  } catch {
    console.error("Failed to parse JSON response:", content.substring(0, 100));
    return null;
  }
};

export const generateGettingStartedQuestions = async (
  userName: string,
): Promise<AIQuestion[]> => {
  const firstName = userName.split(" ")[0] || userName.split("@")[0] || "Friend";

  try {
    const domains = [
      {
        id: "overall",
        label: "Orientation",
        context: "The user's overarching hope or objective for the entire LifePlan process. This is the 'big picture' goal."
      },
      { id: "personal", label: "Personal", context: "physical health, emotional wellbeing, intellectual growth, and spiritual life" },
      { id: "family", label: "Family & Friends", context: "spouse, children, parents, extended family, and close friends" },
      { id: "church", label: "Church & Kingdom", context: "faith practice, ministry, calling, discipleship, and spiritual community" },
      { id: "vocation", label: "Vocation", context: "career, work, daily responsibilities, and professional growth" },
      { id: "community", label: "Community", context: "neighborhood, civic engagement, volunteer work, and giving back" },
    ];

    const systemPrompt = `You are a thoughtful guide helping people reflect on their life goals. Generate a thoughtful, personalized question for ONE specific life domain.

CRITICAL NAME PLACEMENT RULES:
❌ FORBIDDEN: You must NEVER start the question with the user's name. Do NOT write "[Name], [question]".
✅ REQUIRED: You must place the name in the MIDDLE or at the END of the question.

EXAMPLES OF REQUIRED FORMAT:
- "What steps can you take to improve your physical health, ${firstName}?" (Name at end)
- "When you think about your spiritual life, ${firstName}, what does thriving look like?" (Name in middle)

OTHER REQUIREMENTS:
✅ The question must be warm, open-ended, and inviting
✅ Include a brief prompt (1-2 sentences explaining what to consider)
✅ Include guidance (1 sentence on how to approach the reflection)
✅ Provide 4 concrete, relatable examples

SPECIAL INSTRUCTION FOR "Orientation" DOMAIN:
If the domain is "Orientation", the question should ask "What brings you here?" or "What do you hope this LifePlan supports?". 
The 4 examples must be distinct high-level objectives (e.g., "Learning more about myself", "Seeking God's will", "Creating an actionable plan").

REQUIRED JSON FORMAT:
{
  "question": "[your question here, strictly following the name placement rules above]",
  "prompt": "Brief explanation of what to consider",
  "guidance": "How to approach this reflection",
  "examples": ["Option 1", "Option 2", "Option 3", "Option 4"]
}

Return ONLY valid JSON. No explanations, no extra text.`;

    const promises = domains.map(async (domain) => {
      const userContext = `Generate a getting started question for the "${domain.label}" domain. Context: ${domain.context}. User: ${firstName}.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.4-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContext },
        ],
        temperature: 0.6,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0]?.message?.content || "{}";
      const parsed = safeJsonParse(content) as any;

      if (parsed?.question) {
        return {
          id: domain.id,
          domain: domain.id,
          question: parsed.question,
          prompt: parsed.prompt,
          guidance: parsed.guidance || "Reflect honestly.",
          examples: Array.isArray(parsed.examples) ? parsed.examples : [],
        };
      }
      return null;
    });

    const results = await Promise.all(promises);
    const validQuestions = results.filter((q) => q !== null);

    if (validQuestions.length === 6) {
      return validQuestions;
    } else {
      return getGettingStartedFallbackQuestions(firstName);
    }
  } catch (error) {
    console.error("AI Generation Error:", error);
    return getGettingStartedFallbackQuestions(firstName);
  }
};

export const generateDomainFollowUpQuestions = async (
  domainName: string,
  domainExamples: string[],
  userContext: string,
  userName?: string
): Promise<AIQuestion[]> => {
  try {
    const systemPrompt = `SYSTEM ROLE: You help users clarify and deepen their goals within a specific life domain.

PURPOSE: Generate 2-3 follow-up questions that help them move from general to specific.

CRITICAL NAME PLACEMENT RULES (MANDATORY):
❌ FORBIDDEN: You must NEVER start a question with the user's name. Never write "${userName}, [question]".
✅ REQUIRED: You must place "${userName}" in the MIDDLE or at the END of EVERY question.

EXAMPLES OF CORRECT FORMAT:
- "What specifically would success look like in this domain, ${userName}?" (Name at end)
- "When you think about this, ${userName}, what's one small shift that would move you closer?" (Name in middle)

TONE: Calm, warm, grounded, encouraging, non-judgmental
- Normalize that clarifying takes time
- Avoid pressure or urgency
- Frame as exploration not achievement

YOUR TASK: Generate 2-3 follow-up questions that:
✅ Help them think more deeply about their domain goal
✅ Move from "what" to "why" (not why as therapy, but as clarification)
✅ Invite concrete, specific thinking

CONSTRAINTS:
❌ Do NOT generate more than 3 questions
❌ Do NOT ask multiple questions in one prompt
❌ Do NOT prescribe or suggest solutions

JSON FORMAT (REQUIRED):
[
  {
    "id": "followup1",
    "domain": "${domainName}",
    "question": "A specific, clarifying question (with name at the middle or end)",
    "prompt": "The full question with context (1-2 sentences)",
    "guidance": "How to think about this (1 sentence)",
    "examples": ["Example response 1", "Example response 2"]
  }
]`;

    const response = await openai.chat.completions.create({
      model: "gpt-5.4-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Domain: ${domainName}
Their response context: ${userContext}
Domain examples they might relate to: ${domainExamples.join("; ")}

Generate 2-3 clarifying follow-up questions. Remember: NEVER start the question with their name. Put it in the middle or at the end.`,
        },
      ],
      temperature: 0.8,
    });

    const content = response.choices[0]?.message?.content || "[]";
    const parsed = safeJsonParse(content);
    const questions = validateAIResponse<AIQuestion[]>(parsed, "question-array");

    return questions || [];
  } catch (error) {
    console.error("Generate domain follow-up questions error:", error);
    return [];
  }
};

export const generateWhereIAmNowQuestions = async (
  userName: string,
  previousAnswers?: Partial<WhereIAmNowPayload>
): Promise<Record<string, AIQuestion[]>> => {
  try {
    const systemPrompt = `SYSTEM ROLE: You facilitate a Current State Assessment using a deterministic 4-column framework.

CRITICAL NAME PLACEMENT RULES (MANDATORY):
❌ FORBIDDEN: You must NEVER start a prompt with the user's name. Never write "${userName}, [prompt]".
✅ REQUIRED: You must place "${userName}" in the MIDDLE or at the END of EVERY prompt.

EXAMPLES OF CORRECT FORMAT:
- "What in your personal life is going well right now, ${userName}?"
- "When you think about your wellbeing, ${userName}, where do you sense struggle or difficulty?"
- "What feels unclear in your personal growth, ${userName}?"
- "If you step back and look at your personal life, ${userName}, what do you sense is lacking?"

CRITICAL CONSTRAINTS:
❌ You will NOT generate new questions or assessment columns
❌ You will NOT use diagnostic or clinical language
✅ YOU WILL maintain the exact structure: right | wrong | confused | missing
✅ YOU WILL respect the 5-domain order

THE DETERMINISTIC 4-ASSESSMENT FRAMEWORK (EXACT):
1️⃣ Right: What IS working well? What's going right?
2️⃣ Wrong: What is NOT working? What's struggling?
3️⃣ Confused: What feels unclear or ambiguous?
4️⃣ Missing: What is absent or lacking?

DOMAINS (EXACT ORDER - DO NOT REORDER):
1️⃣ Personal 
2️⃣ Family & Friends 
3️⃣ Church & Kingdom 
4️⃣ Vocation 
5️⃣ Community 

JSON FORMAT (REQUIRED):
{
  "personal": [
    { 
      "id": "p_right", 
      "domain": "personal",
      "core": "right", 
      "question": "What in your personal life is going well right now, [Name]?", 
      "prompt": "Think about sleep, movement, nutrition, and how you generally feel.",
      "examples": [] 
    },
    { 
      "id": "p_wrong", 
      "domain": "personal",
      "core": "wrong", 
      "question": "What in your personal life is not working well, [Name]?", 
      "prompt": "Consider what feels off, difficult, or draining.",
      "examples": [] 
    },
    { 
      "id": "p_confused", 
      "domain": "personal",
      "core": "confused", 
      "question": "What feels unclear in your personal life, [Name]?", 
      "prompt": "Reflect on where you feel conflicted or uncertain.",
      "examples": [] 
    },
    { 
      "id": "p_missing", 
      "domain": "personal",
      "core": "missing", 
      "question": "What feels absent in your personal life right now, [Name]?", 
      "prompt": "Consider what is lacking that would make this area healthier.",
      "examples": [] 
    }
  ],
  "family": [...],
  "church": [...],
  "vocation": [...],
  "community": [...]
}`;

    const userContext = `User: ${userName || "Friend"}
${previousAnswers?.analysis ? `Their previous reflection context: "${previousAnswers.analysis}"` : "This is their first current state assessment"}

Generate assessment prompts for all 5 domains using the deterministic framework.
Remember: NEVER start the prompt with their name. Put it in the middle or at the end.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5.4-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContext },
      ],
      temperature: 0.75,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = safeJsonParse(content);
    const validated = validateAIResponse<Record<string, AIQuestion[]>>(
      parsed,
      "question-object"
    );

    if (validated) {
      return validated;
    }
    return getWhereIAmNowFallbackQuestions(userName);
  } catch (error) {
    console.error("Generate Where I Am Now questions error:", error);
    return getWhereIAmNowFallbackQuestions(userName);
  }
};

export const generateContextualFollowUp = async (
  domain: string,
  userResponse: string,
  assessmentType: "right" | "wrong" | "confused" | "missing",
  followUpCount: number = 0,
  userName?: string
): Promise<string> => {
  try {
    if (followUpCount >= 2) {
      console.log(
        `[generateContextualFollowUp] Max follow-ups reached (count=${followUpCount}) for ${domain}/${assessmentType}`
      );
      return "";
    }

    const systemPrompt = `SYSTEM ROLE: You provide warm, reflective follow-up guidance.
PURPOSE: Deepen their reflection without prescribing solutions

CRITICAL NAME PLACEMENT RULES:
❌ FORBIDDEN: You must NEVER start your response with the user's name. Never write "${userName}, [response]".
✅ REQUIRED: You must place "${userName}" in the MIDDLE or at the END of your response.

EXAMPLES OF CORRECT FORMAT:
- "Thank you for that honesty, ${userName}. It takes courage to name what feels unclear..."
- "I hear you, ${userName}. That honesty matters..."
- "It's completely normal to feel that way about this, ${userName}..."

HARD CONSTRAINTS:
❌ Do NOT ask multiple questions
❌ Do NOT provide solutions or advice
❌ Do NOT diagnose or label them
❌ Do NOT create urgency or pressure

STRUCTURE:
1. Brief acknowledgment incorporating the user's name in the middle or end (1-2 sentences)
2. Optional single clarifying question OR reflection prompt
3. Keep it under 80 words total.

CONTEXT:
Domain: ${domain}
Assessment type: ${assessmentType}
User: ${userName || "Friend"}
User response: "${userResponse}"
Follow-up number: ${followUpCount + 1} of 2`;

    const response = await openai.chat.completions.create({
      model: "gpt-5.4-turbo",
      messages: [{ role: "system", content: systemPrompt }],
      temperature: 0.75,
    });

    const followUp = response.choices[0]?.message?.content || "";

    if (!followUp.trim()) {
      return `Thank you for sharing authentically, ${userName}. That honesty matters.`;
    }

    return followUp;
  } catch (error) {
    console.error(
      `[generateContextualFollowUp] Error generating follow-up for ${domain}/${assessmentType}:`,
      error
    );
    return "Thank you for sharing. Take a moment to sit with what you've expressed.";
  }
};

function getGettingStartedFallbackQuestions(userName: string = "Friend"): AIQuestion[] {
  const firstName = userName.split(" ")[0] || userName || "Friend";

  return [
    {
      id: "overall",
      domain: "overall",
      question: `What brings you here, ${firstName}?`,
      prompt: "At this season of your life, what do you hope developing a LifePlan will support or make possible?",
      guidance: "Reflect on your high-level objective.",
      examples: [
        "Learning more about myself - my wiring, strengths, motivations, challenges",
        "Seeking God's will for the upcoming season in my life",
        "Creating a clear, actionable plan that is aligned with my purpose"
      ],
    },
    {
      id: "personal",
      domain: "personal",
      question: `What does a healthy and fulfilled personal life look like for you, ${firstName}?`,
      prompt: "Consider your physical health, emotional wellbeing, intellectual growth, and spiritual life. What would thriving look like?",
      guidance: "Be honest about where you are and where you'd like to be.",
      examples: [
        "I want to feel more energized and take better care of my physical health",
        "I want to develop a stronger spiritual practice",
        "I want to grow intellectually and learn new things"
      ],
    },
    {
      id: "family",
      domain: "family",
      question: `When you think about family and friends, ${firstName}, how do you want to strengthen those relationships?`,
      prompt: "Think about your spouse, children, parents, extended family, and close friendships. What changes would deepen these connections?",
      guidance: "Focus on what matters most to you in these relationships.",
      examples: [
        "I want to spend more quality time with my family",
        "I want to develop deeper friendships",
        "I want to improve communication with my spouse"
      ],
    },
    {
      id: "church",
      domain: "church",
      question: `How do you want your faith life to grow in this season, ${firstName}?`,
      prompt: "Consider your spiritual practice, faith community, ministry, and discipleship. What would spiritual growth look like for you?",
      guidance: "Reflect on what matters to you spiritually.",
      examples: [
        "I want to find a church community where I belong",
        "I want to discover how to use my gifts in ministry",
        "I want to deepen my prayer and spiritual practice"
      ],
    },
    {
      id: "vocation",
      domain: "vocation",
      question: `What would greater fulfillment in your work or vocation look like for you, ${firstName}?`,
      prompt: "Think about your career, daily work, professional growth, and sense of calling. What changes would bring more alignment and meaning?",
      guidance: "Consider both practical and meaningful aspects of work.",
      examples: [
        "I want to align my work with my strengths and passions",
        "I want to gain clarity about my career direction",
        "I want to find greater purpose in my current role"
      ],
    },
    {
      id: "community",
      domain: "community",
      question: `Looking at your community, ${firstName}, how do you want to contribute and engage?`,
      prompt: "Reflect on your neighborhood, civic involvement, volunteer work, and ways to give back. What would meaningful community engagement look like?",
      guidance: "Think about causes and connections that matter to you.",
      examples: [
        "I want to discover meaningful volunteer opportunities",
        "I want to build deeper connections with my neighbors",
        "I want to contribute to causes that align with my values"
      ],
    },
  ];
}

function getWhereIAmNowFallbackQuestions(userName: string = "Friend"): Record<string, any[]> {
  const firstName = userName.split(" ")[0] || userName || "Friend";

  const createFallbackForDomain = (domain: string, title: string) => [
    {
      id: `${domain}_right`,
      domain: domain,
      core: "right",
      question: `What in your ${title} is going well right now, ${firstName}?`,
      prompt: "What has been going well for you in this area?",
      examples: [],
    },
    {
      id: `${domain}_wrong`,
      domain: domain,
      core: "wrong",
      question: `What is not working well in your ${title}, ${firstName}?`,
      prompt: "What feels off, difficult, or draining in this area right now?",
      examples: [],
    },
    {
      id: `${domain}_confused`,
      domain: domain,
      core: "confused",
      question: `What feels unclear in your ${title}, ${firstName}?`,
      prompt: "Where do you feel unclear, conflicted, or uncertain?",
      examples: [],
    },
    {
      id: `${domain}_missing`,
      domain: domain,
      core: "missing",
      question: `What feels missing in your ${title} right now, ${firstName}?`,
      prompt: "What do you sense is absent that would make this area healthier?",
      examples: [],
    },
  ];

  return {
    personal: createFallbackForDomain("personal", "personal life"),
    family: createFallbackForDomain("family", "family and friendships"),
    church: createFallbackForDomain("church", "church and kingdom life"),
    vocation: createFallbackForDomain("vocation", "vocation"),
    community: createFallbackForDomain("community", "community life"),
  };
}

export default {
  generateGettingStartedQuestions,
  generateDomainFollowUpQuestions,
  generateWhereIAmNowQuestions,
  generateContextualFollowUp,
};