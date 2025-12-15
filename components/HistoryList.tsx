import React, { useState } from 'react';
import { SummaryResult, SummaryMode } from '../types';
import { Clock, User, Bot, ArrowRight, Copy, Check, Trash2, FileCode, ListTree, BookCopy } from 'lucide-react';

interface HistoryListProps {
  history: SummaryResult[];
  onSelect: (item: SummaryResult) => void;
  onClear: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, onSelect, onClear }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (history.length === 0) return null;

  const handleCopy = (e: React.MouseEvent, item: SummaryResult) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(new Date(timestamp));
  };

  const getModeInfo = (mode: SummaryMode) => {
    switch(mode) {
      case SummaryMode.HUMAN:
        return { 
          icon: <User className="w-4 h-4" />, 
          label: 'Human', 
          style: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' 
        };
      case SummaryMode.AI_AGENT:
        return { 
          icon: <Bot className="w-4 h-4" />, 
          label: 'AI Agent', 
          style: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' 
        };
      case SummaryMode.MARKDOWN:
        return { 
          icon: <FileCode className="w-4 h-4" />, 
          label: 'Markdown', 
          style: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400' 
        };
      case SummaryMode.TOPIC_ANALYSIS:
        return {
          icon: <ListTree className="w-4 h-4" />,
          label: 'Topic Analysis',
          style: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
        };
      case SummaryMode.CHAPTER_BY_CHAPTER:
        return {
          icon: <BookCopy className="w-4 h-4" />,
          label: 'Chapters',
          style: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
        };
      default:
         return { 
          icon: <User className="w-4 h-4" />, 
          label: 'Unknown', 
          style: 'bg-gray-100 text-gray-700' 
        };
    }
  };

  return (
    <div className="mt-24 border-t border-gray-200 dark:border-gray-700 pt-10 animate-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
          <Clock className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
          Previous Summaries
        </h3>
        <button 
          onClick={onClear}
          className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center transition-colors bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full"
        >
          <Trash2 className="w-3 h-3 mr-1.5" />
          Clear History
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {history.map((item) => {
          const modeInfo = getModeInfo(item.mode);
          return (
            <div 
              key={item.id}
              onClick={() => onSelect(item)}
              className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-3">
                <div className={`p-1.5 rounded-md flex items-center gap-2 ${modeInfo.style}`}>
                  {modeInfo.icon}
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {modeInfo.label}
                  </span>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                  {formatDate(item.timestamp)}
                </span>
              </div>
              
              <h4 className="font-semibold text-gray-900 dark:text-white truncate mb-2" title={item.fileName}>{item.fileName}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 h-8 font-mono leading-relaxed opacity-80">
                {item.text.substring(0, 150).replace(/[#*`]/g, '')}...
              </p>
              
              <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                 <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center">
                   View Result <ArrowRight className="w-3 h-3 ml-1" />
                 </span>
                 
                 <button
                   onClick={(e) => handleCopy(e, item)}
                   className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors z-10"
                   title="Copy text"
                 >
                   {copiedId === item.id ? <Check className="w-4 h-4 text-green-600 dark:text-green-400" /> : <Copy className="w-4 h-4" />}
                 </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};