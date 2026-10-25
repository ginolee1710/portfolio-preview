(function () {
  'use strict';
  var root = document.documentElement;

  // Theme toggle
  var themeBtn = document.querySelector('.theme-toggle');
  function syncThemeLabel() {
    var dark = root.getAttribute('data-theme') === 'dark';
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  }
  syncThemeLabel();
  themeBtn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    syncThemeLabel();
  });

  // Mobile nav
  var navToggle = document.querySelector('.nav-toggle');
  var navLinks = document.getElementById('nav-links');
  navToggle.addEventListener('click', function () {
    var open = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  navLinks.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Timeline expand / collapse
  var items = Array.prototype.slice.call(document.querySelectorAll('.tl-item'));
  function setOpen(item, open) {
    item.classList.toggle('is-open', open);
    item.querySelector('.tl-head').setAttribute('aria-expanded', String(open));
  }
  items.forEach(function (item) {
    item.querySelector('.tl-head').addEventListener('click', function () {
      setOpen(item, !item.classList.contains('is-open'));
      syncToggleAll();
    });
  });
  var toggleAll = document.getElementById('toggle-all');
  function syncToggleAll() {
    var allOpen = items.every(function (i) { return i.classList.contains('is-open'); });
    toggleAll.textContent = allOpen ? 'Collapse all' : 'Expand all';
    toggleAll.setAttribute('aria-pressed', String(allOpen));
  }
  toggleAll.addEventListener('click', function () {
    var allOpen = items.every(function (i) { return i.classList.contains('is-open'); });
    items.forEach(function (i) { setOpen(i, !allOpen); });
    syncToggleAll();
  });

  // Skill filters
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
  var skills = Array.prototype.slice.call(document.querySelectorAll('#skills-grid li'));
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.getAttribute('data-filter');
      chips.forEach(function (c) {
        var on = c === chip;
        c.classList.toggle('is-active', on);
        c.setAttribute('aria-pressed', String(on));
      });
      skills.forEach(function (s) {
        var areas = (s.getAttribute('data-area') || '').split(' ');
        s.classList.toggle('hidden', f !== 'all' && areas.indexOf(f) === -1);
      });
    });
  });

  // Active nav link on scroll
  if ('IntersectionObserver' in window) {
    var links = {};
    Array.prototype.forEach.call(navLinks.querySelectorAll('a'), function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && links[en.target.id]) {
          Object.keys(links).forEach(function (k) { links[k].classList.remove('active'); });
          links[en.target.id].classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
  }

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ========== Portfolio interactives ========== */

  // Generic tab/stepper helper
  function initStepper(rootEl) {
    var tabs = Array.prototype.slice.call(rootEl.querySelectorAll('.stepper-tabs [role="tab"]'));
    var panels = Array.prototype.slice.call(rootEl.querySelectorAll('.step-panel'));
    var dots = Array.prototype.slice.call(rootEl.querySelectorAll('.step-dots .dot'));
    var prev = rootEl.querySelector('.step-prev');
    var next = rootEl.querySelector('.step-next');
    var current = 0;
    var n = panels.length;

    function go(i) {
      if (i < 0 || i >= n) return;
      current = i;
      tabs.forEach(function (t, idx) {
        var on = idx === current;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (p, idx) {
        var on = idx === current;
        p.classList.toggle('is-active', on);
        if (on) p.removeAttribute('hidden');
        else p.setAttribute('hidden', '');
      });
      dots.forEach(function (d, idx) {
        d.classList.toggle('is-active', idx === current);
        if (idx === current) d.setAttribute('aria-current', 'step');
        else d.removeAttribute('aria-current');
      });
      if (prev) prev.disabled = current === 0;
      if (next) next.disabled = current === n - 1;
    }

    tabs.forEach(function (t) {
      t.addEventListener('click', function () { go(+t.getAttribute('data-step')); });
      t.addEventListener('keydown', function (e) {
        var i = current;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); go(Math.min(n - 1, i + 1)); tabs[Math.min(n - 1, i + 1)].focus(); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); go(Math.max(0, i - 1)); tabs[Math.max(0, i - 1)].focus(); }
        if (e.key === 'Home') { e.preventDefault(); go(0); tabs[0].focus(); }
        if (e.key === 'End') { e.preventDefault(); go(n - 1); tabs[n - 1].focus(); }
      });
    });
    dots.forEach(function (d) {
      d.addEventListener('click', function () { go(+d.getAttribute('data-step')); });
    });
    if (prev) prev.addEventListener('click', function () { go(current - 1); });
    if (next) next.addEventListener('click', function () { go(current + 1); });

    // Touch swipe on panels
    var panelsWrap = rootEl.querySelector('.stepper-panels');
    if (panelsWrap) {
      var sx = 0;
      panelsWrap.addEventListener('touchstart', function (e) { sx = e.changedTouches[0].screenX; }, { passive: true });
      panelsWrap.addEventListener('touchend', function (e) {
        var dx = e.changedTouches[0].screenX - sx;
        if (Math.abs(dx) > 50) go(dx < 0 ? current + 1 : current - 1);
      }, { passive: true });
    }

    go(0);
    return { go: go };
  }

  function initTabs(rootEl) {
    var tabs = Array.prototype.slice.call(rootEl.querySelectorAll('.tab-list [role="tab"]'));
    var panels = Array.prototype.slice.call(rootEl.querySelectorAll('.tab-panel'));
    function go(i) {
      tabs.forEach(function (t, idx) {
        var on = idx === i;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (p, idx) {
        var on = idx === i;
        p.classList.toggle('is-active', on);
        if (on) p.removeAttribute('hidden');
        else p.setAttribute('hidden', '');
      });
    }
    tabs.forEach(function (t) {
      t.addEventListener('click', function () { go(+t.getAttribute('data-tab')); });
      t.addEventListener('keydown', function (e) {
        var i = tabs.indexOf(t);
        if (e.key === 'ArrowRight') { e.preventDefault(); var n = (i + 1) % tabs.length; go(n); tabs[n].focus(); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); var p = (i - 1 + tabs.length) % tabs.length; go(p); tabs[p].focus(); }
      });
    });
    go(0);
  }

  /* --- Carlsberg ladder (synthetic HKD) --- */
  var LADDER = {
    '1kc': {
      label: 'per can · 1KC',
      brands: [
        { name: 'Carlsberg', sub: 'Danish Pilsner', prices: [14.9, 12.9, 11.9, 9.9] },
        { name: 'Heineken', sub: 'same segment', prices: [15.9, 13.9, 12.5, 10.9] },
        { name: 'Budweiser', sub: 'same segment', prices: [13.9, 11.9, 10.9, 9.5] }
      ]
    },
    '4pk': {
      label: 'per can equiv · 4-pack',
      brands: [
        { name: 'Carlsberg', sub: 'Danish Pilsner', prices: [12.5, 11.0, 10.0, 8.8] },
        { name: 'Heineken', sub: 'same segment', prices: [13.2, 11.8, 10.8, 9.5] },
        { name: 'Budweiser', sub: 'same segment', prices: [11.8, 10.5, 9.8, 8.5] }
      ]
    },
    '6pk': {
      label: 'per can equiv · 6-pack',
      brands: [
        { name: 'Carlsberg', sub: 'Danish Pilsner', prices: [11.5, 10.2, 9.3, 8.2] },
        { name: 'Heineken', sub: 'same segment', prices: [12.2, 10.9, 9.9, 8.8] },
        { name: 'Budweiser', sub: 'same segment', prices: [10.9, 9.7, 8.9, 7.9] }
      ]
    }
  };
  var TIERS = ['EDLP', 'PSP1', 'PSP2', 'PSP3'];

  function renderLadder(pack) {
    var chart = document.getElementById('ladder-chart');
    if (!chart) return;
    var data = LADDER[pack];
    var max = 18;
    var html = '';
    data.brands.forEach(function (b) {
      html += '<div class="ladder-row"><div class="ladder-brand">' + b.name + '<small>' + b.sub + ' · ' + data.label + '</small></div><div class="ladder-bars">';
      b.prices.forEach(function (p, i) {
        var h = Math.round((p / max) * 48);
        var promo = i > 0 ? ' is-promo' : '';
        html += '<div class="bar-cell' + promo + '"><span class="bar" style="height:' + h + 'px"></span><span class="tier">' + TIERS[i] + '</span><span class="price">$' + p.toFixed(1) + '</span></div>';
      });
      html += '</div></div>';
    });
    chart.innerHTML = html;
  }

  var packBtns = Array.prototype.slice.call(document.querySelectorAll('.pack-toggle .seg'));
  packBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      packBtns.forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      renderLadder(btn.getAttribute('data-pack'));
    });
  });
  renderLadder('1kc');

  /* Scenario planning — synthetic directional deltas */
  var tierNames = ['EDLP', 'PSP1', 'PSP2', 'PSP3'];
  var packPushNames = ['Low', 'Medium', 'High'];

  function updateScenario() {
    var tierEl = document.getElementById('sc-tier');
    var freqEl = document.getElementById('sc-freq');
    var packEl = document.getElementById('sc-pack');
    if (!tierEl) return;
    var tier = +tierEl.value;
    var freq = +freqEl.value;
    var pack = +packEl.value;

    document.getElementById('tier-label').textContent = tierNames[tier];
    tierEl.setAttribute('aria-valuetext', tierNames[tier]);
    document.getElementById('freq-label').textContent = String(freq);
    document.getElementById('pack-push-label').textContent = packPushNames[pack];

    // Baseline: PSP2, 6 weeks, med pack push → 0
    // Deeper tier → +vol, -NS quality, -GPAL
    // Higher freq → +vol (diminishing), -GPAL
    // Pack push → +vol quality, +NS, +GPAL
    var vol = (tier - 2) * 3 + (freq - 6) * 1.5 + (pack - 1) * 2;
    var ns = (2 - tier) * 2.5 + (6 - freq) * 0.8 + (pack - 1) * 3;
    var gp = (2 - tier) * 3.5 + (6 - freq) * 1.2 + (pack - 1) * 2.5;

    function fmt(v) {
      if (Math.abs(v) < 0.05) return { text: 'flat', cls: '' };
      var s = (v >= 0 ? '+' : '') + v.toFixed(1) + '%';
      return { text: s, cls: v > 0.3 ? 'up' : v < -0.3 ? 'down' : '' };
    }
    var vF = fmt(vol), nF = fmt(ns), gF = fmt(gp);
    var vEl = document.getElementById('imp-vol');
    var nEl = document.getElementById('imp-ns');
    var gEl = document.getElementById('imp-gp');
    vEl.textContent = vF.text; vEl.className = vF.cls;
    nEl.textContent = nF.text; nEl.className = nF.cls;
    gEl.textContent = gF.text; gEl.className = gF.cls;

    var note = '';
    if (tier >= 3 && freq >= 8) note = 'Deep cuts + high frequency: volume may spike, but net sales and GPAL usually soften — demo pattern.';
    else if (pack >= 2 && tier <= 2) note = 'Strong pack-conversion push with controlled depth: often the cleaner trade-off on volume quality.';
    else if (freq <= 3) note = 'Sparse calendar: less promo noise, but you may leave volume on the table vs peers.';
    else note = 'Nudge the sliders — watch how tier depth, frequency and pack push pull volume vs GPAL in opposite directions.';
    document.getElementById('scenario-note').textContent = note;
  }

  ['sc-tier', 'sc-freq', 'sc-pack'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateScenario);
      el.addEventListener('change', updateScenario);
    }
  });
  updateScenario();

  var carlsbergStepper = document.querySelector('[data-stepper="carlsberg"]');
  if (carlsbergStepper) initStepper(carlsbergStepper);

  /* --- Moonzen chain --- */
  var CHAIN = {
    rm: {
      title: 'Raw material purchase',
      body: 'Malt, hops, yeast and adjuncts — negotiate supplier terms, lead times and quality specs. GM view: cash tied in ingredients vs brew schedule risk.',
      bi: 'BI cue: open POs, inbound ETA, cost/hl vs plan.'
    },
    inv: {
      title: 'Raw materials & finished-goods inventory',
      body: 'Balance cellar / cold-store stock with sell-out. Too thin risks stock-outs; too thick burns working capital and shelf life.',
      bi: 'BI cue: days-of-cover by SKU, ageing lots, RM vs FG split.'
    },
    batch: {
      title: 'Current production batch status',
      body: 'Live view of brews in tank — fermentation stage, gravity checks, holds. Escalations when a batch slips the packaging window.',
      bi: 'BI cue: batches in progress, yield variance, QA holds.'
    },
    pack: {
      title: 'Packaging runs',
      body: 'Can / bottle / keg lines scheduled against demand and tank readiness. Changeovers and mini-runs eat efficiency.',
      bi: 'BI cue: line utilisation, planned vs actual cases, scrap.'
    },
    wh: {
      title: 'Warehousing',
      body: 'Pick-face discipline, FEFO for craft SKUs, space for seasonal peaks and event volumes.',
      bi: 'BI cue: warehouse occupancy, pick accuracy, slow movers.'
    },
    log: {
      title: 'Logistics',
      body: 'Deliveries to on-trade, retail and events — route density, cold-chain and cut-off times.',
      bi: 'BI cue: on-time delivery, cost per drop, failed deliveries.'
    },
    bill: {
      title: 'Billing',
      body: 'Invoice accuracy across B2B accounts, event deposits and online orders — clean billing protects cash collection later.',
      bi: 'BI cue: invoice cycle time, credit notes, dispute rate.'
    },
    ar: {
      title: 'Accounts receivable',
      body: 'Income streams: B2B customers, events, online shop. Ageing and credit limits are a GM cash-flow lever.',
      bi: 'BI cue: AR ageing, DSO, top overdue accounts.'
    },
    ap: {
      title: 'Accounts payable',
      body: 'Suppliers and vendors — maltsters, packaging, logistics partners. Align payment terms with cash from AR.',
      bi: 'BI cue: AP due calendar, early-pay discounts taken.'
    },
    plan: {
      title: 'Production planning',
      body: 'Close the loop: demand signal → brew plan → packaging → inventory targets. The AGM seat is where trade-offs get decided.',
      bi: 'BI cue: plan attainment, capacity vs pipeline, SKU prioritisation.'
    },
    brand: {
      title: 'Branding, marketing & new craft ideas',
      body: 'Seasonal drops, collabs and tap-room stories — fed by what production can actually brew and what AR shows is selling.',
      bi: 'BI cue: new-SKU sell-through, event ROI, brand mix.'
    }
  };

  function showChain(id) {
    var d = CHAIN[id];
    var el = document.getElementById('chain-detail');
    if (!d || !el) return;
    el.innerHTML = '<h4>' + d.title + '</h4><p>' + d.body + '</p><p class="bi-cue">' + d.bi + '</p>';
  }

  var chainNodes = Array.prototype.slice.call(document.querySelectorAll('.chain-node'));
  chainNodes.forEach(function (node) {
    node.addEventListener('click', function () {
      chainNodes.forEach(function (n) {
        n.classList.remove('is-active');
        n.setAttribute('aria-pressed', 'false');
      });
      node.classList.add('is-active');
      node.setAttribute('aria-pressed', 'true');
      showChain(node.getAttribute('data-node'));
    });
  });
  showChain('rm');

  /* --- MBA tabs --- */
  var mbaTabs = document.querySelector('[data-tabs="mba"]');
  if (mbaTabs) initTabs(mbaTabs);

  /* --- Digital-marketplace journey --- */
  function initSingleChoice(root) {
    if (!root) return;
    var buttons = Array.prototype.slice.call(root.querySelectorAll('[data-choice]'));
    function show(id) {
      buttons.forEach(function (b) {
        var on = b.getAttribute('data-choice') === id;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      Array.prototype.forEach.call(root.querySelectorAll('[data-for]'), function (p) {
        if (p.getAttribute('data-for') === id) p.removeAttribute('hidden');
        else p.setAttribute('hidden', '');
      });
    }
    buttons.forEach(function (b) {
      b.addEventListener('click', function () { show(b.getAttribute('data-choice')); });
    });
  }

  function initIkigai(root) {
    if (!root) return;
    var buttons = Array.prototype.slice.call(root.querySelectorAll('[data-ikigai]'));
    var note = root.querySelector('[data-ikigai-overlap]');
    function sync() {
      var n = 0;
      buttons.forEach(function (b) {
        if (b.getAttribute('aria-pressed') === 'true') n += 1;
      });
      if (!note) return;
      if (buttons.length && n === buttons.length) note.removeAttribute('hidden');
      else note.setAttribute('hidden', '');
    }
    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        var on = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', String(on));
        b.classList.toggle('is-active', on);
        sync();
      });
    });
    sync();
  }

  var aiStepper = document.querySelector('[data-stepper="ai-journey"]');
  if (aiStepper) initStepper(aiStepper);
  initIkigai(document.getElementById('ikigai-board'));
  initSingleChoice(document.getElementById('research-lenses'));
  initSingleChoice(document.getElementById('channel-behavior'));
  initSingleChoice(document.getElementById('test-types'));

})();
