// Hero background: sine waves (from settings via data-bg="sine")
document.addEventListener("DOMContentLoaded", () => {
  const section = document.querySelector(".hb-hero");
  const canvas = document.getElementById("hb-hero-canvas");
  if (!section || !canvas) return;

  const mode = (section.getAttribute("data-bg") || "sine").toLowerCase();
  const ctx = canvas.getContext("2d");
  let w = 0, h = 0, dpr = 1;
  let frame;

  const getPalette = () => {
    const root = getComputedStyle(document.documentElement);
    const fallback = (name, fallback) => root.getPropertyValue(name).trim() || fallback;
    const primary = fallback("--global-theme-color", fallback("--color-primary-500", "#2563eb"));
    const secondary = fallback("--global-secondary-theme-color", fallback("--color-secondary-500", "#5be7c4"));
    return {
      wave1: primary,
      wave2: fallback("--color-primary-400", primary),
      wave3: secondary,
      band: fallback("--color-secondary-200", secondary),
      mean: fallback("--color-primary-200", primary),
      grid: fallback("--hero-grid-color", fallback("--global-divider-color", "rgba(0,0,0,0.08)")),
    };
  };

  const viewportScale = () => {
    const short = Math.min(w, h);
    if (short >= 900) return 1.0;
    if (short >= 720) return 0.9;
    if (short >= 600) return 0.82;
    if (short >= 480) return 0.72;
    if (short >= 360) return 0.64;
    return 0.58;
  };

  const resize = () => {
    dpr = Math.max(1, window.devicePixelRatio || 1);
    w = section.clientWidth;
    h = section.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(performance.now());
  };

  const drawBackground = () => {
    const { grid } = getPalette();
    // Subtle grid on transparent canvas so CSS background shows through
    const step = Math.max(64, Math.min(w, h) / 10);
    ctx.strokeStyle = grid;
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  };

  function drawSineWaves(t) {
    const { wave1, wave2, wave3 } = getPalette();
    const s = viewportScale();
    const time = t * 0.0015; // slow phase drift

    const waves = [
      { A: 70, f: 1.0, ph: 0.0, y0: 0.35, thick: 3.0, color: wave1 },
      { A: 52, f: 1.6, ph: 0.8, y0: 0.4, thick: 2.2, color: wave2 },
      { A: 40, f: 2.3, ph: 1.4, y0: 0.45, thick: 1.8, color: wave3 },
    ];

    waves.forEach(({ A, f, ph, y0, thick, color }) => {
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, color);
      g.addColorStop(0.5, color);
      g.addColorStop(1, color);
      ctx.strokeStyle = g;
      ctx.lineWidth = Math.max(1, thick * (0.85 + 0.15 * s));
      ctx.beginPath();
      for (let x = 0; x <= w; x++) {
        const tau = (x / w) * 6 * Math.PI;
        const y = y0 * h + A * s * Math.sin(f * tau + ph + time);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
  }

  function drawUQ() {
    const { band, mean } = getPalette();
    const s = viewportScale();

    const mTop = h < 520 ? 28 : 40;
    const mBot = h < 520 ? 56 : 80;
    const m = { l: 0, r: 0, t: mTop, b: mBot };

    const W = w - m.l - m.r;
    const H = h - m.t - m.b;
    const L = 600;
    const xs = Array.from({ length: L }, (_, i) => i / (L - 1));

    const mu = xs.map((t) => 0.2 + 0.25 * s * Math.sin(4 * Math.PI * t) * Math.exp(1.2 * t));
    const sig = xs.map((t) => 0.18 * s * (0.6 + 0.4 * Math.cos(2 * Math.PI * t)) * (0.4 + 0.6 * (1 - t)));

    const X = (t) => m.l + t * W;
    const y0 = h < 520 ? -0.9 : -0.8;
    const y1 = h < 520 ? 0.95 : 0.9;
    const Y = (v) => m.t + (1 - (v - y0) / (y1 - y0)) * H;

    ctx.save();
    ctx.globalAlpha = 0.22; // keep band light so text remains readable
    ctx.fillStyle = band;
    ctx.beginPath();
    ctx.moveTo(X(xs[0]), Y(mu[0] + sig[0]));
    for (let i = 1; i < L; i++) ctx.lineTo(X(xs[i]), Y(mu[i] + sig[i]));
    for (let i = L - 1; i >= 0; i--) ctx.lineTo(X(xs[i]), Y(mu[i] - sig[i]));
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = mean;
    ctx.lineWidth = 3 * (0.9 + 0.1 * s);
    ctx.beginPath();
    for (let i = 0; i < L; i++) {
      const x = X(xs[i]);
      const y = Y(mu[i]);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  }

  const draw = (now) => {
    ctx.clearRect(0, 0, w, h);
    drawBackground();
    if (mode === "sine") drawSineWaves(now);
    else if (mode === "uq") drawUQ();
    frame = requestAnimationFrame(draw);
  };

  window.addEventListener("resize", resize, { passive: true });
  resize();

  // Minimal type-in animation for any data-typer elements
  document.querySelectorAll("[data-typer]").forEach((el) => {
    const raw = el.textContent.trim();
    if (!raw) return;
    el.textContent = "";
    el.style.visibility = "hidden";

    const letterDelay = 50;
    let offset = 0;

    raw.split(/(\s+)/).forEach((token) => {
      if (/^\s+$/.test(token)) {
        el.appendChild(document.createTextNode(" "));
        offset += letterDelay;
        return;
      }

      const word = document.createElement("span");
      word.className = "hb-typer-word";

      for (let i = 0; i < token.length; i++) {
        const letter = document.createElement("span");
        letter.className = "hb-typer-letter";
        letter.textContent = token[i];
        letter.style.animationDelay = `${offset + i * letterDelay}ms`;
        word.appendChild(letter);
      }

      el.appendChild(word);
      offset += token.length * letterDelay;
    });

    el.style.visibility = "visible";
  });
});
