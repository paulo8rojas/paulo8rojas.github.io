// Pixel-art hero: an overgrown, abandoned skyline with drifting spores.
// Drawn procedurally on a tiny canvas and scaled up with crisp pixels.
(function () {
  var canvas = document.getElementById('scene');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;
  var GROUND = H - 7;

  // seeded RNG so the skyline is the same on every visit
  var seed = 8;
  function rand() {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function ri(a, b) { return a + Math.floor(rand() * (b - a + 1)); }

  var bg = document.createElement('canvas');
  bg.width = W; bg.height = H;
  var b = bg.getContext('2d');
  function px(x, y, c) { b.fillStyle = c; b.fillRect(x, y, 1, 1); }

  // --- sky: hazy bands with dithered edges
  var bands = ['#1a2420', '#22302a', '#2c3d33', '#3a4c3c', '#4f5f45', '#6a7350'];
  var bandH = Math.ceil(GROUND / bands.length);
  for (var y = 0; y < GROUND; y++) {
    var i = Math.min(bands.length - 1, Math.floor(y / bandH));
    b.fillStyle = bands[i];
    b.fillRect(0, y, W, 1);
    var into = y % bandH;
    if (i < bands.length - 1 && into >= bandH - 3) {
      for (var x = 0; x < W; x++) {
        var step = into - (bandH - 3); // 0..2, denser toward the next band
        if ((x + y) % (4 - step) === 0) px(x, y, bands[i + 1]);
      }
    }
  }

  // --- pale sun behind the haze
  var sx = Math.floor(W * 0.7), sy = Math.floor(GROUND * 0.45), sr = 9;
  for (var dy = -sr; dy <= sr; dy++) {
    for (var dx = -sr; dx <= sr; dx++) {
      if (dx * dx + dy * dy <= sr * sr) px(sx + dx, sy + dy, '#c9c58a');
    }
  }

  // --- skyline layers
  function skyline(color, minW, maxW, minH, maxH, detail) {
    var x = -ri(0, 6);
    while (x < W) {
      var w = ri(minW, maxW), h = ri(minH, maxH), top = GROUND - h;
      var broken = rand() < 0.45;
      for (var cx = Math.max(0, x); cx < Math.min(W, x + w); cx++) {
        var colTop = top;
        if (broken) colTop += Math.floor(Math.abs(Math.sin((cx - x) * 0.9 + h)) * ri(1, 6));
        b.fillStyle = color;
        b.fillRect(cx, colTop, 1, GROUND - colTop);
        if (detail) tops[cx] = Math.min(tops[cx], colTop);
      }
      if (detail) {
        // windows: mostly dead, a rare one still lit
        for (var wy = top + 8; wy < GROUND - 4; wy += 5) {
          for (var wx = x + 2; wx < x + w - 2; wx += 4) {
            if (wx < 0 || wx >= W) continue;
            var r = rand();
            if (r < 0.03) { px(wx, wy, '#d98a3d'); px(wx, wy + 1, '#d98a3d'); }
            else if (r < 0.5) { px(wx, wy, '#1d2923'); px(wx, wy + 1, '#1d2923'); }
          }
        }
      }
      x += w + (rand() < 0.3 ? ri(1, 5) : 0);
    }
  }

  var tops = [];
  for (var t = 0; t < W; t++) tops.push(GROUND);

  skyline('#33453a', 10, 22, 20, 50, false);
  skyline('#111813', 14, 30, 14, 46, true);

  // --- overgrowth: vines hanging off rooftops and ledges
  var greens = ['#3f6a34', '#5b8c3e', '#7fb04f'];
  for (var vx = 0; vx < W; vx++) {
    if (tops[vx] >= GROUND) continue;
    var edge = vx === 0 || vx === W - 1 || tops[vx - 1] !== tops[vx] || tops[vx + 1] !== tops[vx];
    if (rand() < (edge ? 0.8 : 0.4)) {
      var len = edge ? ri(2, 12) : ri(1, 4);
      for (var k = 0; k < len && tops[vx] + k < GROUND; k++) {
        px(vx, tops[vx] + k, greens[ri(0, k < 2 ? 2 : 1)]);
      }
      if (rand() < 0.5) px(vx, tops[vx] - 1, greens[ri(1, 2)]);
    }
  }

  // --- ground and tall grass
  b.fillStyle = '#0e1411';
  b.fillRect(0, GROUND, W, H - GROUND);
  for (var gx = 0; gx < W; gx++) {
    var gh = rand() < 0.75 ? ri(1, 4) : ri(4, 8);
    for (var g = 0; g < gh; g++) px(gx, GROUND - g, g > 2 ? greens[1] : greens[0]);
    if (rand() < 0.08) px(gx, GROUND - gh, '#d9d4b8'); // seed heads
  }

  // --- spores drifting on the air
  var spores = [];
  for (var s = 0; s < 46; s++) {
    spores.push({
      x: rand() * W, y: rand() * H,
      vx: (rand() - 0.5) * 0.25, vy: -(0.05 + rand() * 0.18),
      phase: rand() * 6.28, bright: rand() < 0.35
    });
  }

  function draw(time) {
    ctx.drawImage(bg, 0, 0);
    for (var n = 0; n < spores.length; n++) {
      var p = spores[n];
      var wob = Math.sin(time / 900 + p.phase) * 0.6;
      ctx.fillStyle = p.bright ? '#f1ecc0' : '#a9ad84';
      ctx.fillRect(Math.round(p.x + wob), Math.round(p.y), 1, 1);
    }
  }

  function tick() {
    for (var n = 0; n < spores.length; n++) {
      var p = spores[n];
      p.x += p.vx; p.y += p.vy;
      if (p.y < -1) { p.y = H; p.x = Math.random() * W; }
      if (p.x < -1) p.x = W; else if (p.x > W) p.x = 0;
    }
  }

  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still) { draw(0); return; }

  // ~15fps keeps the motion chunky, like the art
  var last = 0;
  function loop(now) {
    if (now - last > 66) { tick(); draw(now); last = now; }
    requestAnimationFrame(loop);
  }
  draw(0);
  requestAnimationFrame(loop);
})();
