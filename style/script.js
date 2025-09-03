const canvas = document.getElementById("matrixCanvas");
const ctx = canvas.getContext("2d");

let W, H;
function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

const characters = "HAPPYBIRTHDAYCHUCMUNGSINHNHATTUOIMOIZUIZE";
const fontSize = 20;
const columns = Math.floor(W / fontSize);
const drops = Array(columns).fill(1);

const texts = [
  "3",
  "2",
  "1",
  "🎂",
  "4.9.2008",
  "HAPPY BIRTHDAY",
  "BUI LINH TRANG"
];

const BASE_DISPLAY_TIME = 3000;
const EXPLOSION_TIME = 100;
const CHAR_APPEAR_INTERVAL = 100;

let currentDisplayTime = BASE_DISPLAY_TIME;

const offCanvas = document.createElement('canvas');
const offCtx = offCanvas.getContext('2d');

let targetPoints = [];
let dots = [];

let currentTextIndex = 0;
let currentCharIndex = 0;
let lastChangeTime = Date.now();
let lastCharTime = Date.now();

let state = "forming";
let explosionStartTime = 0;

let hue = 0;

// ----------------- STICKER -------------------
const stickerImages = [];
const stickers = [];

function loadStickers() {
  const names = ["anh-shin-cau-be-but-chi-removebg-preview.png", "a074c71043d8d8c8a57ed469f9b14a0b-removebg-preview.png"];
  for (let name of names) {
    const img = new Image();
    img.src = name;
    stickerImages.push(img);
  }
  for (let i = 0; i < 10; i++) {
    const image = stickerImages[i % stickerImages.length];
    stickers.push(new Sticker(image));
  }
}

class Sticker {
  constructor(image) {
    this.image = image;
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    this.vx = (Math.random() - 0.5) * 1.5;
    this.vy = (Math.random() - 0.5) * 1.5;
    this.size = 70 + Math.random() * 20;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < -50 || this.x > W + 50) this.vx *= -1;
    if (this.y < -50 || this.y > H + 50) this.vy *= -1;
  }
  draw(ctx) {
    ctx.drawImage(this.image, this.x, this.y, this.size, this.size);
  }
}
// --------------------------------------------

function getTextPixels(text) {
  offCanvas.width = W;
  offCanvas.height = H;
  offCtx.clearRect(0, 0, W, H);

  let fontSizeOverlay = 500;
  offCtx.font = `bold ${fontSizeOverlay}px Arial`;
  while (offCtx.measureText(text).width > W * 0.9) {
    fontSizeOverlay -= 2;
    offCtx.font = `bold ${fontSizeOverlay}px Arial`;
  }
  offCtx.fillStyle = 'white';
  offCtx.textAlign = 'center';
  offCtx.textBaseline = 'middle';
  offCtx.fillText(text, W / 2, H / 2);

  const imageData = offCtx.getImageData(0, 0, W, H);
  const pixels = [];
  const gap = 6;
  for (let y = 0; y < H; y += gap) {
    for (let x = 0; x < W; x += gap) {
      const idx = (y * W + x) * 4;
      const r = imageData.data[idx];
      const g = imageData.data[idx + 1];
      const b = imageData.data[idx + 2];
      const a = imageData.data[idx + 3];
      if (r + g + b > 200 && a > 128) {
        pixels.push({ x, y });
      }
    }
  }
  return pixels;
}

class Dot {
  constructor(targetX, targetY) {
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    this.targetX = targetX;
    this.targetY = targetY;
    this.vx = 0;
    this.vy = 0;
    this.size = 3;
  }
  update() {
    if (state === "forming") {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const easing = 0.1;
      this.vx = (this.vx + dx * easing) * 0.75;
      this.vy = (this.vy + dy * easing) * 0.75;
      this.x += this.vx;
      this.y += this.vy;
    } else if (state === "exploding") {
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 1.05;
      this.vy *= 1.05;
    }
  }
  draw(ctx) {
    if (texts[currentTextIndex] === "BUI LINH TRANG") {
      ctx.fillStyle = "red";
    } else {
      ctx.fillStyle = `hsl(${(hue + this.x / W * 100) % 360}, 100%, 65%)`;
    }
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }
}

function initDots(text) {
  let partialText = text.substring(0, currentCharIndex);
  if (partialText.length === 0) partialText = " ";
  targetPoints = getTextPixels(partialText);
  if (dots.length === 0) {
    dots = targetPoints.map(p => new Dot(p.x, p.y));
  } else {
    for (let i = 0; i < dots.length; i++) {
      if (i < targetPoints.length) {
        dots[i].targetX = targetPoints[i].x;
        dots[i].targetY = targetPoints[i].y;
      } else {
        dots[i].targetX = Math.random() * W;
        dots[i].targetY = H + 100 + Math.random() * 200;
      }
    }
    if (targetPoints.length > dots.length) {
      const diff = targetPoints.length - dots.length;
      for (let j = 0; j < diff; j++) {
        const p = targetPoints[dots.length + j];
        dots.push(new Dot(p.x, p.y));
      }
    }
  }
  state = "forming";
}

function explodeDots() {
  for (const dot of dots) {
    dot.vx = (Math.random() - 0.5) * 10;
    dot.vy = (Math.random() - 0.5) * 10;
  }
}

function drawMatrixRain() {
  hue = (hue + 1) % 360;

  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  ctx.fillRect(0, 0, W, H);

  ctx.font = fontSize + "px monospace";

  for (let i = 0; i < drops.length; i++) {
    const textChar = characters[Math.floor(Math.random() * characters.length)];
    ctx.fillStyle = `hsl(${(hue + i * 10) % 360}, 100%, 65%)`;
    ctx.fillText(textChar, i * fontSize, drops[i] * fontSize);

    if (drops[i] * fontSize > H || Math.random() > 0.975) {
      drops[i] = 0;
    }
    drops[i]++;
  }

  for (const dot of dots) {
    dot.update();
    dot.draw(ctx);
  }

  const now = Date.now();

  if (state === "forming") {
    if (currentCharIndex < texts[currentTextIndex].length) {
      if (now - lastCharTime > CHAR_APPEAR_INTERVAL) {
        currentCharIndex++;
        initDots(texts[currentTextIndex]);
        lastCharTime = now;
      }
    } else {
      if (now - lastChangeTime > currentDisplayTime) {
        state = "exploding";
        explosionStartTime = now;
        explodeDots();
      }
    }
  } else if (state === "exploding") {
    if (now - explosionStartTime > EXPLOSION_TIME) {
      currentTextIndex++;
      if (currentTextIndex >= texts.length) {
        // ✅ Khi đã chạy hết "BUI LINH TRANG" -> hiện nút
        document.getElementById("goToLetterBtn").style.display = "block";
        return;
      }
      currentCharIndex = 0;
      const nextText = texts[currentTextIndex];
      currentDisplayTime = BASE_DISPLAY_TIME + (nextText.length > 5 ? 3000 : 0);
      initDots(nextText);
      lastChangeTime = now;
      lastCharTime = now;
      state = "forming";
    }
  }

  for (const sticker of stickers) {
    sticker.update();
    sticker.draw(ctx);
  }
}

currentDisplayTime = BASE_DISPLAY_TIME + (texts[0].length > 4 ? 2000 : 0);
initDots(texts[currentTextIndex]);
lastChangeTime = Date.now();
lastCharTime = Date.now();
loadStickers();
setInterval(drawMatrixRain, 50);

function checkOrientation() {
  if (window.innerHeight > window.innerWidth) {
    document.getElementById("rotateMsg").style.display = "flex";
    canvas.style.display = "none";
  } else {
    document.getElementById("rotateMsg").style.display = "none";
    canvas.style.display = "block";
  }
}
window.addEventListener("resize", checkOrientation);
window.addEventListener("load", checkOrientation);

// ✅ Chuyển sang letter.html khi bấm nút
document.getElementById("goToLetterBtn").addEventListener("click", () => {
  window.location.href = "letter.html";
});
// 🎵 Điều khiển âm nhạc
const bgMusic = document.getElementById("bgMusic");
const musicToggle = document.getElementById("musicToggle");

// ✅ Tự phát nhạc khi mới vào trang
window.addEventListener("load", () => {
  bgMusic.play().catch(err => {
    console.log("Autoplay bị chặn, cần người dùng tương tác:", err);
  });
});

// ✅ Nút tắt/bật nhạc
musicToggle.addEventListener("click", () => {
  if (bgMusic.paused) {
    bgMusic.play();
    musicToggle.textContent = "🎵";
  } else {
    bgMusic.pause();
    musicToggle.textContent = "🔇";
  }
});

// ✅ Giữ overlay khi chưa xoay ngang
function checkOrientation() {
  if (window.innerHeight > window.innerWidth) {
    document.getElementById("rotateMsg").style.display = "flex";
    canvas.style.display = "none";
  } else {
    document.getElementById("rotateMsg").style.display = "none";
    canvas.style.display = "block";
  }
}
window.addEventListener("resize", checkOrientation);
window.addEventListener("load", checkOrientation);

// ✅ Khi bấm nút -> dừng nhạc + chuyển trang
document.getElementById("goToLetterBtn").addEventListener("click", () => {
  bgMusic.pause();
  bgMusic.currentTime = 0;
  window.location.href = "letter.html";
});
