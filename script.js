(() => {
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Navigation
  const header = $('.site-header');
  const menuButton = $('.menu-toggle');
  const mobileMenu = $('.mobile-menu');

  function setMenu(open) {
    menuButton?.setAttribute('aria-expanded', String(open));
    mobileMenu?.setAttribute('aria-hidden', String(!open));
    mobileMenu?.classList.toggle('open', open);
    header?.classList.toggle('menu-open', open);
    document.body.classList.toggle('menu-open', open);
  }

  menuButton?.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  $$('.mobile-menu a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  window.addEventListener('resize', () => { if (window.innerWidth > 900) setMenu(false); });
  window.addEventListener('keydown', event => { if (event.key === 'Escape') setMenu(false); });

  const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 22);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  // Reveal transitions
  $$('.reveal').forEach(element => element.style.setProperty('--delay', `${element.dataset.delay || 0}ms`));
  if ('IntersectionObserver' in window && !reducedMotion) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px' });
    $$('.reveal:not(.in-view)').forEach(element => revealObserver.observe(element));
  } else {
    $$('.reveal').forEach(element => element.classList.add('in-view'));
  }

  // Numeric proof points count up once when they enter the viewport.
  const counters = $$('.metrics-rail strong, .experience-stat strong');

  function animateCounter(element) {
    if (element.dataset.counted === 'true') return;

    const finalText = element.textContent.trim();
    const match = finalText.match(/^(\d+)([+%]?)$/);
    if (!match) return;

    const target = Number(match[1]);
    const suffix = match[2];
    element.dataset.counted = 'true';
    element.setAttribute('aria-label', finalText);

    if (reducedMotion) {
      element.textContent = finalText;
      return;
    }

    const duration = 1350;
    let startedAt = null;
    const tick = timestamp => {
      if (startedAt === null) startedAt = timestamp;
      const progress = Math.min((timestamp - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = `${Math.round(target * eased)}${suffix}`;
      if (progress < 1) window.requestAnimationFrame(tick);
      else element.textContent = finalText;
    };

    element.textContent = `0${suffix}`;
    window.requestAnimationFrame(tick);
  }

  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      });
    }, { threshold: .45 });
    counters.forEach(counter => counterObserver.observe(counter));
  } else {
    counters.forEach(animateCounter);
  }

  // Mobile and tablet carousel helper
  function createCarousel({ trackSelector, prevSelector, nextSelector, dotsSelector, tabletVisible = 2 }) {
    const track = $(trackSelector);
    const previous = $(prevSelector);
    const next = $(nextSelector);
    const dots = $(dotsSelector);
    if (!track || !dots) return;

    const items = [...track.children];
    let index = 0;

    function visibleCount() {
      if (window.innerWidth > 900) return items.length;
      return window.innerWidth <= 620 ? 1 : tabletVisible;
    }

    function maxIndex() {
      return Math.max(0, items.length - visibleCount());
    }

    function stepWidth() {
      if (!items[0]) return 0;
      const styles = getComputedStyle(track);
      const gap = parseFloat(styles.columnGap || styles.gap || 0);
      return items[0].getBoundingClientRect().width + gap;
    }

    function renderDots() {
      dots.replaceChildren();
      if (window.innerWidth > 900) return;
      for (let dotIndex = 0; dotIndex <= maxIndex(); dotIndex += 1) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', `Go to slide ${dotIndex + 1}`);
        dot.classList.toggle('active', dotIndex === index);
        dot.addEventListener('click', () => { index = dotIndex; update(); });
        dots.append(dot);
      }
    }

    function update() {
      if (window.innerWidth > 900) {
        index = 0;
        track.style.transform = '';
        renderDots();
        return;
      }
      index = Math.min(maxIndex(), Math.max(0, index));
      track.style.transform = `translateX(${-index * stepWidth()}px)`;
      [...dots.children].forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === index));
      previous?.toggleAttribute('disabled', index === 0);
      next?.toggleAttribute('disabled', index === maxIndex());
    }

    previous?.addEventListener('click', () => { index -= 1; update(); });
    next?.addEventListener('click', () => { index += 1; update(); });
    window.addEventListener('resize', () => { renderDots(); update(); });
    renderDots();
    update();
  }

  createCarousel({
    trackSelector: '#serviceTrack',
    prevSelector: '#servicePrev',
    nextSelector: '#serviceNext',
    dotsSelector: '#serviceDots'
  });

  createCarousel({
    trackSelector: '#portfolioTrack',
    dotsSelector: '#portfolioDots'
  });

  // Service-card spotlight follows the pointer while the icons keep a subtle idle motion.
  if (!reducedMotion && window.matchMedia('(pointer: fine)').matches) {
    $$('.service-card').forEach(card => {
      card.addEventListener('pointermove', event => {
        const bounds = card.getBoundingClientRect();
        card.classList.add('is-pointer-active');
        card.style.setProperty('--spot-x', `${event.clientX - bounds.left}px`);
        card.style.setProperty('--spot-y', `${event.clientY - bounds.top}px`);
      }, { passive: true });
      card.addEventListener('pointerleave', () => {
        card.classList.remove('is-pointer-active');
        card.style.setProperty('--spot-x', '50%');
        card.style.setProperty('--spot-y', '25%');
      });
    });
  }

  // Interactive process timeline: click or keyboard-select a step; desktop also auto-advances.
  const processSteps = $$('.process-line article');
  const processLine = $('.process-line');
  const processSection = $('.process');
  const processCount = $('#processCount');
  let processIndex = 0;
  let processTimer = null;
  let processVisible = false;

  function updateProcess() {
    const progress = processSteps.length > 1 ? (processIndex / (processSteps.length - 1)) * 100 : 0;
    const nextProgress = processSteps.length > 1 && processIndex < processSteps.length - 1
      ? ((processIndex + 1) / (processSteps.length - 1)) * 100
      : progress;
    processLine?.style.setProperty('--progress', `${progress}%`);
    processLine?.style.setProperty('--spark-start', `${progress}%`);
    processLine?.style.setProperty('--spark-end', `${nextProgress}%`);
    if (processLine) {
      processLine.classList.remove('is-flowing');
      void processLine.offsetWidth;
      processLine.classList.add('is-flowing');
    }
    processSteps.forEach((step, index) => {
      const active = index === processIndex;
      step.classList.toggle('mobile-active', active);
      step.classList.toggle('is-active', active);
      step.classList.toggle('is-complete', index < processIndex);
      step.setAttribute('aria-pressed', String(active));
      if (active) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });
    if (processCount) processCount.textContent = `Step ${processIndex + 1} of ${processSteps.length}`;
  }

  function stopProcessAutoplay() {
    window.clearInterval(processTimer);
    processTimer = null;
  }

  function startProcessAutoplay() {
    stopProcessAutoplay();
    if (!processVisible || document.hidden || !processSteps.length) return;
    processTimer = window.setInterval(() => {
      processIndex = (processIndex + 1) % processSteps.length;
      updateProcess();
    }, 2400);
  }

  function selectProcessStep(index, restart = true) {
    processIndex = (index + processSteps.length) % processSteps.length;
    updateProcess();
    if (restart) startProcessAutoplay();
  }

  processSteps.forEach((step, index) => {
    step.addEventListener('click', () => selectProcessStep(index));
    step.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      selectProcessStep(index);
    });
  });

  $('#processPrev')?.addEventListener('click', () => selectProcessStep(processIndex - 1));
  $('#processNext')?.addEventListener('click', () => selectProcessStep(processIndex + 1));
  window.addEventListener('resize', startProcessAutoplay);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopProcessAutoplay();
    else startProcessAutoplay();
  });

  if (processSection && 'IntersectionObserver' in window) {
    const processObserver = new IntersectionObserver(([entry]) => {
      processVisible = entry.isIntersecting;
      if (processVisible) startProcessAutoplay();
      else stopProcessAutoplay();
    }, { threshold: .35 });
    processObserver.observe(processSection);
  } else {
    processVisible = true;
    startProcessAutoplay();
  }
  updateProcess();

  // Testimonials
  const testimonials = [
    {
      quote: 'The Wikipedia Studio delivered beyond my expectations. Their professionalism, attention to detail, and knowledge of Wikipedia guidelines are truly commendable.',
      name: 'Dr. Sarah Mitchell',
      role: 'Author & Speaker'
    },
    {
      quote: 'Their research-first approach made the entire process clear. Every source was assessed carefully, and the finished page felt balanced and authoritative.',
      name: 'Daniel Mercer',
      role: 'Business Leader'
    },
    {
      quote: 'We valued the transparent communication and thoughtful editorial guidance. The team understood both our history and Wikipedia’s standards.',
      name: 'Elena Brooks',
      role: 'Communications Director'
    }
  ];
  const testimonialWindow = $('#testimonialWindow');
  const testimonialDots = $('#testimonialDots');
  const testimonialStage = $('.testimonial-stage');
  const testimonialCurrent = $('#testimonialCurrent');
  let testimonialIndex = 0;
  let testimonialTimer = null;
  let testimonialTransitionTimer = null;
  let testimonialVisible = false;

  function renderTestimonial(animate = false) {
    if (!testimonialWindow || !testimonialDots) return;
    const item = testimonials[testimonialIndex];
    testimonialWindow.innerHTML = `<blockquote>${item.quote}</blockquote><div><strong>${item.name}</strong><span>${item.role}</span></div>`;
    testimonialWindow.dataset.testimonialIndex = String(testimonialIndex);
    if (testimonialCurrent) testimonialCurrent.textContent = String(testimonialIndex + 1).padStart(2, '0');
    testimonialWindow.classList.remove('is-leaving', 'is-entering');
    if (animate && !reducedMotion) {
      void testimonialWindow.offsetWidth;
      testimonialWindow.classList.add('is-entering');
    }
    [...testimonialDots.children].forEach((dot, index) => {
      const isActive = index === testimonialIndex;
      dot.classList.toggle('active', isActive);
      dot.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
  }

  function showTestimonial(index, restart = false) {
    const nextIndex = (index + testimonials.length) % testimonials.length;
    if (!testimonialWindow || nextIndex === testimonialIndex) {
      if (restart) startTestimonialAutoplay();
      return;
    }

    window.clearTimeout(testimonialTransitionTimer);
    testimonialWindow.classList.remove('is-entering');

    if (reducedMotion) {
      testimonialIndex = nextIndex;
      renderTestimonial();
    } else {
      testimonialWindow.classList.add('is-leaving');
      testimonialTransitionTimer = window.setTimeout(() => {
        testimonialIndex = nextIndex;
        renderTestimonial(true);
      }, 220);
    }

    if (restart) startTestimonialAutoplay();
  }

  function stopTestimonialAutoplay() {
    window.clearInterval(testimonialTimer);
    testimonialTimer = null;
    testimonialStage?.classList.remove('is-autoplaying');
  }

  function startTestimonialAutoplay() {
    stopTestimonialAutoplay();
    if (!testimonialVisible || document.hidden || !testimonialStage) return;
    testimonialStage.classList.add('is-autoplaying');
    testimonialTimer = window.setInterval(() => showTestimonial(testimonialIndex + 1), 3600);
  }

  testimonials.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Show testimonial ${index + 1}`);
    dot.addEventListener('click', () => showTestimonial(index, true));
    testimonialDots?.append(dot);
  });
  $('#testimonialPrev')?.addEventListener('click', () => showTestimonial(testimonialIndex - 1, true));
  $('#testimonialNext')?.addEventListener('click', () => showTestimonial(testimonialIndex + 1, true));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopTestimonialAutoplay();
    else startTestimonialAutoplay();
  });
  if ('IntersectionObserver' in window) {
    const testimonialObserver = new IntersectionObserver(entries => {
      testimonialVisible = entries.some(entry => entry.isIntersecting);
      if (testimonialVisible) startTestimonialAutoplay();
      else stopTestimonialAutoplay();
    }, { threshold: .35 });
    if (testimonialStage) testimonialObserver.observe(testimonialStage);
  } else {
    testimonialVisible = true;
    startTestimonialAutoplay();
  }
  renderTestimonial();

  // FAQ keeps one answer open at a time.
  const faqItems = $$('.faq-item');
  faqItems.forEach(item => {
    const question = $('.faq-question', item);
    const answer = $('.faq-answer', item);
    question?.addEventListener('click', () => {
      const willOpen = question.getAttribute('aria-expanded') !== 'true';
      faqItems.forEach(other => {
        $('.faq-question', other)?.setAttribute('aria-expanded', 'false');
        const otherAnswer = $('.faq-answer', other);
        if (otherAnswer) otherAnswer.hidden = true;
      });
      question.setAttribute('aria-expanded', String(willOpen));
      if (answer) answer.hidden = !willOpen;
    });
  });

  // The central control plays a short visual tour through the four proof points.
  const experiencePanel = $('.experience-panel');
  const experienceButton = $('.experience-core button');
  const experienceStats = $$('.experience-stat');
  let highlightTimer = null;
  let highlightIndex = 0;
  function stopHighlights() {
    window.clearInterval(highlightTimer);
    highlightTimer = null;
    experiencePanel?.classList.remove('playing');
    experienceButton?.setAttribute('aria-pressed', 'false');
    experienceStats.forEach(stat => stat.classList.remove('active'));
  }
  experienceButton?.setAttribute('aria-pressed', 'false');
  experienceButton?.addEventListener('click', () => {
    if (highlightTimer) { stopHighlights(); return; }
    experiencePanel?.classList.add('playing');
    experienceButton.setAttribute('aria-pressed', 'true');
    highlightIndex = 0;
    experienceStats[0]?.classList.add('active');
    highlightTimer = window.setInterval(() => {
      experienceStats.forEach(stat => stat.classList.remove('active'));
      highlightIndex = (highlightIndex + 1) % experienceStats.length;
      experienceStats[highlightIndex]?.classList.add('active');
    }, 1200);
  });

  // Gold star field — drifts upward and reacts to the pointer across the whole site
  const canvas = $('#starfield');
  const context = canvas?.getContext('2d');
  let stars = [];
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const REPEL_RADIUS = 130;
  const REPEL_STRENGTH = 1.6;
  const LINK_RADIUS = 150;
  const pointer = { x: -9999, y: -9999, active: false };

  window.addEventListener('pointermove', event => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
  }, { passive: true });
  window.addEventListener('pointerleave', () => { pointer.active = false; });
  window.addEventListener('blur', () => { pointer.active = false; });

  function resizeStars() {
    if (!canvas || !context) return;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(115, Math.floor((window.innerWidth * window.innerHeight) / 13000));
    stars = Array.from({ length: count }, () => {
      const homeX = Math.random() * window.innerWidth;
      return {
        x: homeX,
        homeX,
        y: Math.random() * window.innerHeight,
        vx: 0,
        radius: Math.random() * 0.85 + 0.2,
        alpha: Math.random() * 0.36 + 0.08,
        velocity: Math.random() * 0.04 + 0.01,
        gold: Math.random() > 0.8
      };
    });
  }

  function drawStars() {
    if (!context) return;
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    stars.forEach(star => {
      const dx = star.x - pointer.x;
      const dy = star.y - pointer.y;
      const dist = Math.hypot(dx, dy) || 1;

      if (pointer.active && dist < REPEL_RADIUS) {
        const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
        star.vx += (dx / dist) * force;
      }
      star.vx += (star.homeX - star.x) * 0.012;
      star.vx *= 0.9;
      star.x += star.vx;
      star.y -= star.velocity;
      if (star.y < -2) {
        star.y = window.innerHeight + 2;
        star.homeX = Math.random() * window.innerWidth;
      }

      if (pointer.active && dist < LINK_RADIUS) {
        context.beginPath();
        context.moveTo(star.x, star.y);
        context.lineTo(pointer.x, pointer.y);
        context.strokeStyle = `rgba(216,165,58,${(1 - dist / LINK_RADIUS) * 0.35})`;
        context.lineWidth = 0.6;
        context.stroke();
      }

      context.beginPath();
      context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      context.fillStyle = star.gold ? `rgba(216,165,58,${star.alpha})` : `rgba(211,226,238,${star.alpha})`;
      context.fill();
    });
    window.requestAnimationFrame(drawStars);
  }

  if (canvas && context) {
    resizeStars();
    if (!reducedMotion) drawStars();
    window.addEventListener('resize', resizeStars);
  }

  // Hero globe parallax — subtle tilt toward the pointer on desktop
  // Hero particle system: orbiting light trails, depth sparks, and a soft pointer wake.
  // It stays canvas-native so this lightweight page does not gain a heavy animation dependency.
  const hero = $('.hero');
  const heroCanvas = $('#heroParticles');
  const heroContext = heroCanvas?.getContext('2d');
  const heroPointer = { x: 0, y: 0, active: false };
  const heroParticles = [];
  const orbiters = [];
  let heroWidth = 0;
  let heroHeight = 0;
  let heroDpr = 1;
  let heroVisible = true;
  let heroAnimationFrame = null;

  function heroFocusPoint() {
    if (heroWidth <= 620) return { x: heroWidth * .63, y: 150, radiusX: Math.min(150, heroWidth * .38), radiusY: 56 };
    if (heroWidth <= 900) return { x: heroWidth * .68, y: 250, radiusX: Math.min(260, heroWidth * .33), radiusY: 94 };
    return {
      x: heroWidth * .69,
      y: heroHeight * .47,
      radiusX: Math.min(390, heroWidth * .25),
      radiusY: Math.min(150, heroHeight * .17)
    };
  }

  function makeHeroParticle() {
    const onRight = Math.random() > .2;
    return {
      x: onRight ? heroWidth * (.38 + Math.random() * .61) : Math.random() * heroWidth,
      y: Math.random() * Math.min(heroHeight, window.innerHeight * 1.05),
      radius: .35 + Math.random() * 1.25,
      alpha: .12 + Math.random() * .5,
      speed: .045 + Math.random() * .13,
      drift: (Math.random() - .5) * .09,
      phase: Math.random() * Math.PI * 2,
      warm: Math.random() > .24
    };
  }

  function resizeHeroParticles() {
    if (!hero || !heroCanvas || !heroContext) return;
    const bounds = heroCanvas.getBoundingClientRect();
    heroWidth = Math.max(1, Math.round(bounds.width));
    heroHeight = Math.max(1, Math.round(bounds.height));
    heroDpr = Math.min(window.devicePixelRatio || 1, 1.5);
    heroCanvas.width = Math.round(heroWidth * heroDpr);
    heroCanvas.height = Math.round(heroHeight * heroDpr);
    heroContext.setTransform(heroDpr, 0, 0, heroDpr, 0, 0);

    const particleCount = Math.max(32, Math.min(82, Math.round(heroWidth * Math.min(heroHeight, 920) / 18000)));
    heroParticles.length = 0;
    for (let index = 0; index < particleCount; index += 1) heroParticles.push(makeHeroParticle());

    const orbiterCount = heroWidth <= 620 ? 5 : heroWidth <= 900 ? 7 : 11;
    orbiters.length = 0;
    for (let index = 0; index < orbiterCount; index += 1) {
      orbiters.push({
        angle: Math.random() * Math.PI * 2,
        speed: (.0018 + Math.random() * .0032) * (Math.random() > .18 ? 1 : -1),
        ring: .72 + Math.random() * .55,
        phase: Math.random() * Math.PI * 2,
        size: .8 + Math.random() * 1.7,
        trail: []
      });
    }
  }

  function drawHeroGlow(x, y, radius, alpha) {
    const glow = heroContext.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, `rgba(255,240,190,${alpha})`);
    glow.addColorStop(.18, `rgba(240,186,74,${alpha * .72})`);
    glow.addColorStop(1, 'rgba(216,165,58,0)');
    heroContext.fillStyle = glow;
    heroContext.beginPath();
    heroContext.arc(x, y, radius, 0, Math.PI * 2);
    heroContext.fill();
  }

  function drawHeroParticles(time = 0) {
    if (!heroContext || document.hidden || !heroVisible) {
      heroAnimationFrame = null;
      return;
    }
    heroContext.clearRect(0, 0, heroWidth, heroHeight);
    const focus = heroFocusPoint();
    const activeHeight = heroWidth <= 900 ? Math.min(heroHeight, heroWidth <= 620 ? 340 : 570) : heroHeight;

    heroParticles.forEach(particle => {
      particle.phase += .006;
      particle.y -= particle.speed;
      particle.x += particle.drift + Math.sin(particle.phase) * .025;
      if (particle.y < -8) {
        particle.y = activeHeight + 8;
        particle.x = heroWidth * (.34 + Math.random() * .66);
      }

      let drawX = particle.x;
      let drawY = particle.y;
      if (heroPointer.active) {
        const dx = heroPointer.x - drawX;
        const dy = heroPointer.y - drawY;
        const distance = Math.hypot(dx, dy) || 1;
        if (distance < 170) {
          const pull = (1 - distance / 170) * 8;
          drawX += dx / distance * pull;
          drawY += dy / distance * pull;
          if (distance < 115 && particle.alpha > .34) {
            heroContext.beginPath();
            heroContext.moveTo(drawX, drawY);
            heroContext.lineTo(heroPointer.x, heroPointer.y);
            heroContext.strokeStyle = `rgba(232,184,83,${(1 - distance / 115) * .16})`;
            heroContext.lineWidth = .45;
            heroContext.stroke();
          }
        }
      }

      const twinkle = .64 + Math.sin(time * .0017 + particle.phase) * .36;
      if (particle.radius > 1.05) drawHeroGlow(drawX, drawY, particle.radius * 5.5, particle.alpha * twinkle * .26);
      heroContext.beginPath();
      heroContext.arc(drawX, drawY, particle.radius, 0, Math.PI * 2);
      heroContext.fillStyle = particle.warm
        ? `rgba(244,197,99,${particle.alpha * twinkle})`
        : `rgba(209,229,240,${particle.alpha * twinkle * .75})`;
      heroContext.fill();
    });

    orbiters.forEach((orbiter, orbiterIndex) => {
      orbiter.angle += orbiter.speed;
      const wobble = Math.sin(time * .00055 + orbiter.phase) * .045;
      const angle = orbiter.angle;
      const radiusX = focus.radiusX * (orbiter.ring + wobble);
      const radiusY = focus.radiusY * (orbiter.ring + wobble * .55);
      const x = focus.x + Math.cos(angle) * radiusX;
      const y = focus.y + Math.sin(angle) * radiusY;
      const depth = .48 + (Math.sin(angle) + 1) * .26;

      orbiter.trail.unshift({ x, y });
      if (orbiter.trail.length > 16) orbiter.trail.pop();
      if (orbiter.trail.length > 2) {
        heroContext.beginPath();
        orbiter.trail.forEach((point, index) => {
          if (index === 0) heroContext.moveTo(point.x, point.y);
          else heroContext.lineTo(point.x, point.y);
        });
        const trailEnd = orbiter.trail[orbiter.trail.length - 1];
        const gradient = heroContext.createLinearGradient(trailEnd.x, trailEnd.y, x, y);
        gradient.addColorStop(0, 'rgba(216,165,58,0)');
        gradient.addColorStop(1, `rgba(255,213,122,${.28 * depth})`);
        heroContext.strokeStyle = gradient;
        heroContext.lineWidth = Math.max(.45, orbiter.size * .52);
        heroContext.stroke();
      }
      drawHeroGlow(x, y, 10 + orbiter.size * 4, .22 * depth);
      heroContext.beginPath();
      heroContext.arc(x, y, orbiter.size * depth, 0, Math.PI * 2);
      heroContext.fillStyle = orbiterIndex % 4 === 0 ? '#fff1be' : '#e9b85a';
      heroContext.fill();
    });

    if (heroPointer.active) drawHeroGlow(heroPointer.x, heroPointer.y, 46, .055);
    heroAnimationFrame = reducedMotion ? null : window.requestAnimationFrame(drawHeroParticles);
  }

  function startHeroParticles() {
    if (heroAnimationFrame || reducedMotion || !heroVisible || document.hidden) return;
    heroAnimationFrame = window.requestAnimationFrame(drawHeroParticles);
  }

  if (hero && heroCanvas && heroContext) {
    resizeHeroParticles();
    hero.addEventListener('pointermove', event => {
      const bounds = hero.getBoundingClientRect();
      heroPointer.x = event.clientX - bounds.left;
      heroPointer.y = event.clientY - bounds.top;
      heroPointer.active = event.pointerType === 'mouse' || event.pointerType === 'pen';
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { heroPointer.active = false; });
    window.addEventListener('resize', resizeHeroParticles);
    document.addEventListener('visibilitychange', startHeroParticles);

    if ('IntersectionObserver' in window) {
      const heroObserver = new IntersectionObserver(([entry]) => {
        heroVisible = entry.isIntersecting;
        if (heroVisible) startHeroParticles();
      }, { rootMargin: '120px 0px' });
      heroObserver.observe(hero);
    }

    if (reducedMotion) drawHeroParticles();
    else startHeroParticles();
  }

  const heroArt = $('.hero-art');
  if (heroArt && !reducedMotion && window.matchMedia('(pointer: fine)').matches) {
    const strength = 16;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    window.addEventListener('pointermove', event => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      targetX = (event.clientX / window.innerWidth - 0.5) * strength;
      targetY = (event.clientY / window.innerHeight - 0.5) * strength;
    }, { passive: true });

    (function tiltHero() {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;
      heroArt.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0) scale(1.06)`;
      window.requestAnimationFrame(tiltHero);
    })();
  }

  // Active section navigation.
  // The primary nav points at real page URLs, so only in-page hash links can be
  // observed — anything else would be an invalid querySelector argument.
  const navigationLinks = $$('.desktop-nav a').filter(link => (link.getAttribute('href') || '').startsWith('#'));
  const observedSections = navigationLinks
    .map(link => $(link.getAttribute('href')))
    .filter(Boolean);
  if (observedSections.length && 'IntersectionObserver' in window) {
    const navigationObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navigationLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
      });
    }, { rootMargin: '-38% 0px -53%', threshold: 0 });
    observedSections.forEach(section => navigationObserver.observe(section));
  }

  // The footer year is rendered server-side; this only keeps a long-lived tab
  // accurate across a year boundary.
  const yearSlot = $('#year');
  if (yearSlot) yearSlot.textContent = new Date().getFullYear();
})();
