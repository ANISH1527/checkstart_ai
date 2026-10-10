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
                Previous Score: <span className="font-bold text-slate-800 dark:text-dark-text">{previousReportItem.validationPercentage}%</span>{' '}
                • Current Score: <span className="font-bold text-indigo-700 dark:text-indigo-400">{report.validationPercentage}%</span>
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
                {report.versionNumber && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    Version {report.versionNumber}
                  </span>
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

        {/* 6. PRIORITIZED ACTIONABLE RECOMMENDATIONS */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-white dark:bg-gradient-to-br dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-dark-card border border-indigo-100 dark:border-indigo-900/50 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-indigo-100 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300">
            <Sparkles className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-900 dark:text-dark-text">
              Actionable Founder Roadmap & Recommendations
            </h3>
          </div>
          <div className="space-y-3">
            {analysis?.recommendations?.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-white dark:bg-dark-card border border-slate-200/80 dark:border-dark-border shadow-2xs">
                <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {idx + 1}
                </span>
                <p className="text-xs text-slate-800 dark:text-dark-text leading-relaxed font-medium">
                  {rec.replace(/^\d+\.\s*/, '')}
                </p>
              </div>
            )) || <p className="text-xs text-slate-400 dark:text-slate-500">No recommendations available.</p>}
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
