<?php
/**
 * Closing layout: site footer and the single page script.
 */

declare(strict_types=1);

if (!defined("APP_ROOT")) {
    http_response_code(403);
    exit("Direct access is not permitted.");
}

$footerServices = services();
?>
  </main>

  <footer class="site-footer">
    <div class="shell footer-grid">
      <div class="footer-brand">
        <a class="brand" href="<?= e(url()) ?>" aria-label="<?= e(SITE_NAME) ?> home">
          <img src="<?= e(asset('assets/globe-small.png')) ?>" alt="" width="66" height="55">
          <span class="brand-copy"><b>The Wikipedia</b><span><i></i>Studio<i></i></span></span>
        </a>
        <p>We craft credible, authoritative, and impactful Wikipedia pages that elevate your presence or brand reputation worldwide.</p>
        <div class="socials">
          <a href="<?= e(url('contact')) ?>" aria-label="Facebook">f</a>
          <a href="<?= e(url('contact')) ?>" aria-label="LinkedIn">in</a>
          <a href="<?= e(url('contact')) ?>" aria-label="Instagram">◎</a>
          <a href="<?= e(url('contact')) ?>" aria-label="X">x</a>
        </div>
      </div>

      <div class="footer-column footer-links">
        <h3>Quick Links</h3>
        <?php /* Prefixed names: partials share the including page's scope. */ ?>
        <?php foreach (nav_items() as $footerNavItem): ?>
          <a href="<?= e(url($footerNavItem['slug'])) ?>"><?= e($footerNavItem['label']) ?></a>
        <?php endforeach; ?>
      </div>

      <div class="footer-column footer-services">
        <h3>Services</h3>
        <?php foreach ($footerServices as $footerSlug => $footerService): ?>
          <a href="<?= e(url('services/' . $footerSlug)) ?>"><?= e($footerService['name']) ?></a>
        <?php endforeach; ?>
      </div>

      <div class="footer-column footer-contact">
        <h3>Contact Us</h3>
        <a href="mailto:<?= e(SITE_EMAIL) ?>"><?= e(SITE_EMAIL) ?></a>
        <a href="tel:<?= e(SITE_PHONE_RAW) ?>"><?= e(SITE_PHONE) ?></a>
        <span>Worldwide Services</span>
        <span>Mon–Fri, 9:00 AM–6:00 PM</span>
      </div>
    </div>

    <div class="shell footer-bottom">
      <p>© <span id="year"><?= date('Y') ?></span> <?= e(SITE_NAME) ?>. All Rights Reserved.</p>
      <div>
        <a href="<?= e(url('privacy-policy')) ?>">Privacy Policy</a>
        <a href="<?= e(url('terms-conditions')) ?>">Terms &amp; Conditions</a>
      </div>
    </div>
  </footer>

  <script src="<?= e(asset('script.js', true)) ?>"></script>
</body>
</html>
