export interface CommunityMember {
  id: string;
  slug: string;
  name: string;
  role: string;
  company: string;
  specialty: string;
  image?: string;
  bio: string;
  story: string;
  experience: string[];
  skills: string[];
  linkedinUrl?: string;
  twitterUrl?: string;
  websiteUrl?: string;
}

export const communityMembers: CommunityMember[] = [
  {
    id: "1",
    slug: "amara-okonkwo",
    name: "Amara Okonkwo",
    role: "Senior Software Engineer",
    company: "Google",
    specialty: "Backend Systems & Distributed Computing",
    bio: "Building scalable systems that power millions of users daily.",
    story: "Growing up in Lagos, Nigeria, I never imagined I'd end up building systems at one of the world's largest tech companies. My journey started with a borrowed laptop and free online courses. After moving to the US for graduate school, I faced countless rejections before landing my first role. Now, I'm passionate about creating pathways for other Black women to enter tech.",
    experience: [
      "Led the redesign of Google's internal authentication service, improving latency by 40%",
      "Mentored 15+ junior engineers through Google's internal mentorship program",
      "Speaker at GopherCon and KubeCon on distributed systems best practices",
      "Previously worked at Stripe on payment infrastructure"
    ],
    skills: ["Go", "Kubernetes", "Distributed Systems", "System Design", "gRPC"],
    linkedinUrl: "https://linkedin.com/in/",
    twitterUrl: "https://twitter.com/",
  },
  {
    id: "2",
    slug: "maya-johnson",
    name: "Maya Johnson",
    role: "Staff Engineer",
    company: "Netflix",
    specialty: "Frontend Architecture & Performance",
    bio: "Obsessed with building delightful user experiences at scale.",
    story: "I discovered coding through a Tumblr theme customization rabbit hole in high school. What started as wanting to make my blog look cool turned into a career passion. After a non-traditional path through a coding bootcamp, I worked my way up from junior developer to staff engineer. I believe the best products are built by diverse teams, and I'm committed to making that a reality.",
    experience: [
      "Architected Netflix's next-generation streaming player interface",
      "Reduced initial page load time by 60% through innovative code-splitting strategies",
      "Created internal design system used by 200+ engineers",
      "Founded the Black@ Netflix ERG engineering mentorship track"
    ],
    skills: ["React", "TypeScript", "Performance Optimization", "Design Systems", "Web APIs"],
    linkedinUrl: "https://linkedin.com/in/",
    websiteUrl: "https://example.com",
  },
  {
    id: "3",
    slug: "zara-williams",
    name: "Zara Williams",
    role: "Machine Learning Engineer",
    company: "OpenAI",
    specialty: "Natural Language Processing & AI Ethics",
    bio: "Working to make AI more equitable and accessible for everyone.",
    story: "My path to ML wasn't straightforward—I started as a linguistics major fascinated by how humans communicate. When I discovered NLP, everything clicked. I've made it my mission to ensure AI systems work fairly for all communities. After experiencing bias in AI firsthand, I'm now part of the team working to solve these problems from the inside.",
    experience: [
      "Core contributor to GPT safety and alignment research",
      "Published research on reducing bias in large language models at NeurIPS",
      "Co-founded AI4ALL workshop series for underrepresented students",
      "Previously at DeepMind working on multilingual models"
    ],
    skills: ["Python", "PyTorch", "NLP", "AI Ethics", "Research"],
    linkedinUrl: "https://linkedin.com/in/",
    twitterUrl: "https://twitter.com/",
  },
  {
    id: "4",
    slug: "kira-thompson",
    name: "Kira Thompson",
    role: "Engineering Manager",
    company: "Stripe",
    specialty: "Technical Leadership & Team Building",
    bio: "Building high-performing teams that ship great products.",
    story: "I spent 8 years as an individual contributor before making the leap to management. The transition wasn't easy—I had to unlearn my instinct to solve every problem myself. Now I find the most fulfillment in growing other engineers and creating environments where everyone can do their best work. My biggest challenge has been learning to measure my success through others' achievements.",
    experience: [
      "Manages a team of 12 engineers building Stripe's fraud detection systems",
      "Grew team from 3 to 12 engineers while maintaining high performance",
      "Developed Stripe's engineering career ladder framework",
      "Former principal engineer at Square"
    ],
    skills: ["Team Leadership", "System Design", "Technical Strategy", "Mentorship", "Ruby"],
    linkedinUrl: "https://linkedin.com/in/",
  },
  {
    id: "5",
    slug: "nia-campbell",
    name: "Nia Campbell",
    role: "iOS Engineer",
    company: "Apple",
    specialty: "Mobile Development & Accessibility",
    bio: "Creating apps that everyone can use, regardless of ability.",
    story: "I became passionate about accessibility after my grandmother struggled to use her iPhone due to vision problems. That experience drove me to specialize in making technology usable for everyone. At Apple, I work on features that millions of people with disabilities rely on daily. There's nothing more rewarding than getting messages from users saying our work has changed their lives.",
    experience: [
      "Core contributor to VoiceOver and accessibility features on iOS",
      "Filed 20+ patents related to accessible mobile interfaces",
      "WWDC speaker on building accessible applications",
      "Previously at Airbnb improving their app's accessibility"
    ],
    skills: ["Swift", "SwiftUI", "Accessibility", "UIKit", "iOS Architecture"],
    linkedinUrl: "https://linkedin.com/in/",
    twitterUrl: "https://twitter.com/",
    websiteUrl: "https://example.com",
  },
  {
    id: "6",
    slug: "jade-martinez",
    name: "Jade Martinez",
    role: "DevOps Engineer",
    company: "Datadog",
    specialty: "Cloud Infrastructure & Observability",
    bio: "Making sure systems stay up so engineers can sleep at night.",
    story: "I got into DevOps through a love of automation—I'm fundamentally lazy in the best way possible. Why do something manually when you can write a script? After years of being the only Black woman on infrastructure teams, I started a community group for underrepresented folks in DevOps. We now have over 2,000 members supporting each other through the unique challenges we face.",
    experience: [
      "Built Datadog's internal deployment platform serving 500+ services",
      "Reduced deployment time from 45 minutes to 5 minutes",
      "Founder of BlackOps community for Black professionals in DevOps/SRE",
      "Previously at Hashicorp contributing to Terraform"
    ],
    skills: ["Terraform", "AWS", "Kubernetes", "Python", "Observability"],
    linkedinUrl: "https://linkedin.com/in/",
    twitterUrl: "https://twitter.com/",
  },
];

export function getMemberBySlug(slug: string): CommunityMember | undefined {
  return communityMembers.find(member => member.slug === slug);
}

export function getAllMemberSlugs(): string[] {
  return communityMembers.map(member => member.slug);
}
