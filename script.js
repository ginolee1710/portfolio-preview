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
  var skills = Array.prototype.slice.call(document.querySelectorAll('#skills-grid .skill-group'));
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

  /* --- Carlsberg PSP ladder (illustrative HKD per 500ml can) --- */
  var SCALE_MIN = 5;
  var SCALE_MAX = 14;
  var LADDER = [
    {
      name: 'Carlsberg',
      tiers: [
        { id: 'EDLP', price: 12.0, weeks: null },
        { id: 'PSP1', price: 10.5, weeks: 5 },
        { id: 'PSP2', price: 8.5, weeks: 8 },
        { id: 'PSP3', price: 7.0, weeks: 2 }
      ]
    },
    {
      name: 'Heineken',
      tiers: [
        { id: 'EDLP', price: 13.0, weeks: null },
        { id: 'PSP1', price: 11.5, weeks: 4 },
        { id: 'PSP2', price: 9.5, weeks: 6 },
        { id: 'PSP3', price: 8.0, weeks: 4 }
      ]
    },
    {
      name: 'Budweiser',
      tiers: [
        { id: 'EDLP', price: 11.0, weeks: null },
        { id: 'PSP1', price: 9.5, weeks: 7 },
        { id: 'PSP2', price: 7.5, weeks: 9 },
        { id: 'PSP3', price: 6.0, weeks: 3 }
      ]
    }
  ];
  var activeTier = 'all';
  var activeBrand = '';

  function ladderPct(price) {
    return ((price - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100;
  }

  function hkd(n) {
    var s = n.toFixed(2);
    if (s.slice(-3) === '.00') s = s.slice(0, -3);
    return 'HK$' + s;
  }

  function tierOf(brand, id) {
    for (var i = 0; i < brand.tiers.length; i++) {
      if (brand.tiers[i].id === id) return brand.tiers[i];
    }
    return brand.tiers[0];
  }

  function weekPhrase(tier) {
    if (tier.weeks == null) return 'Everyday list price, not a promo-week count.';
    return 'Promo frequency: ' + tier.weeks + ' weeks (illustrative).';
  }

  function sameTierPhrase(id, exceptName) {
    var bits = [];
    LADDER.forEach(function (b) {
      if (b.name === exceptName) return;
      var t = tierOf(b, id);
      var bit = b.name + ' ' + hkd(t.price);
      if (t.weeks != null) bit += ' (' + t.weeks + ' weeks)';
      bits.push(bit);
    });
    return 'Same tier: ' + bits.join(', ') + '.';
  }

  function setLadderTip(brandName, tierId) {
    var tip = document.getElementById('ladder-tip');
    if (!tip) return;
    if (!brandName) {
      if (tierId && tierId !== 'all') {
        var bits = LADDER.map(function (b) {
          var t = tierOf(b, tierId);
          var bit = b.name + ' ' + hkd(t.price);
          if (t.weeks != null) bit += ' · ' + t.weeks + ' weeks';
          else bit += ' · everyday list';
          return bit;
        });
        tip.textContent = tierId + ' across brands, HKD per 500ml can. ' + bits.join('. ') + '.';
      } else {
        tip.textContent = 'Tap a marker. PSP3 on Carlsberg is HK$7 per can; PSP2, PSP1 and EDLP step up from that floor. The note is promo frequency in weeks.';
      }
      return;
    }
    var brand = null;
    LADDER.forEach(function (b) { if (b.name === brandName) brand = b; });
    if (!brand) return;
    var tier = tierOf(brand, tierId);
    tip.textContent = brand.name + ' · ' + tier.id + ' · ' + hkd(tier.price) + ' per 500ml can. ' + weekPhrase(tier) + ' ' + sameTierPhrase(tier.id, brand.name);
  }

  function renderLadder() {
    var chart = document.getElementById('ladder-chart');
    if (!chart) return;
    var axis = '<div class="err-axis" aria-hidden="true">' +
      '<span style="bottom:100%">HK$14</span>' +
      '<span style="bottom:66.67%">11</span>' +
      '<span style="bottom:33.33%">8</span>' +
      '<span style="bottom:0">5</span></div>';
    var guides = '';
    if (activeTier !== 'all') {
      var pts = LADDER.map(function (b, i) {
        var t = tierOf(b, activeTier);
        var x = ((i + 0.5) / LADDER.length) * 100;
        var y = 100 - ladderPct(t.price);
        return x.toFixed(2) + ',' + y.toFixed(2);
      }).join(' ');
      guides = '<svg class="err-guides" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points="' + pts + '" fill="none" stroke="currentColor" stroke-width="1.25" vector-effect="non-scaling-stroke" stroke-dasharray="4 3"/></svg>';
    }
    var cols = '';
    LADDER.forEach(function (b) {
      var lo = ladderPct(b.tiers[b.tiers.length - 1].price);
      var hi = ladderPct(b.tiers[0].price);
      var marks = '';
      b.tiers.forEach(function (t) {
        var hot = activeTier === 'all' || activeTier === t.id;
        var on = activeBrand === b.name && activeTier === t.id;
        var cls = 'err-mark' + (hot ? ' is-hot' : ' is-dim') + (on ? ' is-on' : '');
        var y = ladderPct(t.price).toFixed(2);
        marks += '<button type="button" class="' + cls + '" style="bottom:' + y + '%" data-brand="' + b.name + '" data-tier="' + t.id + '" aria-pressed="' + (on ? 'true' : 'false') + '" aria-label="' + b.name + ' ' + t.id + ' ' + hkd(t.price) + ' per 500ml can. ' + weekPhrase(t) + '"><span class="err-dot"></span></button>';
      });
      cols += '<div class="err-col"><div class="err-stage"><span class="err-stem" style="bottom:' + lo.toFixed(2) + '%;height:' + (hi - lo).toFixed(2) + '%"></span>' + marks + '</div></div>';
    });
    var names = LADDER.map(function (b) { return '<span>' + b.name + '</span>'; }).join('');
    chart.innerHTML = axis + '<div class="err-plot-wrap">' + guides + '<div class="err-plot">' + cols + '</div><div class="err-names">' + names + '</div></div>';
  }

  var ladderChart = document.getElementById('ladder-chart');
  if (ladderChart) {
    ladderChart.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.err-mark') : null;
      if (!btn || !ladderChart.contains(btn)) return;
      activeBrand = btn.getAttribute('data-brand');
      activeTier = btn.getAttribute('data-tier');
      var tierBtns = document.querySelectorAll('.tier-toggle .seg');
      Array.prototype.forEach.call(tierBtns, function (b) {
        var on = b.getAttribute('data-tier') === activeTier;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      setLadderTip(activeBrand, activeTier);
      renderLadder();
    });
  }

  var tierBtns = Array.prototype.slice.call(document.querySelectorAll('.tier-toggle .seg'));
  tierBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      activeTier = btn.getAttribute('data-tier');
      if (activeTier === 'all') activeBrand = '';
      tierBtns.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      setLadderTip(activeBrand, activeTier);
      renderLadder();
    });
  });
  renderLadder();

  /* Scenario planning — synthetic directional deltas, tier and weeks only */
  var tierNames = ['EDLP', 'PSP1', 'PSP2', 'PSP3'];

  function updateScenario() {
    var tierEl = document.getElementById('sc-tier');
    var freqEl = document.getElementById('sc-freq');
    if (!tierEl || !freqEl) return;
    var tier = +tierEl.value;
    var freq = +freqEl.value;

    document.getElementById('tier-label').textContent = tierNames[tier];
    tierEl.setAttribute('aria-valuetext', tierNames[tier]);
    document.getElementById('freq-label').textContent = String(freq);

    // Baseline: PSP2, 6 weeks → 0
    // Deeper tier → +vol, -NS quality, -GPAL
    // Higher freq → +vol, -GPAL
    var vol = (tier - 2) * 3 + (freq - 6) * 1.5;
    var ns = (2 - tier) * 2.5 + (6 - freq) * 0.8;
    var gp = (2 - tier) * 3.5 + (6 - freq) * 1.2;

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
    if (tier >= 3 && freq >= 8) note = 'A long PSP3 calendar: volume may spike, but net sales and GPAL usually soften. The floor in this demo stays HK$7 on Carlsberg.';
    else if (tier === 2 && freq >= 8) note = 'PSP2 on a long calendar is the clutter. Fewer weeks is the lever, not a deeper floor.';
    else if (freq <= 3) note = 'A short calendar: less promo noise, and you may leave volume on the table versus peers.';
    else note = 'Move the tier and the week count. Watch volume pull against net sales and GPAL.';
    document.getElementById('scenario-note').textContent = note;
  }

  ['sc-tier', 'sc-freq'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateScenario);
      el.addEventListener('change', updateScenario);
    }
  });
  updateScenario();

  var carlsbergStepper = document.querySelector('[data-stepper="carlsberg"]');
  if (carlsbergStepper) initStepper(carlsbergStepper);

  /* --- Moonzen sections (copy lives in the encrypted page) --- */
  function initDesk(root) {
    if (!root) return;
    var nav = null;
    Array.prototype.forEach.call(root.children, function (el) {
      if (!nav && el.classList && el.classList.contains('mz-nav')) nav = el;
    });
    if (!nav) return;
    var tabs = Array.prototype.slice.call(nav.querySelectorAll('[role="tab"]'));
    var panels = [];
    Array.prototype.forEach.call(root.children, function (el) {
      if (el.classList && el.classList.contains('mz-panel')) panels.push(el);
    });

    function show(id) {
      tabs.forEach(function (t) {
        var on = t.getAttribute('aria-controls') === id;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (p) {
        if (p.id === id) p.removeAttribute('hidden');
        else p.setAttribute('hidden', '');
      });
    }

    tabs.forEach(function (t, idx) {
      t.addEventListener('click', function () { show(t.getAttribute('aria-controls')); });
      t.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1) % tabs.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (idx - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = tabs.length - 1;
        else return;
        e.preventDefault();
        tabs[next].focus();
        show(tabs[next].getAttribute('aria-controls'));
      });
    });
  }

  initDesk(document.getElementById('moonzen-desk'));
  initDesk(document.getElementById('mz-ops'));
  initDesk(document.getElementById('mz-cash'));

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
