export type ThankYouOffer = "workshop" | "plugin" | "membership";

// Analytics slugs for the paid thank-you page. Each paid view counts as one
// purchase of that offer in /admin/analytics.
export const THANK_YOU_SLUGS: Record<ThankYouOffer, { slug: string; title: string }> = {
  workshop: {
    slug: "ai-video-editor-workshop-registered",
    title: "AI Video Editing Team Workshop: Registered",
  },
  plugin: {
    slug: "ai-video-editor-plugin-purchased",
    title: "AI Video Editing Plugin: Purchased",
  },
  membership: {
    slug: "ai-video-editor-membership-joined",
    title: "Disgustingly Paid: Joined from the AI Video Editor page",
  },
};
