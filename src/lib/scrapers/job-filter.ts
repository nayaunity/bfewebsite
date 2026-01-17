// Keywords used to identify tech roles
const TECH_TITLE_KEYWORDS = [
  // Engineering
  "engineer",
  "developer",
  "programmer",
  "architect",
  "devops",
  "sre",
  "site reliability",
  "platform",
  "infrastructure",
  "backend",
  "frontend",
  "full stack",
  "fullstack",
  "full-stack",
  "software",
  "systems",
  "embedded",
  "firmware",
  "mobile",
  "ios",
  "android",
  "web",
  "api",
  "cloud",
  "security",
  "cybersecurity",
  "network",
  "database",
  "dba",
  // Data
  "data scientist",
  "data engineer",
  "data analyst",
  "machine learning",
  "ml engineer",
  "ai engineer",
  "artificial intelligence",
  "deep learning",
  "nlp",
  "analytics",
  "big data",
  "etl",
  // Product & Design
  "product manager",
  "product owner",
  "technical product",
  "ux designer",
  "ui designer",
  "product designer",
  "ux researcher",
  "design technologist",
  // QA & Testing
  "qa engineer",
  "quality assurance",
  "test engineer",
  "sdet",
  "automation engineer",
  // Other Tech
  "technical writer",
  "solutions architect",
  "technical lead",
  "tech lead",
  "engineering manager",
  "scrum master",
  "agile coach",
  "it specialist",
  "it analyst",
  "system admin",
  "sysadmin",
];

// Keywords that indicate non-tech roles to exclude
const EXCLUDE_KEYWORDS = [
  "recruiter",
  "recruiting",
  "talent acquisition",
  "human resources",
  "hr ",
  "sales",
  "account executive",
  "account manager",
  "customer success",
  "customer support",
  "administrative",
  "receptionist",
  "executive assistant",
  "legal counsel",
  "lawyer",
  "attorney",
  "accountant",
  "finance manager",
  "marketing manager",
  "social media",
  "content writer",
  "copywriter",
  "janitor",
  "facilities",
  "warehouse",
  "driver",
  "security guard",
  "cook",
  "chef",
];

export function isTechRole(title: string): boolean {
  const lowerTitle = title.toLowerCase();

  // First check exclusions
  for (const exclude of EXCLUDE_KEYWORDS) {
    if (lowerTitle.includes(exclude)) {
      return false;
    }
  }

  // Then check inclusions
  for (const keyword of TECH_TITLE_KEYWORDS) {
    if (lowerTitle.includes(keyword)) {
      return true;
    }
  }

  return false;
}

export function categorizeJob(title: string): string {
  const lowerTitle = title.toLowerCase();

  // Data roles
  if (
    lowerTitle.includes("data scientist") ||
    lowerTitle.includes("machine learning") ||
    lowerTitle.includes("ml ") ||
    lowerTitle.includes("ai ") ||
    lowerTitle.includes("artificial intelligence") ||
    lowerTitle.includes("deep learning") ||
    lowerTitle.includes("nlp")
  ) {
    return "Data Science";
  }

  if (
    lowerTitle.includes("data engineer") ||
    lowerTitle.includes("data analyst") ||
    lowerTitle.includes("analytics") ||
    lowerTitle.includes("big data") ||
    lowerTitle.includes("etl")
  ) {
    return "Data Science";
  }

  // DevOps/SRE
  if (
    lowerTitle.includes("devops") ||
    lowerTitle.includes("sre") ||
    lowerTitle.includes("site reliability") ||
    lowerTitle.includes("platform engineer") ||
    lowerTitle.includes("infrastructure") ||
    lowerTitle.includes("cloud engineer")
  ) {
    return "DevOps / SRE";
  }

  // Product Management
  if (
    lowerTitle.includes("product manager") ||
    lowerTitle.includes("product owner") ||
    lowerTitle.includes("technical product")
  ) {
    return "Product Management";
  }

  // Design
  if (
    lowerTitle.includes("designer") ||
    lowerTitle.includes("ux ") ||
    lowerTitle.includes("ui ") ||
    lowerTitle.includes("design")
  ) {
    return "Design";
  }

  // Default to Software Engineering
  return "Software Engineering";
}

export function extractTags(title: string, description?: string): string[] {
  const text = `${title} ${description || ""}`.toLowerCase();
  const tags: string[] = [];

  const tagPatterns: { pattern: RegExp; tag: string }[] = [
    { pattern: /\bpython\b/i, tag: "Python" },
    { pattern: /\bjava\b/i, tag: "Java" },
    { pattern: /\bjavascript\b/i, tag: "JavaScript" },
    { pattern: /\btypescript\b/i, tag: "TypeScript" },
    { pattern: /\breact\b/i, tag: "React" },
    { pattern: /\bangular\b/i, tag: "Angular" },
    { pattern: /\bvue\b/i, tag: "Vue" },
    { pattern: /\bnode\.?js\b/i, tag: "Node.js" },
    { pattern: /\bgo\b|\bgolang\b/i, tag: "Go" },
    { pattern: /\brust\b/i, tag: "Rust" },
    { pattern: /\bc\+\+\b/i, tag: "C++" },
    { pattern: /\bc#\b|\.net\b/i, tag: "C#/.NET" },
    { pattern: /\bruby\b/i, tag: "Ruby" },
    { pattern: /\bswift\b/i, tag: "Swift" },
    { pattern: /\bkotlin\b/i, tag: "Kotlin" },
    { pattern: /\baws\b/i, tag: "AWS" },
    { pattern: /\bazure\b/i, tag: "Azure" },
    { pattern: /\bgcp\b|\bgoogle cloud\b/i, tag: "GCP" },
    { pattern: /\bkubernetes\b|\bk8s\b/i, tag: "Kubernetes" },
    { pattern: /\bdocker\b/i, tag: "Docker" },
    { pattern: /\bterraform\b/i, tag: "Terraform" },
    { pattern: /\bsql\b/i, tag: "SQL" },
    { pattern: /\bmongodb\b/i, tag: "MongoDB" },
    { pattern: /\bpostgres\b/i, tag: "PostgreSQL" },
    { pattern: /\bredis\b/i, tag: "Redis" },
    { pattern: /\bspark\b/i, tag: "Spark" },
    { pattern: /\btensorflow\b/i, tag: "TensorFlow" },
    { pattern: /\bpytorch\b/i, tag: "PyTorch" },
    { pattern: /\bmachine learning\b|\bml\b/i, tag: "Machine Learning" },
    { pattern: /\bai\b|\bartificial intelligence\b/i, tag: "AI" },
    { pattern: /\bbackend\b/i, tag: "Backend" },
    { pattern: /\bfrontend\b/i, tag: "Frontend" },
    { pattern: /\bfull.?stack\b/i, tag: "Full Stack" },
    { pattern: /\bmobile\b/i, tag: "Mobile" },
    { pattern: /\bios\b/i, tag: "iOS" },
    { pattern: /\bandroid\b/i, tag: "Android" },
    { pattern: /\bsecurity\b/i, tag: "Security" },
    { pattern: /\bfintech\b/i, tag: "Fintech" },
  ];

  for (const { pattern, tag } of tagPatterns) {
    if (pattern.test(text) && !tags.includes(tag)) {
      tags.push(tag);
    }
  }

  return tags.slice(0, 5); // Limit to 5 tags
}

export function isRemote(location: string, title?: string): boolean {
  const text = `${location} ${title || ""}`.toLowerCase();
  return (
    text.includes("remote") ||
    text.includes("work from home") ||
    text.includes("wfh") ||
    text.includes("anywhere")
  );
}

export function normalizeJobType(type?: string): string {
  if (!type) return "Full-time";

  const lower = type.toLowerCase();

  if (lower.includes("intern")) return "Internship";
  if (lower.includes("contract") || lower.includes("contractor"))
    return "Contract";
  if (lower.includes("part")) return "Part-time";
  if (lower.includes("temp")) return "Temporary";

  return "Full-time";
}
