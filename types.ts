export enum SummaryMode {
  HUMAN = 'HUMAN',
  AI_AGENT = 'AI_AGENT',
  MARKDOWN = 'MARKDOWN',
  TOPIC_ANALYSIS = 'TOPIC_ANALYSIS',
  CHAPTER_BY_CHAPTER = 'CHAPTER_BY_CHAPTER',
}

export interface ProcessingState {
  isLoading: boolean;
  error: string | null;
  progress: string;
}

export interface SummaryResult {
  id: string;
  text: string;
  mode: SummaryMode;
  fileName: string;
  timestamp: number;
}

export interface FileData {
  file: File;
  base64: string;
  mimeType: string;
}

export const AVAILABLE_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro' },
];
