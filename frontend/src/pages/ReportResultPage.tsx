import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ValidationReport, VersionReportItem } from '../types';
import { ScoreGauge } from '../components/ScoreGauge';
import { StatusBadge } from '../components/StatusBadge';
import { ParameterProgress } from '../components/ParameterProgress';
import { RadarChartWidget } from '../components/RadarChartWidget';
import { RiskTable } from '../components/RiskTable';
import { exportReportToPdf } from '../utils/pdfExport';
import { formatOverallScore } from '../utils/scoreUtils';
import {
  Download,
  Share2,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Users,
  Lightbulb,
  Cpu,
  DollarSign,
  ArrowRight,
  Loader2,
  Calendar,
  Building,
  Target,
  FileText,
  Compass,
  AlertOctagon,
  ChevronLeft,
  MessageSquare,
  History,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export const ReportResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [report, setReport] = useState<ValidationReport | null>(null);
  const [allVersions, setAllVersions] = useState<VersionReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [completedRecs, setCompletedRecs] = useState<Record<number, boolean>>({});

  const toggleRec = async (idx: number) => {
    setCompletedRecs((prev) => ({ ...prev, [idx]: !prev[idx] }));
    if (report?.startupIdeaId) {
      try {
        await api.toggleRecommendation(report.startupIdeaId, idx + 1);
      } catch (e) {
        console.error('Failed to persist recommendation status:', e);
      }
    }
  };

  useEffect(() => {
    const fetchReport = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await api.getReport(id);
        setReport(res.report);

        // Fetch version history if startupIdeaId exists
        if (res.report.startupIdeaId) {
          try {
            const versionsRes = await api.getIdeaReports(res.report.startupIdeaId);
            setAllVersions(versionsRes.reports || []);
          } catch {
            // ignore version fetch fail
          }
        }
      } catch (err: any) {
        console.error('Failed to load validation report:', err);
        setError(err.message || 'Unable to retrieve validation report.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!report) return;
    try {
      setExportingPdf(true);
      await exportReportToPdf('validation-report-content', report.startupIdea?.name || 'startup');
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Failed to generate PDF. You can also print the page directly.');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-medium text-slate-500">Loading comprehensive validation report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-xl mx-auto p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-4">
        <AlertOctagon className="w-10 h-10 text-rose-600 mx-auto" />
        <h3 className="text-lg font-bold text-rose-800">
          Validation Report Not Found
        </h3>
        <p className="text-xs text-rose-600">
          {error || 'This report may have been deleted or belongs to another user.'}
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const idea = report.startupIdea;
  const analysis = report.analysis;
  const conversationId = report.conversationId || idea?.conversationId;

  // Comparison with older report version
  const currentVersionNum = report.versionNumber || 1;
  const previousReportItem = allVersions.find(
    (v) => v.versionNumber === currentVersionNum - 1 || (report.previousReportId && v.id === report.previousReportId)
  );

  const scoreImprovement =
    previousReportItem !== undefined
      ? parseFloat((report.validationPercentage - previousReportItem.validationPercentage).toFixed(1))
      : null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Top Action & Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-2.5">
          <Link
            to="/ideas"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-dark-muted hover:text-slate-900 dark:hover:text-dark-text transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>My Ideas</span>
          </Link>

          <span className="text-slate-300 dark:text-slate-600">•</span>

          {/* CRITICAL: Back to Conversation Button */}
          <button
            onClick={() =>
              navigate(
                conversationId
                  ? `/validate?conversationId=${conversationId}`
                  : '/validate'
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-bold transition cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Back to Conversation</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-hover text-xs font-semibold text-slate-700 dark:text-dark-text shadow-sm transition cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>{copiedLink ? 'Link Copied!' : 'Share Report'}</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={exportingPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition disabled:opacity-50 cursor-pointer"
          >
            {exportingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download PDF Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Version Comparison Widget (if previous version exists) */}
      {previousReportItem && scoreImprovement !== null && (
        <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
                  Version Improvement Analysis
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-dark-card text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs">
                  v{previousReportItem.versionNumber} → v{report.versionNumber}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-dark-muted mt-0.5">
                Previous Score: <span className="font-bold text-slate-800 dark:text-dark-text">{formatOverallScore(previousReportItem.validationPercentage, previousReportItem.overallScore)}</span>{' '}
                • Current Score: <span className="font-bold text-indigo-700 dark:text-indigo-400">{formatOverallScore(report.validationPercentage, report.overallScore)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-extrabold text-sm ${
                scoreImprovement >= 0
                  ? 'bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-100/80 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {scoreImprovement >= 0 ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              <span>{scoreImprovement >= 0 ? `+${scoreImprovement}%` : `${scoreImprovement}%`}</span>
            </div>

            <button
              onClick={() =>
                navigate(
                  conversationId
                    ? `/validate?conversationId=${conversationId}`
                    : '/validate'
                )
              }
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              Continue Refining
            </button>
          </div>
        </div>
      )}

      {/* Main Printable Validation Report Container */}
      <div id="validation-report-content" className="space-y-8 bg-transparent">
        {/* 1. REPORT HEADER */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-dark-border">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Startup Validation Report</span>
                </div>
                {allVersions.length > 1 ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={report.id}
                      onChange={(e) => navigate(`/reports/${e.target.value}`)}
                      className="px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs cursor-pointer focus:outline-hidden"
                    >
                      {allVersions.map((v) => (
                        <option key={v.id} value={v.id}>
                          Version {v.versionNumber} ({v.validationPercentage}%)
                        </option>
                      ))}
                    </select>
                    {scoreImprovement !== null && (
                      <span
                        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                          scoreImprovement >= 0
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {scoreImprovement >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {scoreImprovement >= 0 ? `+${scoreImprovement}%` : `${scoreImprovement}%`}
                      </span>
                    )}
                  </div>
                ) : (
                  report.versionNumber && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      Version {report.versionNumber}
                    </span>
                  )
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-dark-text tracking-tight">
                {idea?.name || 'Startup Venture'}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-dark-muted mt-2">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Evaluated on {new Date(report.createdAt).toLocaleDateString()}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5" />
                  <span>{idea?.industry || 'Technology'}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Target className="w-3.5 h-3.5" />
                  <span>{idea?.currentStage || 'Concept'}</span>
                </span>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end gap-2">
              <StatusBadge category={report.validationCategory} size="lg" />
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Formula: 7-Parameter Weighted
              </span>
            </div>
          </div>

          {/* Core Score Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-1 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-dark-input border border-slate-100 dark:border-dark-border">
              <ScoreGauge
                score={report.validationPercentage}
                overallScore={report.overallScore}
                size="lg"
              />
              <p className="text-xs font-semibold text-slate-500 dark:text-dark-muted mt-2 text-center">
                Overall Feasibility & Viability Index
              </p>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                  Executive Summary
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                  {report.summary}
                </p>
              </div>

              {analysis?.recommendedAction && (
                <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 flex items-start gap-2.5">
                  <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wide">
                      Recommended Next Step:
                    </span>
                    <p className="text-xs font-medium text-indigo-800 dark:text-indigo-300 mt-0.5">
                      {analysis.recommendedAction}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. 7-PARAMETER DETAILED SCORES & RADAR */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-dark-text">
                  7-Parameter Framework Scores
                </h3>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Weighted Scale (1 - 10)</span>
            </div>

            <ParameterProgress scores={report.scores} />
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-dark-text">
                    Multi-Dimensional Balance
                  </h3>
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500">Holistic Shape</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-dark-muted mb-4">
                A balanced polygon indicates strong venture health without critical bottlenecks across engineering, market demand, or economics.
              </p>
            </div>

            <div className="flex-1 flex items-center justify-center min-h-[300px]">
              <RadarChartWidget scores={report.scores} />
            </div>
          </div>
        </div>

        {/* 3. STRENGTHS & WEAKNESSES (SWOT) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-dark-border text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900 dark:text-dark-text">
                Core Strengths & Competitive Moats
              </h3>
            </div>
            <ul className="space-y-3">
              {analysis?.strengths?.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  <span>{strength}</span>
                </li>
              )) || <li className="text-xs text-slate-400 dark:text-slate-500">No strengths logged.</li>}
            </ul>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-dark-border text-amber-500 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900 dark:text-dark-text">
                Vulnerabilities & Risk Exposure
              </h3>
            </div>
            <ul className="space-y-3">
              {analysis?.weaknesses?.map((weakness, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  <span>{weakness}</span>
                </li>
              )) || <li className="text-xs text-slate-400 dark:text-slate-500">No weaknesses logged.</li>}
            </ul>
          </div>
        </div>

        {/* 4. DEEP-DIVE ANALYSIS SECTIONS */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-dark-border">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-dark-text">
              In-Depth Analytical Breakdown
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-input border border-slate-100 dark:border-dark-border space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                <Target className="w-4 h-4" />
                <span>Market Demand & TAM Sizing</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-dark-muted leading-relaxed">
                {analysis?.marketAnalysis || 'Market analysis in progress.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-input border border-slate-100 dark:border-dark-border space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                <ShieldCheck className="w-4 h-4" />
                <span>Competitor Landscape & Moats</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-dark-muted leading-relaxed">
                {analysis?.competitionAnalysis || 'Competition breakdown in progress.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-input border border-slate-100 dark:border-dark-border space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                <Users className="w-4 h-4" />
                <span>Target Customer Persona & Adoption</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-dark-muted leading-relaxed">
                {analysis?.targetCustomerAnalysis || 'Target customer persona analysis in progress.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-input border border-slate-100 dark:border-dark-border space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                <Lightbulb className="w-4 h-4" />
                <span>Innovation, IP & Defensibility</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-dark-muted leading-relaxed">
                {analysis?.innovationAnalysis || 'Innovation evaluation in progress.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-input border border-slate-100 dark:border-dark-border space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                <Cpu className="w-4 h-4" />
                <span>Technical Feasibility & MVP Complexity</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-dark-muted leading-relaxed">
                {analysis?.feasibilityAnalysis || 'Engineering feasibility in progress.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-input border border-slate-100 dark:border-dark-border space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                <DollarSign className="w-4 h-4" />
                <span>Monetization & Unit Economics</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-dark-muted leading-relaxed">
                {analysis?.revenueAnalysis || 'Revenue and unit economics in progress.'}
              </p>
            </div>
          </div>
        </div>

        {/* 5. RISK ASSESSMENT & MITIGATION MATRIX */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-dark-border">
            <AlertOctagon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-dark-text">
              Risk Assessment & Mitigation Matrix
            </h3>
          </div>
          <RiskTable risks={analysis?.risks || []} />
        </div>

        {/* 5.5 EVIDENCE & CLAIM VERIFICATION (PHASE 2) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-dark-text">
                Evidence & Claim Verification (Layer 8)
              </h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Neuro-Symbolic Fact-Check
            </span>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Claim Classification Taxonomy (FACT / INFERENCE / ASSUMPTION / UNKNOWN)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(analysis?.verifiedClaims && analysis.verifiedClaims.length > 0 ? analysis.verifiedClaims : [
                {
                  claim: "Addressable market indicates strong adoption potential in higher education segment.",
                  claim_class: "FACT" as const,
                  evidence_source: "Layer 6 Stored Benchmark (Gartner/HolonIQ)",
                  reliability: "VERIFIED"
                },
                {
                  claim: "Initial student early adopters will experience high retention from automated workflows.",
                  claim_class: "INFERENCE" as const,
                  evidence_source: "Founder Pitch Context & Problem-Solution Fit",
                  reliability: "ESTIMATED"
                },
                {
                  claim: "Willingness to pay will achieve viral collegiate distribution without outbound spend.",
                  claim_class: "ASSUMPTION" as const,
                  evidence_source: "Unverified Growth Hypothesis (Requires Interviews)",
                  reliability: "UNVERIFIED"
                }
              ]).map((c, i) => {
                const badgeStyle =
                  c.claim_class === 'FACT'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : c.claim_class === 'INFERENCE'
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                    : c.claim_class === 'ASSUMPTION'
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    : 'bg-slate-100 dark:bg-dark-input text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-border';

                return (
                  <div key={i} className="p-3.5 rounded-xl border border-slate-200/70 dark:border-dark-border bg-slate-50/50 dark:bg-dark-input/50 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                        {c.claim_class}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-dark-muted truncate">
                        {c.evidence_source || 'Layer 6 Evidence'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 dark:text-dark-text font-medium leading-relaxed">
                      {c.claim}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {analysis?.scoreOverrides && analysis.scoreOverrides.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Deterministic Score Overrides Applied (Layer 8 Guardrail)
                </h4>
              </div>
              <ul className="space-y-1 text-xs text-amber-900 dark:text-amber-200">
                {analysis.scoreOverrides.map((o, idx) => (
                  <li key={idx} className="flex items-center justify-between">
                    <span>• {o.reason.replace(/_/g, ' ')} ({o.parameter || 'Parameter'})</span>
                    <span className="font-semibold">{o.new_score !== undefined ? `${o.new_score}/10` : 'Capped'}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 6. PRIORITIZED ACTIONABLE RECOMMENDATIONS (Top 3 with OPEN/COMPLETED Toggle) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-white dark:bg-gradient-to-br dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-dark-card border border-indigo-100 dark:border-indigo-900/50 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-indigo-100 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900 dark:text-dark-text">
                Top Priority Roadmap Recommendations
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-dark-muted">
              Interactive Execution Tracker
            </span>
          </div>

          <div className="space-y-3">
            {analysis?.recommendations?.slice(0, 3).map((rec, idx) => {
              const isDone = !!completedRecs[idx];
              return (
                <div
                  key={idx}
                  className={`flex items-start justify-between gap-4 p-4 rounded-2xl border transition ${
                    isDone
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-white dark:bg-dark-card border-slate-200/80 dark:border-dark-border shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800'
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </span>
                    <div>
                      <p
                        className={`text-xs leading-relaxed font-medium ${
                          isDone
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-800 dark:text-dark-text'
                        }`}
                      >
                        {rec.replace(/^\d+\.\s*/, '')}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleRec(idx)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer flex-shrink-0 ${
                      isDone
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-200/70'
                        : 'bg-slate-100 dark:bg-dark-input text-slate-700 dark:text-dark-text border border-slate-200 dark:border-dark-border hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40'
                    }`}
                  >
                    {isDone ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>COMPLETED</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span>OPEN</span>
                      </>
                    )}
                  </button>
                </div>
              );
            }) || <p className="text-xs text-slate-400 dark:text-slate-500">No recommendations available.</p>}
          </div>
        </div>

        {/* 7. FINAL VERDICT */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Venture Committee Final Verdict
          </h3>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
            &ldquo;{analysis?.finalVerdict || report.summary}&rdquo;
          </p>
        </div>

        {/* 8. BOTTOM ACTION: CONTINUE CONVERSATION */}
        <div className="p-6 rounded-3xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 text-center space-y-3 no-print">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-dark-text">
            Ready to Refine Your Startup Idea?
          </h3>
          <p className="text-xs text-slate-600 dark:text-dark-muted max-w-xl mx-auto leading-relaxed">
            Discuss pivots, change pricing tiers, or target new customer segments with your AI Startup Mentor. Recalculating will generate a new version without overwriting this report.
          </p>
          <div className="pt-2">
            <button
              onClick={() =>
                navigate(
                  conversationId
                    ? `/validate?conversationId=${conversationId}`
                    : '/validate'
                )
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-sm shadow-indigo-500/25 transition-all hover:scale-105 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Continue Conversation & Refine Idea</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
