import {
  MetaAdAccount,
  MetaCampaign,
  MetaInsight,
  MetaResponse,
  MetaAPIError,
  MetaErrorResponse,
} from "./types";
import type { CreateCampaignInput, UpdateCampaignInput, DateRange, InsightLevel } from "@/types";

// Coduri Meta care indică throttling tranzitoriu — se reîncearcă cu backoff.
const THROTTLE_CODES = new Set([4, 17, 613, 80004]);
const MAX_RETRIES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MetaAPIClient {
  private accessToken: string;
  private apiVersion = "v19.0";
  private baseUrl: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
  }

  async getAdAccounts(): Promise<MetaAdAccount[]> {
    const data = await this.request<MetaResponse<MetaAdAccount>>(
      "/me/adaccounts?fields=id,account_id,name,currency,timezone_name,account_status,amount_spent&limit=25"
    );
    return data.data ?? [];
  }

  async getCampaigns(adAccountId: string): Promise<MetaCampaign[]> {
    const accountId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
    const data = await this.request<MetaResponse<MetaCampaign>>(
      `/${accountId}/campaigns?fields=id,name,status,configured_status,effective_status,objective,daily_budget,lifetime_budget,start_time,stop_time,created_time,updated_time&limit=100`
    );
    return data.data ?? [];
  }

  async getCampaign(campaignId: string): Promise<MetaCampaign> {
    return this.request<MetaCampaign>(
      `/${campaignId}?fields=id,name,status,configured_status,effective_status,objective,daily_budget,lifetime_budget,budget_remaining,start_time,stop_time,created_time,updated_time,account_id`
    );
  }

  async createCampaign(adAccountId: string, data: CreateCampaignInput): Promise<MetaCampaign> {
    const accountId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
    const response = await this.request<{ id: string }>(
      `/${accountId}/campaigns`,
      {
        method: "POST",
        body: JSON.stringify({
          ...data,
          special_ad_categories: data.special_ad_categories ?? [],
        }),
      }
    );
    return this.getCampaign(response.id);
  }

  async updateCampaign(campaignId: string, data: UpdateCampaignInput): Promise<MetaCampaign> {
    await this.request<{ success: boolean }>(
      `/${campaignId}`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return this.getCampaign(campaignId);
  }

  async deleteCampaign(campaignId: string): Promise<void> {
    await this.request<{ success: boolean }>(
      `/${campaignId}`,
      { method: "DELETE" }
    );
  }

  async getInsights(
    adAccountId: string,
    dateRange: DateRange,
    level: InsightLevel = "campaign"
  ): Promise<MetaInsight[]> {
    const accountId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
    const params = new URLSearchParams({
      fields: "campaign_id,campaign_name,account_id,account_name,impressions,reach,clicks,spend,ctr,cpc,cpp,cpm,actions",
      time_range: JSON.stringify(dateRange),
      level,
      limit: "100",
    });
    const data = await this.request<MetaResponse<MetaInsight>>(
      `/${accountId}/insights?${params.toString()}`
    );
    return data.data ?? [];
  }

  async getCampaignInsights(campaignId: string, dateRange: DateRange): Promise<MetaInsight[]> {
    const params = new URLSearchParams({
      fields: "campaign_id,campaign_name,impressions,reach,clicks,spend,ctr,cpc,cpp,actions",
      time_range: JSON.stringify(dateRange),
    });
    const data = await this.request<MetaResponse<MetaInsight>>(
      `/${campaignId}/insights?${params.toString()}`
    );
    return data.data ?? [];
  }

  async getMe(): Promise<{ id: string; name: string; email?: string }> {
    return this.request("/me?fields=id,name,email");
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    for (let attempt = 0; ; attempt++) {
      // Token-ul se trimite în header, niciodată în URL (query string-urile
      // ajung în log-uri de proxy/APM). Meta Graph API acceptă Bearer auth.
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
          ...options.headers,
        },
      });

      const json = await response.json();

      if (json.error) {
        const error = json.error as MetaErrorResponse;
        // Throttling tranzitoriu: backoff exponențial și reîncercare.
        if ((THROTTLE_CODES.has(error.code) || response.status === 429) && attempt < MAX_RETRIES) {
          await sleep(2 ** attempt * 1000);
          continue;
        }
        this.handleMetaError(error);
      }

      if (!response.ok) {
        if (response.status === 429 && attempt < MAX_RETRIES) {
          await sleep(2 ** attempt * 1000);
          continue;
        }
        throw new Error(`Meta API responded with status ${response.status}`);
      }

      return json as T;
    }
  }

  private handleMetaError(error: MetaErrorResponse): never {
    throw new MetaAPIError(error);
  }
}
