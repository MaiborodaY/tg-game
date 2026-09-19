/* Offline animation source. The game only downloads the encoded silent MP4. */
window.createCaveIntroRenderer = async function (canvas, urls) {
  const load = (src) => new Promise((resolve, reject) => {
    const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = src;
  });
  const [background, runners, leaders] = await Promise.all(urls.map(load));
  const ctx = canvas.getContext('2d');
  const W = 941, H = 1672;
  let seed = 185;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
  const ease = (v) => { v = clamp(v); return v * v * (3 - 2 * v); };
  const mix = (a, b, t) => a + (b - a) * t;
  const path = [[.34, 1.055], [.48, .92], [.50, .83], [.52, .74], [.65, .635], [.665, .575], [.63, .505], [.635, .46]];
  function position(p, lane) {
    const segment = clamp(p) * (path.length - 1), i = Math.min(path.length - 2, Math.floor(segment)), f = segment - i;
    return { x: (mix(path[i][0], path[i + 1][0], f) + lane * mix(.19, .046, clamp(p))) * W,
      y: mix(path[i][1], path[i + 1][1], f) * H };
  }
  // Alpha-bound extraction only: keep the generated artwork and normalize feet.
  function frames(sheet, row) {
    const scratch = document.createElement('canvas'); scratch.width = sheet.width; scratch.height = sheet.height;
    const sc = scratch.getContext('2d'); sc.drawImage(sheet, 0, 0);
    const data = sc.getImageData(0, 0, scratch.width, scratch.height).data;
    return Array.from({ length: 4 }, (_, col) => {
      const left = Math.round(col * sheet.width / 4), right = Math.round((col + 1) * sheet.width / 4);
      const top = Math.round(row * sheet.height / 2), bottom = Math.round((row + 1) * sheet.height / 2);
      let x0 = right, x1 = left, y0 = bottom, y1 = top;
      for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) if (data[(y * sheet.width + x) * 4 + 3] > 35) {
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
      return { sheet, x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
    });
  }
  const sprites = [frames(runners, 0), frames(runners, 1), frames(leaders, 0), frames(leaders, 1)];
  const actors = Array.from({ length: 32 }, (_, i) => ({ kind: 0, p: -.19 + i * .035,
    lane: (random() - .5) * 1.7, phase: random() * 4, size: 112 + random() * 22, speed: .265 + random() * .014 }));
  actors.push({ kind: 1, p: .22, lane: -.22, phase: .2, size: 198, speed: .276 },
    { kind: 2, p: .38, lane: -.55, phase: 1.1, size: 229, speed: .27 },
    { kind: 3, p: .56, lane: .22, phase: .1, size: 282, speed: .265 });
  const rain = Array.from({ length: 210 }, () => ({ x: random(), y: random(), depth: .25 + random() * .75, phase: random() }));
  const torches = [[83, 1250], [206, 992], [437, 957], [715, 1146], [401, 721], [480, 798], [703, 813], [764, 720], [737, 745]];
  function actor(a, t) {
    const p = a.p + t * a.speed;
    if (p < -.04 || p > 1.08) return;
    const pos = position(p, a.lane), perspective = mix(1, .33, clamp(p));
    const cycle = t * (a.kind === 3 ? 3.7 : a.kind === 2 ? 7 : 9) + a.phase;
    const frame = sprites[a.kind][Math.floor(cycle) % 4];
    const height = a.size * perspective, width = height * frame.w / frame.h;
    const bounce = a.kind === 3 ? Math.max(0, Math.sin(cycle * Math.PI / 2)) * 17 * perspective : Math.sin(cycle * Math.PI) * 3 * perspective;
    ctx.save(); ctx.globalAlpha = clamp((p + .04) * 20) * (1 - ease((p - .91) / .17));
    ctx.fillStyle = 'rgba(2,8,15,.4)'; ctx.beginPath(); ctx.ellipse(pos.x, pos.y - 1, width * .31, height * .052, 0, 0, Math.PI * 2); ctx.fill();
    // Wet, broken reflections remain subordinate to the moving silhouettes.
    ctx.save(); ctx.globalAlpha *= .10; ctx.translate(pos.x, pos.y + 3); ctx.scale(1, -.16);
    ctx.drawImage(frame.sheet, frame.x, frame.y, frame.w, frame.h, -width / 2, -height, width, height); ctx.restore();
    ctx.drawImage(frame.sheet, frame.x, frame.y, frame.w, frame.h, pos.x - width / 2, pos.y - height - bounce, width, height);
    ctx.restore();
  }
  return function draw(t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#03060b'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const approach = ease(t / 3), zoom = 1 + 3.25 * Math.pow(approach, 2.2);
    const cameraX = mix(W / 2, W * .634, approach), cameraY = mix(H / 2, H * .478, approach);
    const scale = canvas.width / W * zoom;
    ctx.save(); ctx.translate(canvas.width / 2, canvas.height / 2); ctx.scale(scale, scale); ctx.translate(-cameraX, -cameraY);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(background, 0, 0, W, H);
    for (const [i, [x, y]] of torches.entries()) {
      const flicker = .7 + .3 * Math.sin(t * 17 + i * 2.3), radius = 38 + flicker * 11;
      const glow = ctx.createRadialGradient(x, y, 1, x, y, radius);
      glow.addColorStop(0, `rgba(255,187,61,${.16 * flicker})`); glow.addColorStop(1, 'rgba(255,111,20,0)');
      ctx.fillStyle = glow; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      ctx.fillStyle = `rgba(255,225,128,${.7 * flicker})`;
      ctx.fillRect(x - 2 + Math.sin(t * 21 + i) * 2, y - 13 - flicker * 7, 4, 9 + flicker * 6);
    }
    actors.map(a => ({ ...a, depth: position(a.p + t * a.speed, a.lane).y })).sort((a, b) => a.depth - b.depth).forEach(a => actor(a, t));
    ctx.restore();
    // Two-depth, deterministic rain is baked into the movie, never a runtime game effect.
    for (const drop of rain) {
      const x = ((drop.x - t * .12 * drop.depth + 2) % 1) * canvas.width;
      const y = ((drop.y + t * .9 * drop.depth) % 1) * canvas.height;
      ctx.strokeStyle = `rgba(174,207,234,${.1 + drop.depth * .22})`; ctx.lineWidth = drop.depth > .8 ? 1.3 : .7;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - (3 + drop.depth * 5), y + (8 + drop.depth * 17)); ctx.stroke();
    }
    const vignette = ctx.createRadialGradient(canvas.width * .55, canvas.height * .48, canvas.width * .18, canvas.width * .5, canvas.height * .5, canvas.height * .66);
    vignette.addColorStop(0, 'rgba(0,4,14,0)'); vignette.addColorStop(1, 'rgba(0,4,14,.46)'); ctx.fillStyle = vignette; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = `rgba(2,5,10,${Math.max(1 - ease(t / .12), ease((t - 2.60) / .35))})`; ctx.fillRect(0, 0, canvas.width, canvas.height);
  };
};
