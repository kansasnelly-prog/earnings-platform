// ===========================================
// BRAVE SEARCH SERVICE
// ===========================================

const BRAVE_SEARCH_URL = 'https://api.search.brave.com/res/v1/web/search';
const BRAVE_API_KEY = import.meta.env.VITE_BRAVE_SEARCH_API_KEY || import.meta.env.BRAVE_SEARCH_API_KEY || '';

export interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
  page_age?: string;
  page_fetched?: string;
}

export interface BraveSearchResponse {
  query: {
    original: string;
    show_strict_warning: boolean;
    altered: boolean | null;
    sug_groups: any[];
  };
  web: {
    results: BraveSearchResult[];
    total_results: number;
  };
}

class BraveSearchServiceClass {
  private apiKey: string;
  private enabled: boolean;

  constructor() {
    this.apiKey = BRAVE_API_KEY;
    this.enabled = !!this.apiKey;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async search(query: string, count: number = 5): Promise<BraveSearchResponse['web']> {
    if (!this.enabled) {
      return { results: [], total_results: 0 };
    }

    try {
      const response = await fetch(`${BRAVE_SEARCH_URL}?q=${encodeURIComponent(query)}&count=${count}`, {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': this.apiKey,
        },
      });

      if (!response.ok) {
        console.warn('[BraveSearch] API request failed:', response.status);
        return { results: [], total_results: 0 };
      }

      const data: BraveSearchResponse = await response.json();
      return data.web;
    } catch (error) {
      console.warn('[BraveSearch] Search failed:', error);
      return { results: [], total_results: 0 };
    }
  }

  async searchProductContext(productName: string, category?: string): Promise<string> {
    const query = category ? `${productName} ${category} review specs` : `${productName} review specs`;
    const results = await this.search(query, 3);

    if (results.results.length === 0) {
      return '';
    }

    return results.results
      .map(r => `${r.title}: ${r.description}`)
      .join('\n\n');
  }

  async searchMarketContext(keyword: string): Promise<string> {
    const results = await this.search(`${keyword} market trends 2025 2026`, 3);

    if (results.results.length === 0) {
      return '';
    }

    return results.results
      .map(r => `${r.title}: ${r.description}`)
      .join('\n\n');
  }
}

export const BraveSearchService = new BraveSearchServiceClass();
