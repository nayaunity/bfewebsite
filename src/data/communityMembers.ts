export interface CommunityMember {
  id: string;
  slug: string;
  name: string;
  role: string;
  company: string;
  specialty: string;
  image?: string;
  bio: string;
  summary: string;
  story: string[];
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
    summary: "With over 7 years of experience in backend development, I specialize in designing and implementing distributed systems that handle millions of requests per second. My work at Google focuses on authentication infrastructure, where I've led initiatives that have significantly improved system reliability and performance. I'm passionate about mentoring the next generation of engineers and creating inclusive spaces in tech.",
    story: [
      "Growing up in Lagos, Nigeria, I never imagined I'd end up building systems at one of the world's largest tech companies. My journey started with a borrowed laptop and free online courses. I taught myself to code during power outages using downloaded tutorials, determined to find a path out of limited opportunities. After moving to the US for graduate school, I faced countless rejections before landing my first role at a startup that took a chance on me.",
      "Those early struggles shaped who I am today. Every 'no' taught me resilience, and every late night debugging taught me persistence. Now at Google, I'm passionate about creating pathways for other Black women to enter tech. I mentor through programs like /dev/color and speak at conferences about my non-traditional path. If my story can show one person that they belong in tech, then sharing it is worth it."
    ],
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
    summary: "As a Staff Engineer at Netflix, I lead frontend architecture decisions that impact how 200+ million users experience streaming content. My expertise lies in performance optimization, design systems, and building scalable React applications. I'm a bootcamp graduate who proved that non-traditional paths can lead to senior technical roles, and I actively advocate for diverse hiring practices in tech.",
    story: [
      "I discovered coding through a Tumblr theme customization rabbit hole in high school. What started as wanting to make my blog look cool turned into a career passion. I spent hours tweaking CSS and learning HTML just to get the perfect aesthetic. When I graduated, I didn't have the money for a four-year CS degree, so I worked as a barista for two years while saving for a coding bootcamp. Those 12 weeks changed my life.",
      "After bootcamp, I worked my way up from junior developer at a small agency to staff engineer at Netflix. The journey wasn't linear—I was laid off twice, dealt with imposter syndrome constantly, and had managers who didn't believe in my potential. But I kept building, kept learning, and kept showing up. Now I lead a team that builds tools used by millions, and I make sure to pull up other bootcamp grads along the way. The tech industry told me I didn't belong; I proved them wrong."
    ],
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
    summary: "I'm a Machine Learning Engineer at OpenAI focused on making large language models safer and more equitable. With a background in linguistics and computer science, I bring a unique perspective to AI development that centers human communication and fairness. My research on reducing bias in AI systems has been published at top conferences, and I'm committed to ensuring AI benefits all communities, not just the privileged few.",
    story: [
      "My path to ML wasn't straightforward—I started as a linguistics major fascinated by how humans communicate. I was obsessed with language: how we form meaning, how dialects evolve, how translation preserves or loses nuance. When I discovered NLP during a random elective, everything clicked. I realized I could combine my love of language with technology to build systems that truly understand human communication.",
      "But my real awakening came when I experienced AI bias firsthand. A speech recognition system consistently failed to understand my voice, a hiring algorithm screened out my resume, and a facial recognition app couldn't even detect my face. These weren't just technical failures—they were symptoms of who gets to build AI and whose data is included. Now at OpenAI, I'm part of the team working to solve these problems from the inside. I co-founded AI4ALL workshops to bring underrepresented students into this field, because the future of AI depends on who shapes it."
    ],
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
    summary: "I lead a team of 12 engineers at Stripe building fraud detection systems that protect millions of businesses. With 8 years as an individual contributor before transitioning to management, I bring deep technical expertise to my leadership role. I'm passionate about creating inclusive team cultures, developing career frameworks, and helping engineers grow into their full potential. My approach centers on psychological safety, clear communication, and celebrating wins—big and small.",
    story: [
      "I spent 8 years as an individual contributor before making the leap to management. For most of that time, I resisted the idea of managing—I loved coding, loved solving hard problems, and thought management meant giving that up. But when I looked around at the managers in tech, I didn't see many who looked like me. I realized that by staying an IC, I was leaving decisions about team culture, hiring, and promotions to people who might not prioritize the things I cared about.",
      "The transition wasn't easy. I had to unlearn my instinct to solve every problem myself and learn to find fulfillment in watching others succeed. The hardest part? Letting go of being the smartest person in the room and embracing being the person who makes others smarter. Now I manage a team building critical infrastructure at Stripe, and my biggest wins aren't the code I write—they're the engineers I've helped get promoted, the inclusive culture we've built, and the trust my team places in me. Leadership is a skill, and Black women deserve more seats at that table."
    ],
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
    summary: "As an iOS Engineer at Apple, I work on accessibility features that millions of people with disabilities rely on every day. I specialize in VoiceOver, Dynamic Type, and other assistive technologies that make Apple devices usable for everyone. With 20+ patents in accessible interface design, I'm dedicated to proving that good design is accessible design. My work sits at the intersection of engineering and empathy.",
    story: [
      "I became passionate about accessibility after watching my grandmother struggle to use her iPhone due to vision problems. She wanted to FaceTime with her grandkids, read the news, and stay connected, but the tiny text and touch targets made it nearly impossible. I remember spending hours helping her, wishing the technology was better. That experience drove me to specialize in making technology usable for everyone, not just those with perfect vision and steady hands.",
      "At Apple, I now work on the very features that could have helped my grandmother. I've contributed to VoiceOver improvements, designed new accessibility APIs, and filed patents for interfaces that adapt to users' abilities. The most rewarding part of my job isn't the technical challenges—it's the emails from users telling me how our work has changed their lives. A blind photographer who uses VoiceOver to edit photos. A person with tremors who can finally text their family. Technology should be for everyone, and I'm honored to help make that vision a reality."
    ],
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
    summary: "I'm a DevOps Engineer at Datadog where I build deployment platforms and observability tools that keep systems running smoothly. My specialty is automation—if I have to do something twice, I write a script. I've reduced deployment times by 90% and built infrastructure that serves 500+ microservices. Outside of work, I founded BlackOps, a community of 2,000+ Black professionals in DevOps and SRE, because representation matters in infrastructure too.",
    story: [
      "I got into DevOps through a love of automation—I'm fundamentally lazy in the best way possible. Why do something manually when you can write a script? I started my career in IT support, resetting passwords and imaging laptops. But I kept automating myself out of tasks, which led my manager to suggest I look into DevOps. I had never heard of it, but within a year of self-study and home lab experiments, I landed my first infrastructure role.",
      "For years, I was the only Black woman on every infrastructure team I joined. The isolation was real—no one to relate to, no one who understood the unique pressures of navigating this space. So I started BlackOps, a community for underrepresented folks in DevOps and SRE. What began as a Slack channel with 10 people has grown to over 2,000 members supporting each other through on-call horror stories, career advice, and interview prep. Infrastructure powers everything in tech, and I'm determined to ensure we have a seat at that table."
    ],
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
