# WipeAway Canada

Production source for https://wipeaway.ca — commercial wipe dispensers, refills, signs and specialty products.

## Development

Requires Node.js 22.13+ and pnpm 11.25.0.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

For portable checkouts, the dev script uses Vinext. The Sites environment configures its managed execution profile automatically. Do not commit `.sites-runtime`, credentials, `.env` files, `node_modules` or generated deployment output.

```sh
pnpm exec tsc --noEmit
pnpm build
python3 scripts/qa-site.py http://localhost:5173
```

The QA script accepts the actual running preview URL as its argument and crawls sitemap pages, links, images and legacy URLs.

## Content and routes

- `app/page.tsx`: homepage and buyer FAQs.
- `app/content.ts`: products, city content and articles.
- `app/[...slug]/page.tsx`: product catalog, categories, location pages, articles and quote route.
- `app/quote-form.tsx`: browser form submission with loading, failure and success feedback.
- `app/sitemap.ts` and `app/robots.ts`: crawler discovery.
- `public/legacy-assets`: existing brand and product images.

Public quote submissions use the existing Formspree endpoint `https://formspree.io/f/xdeownaz`. Its identifier is public; inbox routing is managed in Formspree. A successful submission response does not independently verify delivery to the destination mailbox. Confirm delivery with an owner-controlled test after deployment.

The site currently serves English content. French versions should be completed before adding French alternate-language links. No prices, delivery guarantees, product certifications or new client endorsements have been invented.

## October 27, 2026 review

Added product comparison and homepage buying guidance, category-to-quote model selection, structured breadcrumbs, organization identity, social preview defaults and accurate article publication dates. Corrected the misspelled article slug with a permanent redirect. Extra path segments now return 404 instead of duplicate content. Updated navigation, keyboard focus, skip links, reduced-motion handling, mobile layouts and form feedback. Standardized dependency management on pnpm.

Publication is managed with OpenAI Sites using `.openai/hosting.json`. The default Sites build produces a server Worker. For WHC/cPanel, use the dedicated static export described below.

## WHC / cPanel deployment

Keep the existing hosting and DNS. Run `pnpm build:whc` and `pnpm verify:whc`. The isolated build writes all 42 public pages and assets into `whc-dist/`, with Apache/LiteSpeed legacy redirect rules and a 404 page. It does not change the Sites runtime.

1. In cPanel Domains, identify WipeAway.ca’s exact document root; do not assume it is the account-wide `public_html`.
2. Back up that directory and its current `.htaccess` before deployment.
3. Upload the contents of `whc-dist/` into that document root. Preserve unrelated files, domain-verification files, mail settings and existing host configuration. Merge the supplied redirect/error-page rules with the existing `.htaccess`; do not blindly replace host-specific directives.
4. Retain old `_next/static` assets during rollout so existing browser sessions keep working. Update the generated HTML and matching new assets together. Purge hosting/CDN page cache if enabled.
5. Verify homepage buyer FAQs, `/products/`, `/order/?product=Quadrato`, the sitemap, legacy redirects and a missing URL. Send an owner-controlled quote request and confirm inbox delivery.

No hosting credentials are included. Building a package does not deploy it to WHC.
