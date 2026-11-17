// Les Aliments Joe & Ray. Progressive enhancement only: every page works without this file.
// Each UI state machine is written to a data-state attribute so CSS, tests and agents can read it.
//   html[data-hero]                     full | boxed      (set in <head> from ?hero=, before paint)
//   html[data-scrolled]                 header: top -> scrolled
//   .form[data-state]                   idle -> sending -> sent | error   (error -> sending on retry, sent -> idle on reset)
//                                       placeholder endpoint (YOUR_FORM_ID) -> simulated "sent", nothing delivered
//   #catalogue[data-state]              results | empty                    (derived from ?q=&cat=)
//   .code[data-state]                   idle -> copied -> idle (1.6s)
"use strict";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const fold = (s) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase(); // must match fold() in build.py
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

document.addEventListener("DOMContentLoaded", () => {
  header();
  menu();
  carousel();
  contactForm();
  catalogue();
});

function header() {
  const set = () => document.documentElement.toggleAttribute("data-scrolled", scrollY > 8);
  set();
  addEventListener("scroll", set, { passive: true });
}

function menu() {
  const nav = $("#menu");
  if (!nav) return;
  // anchor links inside the full-screen menu should close it
  nav.addEventListener("click", (e) => { if (e.target.closest("a") && nav.matches(":popover-open")) nav.hidePopover(); });
}

function carousel() {
  const rail = $("#quotes"), ctrl = $('[data-rail-ctrl="quotes"]');
  if (!rail || !ctrl) return;
  const [prev, next] = $$("button", ctrl);
  const go = (dir) => rail.scrollBy({ left: dir * (rail.firstElementChild.offsetWidth + 16), behavior: "smooth" });
  const sync = () => {
    prev.disabled = rail.scrollLeft < 4;
    next.disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4;
  };
  ctrl.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) go(+b.dataset.dir); });
  rail.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); go(e.key === "ArrowRight" ? 1 : -1); }
  });
  rail.addEventListener("scroll", sync, { passive: true });
  addEventListener("resize", sync);
  sync();
}

function contactForm() {
  const form = $(".form");
  if (!form) return;
  const msg = new URLSearchParams(location.search).get("message");
  if (msg) form.message.value = msg;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (form.dataset.state === "sending") return;
    form.dataset.state = "sending";
    try {
      const endpoint = form.dataset.endpoint;
      if (!endpoint) throw new Error("No form endpoint configured (content/copy.json site.form_endpoint)");
      // TODO(launch): real Formspree ID needed. Placeholder endpoint = prototype mode: fake success, nothing is sent.
      if (endpoint.includes("YOUR_FORM_ID")) {
        console.warn("[contact form] Placeholder endpoint: simulated send, message NOT delivered. Set site.form_endpoint in content/copy.json.");
        await new Promise((r) => setTimeout(r, 700));
        form.dataset.state = "sent";
        form.reset();
        return;
      }
      const res = await fetch(endpoint, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error("HTTP " + res.status);
      form.dataset.state = "sent";
      form.reset();
    } catch (err) {
      console.warn("[contact form]", err);
      form.dataset.state = "error";
    }
  });
  form.addEventListener("click", (e) => {
    if (e.target.closest('[data-action="reset"]')) { form.dataset.state = "idle"; form.name.focus(); }
  });
}

function catalogue() {
  const root = $("#catalogue");
  if (!root) return;
  const input = root.q, out = $(".showing", root);
  const groups = $$(".cat-group", root).map((g) => ({
    el: g, slug: g.dataset.cat, n: $("[data-n]", g),
    items: $$(".item", g).map((el) => ({ el, s: el.dataset.s, name: $(".item-name", el), raw: $(".item-name", el).textContent })),
  }));
  const total = groups.reduce((a, g) => a + g.items.length, 0);
  const chips = Object.fromEntries($$(".cat-chip", root).map((c) => [c.querySelector("input").value, c]));

  // state comes from the URL so results are linkable and Back works
  const params = new URLSearchParams(location.search);
  input.value = params.get("q") || "";
  const startCat = params.get("cat") || "";
  (root.querySelector(`input[name=cat][value="${CSS.escape(startCat)}"]`) || root.cat[0]).checked = true;

  let lastQ = null;
  function render() {
    const q = input.value.trim();
    const cat = root.cat.value;
    const terms = fold(q).split(/\s+/).filter(Boolean);
    const rx = terms.length ? new RegExp("(" + terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")", "gi") : null;
    let shown = 0;
    const perCat = {};
    for (const g of groups) {
      let n = 0;
      for (const it of g.items) {
        const hit = terms.every((t) => it.s.includes(t));
        it.el.hidden = !hit || (cat && cat !== g.slug);
        if (hit) n++;
        if (q !== lastQ) it.name.innerHTML = rx && hit ? highlight(it.raw, rx) : esc(it.raw);
      }
      perCat[g.slug] = n;
      const visible = n > 0 && (!cat || cat === g.slug);
      g.el.hidden = !visible;
      g.n.textContent = n;
      if (visible) shown += n;
    }
    // category chips show how many hits each would give, and dim when it would give none
    let all = 0;
    for (const [slug, chip] of Object.entries(chips)) {
      if (!slug) continue;
      chip.querySelector(".n").textContent = perCat[slug];
      chip.toggleAttribute("data-empty", perCat[slug] === 0);
      all += perCat[slug];
    }
    chips[""].querySelector(".n").textContent = all;
    lastQ = q;

    root.dataset.state = shown ? "results" : "empty";
    out.textContent = root.dataset.showing.replace("{n}", shown).replace("{total}", total);
    if (!shown) {
      $(".empty-title", root).textContent = root.dataset.emptyTitle.replace("{q}", q);
      const ask = $(".empty-ask", root);
      ask.href = `${root.dataset.home}?message=${encodeURIComponent(`${root.dataset.itemPrefix}: ${q}`)}#contact`;
    }
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (cat) p.set("cat", cat);
    history.replaceState(null, "", p.toString() ? "?" + p : location.pathname);
  }

  // accent-insensitive highlight: map folded match positions back onto the original string
  function highlight(raw, rx) {
    const f = fold(raw);
    if (f.length !== raw.length) return esc(raw); // ponytail: skip highlight when folding changes length (rare ligatures)
    let html = "", last = 0;
    for (const m of f.matchAll(rx)) {
      html += esc(raw.slice(last, m.index)) + "<mark>" + esc(raw.slice(m.index, m.index + m[0].length)) + "</mark>";
      last = m.index + m[0].length;
    }
    return html + esc(raw.slice(last));
  }

  root.addEventListener("input", render);
  root.addEventListener("submit", (e) => { e.preventDefault(); input.blur(); });
  root.addEventListener("reset", () => setTimeout(() => { root.cat[0].checked = true; render(); input.focus(); }));
  // scroll the chip rail only (scrollIntoView would also scroll the page)
  const rail = $(".cats", root);
  const showChip = () => {
    const chip = root.querySelector("input[name=cat]:checked").closest(".cat-chip");
    rail.scrollTo({ left: chip.offsetLeft - (rail.clientWidth - chip.offsetWidth) / 2, behavior: "smooth" });
  };
  root.addEventListener("change", (e) => {
    if (e.target.name !== "cat") return;
    render();
    showChip();
    if (scrollY > root.offsetTop - 140) scrollTo({ top: root.offsetTop - 140, behavior: "smooth" });
  });

  root.addEventListener("click", async (e) => {
    const btn = e.target.closest(".code");
    if (!btn) return;
    try { await navigator.clipboard.writeText(btn.dataset.copy); } catch { return; }
    btn.dataset.state = "copied";
    clearTimeout(btn._t);
    btn._t = setTimeout(() => (btn.dataset.state = "idle"), 1600);
  });

  render();
  if (startCat) showChip();
}
