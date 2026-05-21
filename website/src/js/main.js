import '../css/main.css';

// Mobile nav toggle
const navToggle = document.querySelector('[data-nav-toggle]');
const mobileNav = document.querySelector('[data-mobile-nav]');
if (navToggle && mobileNav) {
  navToggle.addEventListener('click', () => {
    const open = mobileNav.classList.toggle('hidden') === false;
    navToggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('overflow-hidden', open);
  });
  mobileNav.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      mobileNav.classList.add('hidden');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('overflow-hidden');
    })
  );
}

// Sticky header shadow on scroll
const header = document.querySelector('[data-header]');
if (header) {
  const onScroll = () => {
    if (window.scrollY > 8) {
      header.classList.add('shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)]', 'backdrop-blur-md', 'bg-white/90');
      header.classList.remove('bg-white');
    } else {
      header.classList.remove('shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)]', 'backdrop-blur-md', 'bg-white/90');
      header.classList.add('bg-white');
    }
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

// Scroll reveal
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12 }
);
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// Counters
const counterIo = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = Number(el.dataset.count || '0');
      const suffix = el.dataset.suffix || '';
      const duration = 1200;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.floor(eased * target).toLocaleString() + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      counterIo.unobserve(el);
    });
  },
  { threshold: 0.4 }
);
document.querySelectorAll('[data-count]').forEach((el) => counterIo.observe(el));

// Quote form (no backend — captures and shows success)
const forms = document.querySelectorAll('[data-quote-form]');
forms.forEach((form) => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const success = form.querySelector('[data-form-success]');
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
    }
    // Simulate network — replace this with a real endpoint (Formspree, Netlify Forms, your backend).
    setTimeout(() => {
      if (success) success.classList.remove('hidden');
      form.reset();
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Request my free quote';
      }
      console.log('Quote request:', data);
    }, 700);
  });
});

// Current year in footers
document.querySelectorAll('[data-year]').forEach((el) => {
  el.textContent = new Date().getFullYear();
});
