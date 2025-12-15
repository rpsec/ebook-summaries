import { SummaryResult } from '../types';

const STORAGE_KEY = 'gemini_ebook_lens_history';

export const getHistory = (): SummaryResult[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load history", e);
    return [];
  }
};

export const saveHistoryItem = (item: SummaryResult): SummaryResult[] => {
  try {
    const current = getHistory();
    // Prepend new item, limit to 20 items to keep storage light
    const updated = [item, ...current].slice(0, 20);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Failed to save history", e);
    return getHistory();
  }
};

export const clearHistory = (): void => {
    localStorage.removeItem(STORAGE_KEY);
};