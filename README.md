# onAir 5G: pre-launch waitlist page (draft)

This page uses the same layout and visual style as https://natura.inc/interface. The brief also mentioned natura.in/interface (parking page) and natura.link/interface: natura.link is not a registered domain (NXDOMAIN, checked 2026-11-17), so natura.inc/interface is the only live reference.
It is a static page with no build step. Provisional live copy (2026-11-17): https://lorenzofilibertoferraris.github.io/onair-landing/ (repo lorenzofilibertoferraris/onair-landing, public, GitHub Pages from main). Target domain onair.rollingsquare.com: DNS is at one.com (no credentials on this Mac); needs CNAME onair → lorenzofilibertoferraris.github.io, then set the custom domain in repo Settings → Pages.

## Open it locally
- Double-click `index.html`, or run `open index.html` from this folder.
- To get a local server: `python3 -m http.server 8080`, then go to http://localhost:8080
- Press **D** to show or hide the yellow placeholder markers and the draft banner.

## Files
- `index.html`: the page structure (10 sections and the footer)
- `styles.css`: colours, fonts, spacing and responsive layout
- `main.js`: nav, image gallery, specs tabs, FAQ, video autoplay and scroll reveal
- `assets/img/`: images from `../deck/render-*.png` converted to JPEG, plus the app panel
- `assets/icons/`: icons from `../deck/icon-*-blue.png`
- Hero video: a striped **placeholder** box. The final file comes from Nicola (do not generate one). Save it as `assets/video/hero.mp4` (+ optional `hero-mobile.mp4`), remove `.hero-video-slot` and uncomment the `<video>` block in `index.html`.
- Film slot and CTA band show still renders until their videos exist.

## Before publishing
- Drop in the hero video from Nicola, plus the film slot and CTA band videos when available.
- Fonts: the page loads Restora and ATC Arquette from the fonts installed on this Mac (`local()`). Online it will need licensed woff2 files.
- Fill in every `.todo` item and every `<!-- TODO -->` comment, and set the real links (`data-todo-link`).
- Remove the draft banner and `<meta name="robots" content="noindex">`.
- Check the public claims against the pre-NDA rules in PARTNER-MEETINGS.md. The page does not name the module, the partners, volumes or prices.

## Waitlist + $20 deposit (pre-launch)
Offer: retail $300 → $199 for waitlist members who pay a $20 deposit (counts toward the price; $179 due at launch).
- Price card + email form in the product hero (`#reserve-top`), full waitlist block `#waitlist` (price breakdown, 3 steps, form), sticky offer bar, deposit FAQs (09-12), final CTA band.
- Flow: email → (Klaviyo subscribe) → step 2 "Pay the $20 deposit" button → checkout → back to `?deposit=success` (shows "Deposit received").
- All endpoints live in `ONAIR_CONFIG` at the top of `main.js`:
  - `klaviyoListId`: empty = DRAFT mode (nothing is sent). Create an "onAir 5G Waitlist" list in Klaviyo and paste its ID. Public key `RpgkGY` is already set.
  - `depositUrl`: empty = placeholder button. Paste a Stripe Payment Link (or Shopify product URL) for the $20 deposit. Stripe links get `?prefilled_email=` automatically. Set its success redirect to `<page URL>?deposit=success`.
- Refund policy, shipping/taxes note and launch date are marked TODO.
