import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import {
  ValidationConversation,
  ChatMessage,
  StructuredStartupState,
} from '../types';
import { ChatHistorySidebar } from '../components/ChatHistorySidebar';
import { SafeMarkdown } from '../components/SafeMarkdown';

import {
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  ArrowRight,
  RefreshCw,
  Award,
  Lightbulb,
  Check,
} from 'lucide-react';

const PARAM_LABELS: Record<string, string> = {
  marketDemand: 'Market Demand',
  problemSeverity: 'Problem Severity',
  competition: 'Competition & Moat',
  targetCustomer: 'Target Customer',
  innovation: 'Innovation',
  feasibility: 'Feasibility',
  revenuePotential: 'Revenue Potential',
};

export const NewValidationPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [conversations, setConversations] = useState<ValidationConversation[]>([]);
  const [activeConv, setActiveConv] = useState<ValidationConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [structuredState, setStructuredState] = useState<StructuredStartupState>({});
  const [inputText, setInputText] = useState('');

  // Granular Loading States
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStep, setValidationStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Refs for idempotent initialization & scrolling
  const initializedUserIdRef = useRef<string | null>(null);
  const isInitializingRef = useRef<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isNearBottomRef = useRef<boolean>(true);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 120;
  };

  const scrollToBottom = (force = false) => {
    if (force || isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [messages, isValidating, isSendingMessage]);

  /**
   * Internal helper to fetch messages and activate a conversation
   */
  const loadConversationMessages = useCallback(async (convId: string) => {
    try {
      setIsLoadingMessages(true);
      setError(null);
      const res = await api.getConversation(convId);
      setActiveConv(res.conversation);
      setMessages(res.conversation.messages || []);
      try {
        setStructuredState(JSON.parse(res.conversation.structuredData || '{}'));
      } catch {
        setStructuredState({});
      }
      setTimeout(() => scrollToBottom(true), 60);
    } catch (err: any) {
      setError(err.message || 'Failed to load conversation details.');
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  /**
   * Authoritative Initialization Flow for the Authenticated User
   */
  const initializeUserConversations = useCallback(async (userId: string) => {
    if (isInitializingRef.current || initializedUserIdRef.current === userId) {
      return;
    }

    isInitializingRef.current = true;
    initializedUserIdRef.current = userId;
    setIsLoadingConversations(true);
    setError(null);

    try {
      const res = await api.getConversations();
      const userConvs = res.conversations || [];
      setConversations(userConvs);

      const urlConvId = searchParams.get('conversationId');

      if (urlConvId && userConvs.some((c) => c.id === urlConvId)) {
        // 1. URL has a valid conversation ID belonging to the user
        await loadConversationMessages(urlConvId);
      } else if (userConvs.length > 0) {
        // 2. Select the most recent existing conversation
        const latestId = userConvs[0].id;
        setSearchParams({ conversationId: latestId }, { replace: true });
        await loadConversationMessages(latestId);
      } else {
        // 3. New user with 0 conversations -> create EXACTLY ONE initial conversation
        setIsCreatingConversation(true);
        const createRes = await api.createConversation();
        const initialConv = createRes.conversation;
        setConversations([initialConv]);
        setActiveConv(initialConv);
        setMessages(initialConv.messages || []);
        setStructuredState({});
        setSearchParams({ conversationId: initialConv.id }, { replace: true });
        setTimeout(() => scrollToBottom(true), 60);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize conversations.');
    } finally {
      setIsLoadingConversations(false);
      setIsCreatingConversation(false);
      isInitializingRef.current = false;
    }
  }, [searchParams, setSearchParams, loadConversationMessages]);

  /**
   * Monitor user authentication and trigger initialization once per authenticated session
   */
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // User logged out -> reset state
      initializedUserIdRef.current = null;
      isInitializingRef.current = false;
      setConversations([]);
      setActiveConv(null);
      setMessages([]);
      setStructuredState({});
      return;
    }

    if (initializedUserIdRef.current !== user.id) {
      initializeUserConversations(user.id);
    }
  }, [user, authLoading, initializeUserConversations]);

  /**
   * User clicks a conversation item in the history sidebar
   */
  const handleSelectConversation = async (id: string) => {
    if (activeConv?.id === id || isLoadingMessages) return;

    setSearchParams({ conversationId: id }, { replace: true });
    setSidebarOpen(false);
    await loadConversationMessages(id);
  };

  /**
   * User explicitly clicks "+ New Startup Idea" button
   */
  const handleNewIdea = async () => {
    if (isCreatingConversation || isSendingMessage || isValidating) return;

    try {
      setIsCreatingConversation(true);
      setError(null);
      const res = await api.createConversation();
      const newConv = res.conversation;

      setConversations((prev) => {
        // Prevent accidental duplicate in list if same ID exists
        if (prev.some((c) => c.id === newConv.id)) {
          return prev;
        }
        return [newConv, ...prev];
      });

      setActiveConv(newConv);
      setMessages(newConv.messages || []);
      setStructuredState({});
      setSearchParams({ conversationId: newConv.id }, { replace: true });
      setSidebarOpen(false);
      setTimeout(() => scrollToBottom(true), 60);
    } catch (err: any) {
      setError(err.message || 'Failed to start a new startup idea conversation.');
    } finally {
      setIsCreatingConversation(false);
    }
  };

  /**
   * User deletes a conversation
   */
  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this startup conversation?')) return;

    try {
      await api.deleteConversation(id);
      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);

      if (activeConv?.id === id) {
        if (remaining.length > 0) {
          const nextConvId = remaining[0].id;
          setSearchParams({ conversationId: nextConvId }, { replace: true });
          await loadConversationMessages(nextConvId);
        } else {
          // If all conversations are deleted, create a fresh one
          await handleNewIdea();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete conversation.');
    }
  };

  /**
   * User sends a message in the chat
   */
  const handleSendMessage = async (textToSend?: string) => {
    const message = (textToSend || inputText).trim();
    if (!message || !activeConv || isSendingMessage || isValidating) return;

    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsSendingMessage(true);
    setError(null);

    // If initial idea submission without existing validation, show visible evaluation progress
    const isInitialSubmission = !hasValidated && message.length >= 25;
    let t1: any = null;
    let t2: any = null;
    let t3: any = null;

    if (isInitialSubmission) {
      setIsValidating(true);
      setValidationStep(0);
      t1 = setTimeout(() => setValidationStep(1), 500);
      t2 = setTimeout(() => setValidationStep(2), 1100);
      t3 = setTimeout(() => setValidationStep(3), 1700);
    }

    const optimisticMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      conversationId: activeConv.id,
      sender: 'USER',
      message,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom(true), 50);

    try {
      const res = await api.sendMessage(activeConv.id, message);
      if (t1) clearTimeout(t1);
      if (t2) clearTimeout(t2);
      if (t3) clearTimeout(t3);

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticMsg.id),
        res.userMessage,
        res.assistantMessage,
      ]);
      setStructuredState(res.structuredData);

      const meta = parseMetadata(res.assistantMessage.metadata);

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConv.id
            ? {
                ...c,
                title: res.structuredData.startupName || c.title,
                latestScore: meta?.overallScore ?? c.latestScore,
                reportsCount: (c.reportsCount || 0) + (meta?.reportId ? 1 : 0),
                lastMessage: res.assistantMessage.message,
                updatedAt: new Date().toISOString(),
              }
            : c
        )
      );
      setTimeout(() => scrollToBottom(true), 50);
    } catch (err: any) {
      if (t1) clearTimeout(t1);
      if (t2) clearTimeout(t2);
      if (t3) clearTimeout(t3);
      setError(err.message || 'Failed to send message.');
    } finally {
      setIsSendingMessage(false);
      setIsValidating(false);
      setValidationStep(0);
    }
  };

  /**
   * Trigger 7-parameter AI validation scoring
   */
  const handleTriggerValidation = async () => {
    if (!activeConv || isValidating) return;

    setIsValidating(true);
    setValidationStep(0);
    setError(null);
    setTimeout(() => scrollToBottom(true), 50);

    const timer1 = setTimeout(() => setValidationStep(1), 500);
    const timer2 = setTimeout(() => setValidationStep(2), 1100);
    const timer3 = setTimeout(() => setValidationStep(3), 1700);

    try {
      const res = await api.validateConversation(activeConv.id);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      const updatedConv = await api.getConversation(activeConv.id);
      setMessages(updatedConv.conversation.messages || []);
      setActiveConv(updatedConv.conversation);

      // Update sidebar conversations list with latest score and reports count
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConv.id
            ? {
                ...c,
                title: updatedConv.conversation.title || c.title,
                latestScore: res.overallScore ?? c.latestScore,
                reportsCount: (c.reportsCount || 0) + (res.reportId ? 1 : 0),
                updatedAt: new Date().toISOString(),
              }
            : c
        )
      );

      setTimeout(() => scrollToBottom(true), 50);
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate startup idea.');
    } finally {
      setIsValidating(false);
      setValidationStep(0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const parseMetadata = (metadataStr?: string | null) => {
    if (!metadataStr) return null;
    try {
      return JSON.parse(metadataStr);
    } catch {
      return null;
    }
  };

  const starterSuggestions = [
    {
      title: 'AI internship matching platform',
      prompt: 'I want to build an AI platform for students to find internships matching their verified coding projects and skills.',
    },
    {
      title: 'Late-night student food delivery',
      prompt: 'A peer-to-peer late-night campus dorm food delivery service with zero vehicle delivery fees.',
    },
    {
      title: 'Collaborative study platform',
      prompt: 'A collaborative WebXR virtual study space for engineering and STEM students to solve problem sets together.',
    },
    {
      title: 'Campus gear & textbook marketplace',
      prompt: 'A verified student-to-student marketplace for buying and selling textbooks, lab equipment, and dorm furniture.',
    },
  ];

  const hasValidated = messages.some((m) => m.actionType === 'VALIDATION_COMPLETED');
  const hasMultipleMessages = messages.length > 2;

  return (
    <div className="flex h-full w-full bg-[#F8FAFC] dark:bg-dark-bg text-slate-800 dark:text-dark-text overflow-hidden font-sans relative">
      {/* 1. Conversation Sidebar (Desktop Static & Mobile Slide Drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 h-full flex-shrink-0 transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <ChatHistorySidebar
          conversations={conversations}
          activeId={activeConv?.id || null}
          onSelect={handleSelectConversation}
          onNewIdea={handleNewIdea}
          onDelete={handleDeleteConversation}
          loading={isLoadingConversations || isCreatingConversation}
          onCloseMobile={() => setSidebarOpen(false)}
        />
      </aside>

      {/* Backdrop for mobile drawer */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* 2. Main Chat Area Column */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-[#F8FAFC] dark:bg-dark-bg">
        {/* Top Header */}
        <header className="flex-shrink-0 h-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 dark:border-dark-border bg-white dark:bg-dark-card flex items-center justify-between gap-3 shadow-2xs z-10">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-dark-input text-slate-600 dark:text-dark-muted hover:text-slate-900 dark:hover:text-dark-text flex-shrink-0 cursor-pointer"
              title="Toggle Idea History"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-2xs flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-dark-text truncate">
                {activeConv?.title || 'New Startup Idea'}
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-dark-muted truncate">
                {structuredState.targetCustomer
                  ? `Targeting: ${structuredState.targetCustomer}`
                  : 'Discuss and refine your startup idea'}
              </p>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleTriggerValidation}
              disabled={isValidating || isSendingMessage || isLoadingMessages || isLoadingConversations}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-sm shadow-indigo-500/20 transition-all hover:scale-[1.02] disabled:opacity-50 cursor-pointer whitespace-nowrap flex-shrink-0"
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden sm:inline">Evaluating Idea...</span>
                  <span className="sm:hidden">Evaluating...</span>
                </>
              ) : hasValidated ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Recalculate Score</span>
                  <span className="sm:hidden">Recalculate</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Validate My Idea</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Error notification banner */}
        {error && (
          <div className="flex-shrink-0 mx-4 sm:mx-6 lg:mx-8 mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleTriggerValidation}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition cursor-pointer"
              >
                Retry
              </button>
              <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-700 dark:hover:text-rose-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Message Container */}
        <div
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-6 scrollbar-thin space-y-5"
        >
          <div className="max-w-[850px] mx-auto space-y-5">
            {isLoadingConversations || isLoadingMessages ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-7 h-7 animate-spin text-indigo-600 dark:text-indigo-400" />
                  <p className="text-xs text-slate-500 dark:text-dark-muted font-medium">
                    {isLoadingConversations ? 'Initializing validation session...' : 'Loading conversation...'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Friendly Welcome Banner (Shown for fresh conversations) */}
                {!hasMultipleMessages && (
                  <div className="p-6 rounded-2xl bg-white dark:bg-dark-card border border-slate-200/90 dark:border-dark-border shadow-xs space-y-4 mb-6">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
                      <Lightbulb className="w-4 h-4" />
                      <span>Interactive Startup Mentor</span>
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-dark-text tracking-tight">
                        Let&apos;s turn your idea into something worth building.
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-dark-muted mt-1 leading-relaxed">
                        Chat with your AI mentor to sharpen your problem statement, target audience, and business model. Once ready, generate a comprehensive 7-parameter validation report!
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/40 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                      <p className="font-bold text-indigo-900 dark:text-indigo-300">Start by telling me:</p>
                      <p className="text-slate-600 dark:text-dark-muted">• What specific problem are you solving?</p>
                      <p className="text-slate-600 dark:text-dark-muted">• Who has this pain point?</p>
                      <p className="text-slate-600 dark:text-dark-muted">• What is your proposed solution?</p>
                    </div>

                    <div className="pt-2">
                      <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                        Try a popular student idea starter:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {starterSuggestions.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSendMessage(item.prompt)}
                            className="text-left p-2.5 rounded-xl bg-slate-50/80 dark:bg-dark-input/60 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-dark-border hover:border-indigo-200 dark:hover:border-indigo-700/60 text-xs text-slate-700 dark:text-dark-muted hover:text-indigo-900 dark:hover:text-indigo-300 transition-all font-medium group cursor-pointer shadow-2xs"
                          >
                            <p className="font-bold text-slate-900 dark:text-dark-text group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-dark-muted line-clamp-1 mt-0.5">
                              {item.prompt}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Chat Message Stream */}
                {messages.map((msg) => {
                  const isUser = msg.sender === 'USER';
                  const meta = parseMetadata(msg.metadata);

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                          <Sparkles className="w-4 h-4" />
                        </div>
                      )}

                      <div className={`space-y-3 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                        {/* Message Bubble */}
                        <div
                          className={`px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                            isUser
                              ? 'bg-indigo-600 text-white font-medium rounded-tr-xs shadow-xs ml-auto whitespace-pre-wrap'
                              : 'bg-white dark:bg-dark-card border border-slate-200/90 dark:border-dark-border text-slate-800 dark:text-dark-text rounded-tl-xs shadow-xs'
                          }`}
                        >
                          {isUser ? msg.message : <SafeMarkdown content={msg.message} />}
                        </div>


                        {/* 1. Validation Completed Summary Card */}
                        {msg.actionType === 'VALIDATION_COMPLETED' && meta?.reportId && (
                          <div className="w-full p-5 sm:p-6 rounded-2xl bg-white dark:bg-dark-card border border-indigo-200/90 dark:border-indigo-900/60 shadow-md space-y-4 animate-fade-in">
                            {/* Card Header & Classification */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-2xs">
                                  <Award className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-slate-900 dark:text-dark-text block">
                                    Validation Report {meta.versionNumber ? `Version ${meta.versionNumber}` : ''}
                                  </span>
                                  <span className="text-[10px] text-slate-500 dark:text-dark-muted">
                                    Authoritative 7-Parameter Viability Assessment
                                  </span>
                                </div>
                              </div>
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                {meta.validationCategory}
                              </span>
                            </div>

                            {/* Score Display & Delta */}
                            <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-dark-input/50 border border-slate-100 dark:border-dark-border flex items-baseline justify-between">
                              <div className="flex items-baseline gap-2">
                                <span className="text-3xl sm:text-4xl font-black text-indigo-600 dark:text-indigo-400">
                                  {meta.validationPercentage || Math.round(meta.overallScore * 10)}%
                                </span>
                                <span className="text-xs text-slate-500 dark:text-dark-muted font-medium">
                                  ({meta.overallScore}/10 Overall Viability)
                                </span>
                              </div>
                              {meta.delta !== null && meta.delta !== undefined && meta.delta !== 0 && (
                                <span
                                  className={`text-xs font-bold ${
                                    meta.delta > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                  }`}
                                >
                                  {meta.delta > 0 ? `+${meta.delta}%` : `${meta.delta}%`} vs prev
                                </span>
                              )}
                            </div>

                            {/* 7-Parameter Viability Breakdown */}
                            {meta.scores && typeof meta.scores === 'object' && Object.keys(meta.scores).length > 0 && (
                              <div className="space-y-2 pt-1">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-dark-muted">
                                  7-Parameter Viability Breakdown:
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {Object.entries(meta.scores).map(([key, val]) => {
                                    const numVal = typeof val === 'number' ? val : parseFloat(String(val)) || 0;
                                    const pct = Math.min(Math.max(numVal * 10, 0), 100);
                                    return (
                                      <div
                                        key={key}
                                        className="p-2 rounded-xl bg-slate-50/80 dark:bg-dark-input/40 border border-slate-100 dark:border-dark-border text-xs"
                                      >
                                        <div className="flex justify-between items-center mb-1">
                                          <span className="font-semibold text-slate-700 dark:text-dark-muted text-[11px]">
                                            {PARAM_LABELS[key] || key}
                                          </span>
                                          <span className="font-bold text-indigo-600 dark:text-indigo-400 text-[11px]">
                                            {numVal}/10
                                          </span>
                                        </div>
                                        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-dark-border overflow-hidden">
                                          <div
                                            className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-500"
                                            style={{ width: `${pct}%` }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Strengths & Weaknesses Highlights */}
                            {(meta.strengths?.length > 0 || meta.weaknesses?.length > 0) && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                                {meta.strengths?.length > 0 && (
                                  <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-300">
                                    <p className="font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 mb-1 text-emerald-700 dark:text-emerald-400">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Key Strength</span>
                                    </p>
                                    <p className="text-[11px] leading-relaxed">
                                      {Array.isArray(meta.strengths) ? meta.strengths[0] : String(meta.strengths)}
                                    </p>
                                  </div>
                                )}
                                {meta.weaknesses?.length > 0 && (
                                  <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800/40 text-amber-900 dark:text-amber-300">
                                    <p className="font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 mb-1 text-amber-700 dark:text-amber-400">
                                      <AlertCircle className="w-3.5 h-3.5" />
                                      <span>Area to Strengthen</span>
                                    </p>
                                    <p className="text-[11px] leading-relaxed">
                                      {Array.isArray(meta.weaknesses) ? meta.weaknesses[0] : String(meta.weaknesses)}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Top Strategic Action Callout */}
                            {meta.recommendedAction && (
                              <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/40 text-xs">
                                <p className="font-bold text-[11px] uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-0.5">
                                  Recommended Strategic Next Step:
                                </p>
                                <p className="text-slate-700 dark:text-dark-muted text-xs leading-relaxed font-medium">
                                  {meta.recommendedAction}
                                </p>
                              </div>
                            )}

                            {/* Primary Navigation Button */}
                            <div className="pt-2 border-t border-slate-100 dark:border-dark-border">
                              <button
                                onClick={() => navigate(`/report/${meta.reportId}`)}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-sm shadow-indigo-500/20 transition-all cursor-pointer"
                              >
                                <span>View Full Interactive Report</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 2. Validation Offer Callout */}
                        {msg.actionType === 'VALIDATION_OFFERED' && !isValidating && (
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={handleTriggerValidation}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition hover:scale-[1.02] cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>
                                {hasValidated ? 'Recalculate Validation' : 'Run Validation Now'}
                              </span>
                            </button>
                          </div>
                        )}

                        {/* 3. Refinement Suggestion Chips */}
                        {meta?.suggestions && Array.isArray(meta.suggestions) && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {meta.suggestions.map((sug: string, i: number) => (
                              <button
                                key={i}
                                onClick={() => {
                                  if (sug.toLowerCase().includes('recalculate') || sug.toLowerCase().includes('validate my idea')) {
                                    handleTriggerValidation();
                                  } else {
                                    handleSendMessage(sug);
                                  }
                                }}
                                className="text-left text-[11px] font-medium px-3 py-1.5 rounded-xl bg-white dark:bg-dark-card hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-dark-border hover:border-indigo-200 dark:hover:border-indigo-700/60 text-slate-700 dark:text-dark-muted hover:text-indigo-800 dark:hover:text-indigo-300 transition shadow-2xs cursor-pointer"
                              >
                                {sug}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {isUser && (
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs shadow-2xs">
                          {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* AI Thinking Animation */}
                {isSendingMessage && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-slate-500 dark:text-dark-muted text-xs flex items-center gap-2 shadow-2xs">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                      <span>AI mentor is thinking...</span>
                    </div>
                  </div>
                )}

                {/* Multi-step Validation Progress Card */}
                {isValidating && (
                  <div className="w-full max-w-md mx-auto p-5 rounded-2xl bg-white dark:bg-dark-card border border-indigo-200 dark:border-indigo-900/60 shadow-md space-y-3 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" />
                      <h3 className="text-xs font-bold text-slate-900 dark:text-dark-text uppercase tracking-wider">
                        Evaluating your startup idea...
                      </h3>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-dark-muted pl-6 border-l border-slate-200 dark:border-dark-border">
                      <p className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Market Demand (25% weight)</span>
                      </p>
                      <p
                        className={`flex items-center gap-2 font-medium ${
                          validationStep >= 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {validationStep >= 1 ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 inline-block" />
                        )}
                        <span>Problem Severity (20% weight)</span>
                      </p>
                      <p
                        className={`flex items-center gap-2 font-medium ${
                          validationStep >= 2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {validationStep >= 2 ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 inline-block" />
                        )}
                        <span>Competition & Innovation Moat (25% weight)</span>
                      </p>
                      <p
                        className={`flex items-center gap-2 font-medium ${
                          validationStep >= 3 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {validationStep >= 3 ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 inline-block" />
                        )}
                        <span>Feasibility & Revenue Potential (20% weight)</span>
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* 3. Fixed Bottom Input Container */}
        <div className="flex-shrink-0 p-3 sm:p-4 lg:p-5 bg-white/90 dark:bg-dark-card/90 backdrop-blur-md border-t border-slate-200/80 dark:border-dark-border z-10">
          <div className="max-w-[850px] mx-auto">
            {/* Ready for Validation callout banner if state has core info */}
            {structuredState.targetCustomer && !hasValidated && (
              <div className="mb-2 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800/50 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-300 shadow-2xs">
                <span className="flex items-center gap-1.5 font-medium truncate">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                  <span className="truncate">Your idea has sufficient detail across problem, solution & audience!</span>
                </span>
                <button
                  onClick={handleTriggerValidation}
                  disabled={isValidating || isSendingMessage || isLoadingMessages}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow-2xs transition cursor-pointer flex-shrink-0 ml-2 disabled:opacity-50"
                >
                  Validate Now
                </button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="bg-white dark:bg-dark-input border border-slate-200/90 dark:border-dark-border rounded-2xl shadow-sm p-1.5 sm:p-2 flex items-end gap-2 focus-within:border-indigo-400 dark:focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-950/50 transition-all"
            >
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={handleKeyDown}
                disabled={isSendingMessage || isValidating || isLoadingMessages || isLoadingConversations}
                placeholder="Describe your startup idea or tell me what you want to improve..."
                className="flex-1 px-3 py-2 text-slate-800 dark:text-dark-text placeholder-slate-400 dark:placeholder-slate-500 text-xs sm:text-sm focus:outline-none resize-none min-h-[40px] max-h-32 bg-transparent leading-relaxed disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || isSendingMessage || isValidating || isLoadingMessages || isLoadingConversations}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-xs transition-all disabled:opacity-40 disabled:hover:bg-indigo-600 cursor-pointer flex-shrink-0"
                title="Send message"
              >
                {isSendingMessage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>

            <p className="text-[10px] sm:text-[11px] text-center text-slate-400 dark:text-dark-muted mt-2 font-medium">
              Press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded text-slate-500 dark:text-dark-muted font-mono text-[10px]">Enter</kbd> to send • <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded text-slate-500 dark:text-dark-muted font-mono text-[10px]">Shift + Enter</kbd> for a new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


