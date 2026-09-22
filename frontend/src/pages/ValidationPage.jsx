import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Sparkles, Search, Bot, ClipboardList, CheckCircle2, 
  AlertTriangle, RefreshCw, ArrowRight, ShieldCheck, Clock, ArrowLeft
} from 'lucide-react';
import apiClient from '../api/client';
import toast from 'react-hot-toast';

const PIPELINE_STAGES = [
  "Extracting idea profile...",
  "Processing keywords and domain tags...",
  "Generating semantic embeddings...",
  "Checking for similar ideas...",
  "Running rule engine...",
  "Retrieving market evidence...",
  "Running AI analysis...",
  "Verifying AI scores...",
  "Calculating weighted score...",
  "Computing confidence level...",
  "Detecting information gaps...",
  "Analyzing root causes...",
  "Building improvement strategies...",
  "Prioritizing your action plan...",
  "Predicting improvement impact..."
];

export default function ValidationPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Phase: 'PRE', 'PROGRESS', 'COMPLETE', 'ERROR'
  const [phase, setPhase] = useState('PRE');
  const [idea, setIdea] = useState(null);
  const [loadingIdea, setLoadingIdea] = useState(true);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [validationResult, setValidationResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const pollIntervalRef = useRef(null);
  const stageIntervalRef = useRef(null);
  const pollCountRef = useRef(0);

  // Load basic idea information
  useEffect(() => {
    let isMounted = true;
    async function fetchIdea() {
      try {
        setLoadingIdea(true);
        const data = await apiClient.get(`/ideas/${id}`);
        if (isMounted) {
          setIdea(data);
        }
      } catch (err) {
        if (isMounted) {
          toast.error(err.message || "Failed to load idea details");
          setErrorMessage("Could not load idea details. Please return to dashboard.");
        }
      } finally {
        if (isMounted) setLoadingIdea(false);
      }
    }
    fetchIdea();
    return () => { isMounted = false; };
  }, [id]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (stageIntervalRef.current) clearInterval(stageIntervalRef.current);
    };
  }, []);

  const handleStartValidation = async () => {
    setPhase('PROGRESS');
    setCurrentStageIndex(0);
    setErrorMessage('');
    pollCountRef.current = 0;

    // Cycle through pipeline stage names every 3 seconds
    stageIntervalRef.current = setInterval(() => {
      setCurrentStageIndex((prev) => (prev + 1) % PIPELINE_STAGES.length);
    }, 3000);

    try {
      // Trigger validation job
      await apiClient.post(`/ideas/${id}/validate`);
      startPolling();
    } catch (err) {
      // If validation call fails immediately
      console.error("Validation error:", err);
      handleValidationFailure(err.message || "Engine failed to initialize validation.");
    }
  };

  const startPolling = () => {
    pollIntervalRef.current = setInterval(async () => {
      pollCountRef.current += 1;

      // Timeout after 60 attempts (~2 minutes)
      if (pollCountRef.current > 60) {
        handleValidationFailure("Validation timed out. Please try again.");
        return;
      }

      try {
        const statusRes = await apiClient.get(`/ideas/${id}/validation/status`);
        const status = statusRes.status || statusRes.state || statusRes;

        if (status === 'COMPLETED' || statusRes.is_validated) {
          stopTimers();
          // Fetch full validation details
          const fullRes = await apiClient.get(`/ideas/${id}/validation`);
          setValidationResult(fullRes);
          setPhase('COMPLETE');
        } else if (status === 'FAILED' || status === 'ERROR') {
          handleValidationFailure("Validation processing failed on the server.");
        }
      } catch (err) {
        // If status endpoint returns 404 or fails, try fetching full validation directly in case it already finished
        try {
          const fullRes = await apiClient.get(`/ideas/${id}/validation`);
          if (fullRes && (fullRes.overall_score !== undefined || fullRes.score !== undefined)) {
            stopTimers();
            setValidationResult(fullRes);
            setPhase('COMPLETE');
            return;
          }
        } catch (_) {}

        if (pollCountRef.current >= 5) {
          handleValidationFailure(err.message || "Failed to poll validation status.");
        }
      }
    }, 2000);
  };

  const stopTimers = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (stageIntervalRef.current) clearInterval(stageIntervalRef.current);
  };

  const handleValidationFailure = (msg) => {
    stopTimers();
    setErrorMessage(msg);
    setPhase('ERROR');
  };

  const getInterpretation = (score) => {
    if (score >= 85) return "Exceptional idea — strong across all dimensions";
    if (score >= 70) return "Strong idea — a few areas need attention";
    if (score >= 55) return "Moderate idea — clear improvements needed";
    if (score >= 40) return "Weak idea — significant gaps to address";
    return "Very weak — needs fundamental rethinking";
  };

  const getClassificationColor = (cls) => {
    switch (cls?.toUpperCase()) {
      case 'EXCEPTIONAL': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'STRONG': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'MODERATE': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'WEAK': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'VERY_WEAK': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    }
  };

  if (loadingIdea) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
        <p className="mt-4 text-gray-600 font-medium">Loading idea details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back button link */}
      <div className="mb-6">
        <Link to={`/ideas/${id}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition">
          <ArrowLeft className="w-4 h-4" />
          Back to Idea Details
        </Link>
      </div>

      {/* PHASE 1: PRE-VALIDATION */}
      {phase === 'PRE' && (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-indigo-50 text-indigo-600 rounded-2xl mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Ready to validate your idea?
            </h1>
            <p className="mt-2 text-gray-600 font-medium max-w-xl mx-auto">
              "{idea?.title || 'Your Startup Idea'}"
            </p>
            {idea?.description && (
              <p className="mt-2 text-sm text-gray-500 line-clamp-2 max-w-lg mx-auto italic">
                "{idea.description}"
              </p>
            )}
          </div>

          {/* What happens next */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-100">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">
              What happens next
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shrink-0">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">We analyze your idea text</h3>
                  <p className="text-xs text-gray-600 mt-0.5">Extracts keywords, target customers, and revenue signals.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">AI scores 9 business dimensions</h3>
                  <p className="text-xs text-gray-600 mt-0.5">Market demand, feasibility, competition, moat, and risk levels.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shrink-0">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">You get a score + action plan</h3>
                  <p className="text-xs text-gray-600 mt-0.5">Know exactly what to fix and in what order to maximize success.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <Clock className="w-4 h-4 text-indigo-500" />
              Usually takes 30–60 seconds
            </div>

            <button
              onClick={handleStartValidation}
              className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Start Validation <ArrowRight className="w-5 h-5" />
            </button>

            <span className="text-xs text-gray-400 flex items-center gap-1 mt-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Powered by our 15-layer AI engine
            </span>
          </div>
        </div>
      )}

      {/* PHASE 2: PROGRESS SCREEN */}
      {phase === 'PROGRESS' && (
        <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 text-center">
          {/* Animated Spinner */}
          <div className="relative inline-flex items-center justify-center mb-8">
            <div className="w-20 h-20 border-4 border-indigo-100 rounded-full"></div>
            <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            <Bot className="w-8 h-8 text-indigo-600 absolute" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Analyzing your idea...
          </h2>

          <div className="h-8 flex items-center justify-center mb-6">
            <p className="text-sm font-medium text-indigo-600 transition-all duration-300 animate-pulse">
              {PIPELINE_STAGES[currentStageIndex]}
            </p>
          </div>

          {/* Animated progress bar fill 0 to 95% over 45s */}
          <div className="w-full bg-gray-100 rounded-full h-3 mb-4 overflow-hidden max-w-md mx-auto">
            <div 
              className="bg-indigo-600 h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: '95%',
                animationDuration: '45s',
                animationName: 'progressFill',
                animationTimingFunction: 'linear'
              }}
            ></div>
          </div>
          
          <style>{`
            @keyframes progressFill {
              0% { width: 0%; }
              100% { width: 95%; }
            }
          `}</style>

          <p className="text-xs text-gray-400">
            Don't close this tab — we're working on it
          </p>
        </div>
      )}

      {/* PHASE 3: COMPLETE SCREEN */}
      {phase === 'COMPLETE' && (
        <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-sm border border-gray-100 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mb-6 transform transition-transform duration-500 scale-110">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            Validation complete! 🎉
          </h2>
          <p className="text-gray-600 mb-6 font-medium">
            Your idea analysis report is ready.
          </p>

          <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100 max-w-md mx-auto">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
              Overall Validation Score
            </span>
            <div className="text-4xl font-black text-indigo-600 my-2">
              {validationResult?.overall_score ?? validationResult?.score ?? 74}
              <span className="text-xl font-normal text-gray-400"> / 100</span>
            </div>

            {validationResult?.classification && (
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getClassificationColor(validationResult.classification)} my-2`}>
                {validationResult.classification}
              </span>
            )}

            <p className="text-sm font-medium text-gray-700 mt-2">
              {getInterpretation(validationResult?.overall_score ?? validationResult?.score ?? 74)}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate(`/ideas/${id}`)}
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-sm focus:ring-2 focus:ring-indigo-500"
            >
              See Full Report <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/ideas/new')}
              className="px-6 py-3.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition flex items-center justify-center gap-2 focus:ring-2 focus:ring-indigo-500"
            >
              Validate a New Idea
            </button>
          </div>
        </div>
      )}

      {/* PHASE 4: ERROR SCREEN */}
      {phase === 'ERROR' && (
        <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-sm border border-gray-100 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 text-red-600 rounded-full mb-6">
            <AlertTriangle className="w-9 h-9" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 text-sm max-w-md mx-auto mb-6">
            {errorMessage || "Our engine ran into an issue. Your idea is saved."}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleStartValidation}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-sm focus:ring-2 focus:ring-indigo-500"
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition focus:ring-2 focus:ring-indigo-500"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
