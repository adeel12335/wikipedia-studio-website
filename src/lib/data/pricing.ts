export const PRICING_CURRENCY = "USD" as const;

export const pricingTiers = [
  {
    id: "essential",
    name: "Essential",
    price: 700,
    priceLabel: "From $700",
    badge: null as string | null,
    bestFor: "Straightforward subjects with clear, easy-to-find coverage",
    blurb: "For subjects where the coverage is already clear and easy to verify.",
    features: {
      assessment: true,
      sources: "Up to 12 sources",
      length: "800–1,200 words",
      editors: "1 editor + review pass",
      references: "Reference formatting",
      infobox: "Basic",
      images: false,
      wikidata: false,
      disclosure: true,
      revisions: "2 rounds",
      talkPage: false,
      monitoring: false as string | false,
      language: false,
      report: "Written notability report",
    },
  },
  {
    id: "standard",
    name: "Standard",
    price: 1100,
    priceLabel: "From $1,100",
    badge: "Most chosen",
    bestFor:
      "Founders, executives, companies with solid multi-source coverage",
    blurb: "The tier most engagements land in.",
    features: {
      assessment: true,
      sources: "Up to 25 sources",
      length: "1,500–2,000 words",
      editors: "2 editors (drafting + independent claim check)",
      references: "Reference formatting + archived links",
      infobox: "Full",
      images: true,
      wikidata: true,
      disclosure: true,
      revisions: "4 rounds",
      talkPage: true,
      monitoring: "30 days",
      language: false,
      report: "Written notability report",
    },
  },
  {
    id: "comprehensive",
    name: "Comprehensive",
    price: 1800,
    priceLabel: "From $1,800",
    badge: null as string | null,
    bestFor:
      "Previously rejected subjects, thin-but-workable sourcing, complex histories",
    blurb:
      "For subjects that have been rejected before, or where the sourcing needs real digging.",
    features: {
      assessment: true,
      sources: "Unlimited, incl. paywalled archives, books, journals",
      length: "2,500+ words",
      editors: "Senior editor lead + 2nd editor + compliance review",
      references: "Archived links + citation map",
      infobox: "Full",
      images: true,
      wikidata: true,
      disclosure: true,
      revisions: "6 rounds",
      talkPage: true,
      monitoring: "2 months",
      language: "1 included",
      report: "Report + gap plan if not yet notable",
    },
  },
  {
    id: "custom",
    name: "Custom",
    price: 2500,
    priceLabel: "From $2,500",
    badge: null as string | null,
    bestFor:
      "Contested subjects, prior AfD, multi-language, corporate groups",
    blurb:
      "For contested subjects, corporate groups, or multi-language rollouts.",
    features: {
      assessment: true,
      sources: "Unlimited + specialist research",
      length: "Scoped",
      editors: "Full team",
      references: "Full citation handling",
      infobox: "Full",
      images: true,
      wikidata: true,
      disclosure: true,
      revisions: "Unlimited before publishing, plus unlimited rounds on edits after publishing",
      talkPage: true,
      monitoring: "4 months",
      language: "Scoped",
      report: "Written notability report",
    },
  },
] as const;

export const pricingAddOns = [
  {
    name: "Ongoing Page Management",
    price: "$250/month or $2,500/year",
    note: "Watchlist monitoring, incoming-edit assessment, milestone updates, dead-link repair, quarterly report.",
  },
  {
    name: "Existing page editing & expansion",
    price: "From $450",
    note: "Scope depends on article state.",
  },
  {
    name: "Additional language version",
    price: "$400 each",
    note: "Beyond any language version already included in your tier.",
  },
  {
    name: "Wikidata entry only",
    price: "$250",
    note: "Standalone structured-data entry.",
  },
  {
    name: "Deletion (AfD) response & defence",
    price: "From $600",
    note: "Outcome never guaranteed.",
  },
  {
    name: "Rush handling",
    price: "+25%",
    note: "Drafting timeline only — the review queue is outside our control.",
  },
] as const;

export const costDrivers = [
  {
    factor: "Source availability",
    down: "Several substantial pieces in established national or trade outlets",
    up: "Coverage scattered across many thin mentions, or mostly paywalled",
  },
  {
    factor: "Source accessibility",
    down: "Openly available online",
    up: "Print archives, books, subscription databases, non-English sources",
  },
  {
    factor: "Subject history",
    down: "No prior Wikipedia activity",
    up: "Previous draft rejected, page deleted, or an active dispute",
  },
  {
    factor: "Subject type",
    down: "Clear-cut subject-specific guideline (author, academic, musician)",
    up: "Company or founder, where notability is judged more strictly",
  },
  {
    factor: "Controversy in sources",
    down: "Coverage is factual and consistent",
    up: "Sources disagree, or include material the subject would rather omit",
  },
  {
    factor: "Languages",
    down: "English only",
    up: "Additional language versions",
  },
] as const;

export const notIncluded = [
  {
    title: "A guaranteed approval",
    copy: "Volunteer reviewers decide, and no agency controls them. Anyone charging for a guarantee is charging for something they cannot deliver.",
  },
  {
    title: "A page that says only what you want it to say",
    copy: "The article reflects what independent sources published, including anything unflattering they covered.",
  },
  {
    title: "Removal of accurate, sourced information",
    copy: "From an existing article — properly sourced criticism stays.",
  },
  {
    title: "Undisclosed paid editing",
    copy: "Wikipedia's terms of use require paid contributors to declare their client and affiliation. We declare it as a matter of course.",
  },
  {
    title: "A page for a subject that is not notable yet",
    copy: "If the coverage is not there, we say so at the assessment stage and you pay nothing.",
  },
] as const;

export const paymentSteps = [
  {
    title: "Free notability assessment",
    copy: "We search for independent coverage and give you a written verdict, usually within a few days. No cost, no commitment.",
  },
  {
    title: "Tier and quote confirmed in writing",
    copy: "Scope, structure and source list agreed before anything starts.",
  },
  {
    title: "50% to begin",
    copy: "Research and drafting run for three to six weeks.",
  },
  {
    title: "50% on submission",
    copy: "The draft goes to review with full paid-contribution disclosure.",
  },
  {
    title: "Reviewer feedback handled",
    copy: "On its merits, at no extra charge, within your tier.",
  },
  {
    title: "Monitoring period begins",
    copy: "On acceptance, for the duration included in your package.",
  },
] as const;

export const pricingFaqs = [
  {
    q: "How much does it cost to create a Wikipedia page?",
    a: "Our engagements start at $700 for straightforward subjects and run to $1,800 for complex or previously rejected ones, with custom scoping above that. The figure depends on how much independent coverage exists and how much verification it requires, which the free notability assessment establishes before you commit.",
  },
  {
    q: "Why do Wikipedia agencies charge such different prices?",
    a: "Because they are pricing different work. Some price the writing, which is the small part. Some price the research, which is most of it. And some price a guaranteed outcome, which nobody can actually deliver. Ask any agency what proportion of the fee covers source research before you compare quotes.",
  },
  {
    q: "Do you charge for the notability assessment?",
    a: "No. The assessment is free and comes with a written verdict. If the independent coverage is not there, we tell you before any work is commissioned and you pay nothing.",
  },
  {
    q: "Do I pay again if the page is rejected at review?",
    a: "No. Reviewer-feedback revisions are included in your tier — 2 rounds on Essential, 4 on Standard, 6 on Comprehensive. On Custom, we keep responding to reviewer comments until the article is accepted or a genuine blocker is documented in writing, with unlimited rounds on edits after publishing too.",
  },
  {
    q: "Is there a refund if the page is never published?",
    a: "We do not refund research that was properly done — the notability report and source pack are real deliverables you keep. What we do instead is prevent that situation at the assessment stage, which is exactly why the assessment is free and honest.",
  },
  {
    q: "How long does it take?",
    a: "Research and drafting take three to six weeks. The review queue that follows belongs to volunteer reviewers and can clear in days or run to several months. No agency can shorten that queue, and any promised publication date should be treated with suspicion.",
  },
  {
    q: "Do you offer payment plans?",
    a: "Engagements are split 50% at the start and 50% on submission as standard. For Comprehensive and Custom tiers we can stage payments across the research and drafting milestones.",
  },
  {
    q: "What does ongoing management cost, and do I need it?",
    a: "$250 a month or $2,500 a year. You need it if the subject is active enough that facts change or the article attracts edits. If neither is true, a page can sit stable for years without it, and we will say so rather than sell you a retainer.",
  },
  {
    q: "Can I pay you to remove something from my Wikipedia page?",
    a: "Not if it is accurate and properly sourced. We can correct genuine factual errors, add missing context from independent sources, and address undue weight through the proper channels. Paying anyone to scrub sourced material is how accounts and pages get burned.",
  },
] as const;

/** Rows for the HTML comparison table (SEO / LLM extractable). */
export const comparisonRows: Array<{
  label: string;
  values: [string, string, string, string];
}> = [
  {
    label: "Best for",
    values: [
      pricingTiers[0].bestFor,
      pricingTiers[1].bestFor,
      pricingTiers[2].bestFor,
      pricingTiers[3].bestFor,
    ],
  },
  {
    label: "Free notability assessment",
    values: ["Yes", "Yes", "Yes", "Yes"],
  },
  {
    label: "Independent source research",
    values: [
      pricingTiers[0].features.sources,
      pricingTiers[1].features.sources,
      pricingTiers[2].features.sources,
      pricingTiers[3].features.sources,
    ],
  },
  {
    label: "Article length (typical)",
    values: [
      pricingTiers[0].features.length,
      pricingTiers[1].features.length,
      pricingTiers[2].features.length,
      pricingTiers[3].features.length,
    ],
  },
  {
    label: "Editors on the file",
    values: [
      pricingTiers[0].features.editors,
      pricingTiers[1].features.editors,
      pricingTiers[2].features.editors,
      pricingTiers[3].features.editors,
    ],
  },
  {
    label: "Reference formatting",
    values: [
      pricingTiers[0].features.references,
      pricingTiers[1].features.references,
      pricingTiers[2].features.references,
      pricingTiers[3].features.references,
    ],
  },
  {
    label: "Infobox & sections",
    values: [
      pricingTiers[0].features.infobox,
      pricingTiers[1].features.infobox,
      pricingTiers[2].features.infobox,
      pricingTiers[3].features.infobox,
    ],
  },
  {
    label: "Images / Commons licensing",
    values: ["—", "Where permitted", "Where permitted", "Where permitted"],
  },
  {
    label: "Wikidata entry",
    values: ["—", "Yes", "Yes", "Yes"],
  },
  {
    label: "Paid-contribution disclosure",
    values: ["Yes", "Yes", "Yes", "Yes"],
  },
  {
    label: "Reviewer-feedback revisions",
    values: [
      pricingTiers[0].features.revisions,
      pricingTiers[1].features.revisions,
      pricingTiers[2].features.revisions,
      pricingTiers[3].features.revisions,
    ],
  },
  {
    label: "Talk-page / COI engagement",
    values: ["—", "Yes", "Yes", "Yes"],
  },
  {
    label: "Post-publication monitoring",
    values: [
      "—",
      pricingTiers[1].features.monitoring,
      pricingTiers[2].features.monitoring,
      pricingTiers[3].features.monitoring,
    ],
  },
  {
    label: "Additional language version",
    values: [
      "—",
      "—",
      String(pricingTiers[2].features.language),
      String(pricingTiers[3].features.language),
    ],
  },
  {
    label: "Written notability report",
    values: [
      pricingTiers[0].features.report,
      pricingTiers[1].features.report,
      pricingTiers[2].features.report,
      pricingTiers[3].features.report,
    ],
  },
];
