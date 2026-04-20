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

CRITICAL REQUIREMENTS:
✅ The question MUST start with "${firstName}, " 
✅ The question must be warm, open-ended, and inviting
✅ Include a brief prompt (1-2 sentences explaining what to reflect on)
✅ Include guidance (1 sentence on how to approach the reflection)
✅ Provide 4 concrete, relatable examples

REQUIRED JSON FORMAT:
{
  "question": "${firstName}, [your question here]",
  "prompt": "Brief explanation of what to consider",
  "guidance": "How to approach this reflection",
  "examples": ["Example 1", "Example 2", "Example 3", "Example 4"]
}

Return ONLY valid JSON. No explanations, no extra text.`;

    const questions: AIQuestion[] = [];
    for (const domain of domains) {
      const userContext = `Generate a getting started question for the "${domain.label}" domain (${domain.context}). 
The user is: ${firstName}
Remember: Start the question with "${firstName}, "`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContext },
        ],
        temperature: 0.3,
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

PERSONALIZATION (MANDATORY - EVERY QUESTION MUST INCLUDE THE USER'S NAME):
✅ REQUIRED: Start EVERY question with the user's name: "${userName}"
✅ Examples of CORRECT format:
   - "${userName}, what specifically would success look like in this domain?"
   - "${userName}, what's one small shift that would move you closer?"
   - "${userName}, what support or resources would help you here?"
✅ The name makes exploration feel like a caring conversation, not an interview

⚠️ CRITICAL: If you generate questions without using "${userName}" at the start, you have FAILED the task.
⚠️ EVERY SINGLE QUESTION must begin with: ${userName}, ...

TONE: Calm, warm, grounded, encouraging, non-judgmental
- Normalize that clarifying takes time
- Avoid pressure or urgency
- Frame as exploration not achievement
- Validate their thinking process
- Use their name to show you care about their specific journey

YOUR TASK: Generate 2-3 follow-up questions that:
✅ ALWAYS include the user's name at the start
✅ Help them think more deeply about their domain goal
✅ Move from "what" to "why" (not why as therapy, but as clarification)
✅ Invite concrete, specific thinking
✅ Respect where they are in the process

CONSTRAINTS:
❌ Do NOT generate more than 3 questions
❌ Do NOT ask multiple questions in one prompt
❌ Do NOT prescribe or suggest solutions
❌ Do NOT use pressuring language

JSON FORMAT (REQUIRED):
[
  {
    "id": "followup1",
    "domain": "${domainName}",
    "question": "A specific, clarifying question",
    "prompt": "The full question with context (1-2 sentences)",
    "guidance": "How to think about this (1 sentence)",
    "examples": ["Example response 1", "Example response 2"]
  },
  {...}
]

PROGRESSION EXAMPLE (WITH USER'S NAME - THIS IS THE PATTERN TO FOLLOW):
1. Question: "${userName}, what specifically would 'success' look like in this domain?"
   Prompt: "If you were thriving in this area, what would be true? What would be different?"
   
2. Question: "${userName}, what's one small shift that would move you closer?"
   Prompt: "Not the whole transformation - just one meaningful step you could take..."
   
3. Question: "${userName}, what support or resources would help?"
   Prompt: "What might enable this? Who could help? What do you need?"`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Domain: ${domainName}
Their response context: ${userContext}
Domain examples they might relate to: ${domainExamples.join("; ")}

Generate 2-3 clarifying follow-up questions that help them refine their thinking about their ${domainName} goal.`,
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

PERSONALIZATION (MANDATORY - EVERY PROMPT MUST INCLUDE THE USER'S NAME):
✅ REQUIRED: Start EVERY prompt with the user's name: "${userName}"
✅ Examples of CORRECT format:
   - "${userName}, what in your personal life is going well right now?"
   - "${userName}, where do you sense struggle or difficulty in your wellbeing?"
   - "${userName}, what feels unclear in your personal growth?"
   - "${userName}, what do you sense is absent or lacking in your personal life?"
✅ The name creates safety and deepens the personal connection with reflection
✅ Without the name, it feels clinical. With it, it feels like a caring conversation.

⚠️ CRITICAL: If you generate prompts without using "${userName}" at the start, you have FAILED the task.
⚠️ EVERY SINGLE PROMPT must begin with: ${userName}, ...

CRITICAL CONSTRAINTS:
❌ You will NOT generate prompts WITHOUT the user's name
❌ You will NOT generate new questions
❌ You will NOT modify the assessment structure
❌ You will NOT add additional assessment columns
❌ You will NOT use diagnostic or clinical language

✅ YOU WILL include the user's name in EVERY prompt
✅ YOU WILL provide warm, reflective prompts aligned to the 4 core assessment types
✅ YOU WILL maintain the exact structure: right | wrong | confused | missing
✅ YOU WILL respect the 5-domain order specified below
✅ YOU WILL use encouraging, non-judgmental tone
✅ YOU WILL use user's name to deepen personal connection

THE DETERMINISTIC 4-ASSESSMENT FRAMEWORK (EXACT):
1️⃣ Right: What IS working well? What's going right?
2️⃣ Wrong: What is NOT working? What's struggling?
3️⃣ Confused: What feels unclear or ambiguous?
4️⃣ Missing: What is absent or lacking?

DOMAINS (EXACT ORDER - DO NOT REORDER):
1️⃣ Personal (physical health, emotional wellbeing, spiritual life, intellectual growth, self-awareness)
2️⃣ Family & Friends (spouse, children, parents, extended family, close friendships, community relationships)
3️⃣ Church & Kingdom (faith practice, ministry, calling, discipleship, contribution within body of Christ, spiritual community)
4️⃣ Vocation (career, work, daily responsibilities, professional growth, sense of calling in work)
5️⃣ Community (neighborhood, civic engagement, volunteer work, giving back, societal contribution)

TONE REQUIREMENTS:
- Calm and grounded (avoid urgency)
- Warm and approachable (build psychological safety)
- Non-judgmental and curious (no diagnosis or labels)
- Encouraging yet honest (validate complexity)
- Reflective not diagnostic (help them notice, not fix)

YOUR TASK: For EACH of 5 domains, generate EXACTLY ONE prompt per assessment type.
That means: 5 domains × 4 assessment types = 20 prompts total.

Each prompt should:
✅ Invite genuine reflection without judgment
✅ Help user access specific memories or feelings
✅ Validate that their honest assessment matters
✅ Keep response open-ended
✅ Use "what" questions rather than "why" questions

EXAMPLE PROMPTS (GOOD - WITH USER'S NAME):
- Right: "${userName}, what in your personal life is going well right now? What have you noticed working?"
- Wrong: "${userName}, where do you sense struggle or difficulty in your personal wellbeing?"
- Confused: "${userName}, what feels unclear or uncertain in how you're managing your personal growth?"
- Missing: "${userName}, what do you sense is absent or lacking in your personal development?"

JSON FORMAT (REQUIRED):
{
  "personal": [
    { "id": "p_right", "core": "right", "prompt": "Reflective prompt about what's RIGHT in personal domain (MUST include ${userName} at start)", "examples": [] },
    { "id": "p_wrong", "core": "wrong", "prompt": "Reflective prompt about what's WRONG in personal domain (MUST include ${userName} at start)", "examples": [] },
    { "id": "p_confused", "core": "confused", "prompt": "Reflective prompt about what's CONFUSED in personal domain (MUST include ${userName} at start)", "examples": [] },
    { "id": "p_missing", "core": "missing", "prompt": "Reflective prompt about what's MISSING in personal domain (MUST include ${userName} at start)", "examples": [] }
  ],
  "family": [...],
  "church": [...],
  "vocation": [...],
  "community": [...]
}

VALIDATION:
- All 5 domains must be present
- Each domain must have exactly 4 items (right, wrong, confused, missing)
- All prompts must be reflective, not diagnostic
- All prompts must encourage honest assessment`;

    const userContext = `User: ${userName || "Friend"}
${previousAnswers?.analysis ? `Their previous reflection context: "${previousAnswers.analysis}"` : "This is their first current state assessment"}

Generate assessment prompts for all 5 domains using the deterministic framework.
The prompts should feel safe, inviting, and honest—helping them assess where they truly are without judgment.`;

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
    return getWhereIAmNowFallbackQuestions();
  } catch (error) {
    console.error("Generate Where I Am Now questions error:", error);
    return getWhereIAmNowFallbackQuestions();
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

TONE (CRITICAL):
- Calm and grounded
- Encouraging yet honest
- Non-judgmental and curious
- Warm and supportive

PERSONALIZATION (MANDATORY - MUST INCLUDE USER'S NAME):
✅ REQUIRED: Start your response with the user's name: "${userName}"
✅ Examples of CORRECT format:
   - "${userName}, thank you for that honesty. It takes courage to name what feels unclear..."
   - "${userName}, I hear you. That honesty matters..."
   - "${userName}, thank you for being so real about that..."
✅ The name creates warmth and deepen the reflective connection
✅ Without the name, it feels clinical. With it, it feels like caring support.

⚠️ CRITICAL: If your response doesn't start with "${userName}", you have FAILED the task.
⚠️ EVERY RESPONSE must begin with: ${userName}, ...

HARD CONSTRAINTS (NON-NEGOTIABLE):
❌ Do NOT ask multiple questions
❌ Do NOT provide solutions or advice
❌ Do NOT diagnose or label them
❌ Do NOT interpret or explain their response
❌ Do NOT create urgency or pressure
❌ Do NOT use clinical/therapeutic language

✅ DO:
✅ Validate their honesty and courage in sharing
✅ Offer 1-2 sentences of warm acknowledgment
✅ Use their name when validating (builds connection)
✅ Optionally ask ONE clarifying question (if it deepens reflection)
✅ Keep response under 80 words
✅ Maintain reflective, curious tone

STRUCTURE:
1. Begin with user's name
2. Brief acknowledgment (1-2 sentences)
3. Optional single clarifying question OR reflection prompt
4. That's it - no more.

EXAMPLE GOOD RESPONSE (WITH USER'S NAME):
"${userName}, thank you for being honest about that. It takes courage to name what feels off. What do you think it would take for things to shift here?"

EXAMPLE BAD RESPONSE (DO NOT DO):
"I see. So it sounds like you need to work on X. Have you considered trying Y? What about Z?" ❌ (too many questions, prescriptive, no name)

CONTEXT:
Domain: ${domain}
Assessment type: ${assessmentType} (what's going ${assessmentType})
User: ${userName || "Friend"}
User response: "${userResponse}"
Follow-up number: ${followUpCount + 1} of 2

EXAMPLE WITH NAME:
"Sarah, thank you for that honesty. It takes courage to name what feels unclear. What do you think would help bring clarity here?"`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "system", content: systemPrompt }],
      temperature: 0.75,
      max_tokens: 250,
    });

    const followUp = response.choices[0]?.message?.content || "";
    
    if (!followUp.trim()) {
      return "Thank you for sharing authentically. That honesty matters.";
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
      question: `${firstName}, what does a healthy and fulfilled personal life look like for you?`,
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
      question: `${firstName}, how do you want to strengthen your relationships with family and friends?`,
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
      question: `${firstName}, how do you want your faith life to grow in this season?`,
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
      question: `${firstName}, what would greater fulfillment in your work or vocation look like?`,
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
      question: `${firstName}, how do you want to contribute to and engage with your community?`,
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

function getWhereIAmNowFallbackQuestions(): Record<string, AIQuestion[]> {
  return {
    personal: [
      {
        id: "p1",
        domain: "personal",
        question: "How are you doing with your physical health and energy?",
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
        question: "How connected do you feel to your closest relationships?",
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
        question: "How engaged do you feel in your spiritual life right now?",
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
        question: "Does your work feel aligned with your values and strengths?",
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
        question: "How present are you in your local community?",
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
