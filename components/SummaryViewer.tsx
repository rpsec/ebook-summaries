import React from 'react';
import ReactMarkdown from 'react-markdown';
import { BookOpen, Copy, Check, Bot, User, FileCode, ListTree, BookCopy } from 'lucide-react';
import { SummaryResult, SummaryMode } from '../types';

interface SummaryViewerProps {
  result: SummaryResult;
}

export const SummaryViewer: React.FC<SummaryViewerProps> = ({ result }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getModeIcon = () => {
    switch (result.mode) {
      case SummaryMode.HUMAN: return <User className="w-5 h-5" />;
      case SummaryMode.AI_AGENT: return <Bot className="w-5 h-5" />;
      case SummaryMode.MARKDOWN: return <FileCode className="w-5 h-5" />;
      case SummaryMode.TOPIC_ANALYSIS: return <ListTree className="w-5 h-5" />;
      case SummaryMode.CHAPTER_BY_CHAPTER: return <BookCopy className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  const getModeStyles = () => {
    switch (result.mode) {
      case SummaryMode.HUMAN: return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400';
      case SummaryMode.AI_AGENT: return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
      case SummaryMode.MARKDOWN: return 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400';
      case SummaryMode.TOPIC_ANALYSIS: return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
      case SummaryMode.CHAPTER_BY_CHAPTER: return 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400';
      default: return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400';
    }
  };

  const getModeLabel = () => {
    switch (result.mode) {
      case SummaryMode.HUMAN: return 'Human-Readable Summary';
      case SummaryMode.AI_AGENT: return 'AI Context Graph';
      case SummaryMode.MARKDOWN: return 'Markdown Conversion';
      case SummaryMode.TOPIC_ANALYSIS: return 'Topic Analysis';
      case SummaryMode.CHAPTER_BY_CHAPTER: return 'Chapter-by-Chapter';
      default: return 'Summary';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in duration-500 transition-colors">
      <div className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between sticky top-0 z-10 transition-colors">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${getModeStyles()}`}>
            {getModeIcon()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {getModeLabel()}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-0.5">
              <BookOpen className="w-3 h-3 mr-1" />
              {result.fileName}
            </p>
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-1.5 text-green-600 dark:text-green-400" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-1.5" />
              Copy Text
            </>
          )}
        </button>
      </div>
      
      <div className="p-6 md:p-8 overflow-y-auto max-h-[70vh] bg-white dark:bg-gray-800 transition-colors custom-scrollbar">
        <article className="prose prose-indigo dark:prose-invert prose-sm md:prose-base max-w-none">
          <ReactMarkdown>{result.text}</ReactMarkdown>
        </article>
      </div>
    </div>
  );
};