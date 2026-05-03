import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export interface PortfolioContent {
  headline: string;
  bio: string;
  experience: {
    title: string;
    company: string;
    duration: string;
    description: string;
  }[];
  skills: {
    category: string;
    items: string[];
  }[];
  education: {
    degree: string;
    school: string;
    year: string;
  }[];
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
  };
  imagePrompts: {
    section: string;
    prompt: string;
    aspectRatio: string;
  }[];
}

const PORTFOLIO_TOOL = {
  name: "record_portfolio_content",
  description:
    "Record the generated portfolio content including headline, bio, experience, skills, education, color palette, and image generation prompts.",
  input_schema: {
    type: "object" as const,
    properties: {
      headline: {
        type: "string",
        description:
          "A punchy 5-10 word professional tagline. Not a job title. Examples: 'Building the future of fintech', 'Turning complex data into clear insights'.",
      },
      bio: {
        type: "string",
        description:
          "A 2-3 paragraph professional bio written in third person. Highlight achievements, expertise, and professional passion. No em-dashes.",
      },
      experience: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            company: { type: "string" },
            duration: { type: "string", description: "e.g. 'Jan 2023 - Present'" },
            description: {
              type: "string",
              description:
                "2-3 sentences highlighting impact and achievements. Use specific metrics where possible. No em-dashes.",
            },
          },
          required: ["title", "company", "duration", "description"],
        },
      },
      skills: {
        type: "array",
        items: {
          type: "object",
          properties: {
            category: {
              type: "string",
              description: "e.g. 'Languages', 'Frameworks', 'Tools', 'Soft Skills'",
            },
            items: { type: "array", items: { type: "string" } },
          },
          required: ["category", "items"],
        },
      },
      education: {
        type: "array",
        items: {
          type: "object",
          properties: {
            degree: { type: "string" },
            school: { type: "string" },
            year: { type: "string" },
          },
          required: ["degree", "school", "year"],
        },
      },
      colorPalette: {
        type: "object",
        properties: {
          primary: {
            type: "string",
            description: "Hex color for the primary palette tone, chosen based on the person's industry.",
          },
          secondary: { type: "string", description: "Hex color for secondary tone." },
          accent: { type: "string", description: "Hex color for accent/highlight." },
        },
        required: ["primary", "secondary", "accent"],
      },
      imagePrompts: {
        type: "array",
        description:
          "3-4 prompts for Luma uni-1 image generation. Each should produce abstract, futuristic visuals related to the person's field. Be specific about lighting, mood, and style. Never include people or faces.",
        items: {
          type: "object",
          properties: {
            section: {
              type: "string",
              enum: ["hero", "experience", "skills", "projects"],
            },
            prompt: {
              type: "string",
              description:
                "Detailed image prompt (100-300 chars). Abstract, cinematic, no people. Examples: 'Abstract neural network visualization with flowing data streams, deep purple and electric blue, dark background, volumetric lighting, 8k detail'",
            },
            aspectRatio: {
              type: "string",
              enum: ["16:9", "3:2", "1:1", "2:3"],
            },
          },
          required: ["section", "prompt", "aspectRatio"],
        },
      },
    },
    required: [
      "headline",
      "bio",
      "experience",
      "skills",
      "education",
      "colorPalette",
      "imagePrompts",
    ],
  },
};

export async function generatePortfolioContent(
  resumeText: string,
  userName: string
): Promise<PortfolioContent> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    tools: [PORTFOLIO_TOOL],
    tool_choice: { type: "tool", name: "record_portfolio_content" },
    messages: [
      {
        role: "user",
        content: `You are a portfolio content strategist. Analyze this resume and generate compelling portfolio website content.

RESUME TEXT:
${resumeText}

PERSON'S NAME: ${userName}

INSTRUCTIONS:
1. Write a punchy headline (not just their job title)
2. Write a professional bio in third person (2-3 paragraphs, no em-dashes)
3. Enhance each work experience with impact-focused descriptions
4. Categorize skills into logical groups
5. Format education entries
6. Choose a color palette that reflects their industry:
   - Tech/Software: deep purples, electric blues
   - Finance/Fintech: deep navy, gold accents
   - Data Science/ML: dark teal, neon green
   - Design/Creative: coral, warm tones
   - Engineering: gunmetal, amber
   - Healthcare: calming blues, white accents
   - General: deep purple, electric blue
7. Write 3-4 image prompts for Luma uni-1 that create abstract, cinematic visuals related to their field. NEVER include people, faces, or text in the prompts. Focus on abstract shapes, data visualizations, geometric patterns, flowing energy, architectural forms. Use the hero prompt for a dramatic wide shot (16:9). Other sections can be 3:2 or 1:1.

IMPORTANT: No em-dashes anywhere in the output. Use periods or commas instead.`,
      },
    ],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return portfolio content via tool use");
  }

  return toolUse.input as unknown as PortfolioContent;
}
