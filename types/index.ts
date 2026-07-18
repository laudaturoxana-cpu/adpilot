// ── User & Auth ──
export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  agency_name?: string;
  role: "admin" | "user";
  created_at: string;
  updated_at: string;
}

export interface MetaConnection {
  id: string;
  user_id: string;
  workspace_id?: string;
  meta_user_id: string;
  meta_user_name?: string;
  selected_ad_account_id?: string;
  selected_ad_account_name?: string;
  is_active: boolean;
  token_expires_at?: string;
  created_at: string;
  updated_at: string;
}

// ── Workspaces & RBAC ──
export type WorkspacePlan = "free" | "starter" | "agency" | "enterprise";

export type WorkspaceRole =
  | "owner"
  | "admin"
  | "media_buyer"
  | "strategist"
  | "creative"
  | "approver"
  | "client"
  | "viewer";

export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  plan: WorkspacePlan;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
}

/** Membru însoțit de rolul curentului - folosit în răspunsurile API. */
export interface WorkspaceWithRole extends Workspace {
  role: WorkspaceRole;
}

export interface BusinessProfile {
  id: string;
  workspace_id: string;
  business_type?: string;
  main_objective?: string;
  products?: string;
  country?: string;
  currency?: string;
  monthly_budget?: number;
  target_cpa?: number;
  min_roas?: number;
  avg_order_value?: number;
  profit_margin?: number;
  conversion_events: string[];
  landing_pages: string[];
  brand_voice?: string;
  forbidden_words: string[];
  regulated_industry: boolean;
  automation_level: number;
  created_at: string;
  updated_at: string;
}

export type AuditActorType = "user" | "ai" | "system";

export interface AuditLogEntry {
  id: string;
  workspace_id: string;
  actor_id?: string;
  actor_type: AuditActorType;
  action: string;
  entity_type?: string;
  entity_id?: string;
  before_state?: unknown;
  after_state?: unknown;
  reason?: string;
  created_at: string;
}

// ── Meta Ads ──
export interface AdAccount {
  id: string;
  name: string;
  currency: string;
  timezone_name: string;
  account_status: number;
  amount_spent: string;
}

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  objective: string;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  stop_time?: string;
  created_time: string;
  updated_time?: string;
  account_id?: string;
}

export type CampaignStatus = "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED" | "WITH_ISSUES";

export interface CampaignInsight {
  campaign_id: string;
  campaign_name: string;
  impressions: string;
  reach: string;
  clicks: string;
  spend: string;
  ctr: string;
  cpc: string;
  cpp: string;
  actions?: InsightAction[];
  date_start: string;
  date_stop: string;
}

export interface InsightAction {
  action_type: string;
  value: string;
}

export interface DateRange {
  since: string;
  until: string;
}

export type InsightLevel = "account" | "campaign" | "adset" | "ad";

export interface CreateCampaignInput {
  name: string;
  objective: string;
  status: CampaignStatus;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  stop_time?: string;
  special_ad_categories?: string[];
}

export interface UpdateCampaignInput {
  name?: string;
  status?: CampaignStatus;
  daily_budget?: string;
  lifetime_budget?: string;
}

export interface MetaAPIError {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

// ── AI & Copy ──
export interface CopyVariant {
  approach: string;
  primary_text: string;
  headline: string;
  description: string;
  cta: string;
  emoji_hook: string;
  rationale: string;
}

export interface GeneratedCopy {
  id: string;
  user_id: string;
  product: string;
  audience: string;
  objective: string;
  tone?: string;
  variants: CopyVariant[];
  is_favorite: boolean;
  created_at: string;
}

export interface AIAnalysis {
  id: string;
  user_id: string;
  ad_account_id: string;
  period_days: number;
  analysis_text: string;
  created_at: string;
}

export interface InsightsCache {
  id: string;
  user_id: string;
  ad_account_id: string;
  date_range: string;
  data: unknown;
  cached_at: string;
  expires_at: string;
}

// ── API Responses ──
export interface APIResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  paging?: {
    cursors?: { before: string; after: string };
    next?: string;
    previous?: string;
  };
}

// ── Dashboard ──
export interface DashboardMetrics {
  reach: number;
  reachTrend: number;
  spend: number;
  spendTrend: number;
  avgCtr: number;
  ctrTrend: number;
  avgRoas: number;
  roasTrend: number;
}

export interface ChartDataPoint {
  date: string;
  spend: number;
  reach: number;
  clicks: number;
  conversions: number;
}
