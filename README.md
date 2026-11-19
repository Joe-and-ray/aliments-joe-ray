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
| Phone, address, fax, form endpoint  | `content/copy.json` → `site`           |
| Products in the catalogue           | `content/catalogue.csv`                |
| A catalogue category's FR name      | `content/copy.json` → `catalogue.categories` |
| Look and feel                       | `assets/css/site.css` (tokens at top)  |
| Behaviour                           | `assets/js/site.js`                    |
| Page structure / sections           | `build.py` (`home()`, `catalogue()`)   |

**Never edit** `index.html`, `fr/`, `product-catalogue/` or `sitemap.xml`: they are generated. Run `python3 build.py` after any change.

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

## Hero layouts

Two hero layouts share one markup: `full` (photo edge to edge behind the headline) and `boxed` (text left, photo in a rounded frame right).

Home page order: hero → brand logos → about → trust bar → services → products mosaic → reviews → wholesale → coming soon (Acqua eVa) → FAQ → contact. The products mosaic shows every item in `products.items`; tile sizes come from position (1st is the large tile), so keep it at 8 items or adjust `.mosaic` in `site.css`. The default is `site.hero_layout` in `copy.json`; preview the other with `/?hero=boxed` or `/?hero=full`.

Photos `hero-full.webp` (full-width hero), `hero-boxed.webp` (boxed hero) and `wholesale-chef.jpg` (wholesale) were supplied by the client team. Each hero layout shows its own photo. Google reviews in `copy.json` → `reviews.google` are copied verbatim from the Google Business listing; update `rating`/`count` there when it changes.

## Client preview (GitHub Pages)

Every push to `main` rebuilds and deploys the preview via `.github/workflows/pages.yml`.
Pages serves it under `/<repo-name>/`, so the workflow builds with `SITE_BASE=/<repo-name>` (which also adds `noindex`).
Locally, `python3 build.py` (no `SITE_BASE`) builds for the domain root as usual.

## Before launch

- [ ] **Contact form needs a working hook.** `site.form_endpoint` in `copy.json` is a **placeholder** (`https://formspree.io/f/YOUR_FORM_ID`). While it's there the form runs in prototype mode: it shows "Message sent" but **delivers nothing** (a console warning says so). Before launch, create the Formspree form on the client's inbox, paste its ID, rebuild, and send a real test message. Any service that accepts `POST` FormData and returns 2xx works.
- Deploy the folder root as-is. `/product-catalogue/` keeps the old site's URL.
