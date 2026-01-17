export interface ScrapedJob {
  externalId: string;
  title: string;
  location: string;
  type: string;
  remote: boolean;
  salary?: string;
  postedAt?: Date;
  applyUrl: string;
  category: string;
  tags: string[];
}

export interface ScraperResult {
  success: boolean;
  jobs: ScrapedJob[];
  error?: string;
}

export interface DEICompany {
  name: string;
  slug: string;
  careersUrl: string;
  industry: string;
  atsType: "greenhouse" | "workday" | "custom";
  atsConfig: GreenhouseConfig | WorkdayConfig | null;
}

export interface GreenhouseConfig {
  boardToken: string;
}

export interface WorkdayConfig {
  baseUrl: string;
  company: string;
  siteName: string;
}

export type ScraperFunction = (
  company: DEICompany
) => Promise<ScraperResult>;
