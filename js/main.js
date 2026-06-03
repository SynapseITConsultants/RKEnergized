/* R&K Energized — main.js (vanilla JS, no dependencies) */

(function () {
  'use strict';

  /* Flag that JS is running so reveal styles (which hide content) apply only now */
  document.documentElement.classList.add('js');

  /* ---------- Hamburger / Mobile Menu ---------- */
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
      const open = mobileMenu.classList.toggle('is-open');
      hamburger.classList.toggle('is-open', open);
      hamburger.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });

    /* Close menu when a link is tapped */
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.remove('is-open');
        hamburger.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    /* Close on outside tap */
    document.addEventListener('click', function (e) {
      if (
        mobileMenu.classList.contains('is-open') &&
        !mobileMenu.contains(e.target) &&
        !hamburger.contains(e.target)
      ) {
        mobileMenu.classList.remove('is-open');
        hamburger.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  /* ---------- Nav scroll shadow ---------- */
  const nav = document.getElementById('nav');
  if (nav) {
    window.addEventListener('scroll', function () {
      nav.style.boxShadow = window.scrollY > 10
        ? '0 2px 20px rgba(0,0,0,0.4)'
        : 'none';
    }, { passive: true });
  }

  /* ---------- Accordion (Products page) ---------- */
  document.querySelectorAll('.accordion-trigger').forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      const item   = trigger.closest('.accordion-item');
      const body   = item.querySelector('.accordion-body');
      const isOpen = item.classList.contains('is-open');

      /* Close all siblings */
      trigger.closest('.accordion').querySelectorAll('.accordion-item').forEach(function (sibling) {
        sibling.classList.remove('is-open');
        sibling.querySelector('.accordion-body').style.display = '';
        sibling.querySelector('.accordion-trigger').setAttribute('aria-expanded', 'false');
      });

      /* Toggle current */
      if (!isOpen) {
        item.classList.add('is-open');
        body.style.display = 'block';
        trigger.setAttribute('aria-expanded', 'true');
      }
    });

    trigger.setAttribute('aria-expanded', 'false');
  });

  /* ---------- Smooth in-page anchor offset (accounts for fixed nav) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 64;
      const top  = target.getBoundingClientRect().top + window.scrollY - navH - 16;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });

  /* ---------- Sticky call button: reveal after scrolling past the hero ---------- */
  const stickyCall = document.querySelector('.sticky-call');
  if (stickyCall) {
    const heroEl = document.querySelector('.hero, .page-hero');
    function updateSticky() {
      const trigger = heroEl
        ? (heroEl.offsetTop + heroEl.offsetHeight - 90)
        : 240;
      stickyCall.classList.toggle('is-visible', window.scrollY > trigger);
    }
    updateSticky();
    window.addEventListener('scroll', updateSticky, { passive: true });
    window.addEventListener('resize', updateSticky, { passive: true });
  }

  /* ---------- Scroll-reveal animations (eye candy) ---------- */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduceMotion && 'IntersectionObserver' in window) {
    /* Auto-tag common elements so we don't have to edit every page by hand */
    const revealSelectors = [
      '.section-header',
      '.benefit-card', '.step-card', '.financing-card',
      '.testimonial-card', '.accordion-item',
      '.benefits-inner > *', '.benefits-visual',
      '.whyus-bar__inner > *', '.contact-info',
      '.city-content > *', '.cta-banner__inner > *',
      '.products-grid > *', '.programs-grid > *',
      '.stats-strip__inner > *', '.accordion'
    ];

    const items = [];
    revealSelectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        if (!el.classList.contains('reveal')) {
          el.classList.add('reveal');
          items.push(el);
        }
      });
    });

    /* Stagger items that share a parent for a cascading effect */
    const groupCount = new Map();
    items.forEach(function (el) {
      const parent = el.parentElement;
      const n = groupCount.get(parent) || 0;
      el.style.setProperty('--reveal-delay', (n * 90) + 'ms');
      groupCount.set(parent, n + 1);
    });

    const io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    items.forEach(function (el) { io.observe(el); });

    /* Safety net: if anything is still hidden after 3s (e.g. IO never fired), reveal it */
    setTimeout(function () {
      items.forEach(function (el) { el.classList.add('is-visible'); });
    }, 3000);
  } else {
    /* Reduced motion: show everything immediately */
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  /* ---------- Count-up animation for stat numbers ---------- */
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const counters = document.querySelectorAll('[data-count]');
    const countIO = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        const el     = entry.target;
        const target = parseFloat(el.getAttribute('data-count'));
        const suffix = el.getAttribute('data-suffix') || '';
        const dur    = 1100;
        const start  = performance.now();
        function tick(now) {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        obs.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { countIO.observe(el); });
  }

  /* ---------- Subtle parallax drift on hero image ---------- */
  if (!reduceMotion) {
    const heroImg = document.querySelector('.hero__img');
    if (heroImg) {
      window.addEventListener('scroll', function () {
        const y = window.scrollY;
        if (y < 700) heroImg.style.transform = 'scale(1.06) translateY(' + (y * 0.10) + 'px)';
      }, { passive: true });
    }
  }

  /* ---------- Contact form — basic client-side validation ---------- */
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const required = form.querySelectorAll('[required]');
      let valid = true;

      required.forEach(function (field) {
        field.style.borderColor = '';
        if (!field.value.trim()) {
          field.style.borderColor = '#ef4444';
          valid = false;
        }
      });

      if (!valid) {
        const first = form.querySelector('[required][style*="ef4444"]');
        if (first) first.focus();
        return;
      }

      /* Replace form with success message */
      form.innerHTML = '<div class="form-success" role="alert">' +
        '<div class="form-success__icon">✅</div>' +
        '<h3>Message Sent!</h3>' +
        '<p>Thank you — a member of our team will reach out within one business day. ' +
        'Questions? Call us at <a href="tel:+15594443611">559-444-3611</a>.</p>' +
        '</div>';
    });
  }

})();
