export const TIER_LIMITS: Record<
  string,
  {
    appsPerMonth: number;
    maxResumes: number;
    tailoredPerMonth: number;
    portfolioEnabled: boolean;
    portfolioRegenerationsPerMonth: number;
    referralsPerMonth: number;
    concurrentReferrals: number;
  }
> = {
  free: {
    appsPerMonth: 5,
    maxResumes: 3,
    tailoredPerMonth: 1,
    portfolioEnabled: false,
    portfolioRegenerationsPerMonth: 0,
    referralsPerMonth: 0,
    concurrentReferrals: 0,
  },
  starter: {
    appsPerMonth: 100,
    maxResumes: 5,
    tailoredPerMonth: 9999,
    portfolioEnabled: true,
    portfolioRegenerationsPerMonth: 3,
    referralsPerMonth: 2,
    concurrentReferrals: 1,
  },
  pro: {
    appsPerMonth: 300,
    maxResumes: 10,
    tailoredPerMonth: 9999,
    portfolioEnabled: true,
    portfolioRegenerationsPerMonth: 9999,
    referralsPerMonth: 5,
    concurrentReferrals: 3,
  },
};
