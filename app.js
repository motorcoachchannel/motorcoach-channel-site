/* The Motorcoach Channel — interactions */
(function () {
  'use strict';

  /* ---------- Theme ---------- */
  var root = document.documentElement;
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  var theme = prefersDark.matches ? 'dark' : 'light';
  root.setAttribute('data-theme', theme);
  document.getElementById('theme-toggle').addEventListener('click', function () {
    theme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', theme);
  });

  /* ---------- Header state ---------- */
  var header = document.getElementById('site-header');
  var onScroll = function () {
    header.setAttribute('data-scrolled', window.scrollY > 12 ? 'true' : 'false');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile nav ---------- */
  var nav = document.getElementById('nav');
  var navToggle = document.getElementById('nav-toggle');
  navToggle.addEventListener('click', function () {
    var open = nav.getAttribute('data-open') === 'true';
    nav.setAttribute('data-open', open ? 'false' : 'true');
    navToggle.setAttribute('aria-expanded', open ? 'false' : 'true');
    navToggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      nav.setAttribute('data-open', 'false');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });

  /* ---------- Scroll reveal ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.setAttribute('data-in', 'true');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.setAttribute('data-in', 'true'); });
  }

  /* ---------- Partner form ---------- */
  var form = document.getElementById('partner-form');
  var status = document.getElementById('form-status');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var required = ['f-name', 'f-company', 'f-email'];
    var ok = required.every(function (id) { return document.getElementById(id).value.trim() !== ''; });
    if (!ok) {
      status.textContent = 'Add your name, company, and email so we can reach you.';
      status.setAttribute('data-visible', 'true');
      return;
    }
    status.textContent = 'Thanks — that is exactly what we need. In the live build this routes straight to Ryan.';
    status.setAttribute('data-visible', 'true');
    form.reset();
  });

  /* ---------- National operator map ---------- */
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var svg = document.getElementById('us-map');
  var fallback = document.getElementById('map-fallback');
  var chips = document.getElementById('op-chips');
  var els = {
    img: document.getElementById('op-img'),
    status: document.getElementById('op-status'),
    name: document.getElementById('op-name'),
    blurb: document.getElementById('op-blurb'),
    base: document.getElementById('op-base'),
    region: document.getElementById('op-region'),
    network: document.getElementById('op-network'),
    episode: document.getElementById('op-episode')
  };
  var statusLabel = { filmed: 'Filmed', scheduled: 'Scheduled', discussion: 'In discussion' };
  var activeId = null;
  var operators = [];

  function make(tag, attrs) {
    var el = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }

  function select(id) {
    var op = operators.filter(function (o) { return o.id === id; })[0];
    if (!op) return;
    activeId = id;
    els.img.src = op.img;
    els.img.alt = op.name + ' — featured operator visual';
    els.status.textContent = statusLabel[op.status] || 'Featured';
    els.status.className = op.status === 'discussion' ? 'badge quiet' : 'badge';
    els.name.textContent = op.name;
    els.blurb.textContent = op.blurb;
    els.base.textContent = op.base;
    els.region.textContent = op.region;
    els.network.textContent = op.network;
    els.episode.textContent = op.episode;

    Array.prototype.forEach.call(svg.querySelectorAll('.pin'), function (p) {
      p.setAttribute('data-active', p.getAttribute('data-id') === id ? 'true' : 'false');
    });
    Array.prototype.forEach.call(chips.querySelectorAll('.chip'), function (c) {
      c.setAttribute('aria-current', c.getAttribute('data-id') === id ? 'true' : 'false');
    });
  }

  function buildChips() {
    operators.forEach(function (op) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = op.name;
      b.setAttribute('data-id', op.id);
      b.setAttribute('aria-current', 'false');
      b.addEventListener('click', function () { select(op.id); });
      chips.appendChild(b);
    });
  }

  fetch('./assets/map-data.json')
    .then(function (r) { if (!r.ok) throw new Error('map'); return r.json(); })
    .then(function (data) {
      operators = data.operators;
      svg.setAttribute('viewBox', '0 0 ' + data.width + ' ' + data.height);

      var gStates = make('g', { class: 'states' });
      data.states.forEach(function (s) {
        if (!s.d) return;
        gStates.appendChild(make('path', { class: 'state', d: s.d }));
      });
      svg.appendChild(gStates);

      var gPins = make('g', { class: 'pins' });
      operators.forEach(function (op) {
        var g = make('g', { class: 'pin', 'data-id': op.id, 'data-status': op.status, tabindex: '0', role: 'button' });
        g.appendChild(make('title', {})).textContent = op.name + ' — ' + op.base;
        g.appendChild(make('circle', { class: 'halo', cx: op.x, cy: op.y, r: 13 }));
        g.appendChild(make('circle', { class: 'core', cx: op.x, cy: op.y, r: 4.6 }));
        g.addEventListener('click', function () { select(op.id); });
        g.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(op.id); }
        });
        gPins.appendChild(g);
      });
      svg.appendChild(gPins);

      buildChips();
      select(operators[0].id);
    })
    .catch(function () {
      svg.hidden = true;
      fallback.hidden = false;
      operators = [];
    });
})();

/* Road Day open: respect reduced motion */
(function(){var v=document.querySelector('.rdx__media video');if(v&&window.matchMedia('(prefers-reduced-motion: reduce)').matches){v.removeAttribute('autoplay');v.pause();v.setAttribute('controls','')}})();
