<?php
/**
 * Reusable view partials shared across pages.
 *
 * Headings marked "trusted markup" accept a small amount of authored HTML (a
 * <span> to gold-highlight part of a heading). Those strings come from this
 * repository only — never from request data.
 */

declare(strict_types=1);

/**
 * Month and year the site copy was last edited, taken from the content file's
 * modification time so the visible freshness signal cannot drift from reality.
 */
function last_reviewed(): string
{
    $file = __DIR__ . '/data.php';

    return date('F Y', is_file($file) ? (int) filemtime($file) : time());
}

/** Render one icon from the inline symbol library. */
function icon(string $id, string $class = ''): string
{
    $classAttr = $class !== '' ? ' class="' . e($class) . '"' : '';

    return '<svg' . $classAttr . ' aria-hidden="true"><use href="#' . e($id) . '"/></svg>';
}

/**
 * Visible breadcrumb trail. Mirrors the BreadcrumbList structured data so users
 * and crawlers see the same hierarchy.
 *
 * @param array<int, array{label: string, slug: string}> $crumbs
 */
function breadcrumb_trail(array $crumbs, string $current): void
{
    if ($crumbs === []) {
        return;
    }
    ?>
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <ol>
        <li><a href="<?= e(url()) ?>">Home</a></li>
        <?php foreach ($crumbs as $crumb): ?>
          <li><a href="<?= e(url((string) $crumb['slug'])) ?>"><?= e($crumb['label']) ?></a></li>
        <?php endforeach; ?>
        <li><span aria-current="page"><?= e($current) ?></span></li>
      </ol>
    </nav>
    <?php
}

/**
 * Compact hero for inner pages.
 *
 * @param array{eyebrow?: string, h1: string, lede?: string, breadcrumbs?: array, current?: string, actions?: array<int, array{label: string, href: string, style?: string}>} $args
 */
function page_hero(array $args): void
{
    ?>
    <section class="page-hero" aria-labelledby="page-title">
      <div class="page-hero-glow" aria-hidden="true"></div>
      <div class="shell">
        <?php breadcrumb_trail((array) ($args['breadcrumbs'] ?? []), (string) ($args['current'] ?? '')); ?>
        <div class="page-hero-layout">
          <div class="page-hero-copy">
            <?php if (!empty($args['eyebrow'])): ?>
              <p class="micro-label"><?= e($args['eyebrow']) ?></p>
            <?php endif; ?>
            <h1 id="page-title"><?= $args['h1'] /* trusted markup */ ?></h1>
            <?php if (!empty($args['lede'])): ?>
              <p class="page-hero-lede"><?= e($args['lede']) ?></p>
            <?php endif; ?>
            <?php if (!empty($args['actions'])): ?>
              <div class="hero-actions">
                <?php foreach ($args['actions'] as $action): ?>
                  <a class="button <?= e($action['style'] ?? 'button-gold') ?> magnetic" href="<?= e($action['href']) ?>">
                    <?= e($action['label']) ?> <?= icon('i-arrow') ?>
                  </a>
                <?php endforeach; ?>
              </div>
            <?php endif; ?>
          </div>
          <div class="page-hero-visual" aria-hidden="true">
            <span class="page-hero-orbit orbit-one"></span>
            <span class="page-hero-orbit orbit-two"></span>
            <img src="<?= e(asset('assets/globe.png')) ?>" alt="" width="720" height="596">
            <i class="page-hero-rule"></i>
          </div>
        </div>
      </div>
    </section>
    <?php
}

/** One service card, linking through to its detail page. */
function service_card(string $slug, array $service): void
{
    ?>
    <article class="service-card">
      <?= icon($service['icon'], 'card-icon') ?>
      <h3><a href="<?= e(url('services/' . $slug)) ?>"><?= e($service['name']) ?></a></h3>
      <p><?= e($service['card']) ?></p>
      <a href="<?= e(url('services/' . $slug)) ?>">Learn More <?= icon('i-arrow') ?></a>
    </article>
    <?php
}

/** Centred section heading used above card grids. */
function section_heading(string $eyebrow, string $heading, ?string $copy = null): void
{
    ?>
    <div class="section-heading center reveal">
      <p class="micro-label"><?= e($eyebrow) ?></p>
      <h2><?= $heading /* trusted markup */ ?></h2>
      <?php if ($copy !== null): ?>
        <p class="section-heading-copy"><?= e($copy) ?></p>
      <?php endif; ?>
    </div>
    <?php
}

/** Closing call-to-action band, reused at the foot of most pages. */
function cta_band(
    string $heading = 'Ready to Build Your <span>Wikipedia Presence?</span>',
    string $copy = 'Let our experts help you establish credibility and create a lasting impact on Wikipedia.',
    string $label = 'Get Started Today',
    string $href = ''
): void {
    $href = $href !== '' ? $href : url('contact');
    ?>
    <section class="contact" id="contact">
      <div class="shell contact-panel reveal">
        <img class="contact-art" src="<?= e(asset('assets/globe.png')) ?>" alt="" aria-hidden="true" width="720" height="596">
        <div class="contact-copy">
          <h2><?= $heading /* trusted markup */ ?></h2>
          <p><?= e($copy) ?></p>
        </div>
        <a class="button button-gold magnetic" href="<?= e($href) ?>"><?= e($label) ?> <?= icon('i-arrow') ?></a>
      </div>
    </section>
    <?php
}

/** Testimonial carousel section, shared by the home and about pages. */
function testimonial_section(): void
{
    $items = testimonials();
    $first = $items[0];
    ?>
    <section class="testimonials section-pad" aria-labelledby="testimonial-title">
      <div class="shell">
        <div class="section-heading testimonial-heading reveal">
          <p class="micro-label">Client Testimonials</p>
          <h2 id="testimonial-title">What Our Clients Say</h2>
        </div>
        <div class="testimonial-stage reveal">
          <img class="testimonial-orb" src="<?= e(asset('assets/globe-small.png')) ?>" alt="" aria-hidden="true">
          <button class="round-arrow previous" id="testimonialPrev" type="button" aria-label="Previous testimonial"><?= icon('i-arrow') ?></button>
          <div class="testimonial-window" id="testimonialWindow" aria-live="polite">
            <blockquote>“<?= e($first['quote']) ?>”</blockquote>
            <div><strong><?= e($first['name']) ?></strong><span><?= e($first['role']) ?></span></div>
          </div>
          <button class="round-arrow next" id="testimonialNext" type="button" aria-label="Next testimonial"><?= icon('i-arrow') ?></button>
          <div class="testimonial-progress" aria-hidden="true">
            <span id="testimonialCurrent">01</span><i></i><span><?= str_pad((string) count($items), 2, '0', STR_PAD_LEFT) ?></span>
          </div>
        </div>
        <div class="rail-dots testimonial-dots" id="testimonialDots" aria-label="Testimonials"></div>
      </div>
    </section>
    <?php
}

/**
 * Accordion FAQ list.
 *
 * @param array<int, array{q: string, a: string}> $items
 */
function faq_list(array $items): void
{
    foreach ($items as $item) : ?>
      <div class="faq-item">
        <button class="faq-question" type="button" aria-expanded="false"><?= e($item['q']) ?><span>+</span></button>
        <p class="faq-answer" hidden><?= e($item['a']) ?></p>
      </div>
    <?php endforeach;
}
