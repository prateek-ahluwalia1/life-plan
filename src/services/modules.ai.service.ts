import { openai } from "../config/openai";
import type {
  GettingStartedModulesPayload,
} from "../types/gettingStartedModules";
import type { WhereIAmNowPayload } from "../types/whereIAmNow";

interface AIQuestion {
  id: string;
  domain: string;
  question: string;
  prompt: string;
  guidance: string;
  examples: string[];
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
      { id: "personal", label: "Personal", context: "physical health, emotional wellbeing, intellectual growth, and spiritual life" },
      { id: "family", label: "Family & Friends", context: "spouse, children, parents, extended family, and close friends" },
      { id: "church", label: "Church & Kingdom", context: "faith practice, ministry, calling, discipleship, and spiritual community" },
      { id: "vocation", label: "Vocation", context: "career, work, daily responsibilities, and professional growth" },
      { id: "community", label: "Community", context: "neighborhood, civic engagement, volunteer work, and giving back" },
    ];

    const systemPrompt = `You are a thoughtful guide helping people reflect on their life goals. Generate a thoughtful, personalized question for ONE specific life domain.

CRITICAL NAME PLACEMENT RULES:
❌ FORBIDDEN: You must NEVER start the question with the user's name. Do NOT write "${firstName}, [question]".
✅ REQUIRED: You must place the name in the MIDDLE or at the END of the question.

EXAMPLES OF REQUIRED FORMAT:
- "What steps can you take to improve your physical health, ${firstName}?" (Name at end)
- "When you think about your spiritual life, ${firstName}, what does thriving look like?" (Name in middle)

OTHER REQUIREMENTS:
✅ The question must be warm, open-ended, and inviting
✅ Include a brief prompt (1-2 sentences explaining what to reflect on)
✅ Include guidance (1 sentence on how to approach the reflection)
✅ Provide 4 concrete, relatable examples

REQUIRED JSON FORMAT:
{
  "question": "[your question here, strictly following the name placement rules above]",
  "prompt": "Brief explanation of what to consider",
  "guidance": "How to approach this reflection",
  "examples": ["Example 1", "Example 2", "Example 3", "Example 4"]
}

Return ONLY valid JSON. No explanations, no extra text.`;

    const questions: AIQuestion[] = [];
    for (const domain of domains) {
      const userContext = `Generate a getting started question for the "${domain.label}" domain (${domain.context}). 
The user is: ${firstName}
Remember: NEVER start the question with their name. Put it in the middle or at the end.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContext },
        ],
        temperature: 0.6,
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content || "{}";
      const parsed = safeJsonParse(content) as {
        question?: string;
        prompt?: string;
        guidance?: string;
        examples?: string[];
      };

      if (parsed?.question && parsed?.prompt && parsed?.examples) {
        questions.push({
          id: domain.id,
          domain: domain.id,
          question: parsed.question,
          prompt: parsed.prompt,
          guidance: parsed.guidance || "Reflect honestly on your situation.",
          examples: Array.isArray(parsed.examples) ? parsed.examples : [],
        });
        console.log(`[generateGettingStartedQuestions] Generated question for domain: ${domain.id}`);
      } else {
        console.warn(`[generateGettingStartedQuestions] Failed to parse response for domain: ${domain.id}, using fallback`);
        const fallback = getGettingStartedFallbackQuestions(firstName);
        const fallbackForDomain = fallback.find((q) => q.domain === domain.id);
        if (fallbackForDomain) {
          questions.push(fallbackForDomain);
        }
      }
    }
    if (questions.length === 5) {
      console.log("[generateGettingStartedQuestions] Successfully generated all 5 domain questions");
      return questions;
    } else {
      console.warn(`[generateGettingStartedQuestions] Generated only ${questions.length} questions, using full fallback`);
      return getGettingStartedFallbackQuestions(firstName);
    }
  } catch (error) {
    console.error("Generate Getting Started questions error:", error);
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
  },
  {...}
]`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
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
      max_tokens: 1500,
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
    { "id": "p_right", "core": "right", "prompt": "Prompt about what's RIGHT (name in middle or end)", "examples": [] },
    { "id": "p_wrong", "core": "wrong", "prompt": "Prompt about what's WRONG (name in middle or end)", "examples": [] },
    { "id": "p_confused", "core": "confused", "prompt": "Prompt about what's CONFUSED (name in middle or end)", "examples": [] },
    { "id": "p_missing", "core": "missing", "prompt": "Prompt about what's MISSING (name in middle or end)", "examples": [] }
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
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContext },
      ],
      temperature: 0.75,
      max_tokens: 3000,
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
      model: "gpt-4",
      messages: [{ role: "system", content: systemPrompt }],
      temperature: 0.75,
      max_tokens: 250,
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

function getWhereIAmNowFallbackQuestions(userName: string = "Friend"): Record<string, AIQuestion[]> {
  const firstName = userName.split(" ")[0] || userName || "Friend";

  return {
    personal: [
      {
        id: "p1",
        domain: "personal",
        question: `How are you doing with your physical health and energy right now, ${firstName}?`,
        prompt:
          "Think about sleep, movement, nutrition, and how you generally feel in your body.",
        guidance:
          "Be honest about where things are. This is your reality check.",
        examples: [
          "I've been consistent with exercise",
          "My sleep has been disrupted lately",
          "I'm managing stress okay",
        ],
      },
    ],
    family: [
      {
        id: "f1",
        domain: "family",
        question: `When reflecting on your inner circle, ${firstName}, how connected do you feel to your closest relationships?`,
        prompt:
          "Think about your spouse, children, close friends—whoever matters most.",
        guidance:
          "Connection varies—what matters is your honest sense of where things are.",
        examples: [
          "We're communicating really well right now",
          "I feel distant from my spouse",
          "Friendships feel shallow lately",
        ],
      },
    ],
    church: [
      {
        id: "c1",
        domain: "church",
        question: `How engaged do you feel in your spiritual life right now, ${firstName}?`,
        prompt: "Think about your prayer life, church community, and faith.",
        guidance:
          "Engagement ebbs and flows—what matters is being honest about where you are.",
        examples: [
          "My faith feels alive and active",
          "I've been distant from church",
          "I'm seeking but feeling uncertain",
        ],
      },
    ],
    vocation: [
      {
        id: "v1",
        domain: "vocation",
        question: `Does your work feel aligned with your values and strengths, ${firstName}?`,
        prompt:
          "Think about your job, calling, daily work—whatever your vocation looks like.",
        guidance:
          "Alignment is key. Be honest about where things stand.",
        examples: [
          "My work feels purposeful",
          "I feel unfulfilled in my role",
          "I'm questioning my career direction",
        ],
      },
    ],
    community: [
      {
        id: "co1",
        domain: "community",
        question: `Looking outward, ${firstName}, how present are you in your local community?`,
        prompt:
          "Think about your neighborhood, volunteer involvement, civic engagement.",
        guidance:
          "Community involvement looks different for everyone. What matters is your honest sense of presence.",
        examples: [
          "I'm actively involved locally",
          "I'm isolated from my community",
          "I want to be more involved but don't know how",
        ],
      },
    ],
  };
}

export default {
  generateGettingStartedQuestions,
  generateDomainFollowUpQuestions,
  generateWhereIAmNowQuestions,
  generateContextualFollowUp,
};