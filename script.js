(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

var heroExtraDelay = 0;

  var hasGsap = typeof gsap !== 'undefined';
  var hasLenis = typeof Lenis !== 'undefined';

  if (hasGsap && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ---------- Smooth scroll (Lenis) ---------- */
  var lenis = null;
  if (hasLenis && !reduceMotion) {
    lenis = new Lenis({
      duration: 1.1,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true
    });
    function raf(time) {
      lenis.raf(time);
      if (hasGsap && typeof ScrollTrigger !== 'undefined') ScrollTrigger.update();
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  /* ---------- Nav: condense on scroll + active link ---------- */
  var nav = document.getElementById('nav');
  var navLinks = document.querySelectorAll('.nav-link');
  var sections = Array.prototype.slice.call(document.querySelectorAll('main section[id], footer[id]'));

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    nav.classList.toggle('condensed', y > 80);

    var current = null;
    sections.forEach(function (sec) {
      var rect = sec.getBoundingClientRect();
      if (rect.top <= 140 && rect.bottom >= 140) current = sec.id;
    });
    navLinks.forEach(function (link) {
      link.classList.toggle('active', current && link.getAttribute('href') === '#' + current);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* smooth-scroll anchor clicks through Lenis if present */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(target, { offset: -20 });
      } else {
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      }
      closeMenu();
    });
  });

  /* ---------- Mobile takeover menu ---------- */
  var toggle = document.getElementById('navToggle');
  var overlay = document.getElementById('navOverlay');
  var closeBtn = document.getElementById('navClose');

  function openMenu() {
    overlay.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    if (lenis) lenis.stop();
  }
  function closeMenu() {
    overlay.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    if (lenis) lenis.start();
  }
  toggle.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', closeMenu);

  /* ---------- Scroll-triggered reveals ---------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if (hasGsap && typeof ScrollTrigger !== 'undefined' && !reduceMotion) {
    revealEls.forEach(function (el) {
      gsap.fromTo(el,
        { autoAlpha: 0, y: 28 },
        {
          autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        }
      );
    });

    /* hero title lines */
    gsap.set('.hero-title .line span', { yPercent: 110 });
    gsap.to('.hero-title .line span', {
      yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: 0.12, delay: 0
    });
    gsap.fromTo('.hero-eyebrow, .hero-subline, .hero-actions',
      { autoAlpha: 0, y: 16 },
      { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1, delay: 0 }
    );

    /* hero photo subtle parallax on scroll */
    gsap.to('.hero-photo-wrap img', {
      yPercent: 8,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
  } else {
    /* reduced-motion / no-GSAP fallback: everything simply visible */
    revealEls.forEach(function (el) { el.style.opacity = 1; el.style.transform = 'none'; });
    document.querySelectorAll('.hero-title .line span').forEach(function (s) { s.style.transform = 'none'; });
  }

  /* ---------- Magnetic buttons (desktop only, respects reduced motion) ---------- */
  if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.btn, .nav-cta').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.25;
        var y = (e.clientY - r.top - r.height / 2) * 0.4;
        btn.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      });
      btn.addEventListener('mouseleave', function () { btn.style.transform = ''; });
    });
  }

  /* ---------- Custom trailing-line cursor ----------
     Parameters (friction/trails/size/dampening/tension) mirror the
     SleekLineCursor demo's defaults. Desktop pointer-fine only, and
     fully skipped under prefers-reduced-motion. */
  if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    var canvas = document.getElementById('cursorCanvas');
    if (canvas && canvas.getContext) {
      document.body.classList.add('custom-cursor-active');
      var ctx2d = canvas.getContext('2d');
      var dpr = window.devicePixelRatio || 1;

      function resize() {
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      resize();
      window.addEventListener('resize', resize);

      /* Tight lerp-follow, not a spring/velocity system — the previous
         version used tension=0.98 which meant the leader dot only closed
         2% of the distance to the real cursor per frame (that's the lag).
         Fix: the leader snaps toward the real mouse position quickly
         (FOLLOW factor below), and only a short 6-point trail lags
         slightly behind it for a subtle accent, not the whole cursor. */
      var FOLLOW = 0.35;   // leader responsiveness — higher = tighter to real cursor
      var TRAIL_FOLLOW = 0.35;
      var TRAIL_LENGTH = 6;

      var mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      var points = [];
      for (var i = 0; i < TRAIL_LENGTH; i++) points.push({ x: mouse.x, y: mouse.y });

      window.addEventListener('mousemove', function (e) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
      });

      function tick() {
        var leader = points[0];
        leader.x += (mouse.x - leader.x) * FOLLOW;
        leader.y += (mouse.y - leader.y) * FOLLOW;

        for (var i = 1; i < points.length; i++) {
          var p = points[i];
          var target = points[i - 1];
          p.x += (target.x - p.x) * TRAIL_FOLLOW;
          p.y += (target.y - p.y) * TRAIL_FOLLOW;
        }

        ctx2d.clearRect(0, 0, canvas.width, canvas.height);
        ctx2d.lineCap = 'round';
        ctx2d.lineJoin = 'round';
        for (var j = 0; j < points.length - 1; j++) {
          var t = j / points.length;
          ctx2d.beginPath();
          ctx2d.moveTo(points[j].x, points[j].y);
          ctx2d.lineTo(points[j + 1].x, points[j + 1].y);
          ctx2d.strokeStyle = 'rgba(156, 80, 48, ' + (0.55 * (1 - t)) + ')';
          ctx2d.lineWidth = Math.max(1, 5 * (1 - t));
          ctx2d.stroke();
        }
        ctx2d.beginPath();
        ctx2d.arc(leader.x, leader.y, 3, 0, Math.PI * 2);
        ctx2d.fillStyle = '#9C5030';
        ctx2d.fill();

        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
  }

  /* ---------- Experience stat counters ---------- */
  var statEls = document.querySelectorAll('.exp-stat-num');
  if (statEls.length) {
    statEls.forEach(function (el) {
      var target = parseInt(el.getAttribute('data-count-to'), 10) || 0;
      var suffix = el.getAttribute('data-suffix') || '';

      if (reduceMotion) {
        el.textContent = target + suffix;
        return;
      }

      var done = false;
      function runCount() {
        if (done) return;
        done = true;
        var start = null;
        var duration = 1100;
        function frame(ts) {
          if (!start) start = ts;
          var progress = Math.min(1, (ts - start) / duration);
          var eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(eased * target) + suffix;
          if (progress < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      }

      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) { runCount(); io.disconnect(); }
          });
        }, { threshold: 0.5 });
        io.observe(el);
      } else {
        runCount();
      }
    });
  }

  /* ---------- Sticky note stack: click to cycle ---------- */
  var stickyStack = document.querySelector('.sticky-stack');
  if (stickyStack) {
    var notes = Array.prototype.slice.call(stickyStack.querySelectorAll('.sticky-note'));
    var cycling = false;

    stickyStack.addEventListener('click', function () {
      if (cycling || notes.length < 2) return;
      cycling = true;
      var front = notes[0];

      if (reduceMotion) {
        notes.push(notes.shift());
        notes.forEach(function (n, i) { n.setAttribute('data-stack-pos', i); });
        cycling = false;
        return;
      }

      front.classList.add('peeling');
      setTimeout(function () {
        front.classList.remove('peeling');
        notes.push(notes.shift());
        notes.forEach(function (n, i) { n.setAttribute('data-stack-pos', i); });
        cycling = false;
      }, 500);
    });
  }

  /* ---------- About terminal: "currently exploring" typewriter ---------- */
  var termEl = document.getElementById('aboutTerminalText');
  if (termEl) {
    var KEYWORDS = ['Agentic AI', 'MCP (Model Context Protocol)', 'RAG', 'n8n Automation', 'LLM APIs', 'Data Analysis'];

    if (reduceMotion) {
      termEl.textContent = KEYWORDS.join(' \u00b7 ');
    } else {
      (function typewriter() {
        var wordIndex = 0;
        var charIndex = 0;
        var deleting = false;

        function step() {
          var word = KEYWORDS[wordIndex];
          if (!deleting) {
            charIndex++;
            termEl.textContent = word.slice(0, charIndex);
            if (charIndex === word.length) {
              deleting = true;
              setTimeout(step, 1800); // pause on full word
              return;
            }
            setTimeout(step, 55);
          } else {
            charIndex--;
            termEl.textContent = word.slice(0, charIndex);
            if (charIndex === 0) {
              deleting = false;
              wordIndex = (wordIndex + 1) % KEYWORDS.length;
              setTimeout(step, 350);
              return;
            }
            setTimeout(step, 28);
          }
        }
        step();
      })();
    }
  }
})();
