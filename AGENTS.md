# Gemini Ebook Lens - Agent Architecture

This document outlines the AI agent personas, system instructions, and prompting strategies used in the **Gemini Ebook Lens** application.

The application leverages **Google's Gemini 2.5 Flash** and **Gemini 3.0 Pro** models to process large documents (PDF, EPUB, TXT). Instead of a single generic summary, the system dynamically switches "System Instructions" to adopt specific personas based on the user's intent.

## Core Architecture

The application follows a **stateless, single-turn agent** pattern:

1.  **Input Processing**: 
    -   PDFs are converted to Base64 (processed directly by Gemini's multimodal capabilities).
    -   EPUBs are parsed client-side into raw text sequences to ensure structural integrity before being sent to the model.
2.  **Persona Selection**: The user selects a mode (Human, Agent, Topic, etc.), which maps to a specific `System Instruction`.
3.  **Inference**: The file content and the system instruction are sent to the Gemini API.
4.  **Output**: The model returns a structured text response based on the persona's constraints.

---

## Agent Personas

The application defines 5 distinct agent personas, each optimized for a specific output format and density.

### 1. The Master Editor (Human Mode)
*   **Role**: A professional book editor.
*   **Goal**: Create a summary that is enjoyable for humans to read.
*   **Key Behavior**:
    *   Removes "fluff", repetitive examples, and rhetorical transitions.
    *   Maintains the author's original voice but speeds up the pacing.
    *   Uses clear headers and bullet points.
*   **Temperature**: `0.3` (Slightly creative to maintain flow).

### 2. The Data Compression Engine (AI Agent Mode)
*   **Role**: A backend data processing subsystem.
*   **Goal**: Create a "Context Graph" for other LLMs.
*   **Key Behavior**:
    *   **Maximizes information density** (Facts per Token).
    *   Strips all narrative glue, storytelling, and politeness.
    *   Extracts Entities, Definitions, and Causal Relationships.
    *   **Strict Format**: Nested bullets or JSON-like Markdown structures.
*   **Use Case**: Feed this output into a RAG system or another Agent's context window.
*   **Temperature**: `0.1` (Strict adherence to facts).

### 3. The Research Analyst (Topic Analysis)
*   **Role**: A non-linear researcher.
*   **Goal**: Synthesize themes regardless of where they appear in the book.
*   **Key Behavior**:
    *   **Ignores Chronology**: Does not summarize chapter-by-chapter.
    *   Identifies top 5-10 arguments/themes.
    *   Aggregates evidence from the beginning, middle, and end of the book under specific topic headers.
*   **Temperature**: `0.1`.

### 4. The Structural Editor (Chapter-by-Chapter)
*   **Role**: A sequential summarizer.
*   **Goal**: Create a linear companion guide to the text.
*   **Key Behavior**:
    *   Respects the internal structure of the file.
    *   Detects "CHAPTER BREAK" markers (inserted during EPUB parsing) or header tags.
    *   Ensures 100% coverage (no skipped chapters).
*   **Temperature**: `0.1`.

### 5. The Digitization Expert (Markdown Conversion)
*   **Role**: A high-fidelity format converter.
*   **Goal**: Convert binary/proprietary formats into clean Markdown.
*   **Key Behavior**:
    *   **Zero Summarization**: Attempts to keep 100% of the text (within token limits).
    *   Preserves formatting (Bold, Italic, Tables).
    *   Converts code blocks to Fenced Code Blocks.
    *   Describes images in `[italics]`.
*   **Temperature**: `0.1`.

---

## Model Configuration

### Models
*   **Gemini 2.5 Flash (`gemini-2.5-flash`)**: The default workhorse. Selected for its massive context window (1M+ tokens) and speed, making it ideal for processing entire books in one pass.
*   **Gemini 3.0 Pro (`gemini-3-pro-preview`)**: Available for complex reasoning tasks or when higher fidelity nuance is required.

### Parameters
*   **System Instruction**: The primary mechanism for control. We do not use "few-shot" prompting in the user message; instead, we rely on strong, persona-based system instructions.
*   **Temperature**:
    *   `0.1` for analytical tasks (Agent, Topic, Markdown, Chapter) to reduce hallucinations.
    *   `0.3` for Human Summary to allow for better sentence flow and prose.

## Future Agent Capabilities (Roadmap)
*   **Multi-Step Reasoning**: Implement a "Critique and Refine" loop where a second agent reviews the summary for missed details.
*   **Q&A Agent**: A specific mode that ingests the book and then allows the user to chat with it (Interactive Agent).
