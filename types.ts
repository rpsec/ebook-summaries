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