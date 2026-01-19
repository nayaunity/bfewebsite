export interface LinkItem {
  id: string;
  title: string;
  description?: string;
  url: string;
  category?: string;
  featured?: boolean;
}

export const links: LinkItem[] = [
  // Featured/Pinned Links
  {
    id: "free-resources",
    title: "Free Resources Hub",
    description: "Access all my free guides, templates, and tools",
    url: "/resources",
    category: "Resources",
    featured: true,
  },
  {
    id: "community",
    title: "Join the Community",
    description: "Connect with other learners and pivoters",
    url: "/community",
    category: "Community",
    featured: true,
  },

  // Social Media Posts Resources
  // Add new links here as you mention them in social posts
  // Example:
  {
    id: "resume-template",
    title: "✨ Vision boards are cool, but have you ever created a gpt of you 1 year from now?",
    description: "",
    url: "https://theblackfemaleengineer.substack.com/p/dont-create-a-vision-board-create",
    category: "Life",
  },
  {
    id: "coding-roadmap",
    title: "🎤 Attend tech conferences for free!",
    description: "Join this membership community to save on tech conferences year round",
    url: "https://www.skool.com/bigstage/about?ref=8caf1280f64b43e19a63a7b7114a802c",
    category: "Career",
  },
  {
    id: "coding-roadmap",
    title: "🎓 Path to a free self-taught education in Computer Science!",
    description: "",
    url: "https://github.com/ossu/computer-science",
    category: "Learning",
  },

  // Other Links
  {
    id: "jobs",
    title: "Job Board",
    description: "Find opportunities at companies that value diversity",
    url: "/jobs",
    category: "Career",
  },
  {
    id: "work-with-us",
    title: "Work With Us",
    description: "Partnership and collaboration opportunities",
    url: "/work-with-us",
    category: "Business",
  },
  {
    id: "contact",
    title: "Get in Touch",
    description: "Questions? Let's connect",
    url: "/contact",
    category: "Contact",
  },
];

export const socialLinks = [
  {
    name: "Instagram",
    url: "https://instagram.com/theblackfemaleengineer",
    icon: "instagram",
  },
  {
    name: "LinkedIn",
    url: "https://linkedin.com/in/theblackfemaleengineer",
    icon: "linkedin",
  },
  {
    name: "YouTube",
    url: "https://youtube.com/@theblackfemaleengineer",
    icon: "youtube",
  },
  {
    name: "TikTok",
    url: "https://tiktok.com/@theblackfemaleengineer",
    icon: "tiktok",
  },
];
