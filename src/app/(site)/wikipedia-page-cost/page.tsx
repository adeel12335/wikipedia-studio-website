import type { Metadata } from "next";
import Link from "next/link";
import { BodyClass } from "@/components/layout/BodyClass";
import { PricingTrackLink } from "@/components/pricing/PricingTrackLink";
import { JsonLd } from "@/components/seo/JsonLd";
import { CtaBand } from "@/components/ui/CtaBand";
import { FaqList } from "@/components/ui/FaqList";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { absUrl, url } from "@/lib/config";
import {
  comparisonRows,
  costDrivers,
  notIncluded,
  paymentSteps,
  pricingAddOns,
  pricingFaqs,
  pricingTiers,
} from "@/lib/data/pricing";
import { buildPageMetadata, faqNode, seoId } from "@/lib/seo";

const pageSlug = "wikipedia-page-cost";
const pageUrl = absUrl(pageSlug);

const offerNodes = pricingTiers.map((tier) => ({
  "@type": "Offer",
  name: tier.name,
  description: `${tier.bestFor}. ${tier.features.sources}. ${tier.features.editors}.${
    tier.features.monitoring ? ` ${tier.features.monitoring} monitoring.` : ""
  }`,
  priceSpecification: {
    "@type": "PriceSpecification",
    price: String(tier.price),
    priceCurrency: "USD",
    valueAddedTaxIncluded: false,
  },
  availability: "https://schema.org/InStock",
  url: `${pageUrl}#${tier.id}`,
}));

const pageMeta = {
  slug: pageSlug,
  title: "Wikipedia Page Cost: Pricing & Packages (2026)",
  shortTitle: "Pricing",
  breadcrumbName: "Pricing",
  description:
    "What a Wikipedia page actually costs, what drives the price, and our three published tiers from $700. Free notability assessment first — we tell you if the sources aren't there.",
  keywords:
    "wikipedia page creation cost, wikipedia page cost, how much does a wikipedia page cost, wikipedia page price, wikipedia editing cost, wikipedia agency pricing",
  ogImage: "/assets/og/reference-dark.jpg",
  ogImageAlt: "Wikipedia page cost and pricing packages from The Wikipedia Studio",
  modified: "2026-09-03",
  schema: [
    {
      "@type": "Service",
      "@id": `${pageUrl}#service`,
      name: "Wikipedia Page Creation",
      serviceType: "Wikipedia page creation and editing",
      provider: { "@id": seoId("organization") },
      areaServed: { "@type": "Place", name: "Worldwide" },
      description:
        "Guideline-compliant Wikipedia page creation with notability assessment, independent source research, neutral drafting, disclosed submission and post-publication monitoring.",
      offers: offerNodes,
    },
    {
      "@type": "Service",
      "@id": `${pageUrl}#management`,
      name: "Ongoing Wikipedia Page Management",
      provider: { "@id": seoId("organization") },
      description:
        "Watchlist monitoring, incoming-edit assessment, milestone updates, dead-link repair and quarterly reporting.",
      offers: {
        "@type": "Offer",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "250",
          priceCurrency: "USD",
          unitCode: "MON",
          billingIncrement: 1,
        },
      },
    },
    faqNode([...pricingFaqs], pageSlug),
  ],
};

export const metadata: Metadata = buildPageMetadata(pageMeta);

export default function WikipediaPageCostPage() {
  return (
    <>
      <BodyClass className="page-pricing" />
      <JsonLd page={pageMeta} />
      <PageHero
        eyebrow="Pricing"
        h1="What a Wikipedia page costs — and what actually <span>drives the price</span>"
        lede="Professional Wikipedia page creation typically costs between $700 and $2,500, depending on how much independent coverage exists about the subject and how much verification that coverage demands. Our published tiers start at $700 for straightforward subjects and $1,800 for complex or previously rejected ones. Every engagement begins with a free notability assessment."
        current="Pricing"
        actions={[
          {
            label: "Request a free notability assessment",
            href: url("contact"),
          },
          {
            label: "See what's included",
            href: `${url(pageSlug)}#packages`,
            style: "button-outline",
          },
        ]}
        image="/assets/og/reference-dark.jpg"
        imageWidth={1200}
        imageHeight={630}
        visualClass="page-hero-visual--archive"
      />

      <section className="section-pad" aria-labelledby="why-price-varies">
        <div className="shell definition-grid">
          <div className="reveal">
            <p className="micro-label">Why It Varies</p>
            <h2 id="why-price-varies">Why the price varies at all</h2>
            <p className="definition-copy">
              Pricing a Wikipedia article by word count makes no sense, because the
              writing is the small part. Roughly two thirds of the work happens before
              a single sentence is drafted, in the search for significant coverage
              published by sources independent of the subject.
            </p>
            <p className="definition-copy">
              A founder with fifteen years of scattered trade-press mentions takes far
              longer to source properly than a subject with three strong national
              profiles — even though the finished articles look similar in length. That
              research burden is what the tiers reflect.
            </p>
            <p className="definition-copy">
              The assessment tells us which tier applies. The figure is then fixed in
              writing before any work is commissioned.
            </p>
            <Link className="text-link" href={url("our-process")}>
              See how the editorial process runs <Icon name="i-arrow" />
            </Link>
          </div>
          <aside className="who-panel reveal" data-delay="100">
            <h3>Payment terms</h3>
            <ul className="check-list compact">
              <li>
                <Icon name="i-check" />
                Notability assessment: free, no commitment
              </li>
              <li>
                <Icon name="i-check" />
                50% at engagement start, 50% on draft submission
              </li>
              <li>
                <Icon name="i-check" />
                Quote fixed in writing after scope is agreed
              </li>
              <li>
                <Icon name="i-check" />
                No charge for approval — approval is not sold
              </li>
            </ul>
            <p className="reviewed-note">
              Priced in USD. Billed in your local currency at the prevailing rate when
              needed.
            </p>
          </aside>
        </div>
      </section>

      <section className="section-pad" aria-labelledby="cost-drivers">
        <div className="shell">
          <SectionHeading
            eyebrow="Cost Drivers"
            heading="What drives the cost up or down"
          />
          <div className="pricing-table-wrap reveal">
            <table className="pricing-table">
              <caption className="sr-only">
                Factors that push Wikipedia page creation cost down or up
              </caption>
              <thead>
                <tr>
                  <th scope="col">Factor</th>
                  <th scope="col">Pushes cost down</th>
                  <th scope="col">Pushes cost up</th>
                </tr>
              </thead>
              <tbody>
                {costDrivers.map((row) => (
                  <tr key={row.factor}>
                    <th scope="row">{row.factor}</th>
                    <td data-label="Pushes cost down">{row.down}</td>
                    <td data-label="Pushes cost up">{row.up}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section-pad" id="packages" aria-labelledby="packages-heading">
        <div className="shell">
          <SectionHeading
            eyebrow="Our Packages"
            heading="Published tiers, fixed after assessment"
          />
          <p className="pricing-intro reveal" id="packages-heading">
            Every engagement starts from one of these published tiers. Which one applies
            depends on how much source material exists and how much verification it
            demands — decided by the notability assessment, not by guesswork.
          </p>

          <div className="pricing-tier-grid reveal">
            {pricingTiers.map((tier) => (
              <article
                key={tier.id}
                id={tier.id}
                className={`pricing-tier-card${tier.badge ? " is-featured" : ""}`}
              >
                {tier.badge ? (
                  <span className="pricing-tier-badge">{tier.badge}</span>
                ) : null}
                <p className="micro-label">{tier.name}</p>
                <h3>{tier.priceLabel}</h3>
                <p className="pricing-tier-blurb">{tier.blurb}</p>
                <ul className="check-list compact">
                  <li>
                    <Icon name="i-check" />
                    {tier.features.sources}
                  </li>
                  <li>
                    <Icon name="i-check" />
                    {tier.features.editors}
                  </li>
                  {tier.features.monitoring ? (
                    <li>
                      <Icon name="i-check" />
                      {tier.features.monitoring} monitoring
                    </li>
                  ) : null}
                  <li>
                    <Icon name="i-check" />
                    {tier.features.revisions}
                  </li>
                </ul>
                <PricingTrackLink
                  className={`button button-small ${tier.badge ? "button-gold" : "button-outline"}`}
                  href={url("contact")}
                  event="pricing_tier_click"
                  tier={tier.name}
                >
                  Start with assessment <Icon name="i-arrow" />
                </PricingTrackLink>
              </article>
            ))}
          </div>

          <div className="pricing-table-wrap reveal" data-delay="80">
            <table className="pricing-table pricing-table--compare">
              <caption className="sr-only">
                Full package comparison for Essential, Standard, Comprehensive and Custom
              </caption>
              <thead>
                <tr>
                  <th scope="col">Included</th>
                  {pricingTiers.map((tier) => (
                    <th key={tier.id} scope="col">
                      {tier.name}
                      <span className="pricing-th-price">{tier.priceLabel}</span>
                      {tier.badge ? (
                        <span className="pricing-th-badge">{tier.badge}</span>
                      ) : null}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    {row.values.map((value, index) => (
                      <td
                        key={`${row.label}-${pricingTiers[index].id}`}
                        data-label={`${pricingTiers[index].name} · ${pricingTiers[index].priceLabel}`}
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section-pad" aria-labelledby="addons-heading">
        <div className="shell">
          <SectionHeading eyebrow="Add-ons" heading="Optional work beyond the package" />
          <div className="pricing-table-wrap reveal">
            <table className="pricing-table">
              <caption className="sr-only" id="addons-heading">
                Optional Wikipedia services and retainer pricing
              </caption>
              <thead>
                <tr>
                  <th scope="col">Service</th>
                  <th scope="col">Price</th>
                  <th scope="col">Note</th>
                </tr>
              </thead>
              <tbody>
                {pricingAddOns.map((item) => (
                  <tr key={item.name}>
                    <th scope="row">{item.name}</th>
                    <td data-label="Price">{item.price}</td>
                    <td data-label="Note">{item.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section-pad" aria-labelledby="not-included">
        <div className="shell">
          <SectionHeading
            eyebrow="Honest Limits"
            heading="What is not included at any price"
          />
          <div className="card-grid reveal" id="not-included">
            {notIncluded.map((item) => (
              <article key={item.title} className="service-card">
                <Icon name="i-shield" />
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad" aria-labelledby="money-work">
        <div className="shell split-grid">
          <div className="reveal">
            <p className="micro-label">How It Lines Up</p>
            <h2 id="money-work">How the money and the work line up</h2>
            <ol className="numbered-steps">
              {paymentSteps.map((step) => (
                <li key={step.title}>
                  <strong>{step.title}.</strong> {step.copy}
                </li>
              ))}
            </ol>
            <Link className="text-link" href={url("faq")}>
              More answers in the FAQ <Icon name="i-arrow" />
            </Link>
          </div>
          <div className="reveal" data-delay="100">
            <p className="micro-label">Cheaper Options</p>
            <h2>Is a cheaper Wikipedia page worth it?</h2>
            <p className="definition-copy">
              Below roughly $500, something is usually being skipped — normally the
              source research, occasionally the disclosure. Both create the same
              outcome: a draft that reads well, fails review, and leaves the subject
              with a rejection on record that makes the next attempt harder.
            </p>
            <p className="definition-copy">
              The cheapest genuinely useful thing we offer is the notability
              assessment, and it is free. If the coverage is not there yet, that answer
              saves you the entire budget.
            </p>
            <Link
              className="text-link"
              href={url("services/wikipedia-page-creation")}
            >
              Read about page creation <Icon name="i-arrow" />
            </Link>
          </div>
        </div>
      </section>

      <section className="section-pad" aria-labelledby="management-heading">
        <div className="shell definition-grid">
          <div className="reveal">
            <p className="micro-label">After Publication</p>
            <h2 id="management-heading">Ongoing page management</h2>
            <p className="definition-copy">
              Publication is not the end. Articles get edited by anyone, milestones go
              stale, and links rot.
            </p>
            <p className="definition-copy">
              <strong>$250/month or $2,500/year</strong> covers watchlist monitoring,
              assessment of incoming edits, milestone updates drawn from independent
              sources, dead-link repair, and a quarterly report in plain language
              explaining what changed and why.
            </p>
            <Link
              className="text-link"
              href={url("services/wikipedia-page-management")}
            >
              How ongoing management works <Icon name="i-arrow" />
            </Link>
          </div>
          <aside className="who-panel reveal" data-delay="100">
            <h3>Do you need a retainer?</h3>
            <p>
              You need it if the subject is active enough that facts change or the
              article attracts edits. If neither is true, a page can sit stable for
              years without it — and we will say so rather than sell you a retainer.
            </p>
          </aside>
        </div>
      </section>

      <section className="section-pad" aria-labelledby="pricing-faq">
        <div className="shell faq-library">
          <div className="faq-library-intro reveal">
            <p className="micro-label">Pricing FAQ</p>
            <h2 id="pricing-faq">
              Straight answers on <span>cost and payment.</span>
            </h2>
            <p>
              If a quote elsewhere looks dramatically cheaper, ask what proportion of
              the fee covers independent source research before drafting starts.
            </p>
            <PricingTrackLink
              className="text-link"
              href={url("contact")}
              event="pricing_cta_click"
            >
              Request a free assessment <Icon name="i-arrow" />
            </PricingTrackLink>
          </div>
          <div className="faq-wide">
            <FaqList items={[...pricingFaqs]} wide />
          </div>
        </div>
      </section>

      <CtaBand
        heading="Start with the assessment, <span>not the invoice.</span>"
        copy="Bring the strongest independent coverage you have. We will tell you which tier applies — or that a page is not realistic yet."
        label="Request a free notability assessment"
      />
    </>
  );
}
