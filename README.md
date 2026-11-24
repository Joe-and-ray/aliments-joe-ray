# Les Aliments Joe & Ray: website

Static, bilingual (EN/FR) site. No framework, no dependencies: Python 3 stdlib builds it, any static host serves it.

```bash
python3 build.py                 # regenerate all pages
python3 -m http.server 4321      # preview at http://localhost:4321
```

## Where things live

| You want to change…                 | Edit                                   |
|-------------------------------------|----------------------------------------|
| Any text, EN or FR                  | `content/copy.json` (every string is `{"en": …, "fr": …}`) |
| Phone, address, fax, contact form   | `content/copy.json` → `site`           |
| Products in the catalogue           | `content/catalogue.csv`                |
| A catalogue category's FR name      | `content/copy.json` → `catalogue.categories` |
| Look and feel                       | `assets/css/site.css` (tokens at top)  |
| Behaviour                           | `assets/js/site.js`                    |
| Page structure / sections           | `build.py` (`home()`, `catalogue()`)   |

**Never edit** `index.html`, `fr/`, `product-catalogue/`, `404.html`, `sitemap.xml`, `robots.txt` or `_site/`: they are generated. Run `python3 build.py` after any change.

## Updating the catalogue

`content/catalogue.csv`, one product per row:

```csv
category,name,code,image
Cheese,BURRATA NONNO NANNI ( 8 x125 g ),FRMG-MAC-0002,
```

- **Add**: append a row. **Remove**: delete the row. **Rename / recode**: edit in place. Rows are sorted automatically.
- `category` must match an existing one exactly. A new category also needs an entry in `copy.json` → `catalogue.categories` (the build warns if it's missing).
- `image` is optional: a path like `/assets/img/products/burrata.jpg`. Leave empty until a photo exists.
- Names stay as the supplier writes them; the build title-cases ALL-CAPS names for display. Search still matches the raw name and the code.

## UI states (explicit, inspectable)

Every interactive piece keeps its state in a DOM attribute, so CSS styles it, and tests or agents can read it:

| Element               | Attribute          | States                                    |
|-----------------------|--------------------|-------------------------------------------|
| `<html>`              | `data-scrolled`    | present once the page is scrolled         |
| `#menu` (mobile nav)  | native `popover`   | `:popover-open`                           |
| `.form` (contact)     | `data-state`       | `idle → sending → sent \| error`          |
| `#catalogue`          | `data-state`       | `results \| empty`; filters live in the URL (`?q=&cat=`) |
| `.code` (item code)   | `data-state`       | `idle → copied → idle`                    |
| FAQ                   | native `<details name="faq">` | one open at a time              |
| Acqua eVa release     | `data-state` on each row | `scheduled \| later`               |

Deep links: `/product-catalogue/?q=burrata&cat=cheese`, `/?message=Hello#contact` (prefills the form).

## Home page

Order: hero (full-width photo, headline and three stats) → brand logos → about → services → products → reviews → wholesale → coming soon (Acqua eVa) → FAQ → contact. The hero stats and their order come from `trust.items` / `trust.hero_order` in `copy.json`.

The products grid shows every item in `products.items` (4 per row, square photos). The featured product photos in `assets/img/products/` are square, text-free versions of the client's product posters, regenerated with Higgsfield (GPT Image 2.6). The About photo `assets/img/history.jpg` is an AI composite of the two archive van photos; have the client approve it before launch. Social links live in `site.social` in `copy.json`.

Photos `hero-full.webp` (hero) and `wholesale-chef.jpg` (wholesale) were supplied by the client team. Google reviews in `copy.json` → `reviews.google` are copied verbatim from the Google Business listing; update `rating`/`count` there when it changes.

## Contact form

The form posts to [Web3Forms](https://web3forms.com) (`site.form_endpoint` and `site.form_access_key` in `copy.json`). Messages are emailed to the address registered with that access key; the subject line is `contact.email_subject`. The key is public by design. A hidden `botcheck` box catches spam bots. Without JavaScript the form still posts straight to Web3Forms.

## Deploying (Cloudflare Pages)

`python3 build.py` writes `_site/`: exactly the folder that goes online (pages, assets, `404.html`, `sitemap.xml`, `robots.txt`, `_headers` with security headers, `_redirects` for the old WordPress URLs). Sources, notes and the build script stay private.

One-time setup in Cloudflare (Workers & Pages → Create → Pages → Connect to Git):

| Setting | Value |
|---|---|
| Repository | the client's GitHub repository |
| Production branch | `main` → https://alimentsjoeandray.com |
| Build command | `python3 build.py` |
| Build output directory | `_site` |
| Preview branches | `staging` only (sandbox: `https://staging.<project>.pages.dev`) |

Then: add the custom domains `alimentsjoeandray.com` and `www.alimentsjoeandray.com` (redirect `www` to the apex with a Cloudflare redirect rule), turn on Web Analytics for the project, verify the domain in Google Search Console (DNS record in Cloudflare) and submit `https://alimentsjoeandray.com/sitemap.xml`. Optionally restrict the Web3Forms key to the domain. Write the real sandbox URL into `AGENTS.md` section 3.

Day-to-day changes follow `AGENTS.md`: edit on `staging` → check the sandbox → merge to `main` only when the owner says "push it live".

The old WordPress site had only `/` and `/product-catalogue/` (both kept); its leftover `/hello-world/` and `/category/…` URLs redirect to the home page.

`.github/workflows/pages.yml` is the design agency's GitHub Pages preview (built with `SITE_BASE=/<repo-name>`, `noindex`). It only runs in the agency repository.
