import {
  MetaAdAccount,
  MetaCampaign,
  MetaInsight,
  MetaResponse,
  MetaAPIError,
  MetaErrorResponse,
} from "./types";
import type { CreateCampaignInput, UpdateCampaignInput, DateRange, InsightLevel } from "@/types";

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
    const separator = url.includes("?") ? "&" : "?";

    const response = await fetch(`${url}${separator}access_token=${this.accessToken}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const json = await response.json();

    if (json.error) {
      this.handleMetaError(json.error as MetaErrorResponse);
    }

    if (!response.ok) {
      throw new Error(`Meta API responded with status ${response.status}`);
    }

    return json as T;
  }

  private handleMetaError(error: MetaErrorResponse): never {
    throw new MetaAPIError(error);
  }
}
