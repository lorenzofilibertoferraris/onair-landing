// ============================================================
// WAITLIST + DEPOSIT CONFIG: fill these in to go live.
// ============================================================
const ONAIR_CONFIG = {
  // Klaviyo: public key (company id) of the Rolling Square account, and the ID of
  // a dedicated "onAir 5G Waitlist" list (TO CREATE). While listId is empty the form
  // runs in DRAFT mode: no data is sent anywhere, it just shows step 2.
  klaviyoPublicKey: 'RpgkGY',
  klaviyoListId: 'TsNfB4',
  // $20 deposit checkout (Stripe Payment Link or Shopify deposit product URL).
  // Leave empty while it does not exist: the button is shown as a placeholder.
  // For Stripe Payment Links the email is prefilled via ?prefilled_email=.
  // Live Stripe Payment Link (product prod_Ve6As7PC0uOGbP, $20, redirect → ?deposit=success)
  depositUrl: 'https://buy.stripe.com/3cI8wP46F4Lw4973oH0kE0u',
};

// onAir 5G landing: small, dependency-free interactions.
(() => {
  // Nav turns solid once the hero video is scrolled past.
  const nav = document.getElementById('nav');
  const hero = document.querySelector('.hero');
  const setNav = () => nav.classList.toggle('is-solid', window.scrollY > hero.offsetHeight - 80);
  setNav();
  window.addEventListener('scroll', setNav, { passive: true });

  // Product gallery: thumbnails swap the main image.
  const gallery = document.querySelector('[data-gallery]');
  if (gallery) {
    const main = gallery.querySelector('[data-gallery-main]');
    const idx = gallery.querySelector('[data-gallery-index]');
    const thumbs = [...gallery.querySelectorAll('.gallery-thumbs button')];
    thumbs.forEach((btn, i) => btn.addEventListener('click', () => {
      thumbs.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      main.style.opacity = 0;
      setTimeout(() => { main.src = btn.dataset.src; main.alt = btn.dataset.alt; main.style.opacity = 1; }, 180);
      idx.textContent = String(i + 1).padStart(2, '0');
    }));
  }

  // Specs: one open item at a time, image follows the open item.
  const specs = document.querySelector('[data-specs]');
  if (specs) {
    const img = specs.querySelector('[data-specs-img]');
    const items = [...specs.querySelectorAll('.specs-list li')];
    items.forEach(li => li.querySelector('button').addEventListener('click', () => {
      items.forEach(x => x.classList.remove('is-active'));
      li.classList.add('is-active');
      img.style.opacity = 0;
      setTimeout(() => { img.src = li.dataset.img; img.style.opacity = 1; }, 180);
    }));
  }

  // FAQ: keep a single answer open.
  const faq = [...document.querySelectorAll('.faq-list details')];
  faq.forEach(d => d.addEventListener('toggle', () => {
    if (d.open) faq.forEach(o => { if (o !== d) o.open = false; });
  }));

  // Lower videos only play while on screen.
  const vids = document.querySelectorAll('video[data-autoplay-on-view]');
  const vio = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) e.target.play().catch(() => {}); else e.target.pause();
  }), { threshold: 0.25 });
  vids.forEach(v => vio.observe(v));

  // Soft blur-lift reveal, like the reference page.
  const targets = document.querySelectorAll(
    '.product-copy > *:not(.price-card), .idea .wrap > *, .wide-figure, .feature, .split-grid, .specs-head, .specs-grid, .how .wrap > *, .film-video, .faq-wrap > *'
  );
  const rio = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); rio.unobserve(e.target); }
  }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  targets.forEach(t => { t.classList.add('reveal'); rio.observe(t); });


  // ---------- Waitlist form: step 1 email → step 2 $20 deposit ----------
  const draftMode = !ONAIR_CONFIG.klaviyoListId;
  const depositHref = email => {
    if (!ONAIR_CONFIG.depositUrl) return null;
    const u = new URL(ONAIR_CONFIG.depositUrl);
    if (email && /stripe\.com/.test(u.hostname)) u.searchParams.set('prefilled_email', email);
    return u.toString();
  };
  const subscribe = async (email, source, phone) => {
    if (draftMode) { console.info('[onAir waitlist] DRAFT mode, not sent:', email, source, phone); return; }
    const send = async (withPhone) => {
      // client/subscriptions grants marketing consent for the identifiers
      // provided (email always; SMS when phone_number is included).
      const attrs = { email, properties: { onair_waitlist: true, onair_waitlist_source: source } };
      if (withPhone && phone) { attrs.phone_number = phone; }
      const res = await fetch(`https://a.klaviyo.com/client/subscriptions?company_id=${ONAIR_CONFIG.klaviyoPublicKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/vnd.api+json', revision: '2024-10-15' },
        body: JSON.stringify({ data: { type: 'subscription', attributes: {
          custom_source: `onAir 5G waitlist · ${source}`,
          profile: { data: { type: 'profile', attributes: attrs } },
        }, relationships: { list: { data: { type: 'list', id: ONAIR_CONFIG.klaviyoListId } } } } }),
      });
      if (!res.ok) throw new Error('Subscription failed: ' + res.status);
    };
    try { await send(true); }
    catch (e) { if (phone) await send(false); else throw e; }
  };
  const showStep2 = (wl, email) => {
    wl.querySelector('.wl-form').hidden = true;
    wl.querySelector('.wl-step2').hidden = false;
    const pay = wl.querySelector('[data-deposit-link]');
    const href = depositHref(email);
    if (href) { pay.href = href; pay.rel = 'noopener'; }
    else { pay.dataset.todoLink = ''; pay.classList.add('todo'); pay.title = 'Deposit payment link still to be connected'; }
  };
  const widgets = [...document.querySelectorAll('[data-waitlist]')];
  const saved = localStorage.getItem('onair_wl_email');
  widgets.forEach(wl => {
    const form = wl.querySelector('.wl-form');
    const err = wl.querySelector('.wl-error');
    const btn = wl.querySelector('.wl-submit');
    if (saved) showStep2(wl, saved);
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const email = form.email.value.trim();
      err.hidden = true;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { err.textContent = 'Please enter a valid email address.'; err.hidden = false; return; }
      let phone = form.phone ? form.phone.value.replace(/[\s().-]/g, '') : '';
      if (phone && !/^\+[0-9]{7,15}$/.test(phone)) { err.textContent = 'Phone must be in international format, e.g. +1 555 000 1111 — or leave it empty.'; err.hidden = false; return; }
      btn.disabled = true; btn.textContent = 'Joining…';
      try {
        await subscribe(email, wl.dataset.source, phone || undefined);
        localStorage.setItem('onair_wl_email', email);
        widgets.forEach(w => showStep2(w, email));
        if (window.fbq) fbq('track', 'Lead');
        if (window.gtag) gtag('event', 'generate_lead', { method: 'onair_waitlist' });
      } catch (x) {
        err.textContent = 'Something went wrong. Please try again.'; err.hidden = false;
      } finally { btn.disabled = false; btn.textContent = 'Join the waitlist'; }
    });
  });
  // Coming back from the deposit checkout.
  if (new URLSearchParams(location.search).get('deposit') === 'success') {
    widgets.forEach(wl => {
      wl.querySelector('.wl-form').hidden = true;
      wl.querySelector('.wl-step2').hidden = true;
      const paid = wl.querySelector('.wl-paid'); if (paid) paid.hidden = false;
    });
    document.getElementById('waitlist')?.scrollIntoView();
  }

  // ---------- Sticky offer bar: after the hero, hidden over the waitlist block ----------
  const bar = document.querySelector('[data-offer-bar]');
  const wlSection = document.getElementById('waitlist');
  let wlVisible = false;
  if (bar && wlSection) {
    new IntersectionObserver(([e]) => { wlVisible = e.isIntersecting; setBar(); }, { threshold: 0.05 }).observe(wlSection);
    const setBar = () => {
      const on = window.scrollY > hero.offsetHeight * 0.8 && !wlVisible;
      bar.classList.toggle('is-on', on);
      bar.setAttribute('aria-hidden', String(!on));
      bar.querySelector('a').tabIndex = on ? 0 : -1;
    };
    window.addEventListener('scroll', setBar, { passive: true });
  }

  // Placeholder links: flag instead of jumping to the top.
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-todo-link]');
    if (!a) return;
    e.preventDefault();
    a.classList.add('todo');
    a.title = a.title || 'Link still to be provided';
  });

  // "D" toggles the draft markers.
  window.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 'd' && !e.metaKey && !e.ctrlKey && !/input|textarea/i.test(e.target.tagName)) {
      document.body.classList.toggle('hide-todo');
    }
  });
})();

// Step 03 mock: toggle between onAir Global plan and the user's own eSIM
document.querySelectorAll('[data-sim-mock]').forEach((m) => {
  const btns = m.querySelectorAll('.sim-seg button');
  const g = m.querySelector('.sim-global');
  const o = m.querySelector('.sim-own');
  btns.forEach((b) => b.addEventListener('click', () => {
    btns.forEach((x) => x.classList.toggle('is-active', x === b));
    g.hidden = b.dataset.sim !== 'global';
    o.hidden = b.dataset.sim !== 'own';
  }));
});

// Final CTA: rotating headline
(() => {
  const rt = document.querySelector('[data-rotate-title]');
  if (!rt || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const sets = [
    ['Your MacBook', 'always online.'],
    ['Your agents', 'always working.'],
    ['Your tasks', 'always running.'],
  ];
  const a = rt.querySelector('[data-r1]');
  const b = rt.querySelector('[data-r2]');
  let i = 0;
  setInterval(() => {
    rt.classList.add('is-swap');
    setTimeout(() => {
      i = (i + 1) % sets.length;
      a.textContent = sets[i][0];
      b.textContent = sets[i][1];
      rt.classList.remove('is-swap');
    }, 460);
  }, 3200);
})();

// Mobile hero: show the email field only after tapping the CTA
(() => {
  const wl = document.querySelector('.wl-hero');
  const reveal = wl && wl.querySelector('.wl-reveal');
  if (!reveal) return;
  let saved = null;
  try { saved = localStorage.getItem('onair_wl_email'); } catch (e) {}
  if (matchMedia('(max-width: 640px)').matches && !saved) {
    wl.classList.add('is-collapsed');
  }
  reveal.addEventListener('click', () => {
    wl.classList.remove('is-collapsed');
    const inp = wl.querySelector('.wl-input');
    if (inp) inp.focus();
  });
})();
