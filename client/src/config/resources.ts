export interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  category: "tools" | "learning" | "integrations" | "services";
  ctaLabel?: string;
}

export const RESOURCES: Resource[] = [
  // FP&A Tools
  {
    id: "excel",
    title: "Microsoft Excel",
    description: "The industry-standard spreadsheet tool for financial modeling and analysis. Perfect for exporting MyFPnA data for advanced custom calculations.",
    url: "https://www.microsoft.com/en-us/microsoft-365/excel",
    category: "tools",
    ctaLabel: "Learn More",
  },
  {
    id: "quickbooks",
    title: "QuickBooks",
    description: "Leading accounting software for small businesses. Integrate your actuals data seamlessly with MyFPnA for real-time variance analysis.",
    url: "https://quickbooks.intuit.com/",
    category: "integrations",
    ctaLabel: "Explore Integration",
  },
  {
    id: "xero",
    title: "Xero",
    description: "Beautiful accounting software for small businesses. Connect Xero to automatically import actual spending into your MyFPnA scenarios.",
    url: "https://www.xero.com/",
    category: "integrations",
    ctaLabel: "Connect Now",
  },
  
  // Learning Resources
  {
    id: "fp-a-course",
    title: "FP&A Fundamentals Course",
    description: "Master financial planning and analysis with this comprehensive online course. Learn budgeting, forecasting, and variance analysis from industry experts.",
    url: "https://www.coursera.org/learn/financial-planning-and-analysis",
    category: "learning",
    ctaLabel: "Start Learning",
  },
  {
    id: "financial-modeling",
    title: "Financial Modeling Best Practices",
    description: "Free guide to building robust financial models. Learn the principles that power MyFPnA's AI forecasting engine.",
    url: "https://www.wallstreetprep.com/knowledge/financial-modeling/",
    category: "learning",
    ctaLabel: "Read Guide",
  },
  
  // Services
  {
    id: "fractional-cfo",
    title: "Fractional CFO Services",
    description: "Get expert financial leadership without the full-time cost. Perfect for startups using MyFPnA who need strategic guidance.",
    url: "https://www.toptal.com/finance/fractional-cfos",
    category: "services",
    ctaLabel: "Find a CFO",
  },
  {
    id: "bookkeeping",
    title: "Professional Bookkeeping",
    description: "Outsource your bookkeeping to focus on strategy. Clean books make MyFPnA forecasts more accurate and actionable.",
    url: "https://www.bench.co/",
    category: "services",
    ctaLabel: "Get Started",
  },
  
  // Additional Tools
  {
    id: "tableau",
    title: "Tableau",
    description: "Advanced data visualization platform. Export MyFPnA data to create stunning executive dashboards and presentations.",
    url: "https://www.tableau.com/",
    category: "tools",
    ctaLabel: "Try Tableau",
  },
  {
    id: "stripe",
    title: "Stripe",
    description: "Payment processing for internet businesses. Track revenue in MyFPnA and reconcile with Stripe for accurate forecasting.",
    url: "https://stripe.com/",
    category: "integrations",
    ctaLabel: "View Integration",
  },
];

export const RESOURCE_CATEGORIES = {
  tools: {
    label: "Tools & Software",
    description: "Complementary tools that work great with MyFPnA",
  },
  learning: {
    label: "Learning Resources",
    description: "Courses and guides to level up your FP&A skills",
  },
  integrations: {
    label: "Integrations",
    description: "Connect your favorite tools to MyFPnA",
  },
  services: {
    label: "Professional Services",
    description: "Expert help for your financial planning needs",
  },
};
