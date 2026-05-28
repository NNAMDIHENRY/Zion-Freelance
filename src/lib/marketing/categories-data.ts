export type MarketplaceCategoryDef = {
  slug: string;
  name: string;
  description: string;
  tags: string[];
};

export const MARKETPLACE_CATEGORIES: MarketplaceCategoryDef[] = [
  { slug: "web-development", name: "Web Development", description: "Websites, web apps, APIs, and full-stack delivery.", tags: ["React", "Next.js", "Node.js"] },
  { slug: "mobile-development", name: "Mobile Development", description: "iOS, Android, and cross-platform applications.", tags: ["Swift", "Kotlin", "Flutter"] },
  { slug: "ui-ux-design", name: "UI/UX Design", description: "Product design, wireframes, prototypes, and design systems.", tags: ["Figma", "UX research", "Prototyping"] },
  { slug: "graphic-design", name: "Graphic Design", description: "Visual identity, marketing assets, and print-ready design.", tags: ["Branding", "Illustration", "Layout"] },
  { slug: "content-writing", name: "Content Writing", description: "Blogs, articles, guides, and long-form content.", tags: ["SEO content", "Editorial", "Research"] },
  { slug: "copywriting", name: "Copywriting", description: "Conversion-focused copy for web, ads, and campaigns.", tags: ["Landing pages", "Email", "Ads"] },
  { slug: "seo", name: "SEO", description: "Technical SEO, on-page optimization, and growth audits.", tags: ["Keywords", "Audits", "Link building"] },
  { slug: "digital-marketing", name: "Digital Marketing", description: "Paid media, social, lifecycle, and performance marketing.", tags: ["PPC", "Social", "Analytics"] },
  { slug: "data-science", name: "Data Science", description: "Analytics, modeling, dashboards, and experimentation.", tags: ["Python", "SQL", "Visualization"] },
  { slug: "ai-ml", name: "AI / ML", description: "Machine learning, LLM integrations, and intelligent automation.", tags: ["ML", "NLP", "MLOps"] },
  { slug: "blockchain", name: "Blockchain", description: "Smart contracts, dApps, and Web3 product engineering.", tags: ["Solidity", "Web3", "DeFi"] },
  { slug: "devops", name: "DevOps", description: "CI/CD, infrastructure as code, and release automation.", tags: ["Docker", "Kubernetes", "Terraform"] },
  { slug: "cybersecurity", name: "Cybersecurity", description: "AppSec reviews, pentesting, and security hardening.", tags: ["Audits", "Compliance", "IAM"] },
  { slug: "virtual-assistance", name: "Virtual Assistance", description: "Scheduling, inbox management, and operational support.", tags: ["Admin", "CRM", "Research"] },
  { slug: "video-editing", name: "Video Editing", description: "Social clips, explainers, ads, and post-production.", tags: ["Premiere", "After Effects", "Color"] },
  { slug: "animation", name: "Animation", description: "2D/3D motion graphics and character animation.", tags: ["Motion", "Explainers", "3D"] },
  { slug: "translation", name: "Translation", description: "Localization and multilingual content adaptation.", tags: ["Localization", "Proofreading", "Subtitles"] },
  { slug: "accounting", name: "Accounting", description: "Bookkeeping, payroll support, and financial reporting.", tags: ["QuickBooks", "Tax prep", "Reconciliation"] },
  { slug: "legal-services", name: "Legal Services", description: "Contract review, compliance, and business legal support.", tags: ["Contracts", "IP", "Compliance"] },
  { slug: "product-design", name: "Product Design", description: "End-to-end product discovery and experience design.", tags: ["Strategy", "UX", "UI"] },
  { slug: "customer-support", name: "Customer Support", description: "Help desk, chat support, and customer success operations.", tags: ["Zendesk", "Chat", "SLA"] },
  { slug: "architecture", name: "Architecture", description: "System architecture, solution design, and technical leadership.", tags: ["Cloud", "Microservices", "Scale"] },
  { slug: "game-development", name: "Game Development", description: "Gameplay systems, Unity/Unreal builds, and game art pipelines.", tags: ["Unity", "Unreal", "Gameplay"] },
  { slug: "ecommerce", name: "Ecommerce", description: "Store setup, catalog ops, and conversion optimization.", tags: ["Shopify", "WooCommerce", "CRO"] },
  { slug: "business-consulting", name: "Business Consulting", description: "Strategy, operations, and go-to-market advisory.", tags: ["Strategy", "Ops", "GTM"] },
  { slug: "software-testing", name: "Software Testing", description: "QA automation, manual testing, and release validation.", tags: ["QA", "Automation", "Regression"] },
  { slug: "cloud-engineering", name: "Cloud Engineering", description: "AWS, Azure, GCP architecture and managed cloud ops.", tags: ["AWS", "Azure", "GCP"] },
  { slug: "technical-writing", name: "Technical Writing", description: "Documentation, API references, and developer guides.", tags: ["Docs", "API", "Guides"] },
  { slug: "audio-production", name: "Audio Production", description: "Podcast editing, sound design, and music production.", tags: ["Mixing", "Mastering", "Podcasts"] },
  { slug: "branding", name: "Branding", description: "Brand strategy, voice, and visual identity systems.", tags: ["Identity", "Guidelines", "Positioning"] }
];

export function getCategoryBySlug(slug: string) {
  return MARKETPLACE_CATEGORIES.find((c) => c.slug === slug);
}
