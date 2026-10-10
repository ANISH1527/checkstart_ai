export type ValidationCategory = 'Highly Promising' | 'Promising' | 'Needs Improvement' | 'High Risk';
export type UserRole = 'USER' | 'ADMIN';
export type AuthProvider = 'LOCAL' | 'GOOGLE';

export interface ParameterScores {
  marketDemand: number;
  problemSeverity: number;
  competition: number;
  targetCustomer: number;
  innovation: number;
  feasibility: number;
  revenuePotential: number;
}

export interface RiskItem {
  risk: string;
  severity: 'High' | 'Medium' | 'Low';
  mitigation: string;
}

export interface ReportAnalysisData {
  strengths: string[];
  weaknesses: string[];
  marketAnalysis: string;
  competitionAnalysis: string;
  targetCustomerAnalysis: string;
  innovationAnalysis: string;
  feasibilityAnalysis: string;
  revenueAnalysis: string;
  risks: RiskItem[];
  recommendations: string[];
  finalVerdict: string;
  recommendedAction: string;
}

export interface StartupIdea {
  id: string;
  name: string;
  description: string;
  problemStatement: string;
  proposedSolution: string;
  targetCustomer: string;
  industry: string;
  location: string;
  businessModel: string;
  revenueModel: string;
  currentStage: string;
  competitors?: string | null;
  usp?: string | null;
  technology?: string | null;
  estimatedInvestment?: string | null;
  additionalInformation?: string | null;
  createdAt: string;
  updatedAt?: string;
  conversationId?: string | null;
  reportsCount?: number;
  latestReport?: {
    id: string;
    versionNumber?: number;
    overallScore: number;
    validationPercentage: number;
    validationCategory: ValidationCategory;
    summary: string;
    createdAt: string;
  } | null;
  reports?: ValidationReport[];
}

export interface ValidationReport {
  id: string;
  startupIdeaId: string;
  startupIdea?: StartupIdea;
  conversationId?: string | null;
  versionNumber: number;
  previousReportId?: string | null;
  scores: ParameterScores;
  overallScore: number;
  validationPercentage: number;
  validationCategory: ValidationCategory;
  summary: string;
  createdAt: string;
  analysis?: ReportAnalysisData | null;
}

export interface StructuredStartupState {
  startupName?: string;
  description?: string;
  problemStatement?: string;
  proposedSolution?: string;
  targetCustomer?: string;
  industry?: string;
  location?: string;
  businessModel?: string;
  revenueModel?: string;
  competitors?: string;
  usp?: string;
  technology?: string;
  estimatedInvestment?: string;
  currentStage?: string;
  additionalInformation?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: 'USER' | 'ASSISTANT' | 'SYSTEM';
  message: string;
  actionType?: 'VALIDATION_OFFERED' | 'VALIDATION_COMPLETED' | 'INFO' | null;
  metadata?: string | null;
  createdAt: string;
}

export interface ValidationConversation {
  id: string;
  userId: string;
  startupIdeaId?: string | null;
  startupIdea?: {
    id: string;
    name: string;
    industry: string;
    reports?: {
      id: string;
      versionNumber: number;
      overallScore: number;
      validationPercentage: number;
      validationCategory: ValidationCategory;
      summary: string;
      createdAt: string;
    }[];
  } | null;
  title: string;
  structuredData: string;
  lastMessage?: string;
  messageCount?: number;
  reportsCount?: number;
  latestScore?: number;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
}

export interface VersionReportItem {
  id: string;
  versionNumber: number;
  previousReportId?: string | null;
  overallScore: number;
  validationPercentage: number;
  validationCategory: ValidationCategory;
  summary: string;
  recommendedAction: string;
  createdAt: string;
  scoreDelta?: number | null;
  scores: ParameterScores;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  authProvider: AuthProvider;
  profileImage?: string | null;
  college?: string | null;
  course?: string | null;
  graduationYear?: number | null;
  createdAt?: string;
  lastLoginAt?: string | null;
  _count?: {
    ideas: number;
    conversations?: number;
  };
}

export interface DashboardStats {
  totalIdeas: number;
  totalValidations: number;
  activeConversations: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  promisingIdeas: number;
  categories: {
    highlyPromising: number;
    promising: number;
    needsImprovement: number;
    highRisk: number;
  };
  scoreHistory: {
    id: string;
    name: string;
    fullName: string;
    score: number;
    category: ValidationCategory;
    date: string;
  }[];
  recentAnalyses: {
    id: string;
    name: string;
    industry: string;
    reportId: string;
    versionNumber?: number;
    totalVersions?: number;
    score: number;
    category: ValidationCategory;
    createdAt: string;
    summary: string;
  }[];
}

export interface ComparisonResult {
  ideas: {
    id: string;
    name: string;
    industry: string;
    stage: string;
    businessModel: string;
    reportId: string | null;
    scores: (ParameterScores & {
      overallScore: number;
      validationPercentage: number;
      validationCategory: ValidationCategory;
    }) | null;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    recommendedAction: string;
  }[];
  rankedOrder: string[];
  comparisonSummary: string;
}

// Admin Panel Types
export interface AdminDashboardStats {
  totalUsers: number;
  totalIdeas: number;
  totalValidations: number;
  averageValidationScore: number;
  categories: {
    highlyPromising: number;
    promising: number;
    needsImprovement: number;
    highRisk: number;
  };
  newUsersToday: number;
  newValidationsToday: number;
  categoryDistribution: { name: string; value: number; color: string }[];
  scoreDistribution: { range: string; count: number }[];
  userGrowth: { date: string; users: number }[];
  validationActivity: { date: string; validations: number }[];
}

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  authProvider: AuthProvider;
  profileImage?: string | null;
  college?: string | null;
  course?: string | null;
  graduationYear?: number | null;
  ideasCount: number;
  validationsCount: number;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface AdminUserDetails {
  user: User;
  stats: {
    totalIdeas: number;
    totalValidations: number;
    averageScore: number;
    highestScore: number;
  };
  ideas: {
    id: string;
    name: string;
    industry: string;
    stage: string;
    createdAt: string;
    latestReport?: {
      id: string;
      overallScore: number;
      validationPercentage: number;
      validationCategory: ValidationCategory;
      summary: string;
      createdAt: string;
    } | null;
  }[];
}

export interface AdminIdeaItem {
  id: string;
  name: string;
  industry: string;
  location: string;
  currentStage: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    college?: string | null;
    profileImage?: string | null;
  };
  latestReport?: {
    id: string;
    overallScore: number;
    validationPercentage: number;
    validationCategory: ValidationCategory;
    summary: string;
    createdAt: string;
  } | null;
}

export interface AdminReportItem {
  id: string;
  startupIdeaId: string;
  startupName: string;
  industry: string;
  user: {
    id: string;
    name: string;
    email: string;
    college?: string | null;
    profileImage?: string | null;
  };
  overallScore: number;
  validationPercentage: number;
  validationCategory: ValidationCategory;
  summary: string;
  createdAt: string;
}
