import React, { useState, useRef, useEffect } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { ProcessingIndicator } from '../components/chat/ProcessingIndicator';
import { ValidationSummary } from '../components/validation/ValidationSummary';
import { ideasApi } from '../api/ideas';
import { validationApi } from '../api/validation';
import type { IdeaResponse } from '../types/idea';
import type { ValidationResponse } from '../types/validation';
import {
  Sparkles,
  Send,
  User,
  AlertCircle,
  Play,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  validationData?: ValidationResponse;
  ideaData?: IdeaResponse;
}

export const Workspace: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I am your AI Startup Validation Assistant. Describe your startup idea in detail, and I will analyze its market demand, feasibility, competitive signals, and actionable next steps.",
      timestamp: new Date()
    }
  ]);

  const [inputTitle, setInputTitle] = useState('');
  const [inputDescription, setInputDescription] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced fields
  const [problem, setProblem] = useState('');
  const [targetCustomer, setTargetCustomer] = useState('');
  const [solution, setSolution] = useState('');
  const [industry, setIndustry] = useState('');

  const [currentIdea, setCurrentIdea] = useState<IdeaResponse | null>(null);
  const [latestValidation, setLatestValidation] = useState<ValidationResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [revalidating, setRevalidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, validating]);

  const handleNewValidation = () => {
    setCurrentIdea(null);
    setLatestValidation(null);
    setInputTitle('');
    setInputDescription('');
    setProblem('');
    setTargetCustomer('');
    setSolution('');
    setIndustry('');
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: "New validation session initialized! Tell me about your new startup idea.",
        timestamp: new Date()
      }
    ]);
  };

  // Submit Idea to Backend (POST /ideas)
  const handleSendIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputDescription.trim()) return;

    setError(null);
    const title = inputTitle.trim() || inputDescription.slice(0, 40) + '...';
    const userMsgContent = inputDescription;

    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMsgContent,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setLoading(true);

    try {
      // 1. Call Backend POST /ideas
      const createdIdea = await ideasApi.createIdea({
        title,
        description: inputDescription,
        problem: problem || undefined,
        target_customer: targetCustomer || undefined,
        solution: solution || undefined,
        industry: industry || undefined
      });

      setCurrentIdea(createdIdea);

      // Reset Input Fields
      setInputTitle('');
      setInputDescription('');

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Got it! I've registered "${createdIdea.title}" in your database workspace. Click "Run AI Validation" below to perform a complete multi-stage preliminary validation.`,
        timestamp: new Date(),
        ideaData: createdIdea
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Create idea error:', err);
      setError('Failed to create startup idea submission in backend.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger Full Validation Pipeline (POST /ideas/{id}/validate)
  const handleRunValidation = async (ideaId: number) => {
    setError(null);
    setValidating(true);

    try {
      // Call Backend POST /ideas/{id}/validate
      const valResponse = await validationApi.validateIdea(ideaId);
      setLatestValidation(valResponse);

      const valMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I've completed the validation assessment for "${currentIdea?.title || 'your startup idea'}".`,
        timestamp: new Date(),
        validationData: valResponse
      };

      setMessages((prev) => [...prev, valMsg]);
    } catch (err: any) {
      console.error('Validation error:', err);
      setError('AI Validation pipeline execution failed. Please verify input data.');
    } finally {
      setValidating(false);
    }
  };

  // Trigger Re-validation Pipeline (POST /ideas/{id}/revalidate)
  const handleRevalidate = async () => {
    if (!currentIdea) return;
    setRevalidating(true);
    setError(null);

    try {
      // Call Backend POST /ideas/{id}/revalidate
      const newValResponse = await validationApi.revalidateIdea(currentIdea.id);
      setLatestValidation(newValResponse);

      const valMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Re-validation complete! Version ${newValResponse.version} analysis is ready.`,
        timestamp: new Date(),
        validationData: newValResponse
      };

      setMessages((prev) => [...prev, valMsg]);
    } catch (err: any) {
      console.error('Re-validation error:', err);
      setError('Failed to execute re-validation.');
    } finally {
      setRevalidating(false);
    }
  };

  const handleDownloadReport = async (ideaId: number) => {
    try {
      const markdown = await validationApi.getMarkdownReport(ideaId);
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `startup_validation_report_idea_${ideaId}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Report export failed:', err);
      alert('Failed to download markdown report.');
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar onNewValidation={handleNewValidation} />

      {/* Main AI Chat Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-slate-950">
        {/* Workspace Top Header */}
        <header className="h-14 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-200">
              {currentIdea ? currentIdea.title : 'AI Startup Validation Assistant'}
            </h2>
            {currentIdea && (
              <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800/60">
                v{currentIdea.version}
              </span>
            )}
          </div>

          {currentIdea && !latestValidation && !validating && (
            <button
              onClick={() => handleRunValidation(currentIdea.id)}
              className="py-1.5 px-3.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run AI Validation</span>
            </button>
          )}
        </header>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-4xl mx-auto ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/20 text-white mt-1">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}

              <div className="flex-1 max-w-3xl">
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-cyan-600 text-white rounded-tr-none ml-auto max-w-xl shadow-lg'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>

                {/* Render Action button for created idea */}
                {msg.ideaData && !latestValidation && !validating && (
                  <div className="mt-3 bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">Idea Registered</h4>
                      <p className="text-[11px] text-slate-400">Ready to execute deterministic AI scoring</p>
                    </div>
                    <button
                      onClick={() => handleRunValidation(msg.ideaData!.id)}
                      className="py-2 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Run AI Validation</span>
                    </button>
                  </div>
                )}

                {/* Render Validation Summary inside Chat feed */}
                {msg.validationData && (
                  <ValidationSummary
                    validation={msg.validationData}
                    onRevalidate={handleRevalidate}
                    onDownloadReport={() => handleDownloadReport(msg.validationData!.idea_id)}
                    revalidating={revalidating}
                  />
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-cyan-400 font-bold text-xs mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {/* Validation Running State */}
          {validating && <ProcessingIndicator />}

          {/* Error Banner */}
          {error && (
            <div className="max-w-xl mx-auto p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 shrink-0">
          <form onSubmit={handleSendIdea} className="max-w-4xl mx-auto space-y-3">
            {/* Advanced Fields Toggle Header */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{showAdvanced ? 'Hide Optional Specifications' : 'Add Optional Specifications (Problem, Customer, Industry)'}</span>
                {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Optional Specification Fields */}
            {showAdvanced && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Title</label>
                  <input
                    type="text"
                    value={inputTitle}
                    onChange={(e) => setInputTitle(e.target.value)}
                    placeholder="e.g. AI Contract Analyzer"
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Industry</label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. LegalTech / B2B SaaS"
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Target Customer Profile</label>
                  <input
                    type="text"
                    value={targetCustomer}
                    onChange={(e) => setTargetCustomer(e.target.value)}
                    placeholder="e.g. Small business founders & legal ops"
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Core Problem Solved</label>
                  <input
                    type="text"
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    placeholder="e.g. Contract review is expensive and slow"
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}

            {/* Main Textarea Input */}
            <div className="relative flex items-center">
              <textarea
                required
                rows={2}
                value={inputDescription}
                onChange={(e) => setInputDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendIdea(e);
                  }
                }}
                placeholder="Describe your startup concept here... (Press Enter to submit, Shift+Enter for new line)"
                className="w-full py-3 pl-4 pr-14 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none shadow-xl"
              />
              <button
                type="submit"
                disabled={loading || !inputDescription.trim()}
                className="absolute right-3 py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all disabled:opacity-40"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
