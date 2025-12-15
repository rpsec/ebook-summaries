import React, { useState, useRef, useEffect } from 'react';
import { UploadZone } from './components/UploadZone';
import { SummaryViewer } from './components/SummaryViewer';
import { Spinner } from './components/Spinner';
import { HistoryList } from './components/HistoryList';
import { generateSummary } from './services/geminiService';
import { parseEpub } from './services/epubService';
import { getHistory, saveHistoryItem, clearHistory } from './services/historyService';
import { FileData, SummaryMode, ProcessingState, SummaryResult, AVAILABLE_MODELS } from './types';
import { BrainCircuit, User, Bot, FileText, Sparkles, Moon, Sun, FileCode, ListTree, BookCopy, ChevronDown } from 'lucide-react';

const App: React.FC = () => {
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [mode, setMode] = useState<SummaryMode>(SummaryMode.HUMAN);
  const [processing, setProcessing] = useState<ProcessingState>({
    isLoading: false,
    error: null,
    progress: '',
  });
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [history, setHistory] = useState<SummaryResult[]>([]);
  const [isDark, setIsDark] = useState(false);
  const [modelId, setModelId] = useState<string>(AVAILABLE_MODELS[0].id);
  
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHistory(getHistory());
    
    // Check local storage or system preference
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDark;
    setIsDark(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleFileSelected = (data: FileData) => {
    setFileData(data);
    setResult(null);
    setProcessing({ isLoading: false, error: null, progress: '' });
  };

  const handleProcess = async () => {
    if (!fileData) return;

    setProcessing({ isLoading: true, error: null, progress: 'Analyzing document structure...' });
    
    try {
      let base64Payload = fileData.base64;
      let mimeTypePayload = fileData.mimeType;

      // Handle EPUB parsing client-side
      if (fileData.mimeType === 'application/epub+zip' || fileData.file.name.toLowerCase().endsWith('.epub')) {
         setProcessing(prev => ({ ...prev, progress: 'Parsing EPUB content...' }));
         const epubText = await parseEpub(fileData.file);
         
         // Convert extracted text to base64 to match geminiService expectation for generic data
         // We switch mimeType to text/plain because we extracted the raw text
         base64Payload = btoa(unescape(encodeURIComponent(epubText))); 
         mimeTypePayload = 'text/plain';
      }

      setProcessing(prev => ({ ...prev, progress: 'Generating output with Gemini...' }));
      const summaryText = await generateSummary(base64Payload, mimeTypePayload, mode, modelId);
      
      const newResult: SummaryResult = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        text: summaryText,
        mode: mode,
        fileName: fileData.file.name,
        timestamp: Date.now(),
      };

      setResult(newResult);
      setHistory(saveHistoryItem(newResult));
      
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (err: any) {
      setProcessing(prev => ({ ...prev, error: err.message || "An unexpected error occurred" }));
    } finally {
      setProcessing(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleReset = () => {
    setFileData(null);
    setResult(null);
    setProcessing({ isLoading: false, error: null, progress: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHistorySelect = (item: SummaryResult) => {
    setFileData(null);
    setResult(item);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  // Helper to determine active color based on mode
  const getModeColor = (m: SummaryMode) => {
    switch(m) {
      case SummaryMode.HUMAN: return 'indigo';
      case SummaryMode.AI_AGENT: return 'purple';
      case SummaryMode.MARKDOWN: return 'teal';
      case SummaryMode.TOPIC_ANALYSIS: return 'amber';
      case SummaryMode.CHAPTER_BY_CHAPTER: return 'rose';
      default: return 'indigo';
    }
  };

  const activeColor = getModeColor(mode);

  const getGradient = () => {
    switch(activeColor) {
      case 'indigo': return 'from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400';
      case 'purple': return 'from-purple-600 to-fuchsia-600 dark:from-purple-400 dark:to-fuchsia-400';
      case 'teal': return 'from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400';
      case 'amber': return 'from-amber-500 to-orange-600 dark:from-amber-400 dark:to-orange-400';
      case 'rose': return 'from-rose-500 to-pink-600 dark:from-rose-400 dark:to-pink-400';
      default: return 'from-indigo-600 to-violet-600';
    }
  };

  const getButtonClass = (bgColor: string) => {
    // Mapping internal color name to tailwind classes
    const classes: Record<string, string> = {
      'indigo': 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200',
      'purple': 'bg-purple-600 hover:bg-purple-700 shadow-purple-200',
      'teal': 'bg-teal-600 hover:bg-teal-700 shadow-teal-200',
      'amber': 'bg-amber-600 hover:bg-amber-700 shadow-amber-200',
      'rose': 'bg-rose-600 hover:bg-rose-700 shadow-rose-200',
    };
    return classes[bgColor] || classes['indigo'];
  };

  const getButtonLabel = () => {
    switch(mode) {
      case SummaryMode.HUMAN: return 'Generate Readable Summary';
      case SummaryMode.AI_AGENT: return 'Generate AI Context';
      case SummaryMode.MARKDOWN: return 'Convert to Markdown';
      case SummaryMode.TOPIC_ANALYSIS: return 'Analyze Topics';
      case SummaryMode.CHAPTER_BY_CHAPTER: return 'Analyze Chapters';
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 shadow-sm transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={handleReset}>
            <div className={`p-2 rounded-lg transition-colors bg-${activeColor}-600`}>
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <h1 className={`text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r transition-all duration-300 ${getGradient()}`}>
              Gemini Ebook Lens
            </h1>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4">
             <div className="relative group hidden sm:block">
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-gray-500">
                    <ChevronDown className="w-3 h-3" />
                </div>
                <select
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    className="appearance-none bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-xs font-medium text-gray-700 dark:text-gray-200 py-1.5 pl-3 pr-8 rounded-lg border border-transparent focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                    aria-label="Select AI Model"
                >
                    {AVAILABLE_MODELS.map(model => (
                        <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                </select>
             </div>

             <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle Dark Mode"
             >
               {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        
        {/* Mobile Model Selector (visible only on small screens) */}
        <div className="sm:hidden mb-6 flex justify-end">
            <div className="relative group w-full max-w-[200px]">
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-gray-500">
                    <ChevronDown className="w-3 h-3" />
                </div>
                <select
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 py-2 pl-3 pr-8 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                     {AVAILABLE_MODELS.map(model => (
                        <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                </select>
            </div>
        </div>
        
        {/* Introduction */}
        {!fileData && !result && (
          <div className="text-center mb-10 space-y-4 animate-fade-in">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Transform Your Ebooks
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto leading-relaxed">
              Upload PDF or EPUB files to process them with Gemini. <br/>
              Choose from 5 distinct analysis modes tailored to your needs.
            </p>
          </div>
        )}

        {/* Mode Selection - Only show if no result yet */}
        {!result && (
          <div className="mb-8 animate-slide-up">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 ml-1">Summary Strategy</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {/* HUMAN MODE */}
              <button
                onClick={() => setMode(SummaryMode.HUMAN)}
                className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  mode === SummaryMode.HUMAN
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 ring-1 ring-indigo-600'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-750'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${mode === SummaryMode.HUMAN ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                    <User className="w-5 h-5" />
                  </div>
                  {mode === SummaryMode.HUMAN && <div className="h-3 w-3 bg-indigo-600 dark:bg-indigo-500 rounded-full animate-pulse" />}
                </div>
                <h3 className={`font-semibold ${mode === SummaryMode.HUMAN ? 'text-indigo-900 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-200'}`}>
                  Readable
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Concise narrative summaries for quick reading.
                </p>
              </button>

              {/* CHAPTER MODE */}
              <button
                onClick={() => setMode(SummaryMode.CHAPTER_BY_CHAPTER)}
                className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  mode === SummaryMode.CHAPTER_BY_CHAPTER
                    ? 'border-rose-600 bg-rose-50 dark:bg-rose-900/30 ring-1 ring-rose-600'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-rose-300 dark:hover:border-rose-500 hover:bg-gray-50 dark:hover:bg-gray-750'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${mode === SummaryMode.CHAPTER_BY_CHAPTER ? 'bg-rose-200 text-rose-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                    <BookCopy className="w-5 h-5" />
                  </div>
                  {mode === SummaryMode.CHAPTER_BY_CHAPTER && <div className="h-3 w-3 bg-rose-600 dark:bg-rose-500 rounded-full animate-pulse" />}
                </div>
                <h3 className={`font-semibold ${mode === SummaryMode.CHAPTER_BY_CHAPTER ? 'text-rose-900 dark:text-rose-300' : 'text-gray-700 dark:text-gray-200'}`}>
                  By Chapter
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Sequential summaries respecting book structure.
                </p>
              </button>

              {/* TOPIC MODE */}
              <button
                onClick={() => setMode(SummaryMode.TOPIC_ANALYSIS)}
                className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  mode === SummaryMode.TOPIC_ANALYSIS
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 ring-1 ring-amber-500'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-amber-300 dark:hover:border-amber-500 hover:bg-gray-50 dark:hover:bg-gray-750'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${mode === SummaryMode.TOPIC_ANALYSIS ? 'bg-amber-200 text-amber-800' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                    <ListTree className="w-5 h-5" />
                  </div>
                  {mode === SummaryMode.TOPIC_ANALYSIS && <div className="h-3 w-3 bg-amber-500 dark:bg-amber-500 rounded-full animate-pulse" />}
                </div>
                <h3 className={`font-semibold ${mode === SummaryMode.TOPIC_ANALYSIS ? 'text-amber-900 dark:text-amber-300' : 'text-gray-700 dark:text-gray-200'}`}>
                  Topic Analysis
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Extract and synthesize key themes across the text.
                </p>
              </button>
            </div>

            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 ml-1">Data & Context</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* AI AGENT MODE */}
              <button
                onClick={() => setMode(SummaryMode.AI_AGENT)}
                className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  mode === SummaryMode.AI_AGENT
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 ring-1 ring-purple-600'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-300 dark:hover:border-purple-500 hover:bg-gray-50 dark:hover:bg-gray-750'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${mode === SummaryMode.AI_AGENT ? 'bg-purple-200 text-purple-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                    <Bot className="w-5 h-5" />
                  </div>
                  {mode === SummaryMode.AI_AGENT && <div className="h-3 w-3 bg-purple-600 dark:bg-purple-500 rounded-full animate-pulse" />}
                </div>
                <h3 className={`font-semibold ${mode === SummaryMode.AI_AGENT ? 'text-purple-900 dark:text-purple-300' : 'text-gray-700 dark:text-gray-200'}`}>
                  AI Context
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Dense facts & entities for LLM ingestion.
                </p>
              </button>

              {/* MARKDOWN MODE */}
              <button
                onClick={() => setMode(SummaryMode.MARKDOWN)}
                className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  mode === SummaryMode.MARKDOWN
                    ? 'border-teal-600 bg-teal-50 dark:bg-teal-900/30 ring-1 ring-teal-600'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-teal-300 dark:hover:border-teal-500 hover:bg-gray-50 dark:hover:bg-gray-750'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${mode === SummaryMode.MARKDOWN ? 'bg-teal-200 text-teal-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                    <FileCode className="w-5 h-5" />
                  </div>
                  {mode === SummaryMode.MARKDOWN && <div className="h-3 w-3 bg-teal-600 dark:bg-teal-500 rounded-full animate-pulse" />}
                </div>
                <h3 className={`font-semibold ${mode === SummaryMode.MARKDOWN ? 'text-teal-900 dark:text-teal-300' : 'text-gray-700 dark:text-gray-200'}`}>
                  Markdown
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Full content conversion to structured MD.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Upload Area - Hidden if there is a result */}
        {!fileData && !result && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <UploadZone onFileSelected={handleFileSelected} disabled={processing.isLoading} />
          </div>
        )}

        {/* Processing View */}
        {fileData && !result && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-lg">
                  <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">
                    {fileData.file.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(fileData.file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button 
                onClick={handleReset}
                className="text-sm text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                disabled={processing.isLoading}
              >
                Remove
              </button>
            </div>

            {processing.error ? (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg text-sm">
                Error: {processing.error}
                <button onClick={handleProcess} className="ml-2 font-bold underline">Retry</button>
              </div>
            ) : (
              <div className="text-center py-4">
                 {!processing.isLoading ? (
                   <button
                    onClick={handleProcess}
                    className={`w-full sm:w-auto px-8 py-3 rounded-xl font-semibold text-white shadow-lg dark:shadow-none transition-all transform active:scale-95 flex items-center justify-center mx-auto space-x-2 ${getButtonClass(activeColor)}`}
                   >
                    <Sparkles className="w-5 h-5" />
                    <span>{getButtonLabel()}</span>
                   </button>
                 ) : (
                   <div className="flex flex-col items-center space-y-3 py-2">
                     <div className={`p-3 rounded-full bg-${activeColor}-600`}>
                       <Spinner />
                     </div>
                     <p className="text-gray-600 dark:text-gray-300 font-medium animate-pulse">{processing.progress}</p>
                     <p className="text-xs text-gray-400">This may take a moment for large books</p>
                   </div>
                 )}
              </div>
            )}
          </div>
        )}

        {/* Result View */}
        {result && (
          <div ref={resultsRef} className="space-y-6">
             <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {fileData ? "Processing Complete" : "Viewing History"}
                </h2>
                <button
                   onClick={handleReset}
                   className="text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-lg transition-colors"
                >
                   Start New Summary
                </button>
             </div>
             <SummaryViewer result={result} />
          </div>
        )}

        {/* History List */}
        {!processing.isLoading && (
            <HistoryList 
                history={history} 
                onSelect={handleHistorySelect} 
                onClear={handleClearHistory} 
            />
        )}

      </main>
    </div>
  );
};

export default App;
