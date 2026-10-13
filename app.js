/* =========================================================================
   Home Improvement Local — frontend logic
   -------------------------------------------------------------------------
   This file works in two modes:

   1. DEMO MODE (default): renders from the SEED data below. No backend needed.
      Great for previewing locally or hosting as a static site.

   2. LIVE AIRTABLE MODE: if window.HIL_CONFIG (see config.js) contains your
      Airtable base ID + a read-only token + table names, the page fetches
      categories, reviews and professionals live from Airtable and the job form POSTs
      new leads straight into your "Jobs" table.

   SECURITY NOTE: A real published site must NOT ship an Airtable PAT in the
   browser. Either (a) build the public site with Softr (it handles auth
   server-side), or (b) put the token behind a tiny serverless proxy and point
   `apiBase` at that proxy. The direct-token path below is for local demos only.
   ========================================================================= */

(function () {
  "use strict";

  // ---- Config (overridable via config.js loaded before this file) ----
  var CONFIG = window.HIL_CONFIG || {};
  var AIRTABLE = CONFIG.airtable || {};
  var USE_AIRTABLE = !!(AIRTABLE.baseId && AIRTABLE.token);
  var API = (AIRTABLE.apiBase || "https://api.airtable.com/v0") + "/" + (AIRTABLE.baseId || "");

  // ---- Seed data (used when Airtable is not configured) ----
  var SEED_CATEGORIES = [
    { icon: "🔧", name: "Plumbing", count: "1,200+ professionals" },
    { icon: "💡", name: "Electrician", count: "980+ professionals" },
    { icon: "🏠", name: "Roofing", count: "640+ professionals" },
    { icon: "🛁", name: "Bathroom Fitting", count: "720+ professionals" },
    { icon: "🎨", name: "Painter / Decorator", count: "1,050+ professionals" },
    { icon: "🌿", name: "Gardener / Landscaping", count: "560+ professionals" },
    { icon: "🧱", name: "Builder", count: "810+ professionals" },
    { icon: "🪵", name: "Carpenter", count: "490+ professionals" },
    { icon: "🚪", name: "Handyman", count: "1,400+ professionals" },
    { icon: "🔥", name: "Heating / HVAC", count: "430+ professionals" },
    { icon: "🪟", name: "Windows / Glazing", count: "380+ professionals" },
    { icon: "🌳", name: "Tree Surgeon", count: "260+ professionals" }
  ];

  var SEED_REVIEWS = [
    { stars: 5, text: "Sorted our leaking kitchen tap the same day. Reliable, tidy and fair price.", author: "Sarah M.", loc: "Manchester" },
    { stars: 5, text: "Rewired our extension and explained everything clearly. Proper professional.", author: "James T.", loc: "Birmingham" },
    { stars: 5, text: "New bathroom fitted on schedule. Communication was excellent throughout.", author: "Priya K.", loc: "Leeds" },
    { stars: 5, text: "Garden landscaped beautifully. Turned up when they said they would.", author: "Daniel R.", loc: "Bristol" },
    { stars: 5, text: "Roof repair after storm damage — fast, clean and guaranteed.", author: "Emma L.", loc: "Leeds" },
    { stars: 5, text: "Painting and decorating done to a high standard. Would hire again.", author: "Tom B.", loc: "Glasgow" }
  ];

  // ---- Helpers ----
  function el(id) { return document.getElementById(id); }
  function stars(n) { return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n); }

  function renderCategories(list) {
    var grid = el("cat-grid");
    var select = el("category");
    grid.innerHTML = "";
    list.forEach(function (c) {
      var card = document.createElement("a");
      card.href = "#post";
      card.className = "cat-card";
      card.innerHTML =
        '<div class="cat-icon">' + c.icon + '</div>' +
        '<div class="cat-name">' + c.name + '</div>' +
        '<div class="cat-count">' + (c.count || "") + '</div>';
      card.addEventListener("click", function () {
        if (select) {
          // try to match an option
          var opt = Array.prototype.find.call(select.options, function (o) { return o.text === c.name; });
          if (opt) select.value = opt.value;
        }
      });
      grid.appendChild(card);

      if (select && !Array.prototype.find.call(select.options, function (o) { return o.text === c.name; })) {
        var o = document.createElement("option");
        o.value = c.name; o.text = c.name;
        select.appendChild(o);
      }
    });
  }

  function renderReviews(list) {
    var grid = el("review-grid");
    grid.innerHTML = "";
    list.forEach(function (r) {
      var card = document.createElement("div");
      card.className = "review-card";
      card.innerHTML =
        '<div class="review-stars">' + stars(r.stars || 5) + '</div>' +
        '<p class="review-text">"' + r.text + '"</p>' +
        '<div class="review-author">' + r.author + '</div>' +
        '<div class="review-loc">' + (r.loc || "") + '</div>';
      grid.appendChild(card);
    });
  }

  // ---- Airtable (optional) ----
  function airtableHeaders() {
    return { "Authorization": "Bearer " + AIRTABLE.token, "Content-Type": "application/json" };
  }

  function fetchTable(table, max) {
    var url = API + "/" + encodeURIComponent(table) + "?pageSize=" + (max || 100);
    return fetch(url, { headers: airtableHeaders() }).then(function (r) {
      if (!r.ok) throw new Error("Airtable " + r.status);
      return r.json();
    }).then(function (d) { return d.records || []; });
  }

  function loadFromAirtable() {
    var catsTable = AIRTABLE.tables && AIRTABLE.tables.categories;
    var revTable = AIRTABLE.tables && AIRTABLE.tables.reviews;
    var jobs = [];
    if (catsTable) {
      fetchTable(catsTable).then(function (recs) {
        var list = recs.map(function (r) {
          var f = r.fields || {};
          return { icon: f.Icon || "🔧", name: f.Name || f["Trade"], count: f.Count || "" };
        }).filter(function (c) { return c.name; });
        if (list.length) renderCategories(list);
      }).catch(function (e) { console.warn("Categories load failed, using seed:", e); });
    }
    if (revTable) {
      fetchTable(revTable).then(function (recs) {
        var list = recs.map(function (r) {
          var f = r.fields || {};
          return { stars: f.Rating || 5, text: f.Review || f.Text || "", author: f.Author || f.Name || "", loc: f.Location || "" };
        }).filter(function (x) { return x.text; });
        if (list.length) renderReviews(list);
      }).catch(function (e) { console.warn("Reviews load failed, using seed:", e); });
    }
  }

  function submitToAirtable(fields) {
    var table = AIRTABLE.tables && AIRTABLE.tables.jobs;
    if (!table) return Promise.reject(new Error("no-jobs-table"));
    return fetch(API + "/" + encodeURIComponent(table), {
      method: "POST",
      headers: airtableHeaders(),
      body: JSON.stringify({ fields: fields, typecast: true })
    }).then(function (r) {
      if (!r.ok) throw new Error("Airtable " + r.status);
      return r.json();
    });
  }

  // ---- Form handling ----
  // Netlify Forms: the form submits NATIVELY (method=POST, action="/") so
  // Netlify's endpoint stores the lead. We DON'T preventDefault — we only
  // show an inline status after Netlify's own success redirect posts back.
  function handleSubmit(e) {
    // Allow native submission to proceed (Netlify intercepts it).
    var status = el("form-status");
    status.className = "form-status";
    status.textContent = "Sending…";
    // The browser performs the real POST to Netlify; on return Netlify
    // reloads the page (or its success page) and we read ?success below.
  }

  // Show confirmation if Netlify redirected back with ?success (or after POST).
  if (location.search.indexOf("success") !== -1) {
    var s = el("form-status");
    if (s) {
      s.className = "form-status ok";
      s.textContent = "✓ Thanks! Your job is live and local professionals will be in touch soon.";
    }
  }

  function goToPost(e) {
    e.preventDefault();
    var q = el("q").value.trim();
    var loc = el("loc").value.trim();
    // prefill post form
    if (q) el("description").value = q;
    if (loc) el("location").value = loc;
    el("post").scrollIntoView({ behavior: "smooth" });
    return false;
  }

  // ---- Init ----
  function init() {
    el("year").textContent = new Date().getFullYear();
    if (USE_AIRTABLE) {
      loadFromAirtable();
    } else {
      renderCategories(SEED_CATEGORIES);
      renderReviews(SEED_REVIEWS);
    }
    el("job-form").addEventListener("submit", handleSubmit);
    el("hero-search").addEventListener("submit", goToPost);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
