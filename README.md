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

**Never edit** `index.html`, `fr/`, `product-catalogue/`, `sitemap.xml` or `robots.txt`: they are generated. Run `python3 build.py` after any change.

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

## Client preview (GitHub Pages)

Every push to `main` rebuilds and deploys the preview via `.github/workflows/pages.yml`.
Pages serves it under `/<repo-name>/`, so the workflow builds with `SITE_BASE=/<repo-name>` (which also adds `noindex`).
Locally, `python3 build.py` (no `SITE_BASE`) builds for the domain root as usual.

## Deploying to alimentsjoeandray.com

1. `python3 build.py` (no `SITE_BASE`): pages are built for the domain root, indexable, with canonical and hreflang URLs on `https://alimentsjoeandray.com` (`site.url` in `copy.json`).
2. Upload these to the web root: `index.html`, `fr/`, `product-catalogue/`, `assets/`, `sitemap.xml`, `robots.txt`. Nothing else is needed (no server code, no database).
3. `/product-catalogue/` keeps the old site's URL, so existing links keep working.
4. After launch: send one real test message through the form, submit `sitemap.xml` in Google Search Console, and in Web3Forms optionally restrict the key to the `alimentsjoeandray.com` domain.

The GitHub Pages copy is a preview only: it is built with `SITE_BASE=/<repo-name>`, which adds `noindex` and a `robots.txt` that blocks crawlers.
