// ==========================================
// COLOR HELPER & PAGE DEFINITIONS
// ==========================================
function parseColor(colorStr) {
  if (colorStr.startsWith("#")) {
    const hex = colorStr.replace("#", "");
    return Array.of(
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16)
    );
  }
  return colorStr.match(/\d+/g).map(Number);
}

const PAGES = {
  SAMd: {
    title: "S.A.M. Development",
    icon: "assets/SAMd.png",
    dotColor: parseColor("#0B4640"),
    lineColor: parseColor("rgb(17, 87, 61)"),
    html: `
      <img class="page-logo" src="assets/SAMd.jpg" alt="S.A.M. Development Logo" />
      <div class="glow-box">
        <h1>S.A.M. Development</h1>
        <p><b>Welcome to S.A.M. Development!</b> <i>(Simple Automated Modules)</i><br><br><b>Please consider supporting us by adding one of our bots to your servers!</b></p>
      </div>
    `
  },
  SAM: {
    title: "Simple Auto Mod",
    dotColor: parseColor("#226CAB"),
    lineColor: parseColor("#B3FFFF"),
    html: `
      <img class="page-logo" src="assets/SAM.jpg" alt="S.A.M. Logo" />
      <div class="glow-box">
        <h1>Simple Auto Mod</h1>
        <p><b>Simple Auto Mod,</b> <i>(aka S.A.M.)<i> <b>is our first bot that we created. SAM is a moderation bot, and are capable of executing all sorts of commands. Although SAM is for moderation, they have some fun commands in there as well!</b></p>
      </div>
    `
  }
};

let currentDotRGB = PAGES.SAMd.dotColor.slice();
let targetDotRGB = PAGES.SAMd.dotColor.slice();
let currentLineRGB = PAGES.SAMd.lineColor.slice();
let targetLineRGB = PAGES.SAMd.lineColor.slice();

function renderPage() {
  const hash = window.location.hash.replace("#", "") || "SAMd";
  const page = PAGES[hash] || PAGES.SAMd;
  const activeKey = PAGES[hash] ? hash : "SAMd";

  document.title = page.title;

  const favicon = document.getElementById("favicon");
  if (favicon && page.icon) {
    favicon.href = page.icon;
  }

  const app = document.getElementById("app");
  app.style.animation = "none";
  app.offsetHeight;
  app.style.animation = null;
  app.innerHTML = page.html;

  document.querySelectorAll(".glow-header a").forEach(link => {
    link.classList.toggle("active", link.dataset.page === activeKey);
  });

  targetDotRGB = page.dotColor.slice();
  targetLineRGB = page.lineColor.slice();
}

window.addEventListener("hashchange", renderPage);
renderPage();

// ==========================================
// CANVAS & GLIDING GRID SETTINGS
// ==========================================
const canvas = document.getElementById("particleCanvas");
const ctx = canvas.getContext("2d");

// LAPTOP VIEWPORT BASELINE (1862 x 880)
const BASE_WIDTH = 1862;
const BASE_HEIGHT = 880;
const BASE_AREA = BASE_WIDTH * BASE_HEIGHT;
const BASE_DIAGONAL = Math.hypot(BASE_WIDTH, BASE_HEIGHT);

const BASE_PARTICLE_COUNT = 115;
const BASE_MAX_DISTANCE = 140;
const BASE_SPEED = 0.6;

// GLIDING BACKGROUND GRID SETTINGS
const GRID_SIZE = 40;
const GRID_SPEED = 0.1;
const gridAngle = Math.atan2(-26.7038 - (-19.4576), -25.1888 - (-11.1569));
const gridVx = Math.cos(gridAngle) * GRID_SPEED;
const gridVy = Math.sin(gridAngle) * GRID_SPEED;
let gridX = 0;
let gridY = 0;

let particles = [];
let currentMaxDistance = BASE_MAX_DISTANCE;
let lastWidth = window.innerWidth;

function getResponsiveConfig() {
  const area = canvas.width * canvas.height;
  const diagonal = Math.hypot(canvas.width, canvas.height);

  const areaScale = Math.sqrt(area / BASE_AREA);
  const count = Math.max(32, Math.round(BASE_PARTICLE_COUNT * areaScale));

  const diagRatio = Math.max(0.45, Math.min(1.25, diagonal / BASE_DIAGONAL));
  const speed = BASE_SPEED * diagRatio;
  const maxDistance = BASE_MAX_DISTANCE * Math.max(0.65, diagRatio);

  return { count, speed, maxDistance };
}

function initParticles() {
  const { count, speed, maxDistance } = getResponsiveConfig();
  currentMaxDistance = maxDistance;
  particles = [];

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * speed * 2,
      vy: (Math.random() - 0.5) * speed * 2,
      radius: Math.random() * 2 + 1.5
    });
  }
}

function resizeCanvas() {
  const widthChanged = window.innerWidth !== lastWidth;
  const heightDiff = Math.abs(window.innerHeight - canvas.height);

  if (widthChanged || heightDiff > 40) {
    lastWidth = window.innerWidth;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initParticles();
  }
}

window.addEventListener("resize", resizeCanvas);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
initParticles();

function lerpColor(current, target, factor) {
  for (let i = 0; i < 3; i++) {
    current[i] += (target[i] - current[i]) * factor;
  }
}

let lastTime = performance.now();

function animate(now) {
  const delta = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  const timeScale = delta * 60;

  // Smoothly blend dot, line, and glow colors toward active page target
  const colorFadeSpeed = Math.min(1, 0.06 * timeScale);
  lerpColor(currentDotRGB, targetDotRGB, colorFadeSpeed);
  lerpColor(currentLineRGB, targetLineRGB, colorFadeSpeed);

  const dotRGBString = currentDotRGB.map(Math.round).join(", ");
  const dotFill = `rgb(${dotRGBString})`;
  const lineBase = currentLineRGB.map(Math.round).join(", ");
  document.documentElement.style.setProperty("--glow-rgb", dotRGBString);

  // Update gliding grid position
  gridX = (gridX + gridVx * timeScale) % GRID_SIZE;
  gridY = (gridY + gridVy * timeScale) % GRID_SIZE;
  document.body.style.backgroundPosition = `${gridX}px ${gridY}px`;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.x += p.vx * timeScale;
    p.y += p.vy * timeScale;

    if (p.x < 0) { p.x = 0; p.vx *= -1; }
    if (p.x > canvas.width) { p.x = canvas.width; p.vx *= -1; }
    if (p.y < 0) { p.y = 0; p.vy *= -1; }
    if (p.y > canvas.height) { p.y = canvas.height; p.vy *= -1; }

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = dotFill;
    ctx.fill();

    for (let j = i + 1; j < particles.length; j++) {
      const p2 = particles[j];
      const dx = p.x - p2.x;
      const dy = p.y - p2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < currentMaxDistance) {
        const opacity = 1 - dist / currentMaxDistance;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(${lineBase}, ${opacity * 0.45})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
