import { SummaryMode } from "../types";
import { LiteLlm } from "./adk/liteLlm";
import { LlmRequest } from "@google/adk";
import { Content } from "@google/genai";

const getSystemInstruction = (mode: SummaryMode): string => {
  switch (mode) {
    case SummaryMode.HUMAN:
      return `You are a master editor. Your task is to summarize the provided ebook/document by ruthlessly removing non-important parts while preserving the core narrative and key insights.
    
    GUIDELINES FOR HUMAN OUTPUT:
    - **Readability is paramount.** Write in clear, engaging prose.
    - **Remove fluff.** Strip out repetitive examples, verbose transitions, and rhetorical filler.
    - **Structure.** Use main headers for chapters/sections and bullet points for lists.
    - **Tone.** Maintain the author's voice but speed up the pacing.
    - **Goal.** A human should be able to read this summary in 5-10 minutes and understand 90% of the book's value.`;

    case SummaryMode.AI_AGENT:
      return `You are a backend data compression engine for an AI Agent. Your task is to convert the provided ebook/document into a highly dense context file.
    
    GUIDELINES FOR AI AGENT OUTPUT:
    - **Density is paramount.** Maximize information per token.
    - **Remove non-important parts.** Discard all narrative glue, storytelling devices, and politeness.
    - **Extract.** Focus on Entities, Definitions, Causal Relationships, and Hard Facts.
    - **Format.** Use a structured Markdown hierarchy or nested bullets.
    - **Goal.** An LLM should be able to ingest this summary and answer detailed questions about the book without needing the original file.
    - **No prose.** Do not write paragraphs unless explaining a complex concept. Use fragments and keywords.`;

    case SummaryMode.TOPIC_ANALYSIS:
      return `You are a research analyst. Your task is to ignore the chronological order of the book and instead identify, extract, and synthesize the key topics/themes.

      GUIDELINES FOR TOPIC ANALYSIS:
      - **Identify Themes.** Find the 5-10 most critical topics or arguments discussed in the book.
      - **Synthesize.** For each topic, gather evidence, examples, and arguments from across the entire text.
      - **Format.** Use H2 headers for each Topic, followed by a detailed summary of that specific subject.
      - **Deep Dive.** Go deep on the "What", "Why", and "How" for each topic.
      - **Ignore Structure.** Do not summarize chapter by chapter. Group related information together regardless of where it appears in the text.`;

    case SummaryMode.CHAPTER_BY_CHAPTER:
      return `You are a structural editor. Your task is to provide a sequential summary of the book, respecting its internal structure.

      GUIDELINES FOR CHAPTER-BY-CHAPTER:
      - **Sequential.** Follow the order of the text exactly.
      - **Identify Chapters.** Look for "CHAPTER BREAK" markers or explicit chapter headings in the text to denote sections.
      - **Summarize.** For each chapter, write a concise summary (3-5 bullet points or a short paragraph) capturing the key events or arguments.
      - **Format.** Use H2 headers for Chapter Names/Numbers.
      - **Completeness.** Do not skip chapters. Ensure every section is represented.`;

    case SummaryMode.MARKDOWN:
    default:
      return `You are a professional document digitization expert. Your task is to convert the provided ebook/document into a high-fidelity Markdown representation.

    GUIDELINES FOR MARKDOWN CONVERSION:
    - **Fidelity:** Preserve the original structure, including headers (H1, H2, etc.), lists, and code blocks.
    - **No Summarization:** Do not summarize. Extract the full content as accurately as possible within output limits.
    - **Formatting:** Ensure bold, italic, and other emphasis matches the source.
    - **Tables:** Convert tables into standard Markdown tables.
    - **Code:** Use fenced code blocks for any code snippets found.
    - **Images:** You cannot render images, but describe them briefly in [italics in brackets] if they are critical to context.
    - **Goal:** The output should be a clean, structured Markdown file ready for a static site generator or documentation system.`;
  }
};

export const generateSummary = async (
  base64Data: string,
  mimeType: string,
  mode: SummaryMode,
  modelId: string
): Promise<string> => {
  // We use a dummy key or env var for LiteLLM
  const apiKey = process.env.API_KEY || "sk-litellm-local";
  const baseUrl = process.env.VITE_LITELLM_BASE_URL || "http://localhost:4000/v1";

  const liteLlm = new LiteLlm({
    model: modelId,
    apiKey,
    baseUrl
  });

  try {
    const contents: Content[] = [{
      role: "user",
      parts: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
        {
          text: "Analyze this document and generate the output based on the system instructions.",
        },
      ],
    }];

    const request: LlmRequest = {
      model: modelId,
      contents: contents,
      config: {
        systemInstruction: {
            parts: [{ text: getSystemInstruction(mode) }]
        },
        temperature: mode === SummaryMode.HUMAN ? 0.3 : 0.1,
      },
      liveConnectConfig: {}, // Required by interface but not used here
      toolsDict: {} // Required by interface but not used here
    };

    const generator = liteLlm.generateContentAsync(request);
    let fullText = "";

    for await (const response of generator) {
        if (response.errorMessage) {
            throw new Error(response.errorMessage);
        }
        if (response.content?.parts) {
            for (const part of response.content.parts) {
                if (part.text) {
                    fullText += part.text;
                }
            }
        }
    }

    return fullText || "No output generated.";
  } catch (error: any) {
    console.error("LiteLLM/ADK Error:", error);
    throw new Error(error.message || "Failed to process document");
  }
};
