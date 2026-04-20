import { openai } from "../config/openai";
import type { 
  GettingStartedProgress,
  GettingStartedModulesPayload,
} from "../types/gettingStartedModules";
import type { WhereIAmNowPayload } from "../types/whereIAmNow";

// ==================== TYPES ====================

interface AIQuestion {
  id: string;
  domain: string;
  question: string;
  prompt: string;
  guidance: string;
  examples: string[];
}

interface AIQuestionBatch {
  moduleId: string;
  stage: number;
  questions: AIQuestion[];
  generatedAt: Date;
  cachedUntil: Date;
}

// ==================== GETTING STARTED MODULE ====================

/**
 * Generate personalized getting started questions based on user context
 */
export const generateGettingStartedQuestions = async (
  userName: string,
  userEmail: string,
  existingData?: Partial<GettingStartedModulesPayload>
): Promise<AIQuestion[]> => {
  try {
    const systemPrompt = `You are a thoughtful life coach helping someone create a LifePlan. 
You will generate 5-6 warm, personalized opening questions for the "Getting Started" module.
These questions should help the user reflect on:
1. Why they're here and what brings them to this journey
2. What they hope to achieve with this LifePlan
3. Their current season of life
4. Specific domains they want to focus on (Personal, Family, Church, Vocation, Community)

Format your response as a JSON array with this exact structure:
[
  {
    "id": "q1",
    "domain": "overall",
    "question": "The main question to ask",
    "prompt": "The expanded prompt/instructions",
    "guidance": "Brief guidance on how to answer",
    "examples": ["Example 1", "Example 2", "Example 3"]
  }
]

Make the questions conversational, warm, and non-judgmental. These are for a faith-based life planning tool.`;

    const userContext = `User: ${userName || userEmail || "Friend"}
${existingData?.overallGoal ? `They previously shared: ${existingData.overallGoal}` : "This is their first time here."}

Generate questions that help them articulate their life goals across these domains:
- Personal (health, growth, inner life)
- Family & Friends (relationships)
- Church & Kingdom (spiritual/faith life)
- Vocation (work/calling)
- Community (giving back, local impact)`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContext },
      ],
      temperature: 0.8,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || "[]";
    
    // Parse and validate the response
    const questions = JSON.parse(content) as AIQuestion[];
    return questions;
  } catch (error) {
    console.error("Generate Getting Started questions error:", error);
    // Fallback to basic questions if AI fails
    return getGettingStartedFallbackQuestions();
  }
};

/**
 * Generate follow-up questions for domain goals
 */
export const generateDomainFollowUpQuestions = async (
  domainName: string,
  domainExamples: string[],
  userContext: string
): Promise<AIQuestion[]> => {
  try {
    const systemPrompt = `You are a compassionate life coach helping someone refine their goals in a specific life domain.
Generate 3-4 follow-up questions that help them clarify and deepen their goal for this domain.

Format your response as JSON:
[
  {
    "id": "q1",
    "domain": "${domainName}",
    "question": "A specific, clarifying question",
    "prompt": "The full question with context",
    "guidance": "How to think about this",
    "examples": ["Example response 1", "Example response 2"]
  }
]

Make questions that move from general to specific, helping them articulate a meaningful goal.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Domain: ${domainName}\nContext: ${userContext}\nRelevant examples: ${domainExamples.join("; ")}`,
        },
      ],
      temperature: 0.8,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content || "[]";
    const questions = JSON.parse(content) as AIQuestion[];
    return questions;
  } catch (error) {
    console.error("Generate domain follow-up questions error:", error);
    return [];
  }
};

// ==================== WHERE I AM NOW MODULE ====================

/**
 * Generate personalized assessment questions for the Where I Am Now module
 */
export const generateWhereIAmNowQuestions = async (
  userName: string,
  previousAnswers?: Partial<WhereIAmNowPayload>
): Promise<Record<string, AIQuestion[]>> => {
  try {
    const systemPrompt = `You are an empathetic guide helping someone assess their current life situation across five key domains.
For EACH domain, generate 3-4 warm, open-ended questions that help them reflect deeply.
These questions should explore what's working, what's challenging, and what's missing.

Format ONLY as valid JSON with this structure:
{
  "personal": [
    {
      "id": "p1",
      "domain": "personal",
      "question": "What's one area of your personal life that feels solid right now?",
      "prompt": "Think about your physical health, emotional wellbeing, spiritual life, and personal growth...",
      "guidance": "Be honest - there's no judgment here, only what's true for you today",
      "examples": ["My morning prayer routine", "How I'm managing stress", "Growth I've noticed"]
    }
  ],
  "family": [...],
  "church": [...],
  "vocation": [...],
  "community": [...]
}`;

    const userContext = `User: ${userName || "Friend"}
${previousAnswers?.analysis ? `Their previous reflection: ${previousAnswers.analysis}` : "This is their first assessment."}

Generate questions that help them honestly assess their situation WITHOUT pressure or judgment.
Focus on: current reality, what's working, what feels stuck, what's missing, what they need.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContext },
      ],
      temperature: 0.85,
      max_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const questions = JSON.parse(content) as Record<string, AIQuestion[]>;
    return questions;
  } catch (error) {
    console.error("Generate Where I Am Now questions error:", error);
    return getWhereIAmNowFallbackQuestions();
  }
};

/**
 * Generate contextual follow-up for a specific response
 */
export const generateContextualFollowUp = async (
  domain: string,
  userResponse: string,
  assessmentType: "right" | "wrong" | "confused" | "missing"
): Promise<string> => {
  try {
    const systemPrompt = `You are a skilled coach providing thoughtful follow-up guidance.
Based on their response, provide a brief, encouraging follow-up that:
1. Validates what they shared
2. Asks a clarifying or deepening question
3. Points toward constructive reflection

Keep it under 150 words. Be warm and non-judgmental.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Domain: ${domain}\nAssessment type: ${assessmentType}\nTheir response: "${userResponse}"`,
        },
      ],
      temperature: 0.8,
      max_tokens: 300,
    });

    return response.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Generate contextual follow-up error:", error);
    return "Thank you for sharing. Take a moment to sit with what you've expressed.";
  }
};

// ==================== FALLBACK QUESTIONS ====================

/**
 * Fallback questions for Getting Started (if AI generation fails)
 */
function getGettingStartedFallbackQuestions(): AIQuestion[] {
  return [
    {
      id: "gs1",
      domain: "overall",
      question: "What brings you here at this particular moment in your life?",
      prompt:
        "Take a moment to reflect on why you decided to work on a LifePlan right now. What triggered this decision?",
      guidance:
        "There's no right answer—just what feels true for you today. It might be a transition, a prompting, or a sense that something needs to shift.",
      examples: [
        "I'm at a major life transition and need clarity",
        "I feel called to live more intentionally",
        "I want to be more aligned with my values",
      ],
    },
    {
      id: "gs2",
      domain: "overall",
      question: "What would it look like to live more aligned with your purpose?",
      prompt:
        "Imagine yourself 12 months from now, having engaged deeply with this LifePlan. What would be different?",
      guidance:
        "Be specific. Not aspirational—actual, concrete changes you'd like to see.",
      examples: [
        "I'd feel more at peace in my daily rhythms",
        "My relationships would feel deeper and more intentional",
        "My work would feel more meaningful",
      ],
    },
  ];
}

/**
 * Fallback questions for Where I Am Now (if AI generation fails)
 */
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
