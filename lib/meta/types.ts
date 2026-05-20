export interface MetaUser {
  id: string;
  name: string;
  email?: string;
}

export interface MetaAdAccount {
  id: string;
  account_id: string;
  name: string;
  currency: string;
  timezone_name: string;
  account_status: number;
  amount_spent: string;
  balance?: string;
}

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  configured_status?: string;
  effective_status?: string;
  objective: string;
  daily_budget?: string;
  lifetime_budget?: string;
  budget_remaining?: string;
  start_time?: string;
  stop_time?: string;
  created_time: string;
  updated_time?: string;
  account_id?: string;
  insights?: { data: MetaInsight[] };
}

export interface MetaInsight {
  campaign_id: string;
  campaign_name: string;
  account_id: string;
  account_name: string;
  impressions: string;
  reach: string;
  frequency?: string;
  clicks: string;
  unique_clicks?: string;
  spend: string;
  ctr: string;
  cpc?: string;
  cpp?: string;
  cpm?: string;
  actions?: MetaAction[];
  cost_per_action_type?: MetaAction[];
  date_start: string;
  date_stop: string;
}

export interface MetaAction {
  action_type: string;
  value: string;
}

export interface MetaPaging {
  cursors?: { before: string; after: string };
  next?: string;
  previous?: string;
}

export interface MetaResponse<T> {
  data: T[];
  paging?: MetaPaging;
  error?: MetaErrorResponse;
}

export interface MetaErrorResponse {
  message: string;
  type: string;
  code: number;
  error_subcode?: number;
  fbtrace_id?: string;
}

export class MetaAPIError extends Error {
  code: number;
  type: string;
  fbtraceId?: string;

  constructor(error: MetaErrorResponse) {
    super(error.message);
    this.name = "MetaAPIError";
    this.code = error.code;
    this.type = error.type;
    this.fbtraceId = error.fbtrace_id;
  }

  getUserMessage(): string {
    const messages: Record<number, string> = {
      190: "Token-ul Meta a expirat. Te rugăm să reconectezi contul Meta Ads.",
      200: "Nu ai permisiunile necesare pentru această acțiune.",
      4: "Prea multe cereri. Te rugăm așteaptă câteva minute.",
      100: "Parametru invalid trimis către Meta API.",
      17: "Limita de cereri a fost atinsă. Încearcă din nou în 10 minute.",
      10: "Permisiuni insuficiente pentru aplicație.",
    };
    return messages[this.code] ?? `Eroare Meta API: ${this.message}`;
  }
}
