/* R&K Energized — Main JS */

// ── Nav scroll effect ──────────────────────────────
const nav = document.getElementById('nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

// ── Hamburger menu ─────────────────────────────────
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', String(open));
  });
  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) mobileMenu.classList.remove('open');
  });
}

// ── Active nav link ────────────────────────────────
(function setActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__link').forEach(link => {
    const href = link.getAttribute('href').split('#')[0];
    link.classList.toggle('active', href === page || (page === '' && href === 'index.html'));
  });
})();

// ── Animated counters ──────────────────────────────
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 2000;
  const step = target / (duration / 16);
  let current = 0;
  const tick = () => {
    current = Math.min(current + step, target);
    el.textContent = Math.floor(current);
    if (current < target) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

const counters = document.querySelectorAll('[data-target]');
if (counters.length) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { animateCounter(e.target); io.unobserve(e.target); }
    });
  }, { threshold: 0.5 });
  counters.forEach(c => io.observe(c));
}

// ── Scroll-triggered fade-in ───────────────────────
const fadeTargets = document.querySelectorAll(
  '.benefit-item, .step-card, .program-card, .program-full-card, ' +
  '.testimonial-card, .team-card, .value-card, .included-card, ' +
  '.contact-detail, .timeline-item, .how-step, .savings-stat'
);

if (fadeTargets.length) {
  const fadeObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, delay);
        fadeObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  fadeTargets.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(22px)';
    el.style.transition = 'opacity 0.55s ease, transform 0.55s ease';
    el.dataset.delay = (i % 4) * 75;
    fadeObs.observe(el);
  });
}

// ── FAQ accordion ──────────────────────────────────
const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach(item => {
  const btn = item.querySelector('.faq-question');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    // Close all others
    faqItems.forEach(other => other.classList.remove('open'));
    // Toggle this one
    if (!isOpen) item.classList.add('open');
  });
});

// ── Contact form (Netlify Forms — AJAX submit) ─────
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('[type="submit"]');
    const original = btn.textContent;
    btn.textContent = 'Sending…';
    btn.disabled = true;
    btn.style.opacity = '0.7';

    try {
      // Build form-encoded payload (what Netlify Forms expects)
      const formData = new FormData(contactForm);
      const body = new URLSearchParams(formData).toString();

      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });

      if (!res.ok) throw new Error('Submission failed');

      btn.textContent = '✓ Request Received! We\'ll be in touch soon.';
      btn.style.background = 'linear-gradient(135deg, #22C55E, #16a34a)';
      btn.style.opacity = '1';
      setTimeout(() => {
        contactForm.reset();
        btn.textContent = original;
        btn.style.background = '';
        btn.disabled = false;
      }, 4000);
    } catch (err) {
      btn.textContent = '✗ Something went wrong — please call us';
      btn.style.background = '#dc2626';
      btn.style.opacity = '1';
      btn.disabled = false;
    }
  });
}

// ── Product image gallery (clickable thumbnails) ───
// Works automatically once real images exist in /images.
// Until then, missing files are ignored and placeholders stay.
document.querySelectorAll('[data-gallery]').forEach(gallery => {
  const mainImg = gallery.querySelector('.gallery-main__img');
  const thumbs  = gallery.querySelectorAll('.gallery-thumb');
  if (!mainImg || !thumbs.length) return;

  // Swap the main image — only show it if the file actually loads
  function showMain(src) {
    if (!src) return;
    const test = new Image();
    test.onload = () => {
      mainImg.src = src;
      mainImg.classList.add('is-loaded');
    };
    test.onerror = () => {
      mainImg.classList.remove('is-loaded'); // keep placeholder
    };
    test.src = src;
  }

  thumbs.forEach(thumb => {
    const src = thumb.dataset.img;

    // If a thumb's image exists, show it as the thumbnail background
    if (src) {
      const probe = new Image();
      probe.onload = () => {
        thumb.style.backgroundImage = `url("${src}")`;
        thumb.classList.add('has-img');
      };
      probe.src = src;
    }

    // Click to set the main image
    thumb.addEventListener('click', () => {
      thumbs.forEach(t => t.classList.remove('gallery-thumb--active'));
      thumb.classList.add('gallery-thumb--active');
      showMain(src);
    });
  });

  // On load, try to show the active thumb's image as the main image
  const active = gallery.querySelector('.gallery-thumb--active') || thumbs[0];
  if (active) showMain(active.dataset.img);
});

// ── Smooth anchor scroll ───────────────────────────
document.querySelectorAll('a[href*="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const [path, hash] = link.getAttribute('href').split('#');
    const page = window.location.pathname.split('/').pop() || 'index.html';
    if (hash && (path === '' || path === page)) {
      const target = document.getElementById(hash);
      if (target) {
        e.preventDefault();
        const offset = 100;
        window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
      }
    }
  });
});
