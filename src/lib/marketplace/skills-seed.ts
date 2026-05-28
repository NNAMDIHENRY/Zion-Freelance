/** Normalized, deduplicated marketplace skills — synced via taxonomy. */

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const SKILL_NAMES = [
  // Software engineering
  "TypeScript", "JavaScript", "Python", "Java", "C#", "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin",
  "React", "Next.js", "Vue.js", "Angular", "Svelte", "Node.js", "Express.js", "NestJS", "Django", "Flask",
  "FastAPI", "Spring Boot", "Laravel", "Ruby on Rails", ".NET", "GraphQL", "REST APIs", "Microservices",
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "Prisma", "SQL", "NoSQL",
  // Mobile
  "React Native", "Flutter", "iOS Development", "Android Development", "Mobile UI",
  // DevOps & cloud
  "Docker", "Kubernetes", "Terraform", "Ansible", "CI/CD", "GitHub Actions", "Jenkins",
  "AWS", "Google Cloud", "Microsoft Azure", "Cloud Architecture", "Serverless", "Linux Administration",
  // Design
  "UI Design", "UX Design", "UI/UX Design", "Figma", "Adobe XD", "Sketch", "Adobe Photoshop",
  "Adobe Illustrator", "Brand Identity", "Logo Design", "Visual Design", "Design Systems",
  "Motion Graphics", "3D Modeling", "Blender", "After Effects",
  // AI & data
  "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Data Science", "Data Analysis",
  "Pandas", "NumPy", "NLP", "Computer Vision", "LLM Integration", "OpenAI API", "Prompt Engineering",
  "MLOps", "AI Strategy", "Generative AI",
  // Cybersecurity
  "Cybersecurity", "Penetration Testing", "Security Auditing", "SOC Analysis", "OWASP",
  "Network Security", "Cloud Security", "Compliance (SOC2/GDPR)",
  // Writing & content
  "Content Writing", "Copywriting", "Technical Writing", "Blog Writing", "Ghostwriting",
  "Editing & Proofreading", "Grant Writing", "Scriptwriting",
  // Marketing
  "Digital Marketing", "SEO", "SEM", "Google Ads", "Facebook Ads", "Email Marketing",
  "Social Media Marketing", "Content Marketing", "Marketing Strategy", "Growth Marketing",
  "Influencer Marketing", "Affiliate Marketing", "Analytics (GA4)",
  // Video & audio
  "Video Editing", "Video Production", "Premiere Pro", "Final Cut Pro", "DaVinci Resolve",
  "Animation", "2D Animation", "3D Animation", "Voice Over", "Podcast Production",
  // Business & PM
  "Product Management", "Project Management", "Agile", "Scrum", "Business Analysis",
  "Business Strategy", "Market Research", "Competitive Analysis", "Operations Management",
  "Virtual Assistance", "Executive Assistance", "Data Entry",
  // Finance & legal
  "Bookkeeping", "Accounting", "Financial Modeling", "Tax Preparation", "Legal Research",
  "Contract Review", "Compliance",
  // E-commerce
  "Shopify", "WooCommerce", "Amazon FBA", "E-commerce Strategy", "Product Listing Optimization",
  // No-code & automation
  "Webflow", "Bubble", "Zapier", "Make (Integromat)", "Airtable", "Notion Automation",
  "Workflow Automation", "RPA",
  // Blockchain
  "Blockchain", "Solidity", "Smart Contracts", "Web3", "NFT Development", "DeFi",
  // Consulting & tutoring
  "Management Consulting", "Startup Consulting", "Career Coaching", "Online Tutoring",
  "Language Tutoring", "STEM Tutoring",
  // Translation
  "Translation", "Localization", "Subtitling", "Transcription",
  // Other
  "Customer Support", "Community Management", "HR Consulting", "Recruitment",
  "CAD Design", "Architecture", "Interior Design", "Game Development", "Unity", "Unreal Engine",
  "QA Testing", "Manual Testing", "Automated Testing", "Selenium", "Cypress",
  "Tailwind CSS", "Bootstrap", "WordPress", "Webflow Development", "Accessibility (WCAG)"
] as const;

const seenSlug = new Set<string>();
const seenName = new Set<string>();
export const MARKETPLACE_SKILL_SEED = SKILL_NAMES.reduce<
  Array<{ slug: string; name: string }>
>((acc, name) => {
  const slug = slugify(name);
  const nameKey = name.trim().toLowerCase();
  if (!slug || seenSlug.has(slug) || seenName.has(nameKey)) return acc;
  seenSlug.add(slug);
  seenName.add(nameKey);
  acc.push({ slug, name: name.trim() });
  return acc;
}, []);
