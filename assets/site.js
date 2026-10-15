// Dosher Fitness demo — live clock, schedule board, menu.
(function () {
  var TZ = 'America/New_York';
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // From the class schedule posted on Facebook. Times are minutes after midnight.
  var K = function (name, s, e, kind, noEnd) { return { name: name, s: s, e: e, kind: kind, noEnd: noEnd }; };
  var t = function (h, m) { return h * 60 + (m || 0); };
  var SCHEDULE = {
    0: [K('Open Mat', t(10), t(11), 'open', true)],
    1: [K('Kids BJJ 9+', t(17), t(18), 'kids'), K('Open Mat', t(18), t(18, 30), 'open'), K('Muay Thai Kickboxing', t(18, 30), t(19, 30), 'adult'), K('Open Mat', t(19, 30), t(20), 'open'), K('Adult BJJ', t(20), t(21), 'adult')],
    2: [K('Kids BJJ 4–8', t(17), t(18), 'kids')],
    3: [K('Kids BJJ 9+', t(17), t(18), 'kids'), K('Open Mat', t(18), t(18, 30), 'open'), K('Cardio Kickboxing', t(18, 30), t(19, 30), 'adult'), K('Open Mat', t(19, 30), t(20), 'open'), K('Adult BJJ', t(20), t(21), 'adult')],
    4: [K('Kids BJJ 4–8', t(17), t(18), 'kids'), K('Open Mat', t(18), t(18, 30), 'open'), K('Boxing', t(18, 30), t(19, 30), 'adult'), K('Open Mat', t(19, 30), t(20), 'open'), K('Adult BJJ', t(20), t(21), 'adult')],
    5: [],
    6: []
  };
  var LABEL = { kids: 'Youth', adult: 'Adults', open: 'All levels' };

  function fmt(min) {
    var h = Math.floor(min / 60), m = min % 60, ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + ':' + (m < 10 ? '0' : '') + m + ' ' + ap;
  }

  function nowLocal() {
    var parts = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short', hour: 'numeric', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    var o = {};
    parts.forEach(function (p) { o[p.type] = p.value; });
    return { day: DAYS.indexOf(o.weekday), min: parseInt(o.hour, 10) * 60 + parseInt(o.minute, 10) };
  }

  // ---- live clock
  var elTime = document.getElementById('clock-time');
  var elAp = document.getElementById('clock-ampm');
  var elFill = document.getElementById('dial-fill');
  var elNext = document.getElementById('clock-next');

  function nextClass(n) {
    for (var i = 0; i < 7; i++) {
      var d = (n.day + i) % 7;
      var list = SCHEDULE[d];
      for (var j = 0; j < list.length; j++) {
        var c = list[j];
        if (i === 0 && c.e <= n.min) continue;
        return { c: c, d: d, offset: i, live: i === 0 && c.s <= n.min };
      }
    }
    return null;
  }

  function tick() {
    var n = nowLocal();
    var h = Math.floor(n.min / 60), m = n.min % 60;
    elTime.textContent = (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m;
    elAp.textContent = h >= 12 ? 'PM' : 'AM';
    elFill.style.clipPath = 'inset(0 ' + (100 - ((h + 1) / 24) * 100) + '% 0 0)';
    var nx = nextClass(n);
    if (nx) {
      var when = nx.live ? 'On the mat now' : nx.offset === 0 ? 'Next up tonight, ' + fmt(nx.c.s) : nx.offset === 1 ? 'Next class tomorrow, ' + fmt(nx.c.s) : 'Next class ' + DAY_NAMES[nx.d] + ', ' + fmt(nx.c.s);
      elNext.innerHTML = when + ': <b>' + nx.c.name + '</b>';
    }
    highlight(n);
  }

  // ---- schedule board
  var tabs = document.getElementById('day-tabs');
  var panels = document.getElementById('day-panels');
  var order = [1, 2, 3, 4, 5, 6, 0];
  var today = nowLocal().day;

  order.forEach(function (d) {
    var b = document.createElement('button');
    b.type = 'button';
    b.id = 'tab-' + d;
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-controls', 'panel-' + d);
    b.setAttribute('aria-label', DAY_NAMES[d] + (d === today ? ', today' : ''));
    b.textContent = DAYS[d];
    if (d === today) b.classList.add('is-today');
    b.addEventListener('click', function () { select(d, true); });
    tabs.appendChild(b);

    var p = document.createElement('div');
    p.className = 'panel';
    p.id = 'panel-' + d;
    p.setAttribute('role', 'tabpanel');
    p.setAttribute('aria-labelledby', 'tab-' + d);
    p.tabIndex = 0;
    var list = SCHEDULE[d];
    if (!list.length) {
      p.innerHTML = '<div class="empty"><strong>No group classes</strong><p>The 24 HR gym is open all day and all night. Book a personal training session: <a href="tel:+19105403161">(910) 540-3161</a>.</p></div>';
    } else {
      p.innerHTML = list.map(function (c, i) {
        return '<div class="slot ' + c.kind + '" data-i="' + i + '"><time>' + (c.noEnd ? 'Starts ' + fmt(c.s) : fmt(c.s) + ' – ' + fmt(c.e)) + '</time><strong>' + c.name + '</strong><span class="who">' + LABEL[c.kind] + '</span></div>';
      }).join('');
    }
    panels.appendChild(p);
  });

  function select(d, focus) {
    order.forEach(function (x) {
      var on = x === d;
      var b = document.getElementById('tab-' + x);
      b.setAttribute('aria-selected', on);
      b.tabIndex = on ? 0 : -1;
      document.getElementById('panel-' + x).hidden = !on;
      if (on && focus) b.focus();
    });
  }
  tabs.addEventListener('keydown', function (e) {
    var cur = order.indexOf(parseInt(document.activeElement.id.replace('tab-', ''), 10));
    if (cur < 0) return;
    var nxt = e.key === 'ArrowRight' ? cur + 1 : e.key === 'ArrowLeft' ? cur - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? 6 : null;
    if (nxt === null) return;
    e.preventDefault();
    select(order[(nxt + 7) % 7], true);
  });
  select(today, false);

  function highlight(n) {
    var p = document.getElementById('panel-' + n.day);
    if (!p) return;
    SCHEDULE[n.day].forEach(function (c, i) {
      var el = p.querySelector('[data-i="' + i + '"]');
      el.classList.toggle('is-now', c.s <= n.min && n.min < c.e);
      el.classList.toggle('past', c.e <= n.min);
    });
  }

  tick();
  setInterval(tick, 15000);

  // ---- menu
  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('nav');
  function closeMenu() { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
  btn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
    if (open) nav.querySelector('a').focus();
  });
  nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') closeMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); btn.focus(); } });

  // ---- scroll reveal
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -10% 0px' });
    document.querySelectorAll('.card, .gym-photos, .coach-photo, .quotes figure, .stats li, .reach').forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = (i % 4) * 70 + 'ms';
      io.observe(el);
    });
  }

  document.getElementById('yr').textContent = new Date().getFullYear();
})();
