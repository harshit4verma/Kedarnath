/**
 * Kedarnath 360 AR/VR - Procedural Texture Generator
 * Creates photorealistic 2K & 1K textures for temple granite, slate roof,
 * Himalayan snow/rock, alpine greenery, flagstones, and sacred temple archways.
 */

const TextureGenerator = {
  cache: {},

  // Helper: Create an offscreen canvas
  createCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  },

  // 1. Weathered Katyuri Granite Stone (Temple walls & Shikhara)
  // Perfectly matching the warm grey-ochre granite from user photos
  getTempleStoneTexture() {
    if (this.cache.templeStone) return this.cache.templeStone;

    const loader = new THREE.TextureLoader();
    const texture = loader.load('assets/temple_granite_real.png');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    this.cache.templeStone = texture;
    return texture;
  },

  getTempleStoneBumpMap() {
    if (this.cache.templeStoneBump) return this.cache.templeStoneBump;

    const loader = new THREE.TextureLoader();
    const texture = loader.load('assets/temple_granite_bump.png');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    this.cache.templeStoneBump = texture;
    return texture;
  },

  // 1b. Cobalt Blue Metal Roof Trim & Fascia Eave Sheet
  // Matching the iconic bright blue roof borders from media_1788949789932.png & media_1788949814007.jpg
  getBlueRoofTrimTexture() {
    if (this.cache.blueTrim) return this.cache.blueTrim;

    const loader = new THREE.TextureLoader();
    const texture = loader.load('assets/temple_blue_trim.png');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 4);
    this.cache.blueTrim = texture;
    return texture;
  },

  // 2. Slate Roof Shingles (Mandapa roof)
  getSlateRoofTexture() {
    if (this.cache.slateRoof) return this.cache.slateRoof;

    const canvas = this.createCanvas(512, 512);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#374151';
    ctx.fillRect(0, 0, 512, 512);

    const shingleH = 32;
    const shingleW = 48;
    const rows = 512 / shingleH;

    for (let r = 0; r < rows; r++) {
      const y = r * shingleH;
      const offset = (r % 2 === 0) ? 0 : shingleW / 2;
      for (let x = -shingleW; x < 512 + shingleW; x += shingleW) {
        const rand = (Math.sin(r * 7 + x) * 0.5 + 0.5);
        const shade = Math.floor(40 + rand * 35);
        ctx.fillStyle = `rgb(${shade}, ${shade + 6}, ${shade + 12})`;
        ctx.fillRect(x + offset + 1, y + 1, shingleW - 2, shingleH - 2);

        // Shingle drop shadow
        ctx.fillStyle = 'rgba(15, 20, 25, 0.7)';
        ctx.fillRect(x + offset, y + shingleH - 3, shingleW, 3);

        // Frost/snow rim
        if (Math.random() > 0.6) {
          ctx.fillStyle = 'rgba(230, 240, 255, 0.35)';
          ctx.fillRect(x + offset + 2, y + shingleH - 2, shingleW - 4, 2);
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.slateRoof = texture;
    return texture;
  },

  // 3. Courtyard Flagstone Floor
  getCourtyardTexture() {
    if (this.cache.courtyard) return this.cache.courtyard;

    const canvas = this.createCanvas(1024, 1024);
    const ctx = canvas.getContext('2d');

    // Base stone color
    ctx.fillStyle = '#52525b';
    ctx.fillRect(0, 0, 1024, 1024);

    // Large rectangular flagstone tiles
    const tileSizeX = 128;
    const tileSizeY = 64;

    for (let y = 0; y < 1024; y += tileSizeY) {
      const row = Math.floor(y / tileSizeY);
      const shift = (row % 2 === 0) ? 0 : tileSizeX * 0.45;
      for (let x = -tileSizeX; x < 1024 + tileSizeX; x += tileSizeX) {
        const stoneX = x + shift;
        const val = Math.floor(75 + (Math.sin(row * 3.4 + stoneX * 0.05) * 15) + (Math.random() * 10));
        ctx.fillStyle = `rgb(${val}, ${val + 2}, ${val + 5})`;
        ctx.fillRect(stoneX + 3, y + 3, tileSizeX - 6, tileSizeY - 6);

        // Mortar groove
        ctx.fillStyle = '#27272a';
        ctx.fillRect(stoneX, y + tileSizeY - 3, tileSizeX, 3);
        ctx.fillRect(stoneX + tileSizeX - 3, y, 3, tileSizeY);

        // Edge bevel
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(stoneX + 3, y + 3, tileSizeX - 6, 2);
        ctx.fillRect(stoneX + 3, y + 3, 2, tileSizeY - 6);
      }
    }

    // Add fine gravel/dirt spots
    const imgData = ctx.getImageData(0, 0, 1024, 1024);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 30;
      data[i] += noise;
      data[i + 1] += noise;
      data[i + 2] += noise;
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(12, 12);
    this.cache.courtyard = texture;
    return texture;
  },

  // 4. Himalayan Snow & Mountain Rock
  getMountainSnowRockTexture() {
    if (this.cache.mountainSnow) return this.cache.mountainSnow;

    const canvas = this.createCanvas(1024, 1024);
    const ctx = canvas.getContext('2d');

    // Base dark granite mountain rock
    ctx.fillStyle = '#374151';
    ctx.fillRect(0, 0, 1024, 1024);

    // Vertical rock strata lines and gullies
    for (let i = 0; i < 150; i++) {
      const x = Math.random() * 1024;
      const w = 4 + Math.random() * 20;
      const rockDark = Math.floor(30 + Math.random() * 30);
      ctx.fillStyle = `rgb(${rockDark}, ${rockDark + 2}, ${rockDark + 5})`;
      ctx.fillRect(x, 0, w, 1024);
    }

    // Snow cover and glacier couloirs (matching reference photos)
    for (let y = 0; y < 1024; y += 4) {
      const snowIntensity = Math.min(1.0, Math.max(0.1, 1.2 - (y / 1024)));
      for (let x = 0; x < 1024; x += 8) {
        const noise = Math.sin(x * 0.02 + y * 0.05) + Math.cos(x * 0.05 - y * 0.01) * 0.5;
        if (noise > (0.4 - snowIntensity * 0.8)) {
          const snowBright = Math.floor(220 + Math.random() * 35);
          ctx.fillStyle = `rgba(${snowBright}, ${snowBright + 4}, 255, ${0.7 + Math.random() * 0.3})`;
          ctx.fillRect(x, y, 8, 4);
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    this.cache.mountainSnow = texture;
    return texture;
  },

  // 5. Alpine Greenery & Meadow
  getAlpineMeadowTexture() {
    if (this.cache.alpineMeadow) return this.cache.alpineMeadow;

    const canvas = this.createCanvas(512, 512);
    const ctx = canvas.getContext('2d');

    // Rich mountain grass green
    ctx.fillStyle = '#2d5a27';
    ctx.fillRect(0, 0, 512, 512);

    // Variations of moss, dark forest green, and rocky earth
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = 2 + Math.random() * 6;
      const shade = Math.random();
      if (shade < 0.4) {
        ctx.fillStyle = '#417a36'; // Bright alpine grass
      } else if (shade < 0.7) {
        ctx.fillStyle = '#1e3f1a'; // Deep pine moss
      } else {
        ctx.fillStyle = '#57534e'; // Earthy rock pebble
      }
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(16, 16);
    this.cache.alpineMeadow = texture;
    return texture;
  },

  // 6. Sacred Temple Entrance Archway & Signboard ("जय श्री केदार")
  // Replicating the authentic festive painted concentric arches from user photos
  getTempleEntranceTexture() {
    if (this.cache.entranceArch) return this.cache.entranceArch;

    const canvas = this.createCanvas(1024, 1024);
    const ctx = canvas.getContext('2d');

    // 1. Background Warm Katyuri Granite Masonry Stone
    ctx.fillStyle = '#cbc2b6';
    ctx.fillRect(0, 0, 1024, 1024);

    // Stone courses
    const bh = 64;
    const bw = 128;
    for (let y = 0; y < 1024; y += bh) {
      const r = Math.floor(y / bh);
      const shift = (r % 2 === 0) ? 0 : bw / 2;
      for (let x = -bw; x < 1024 + bw; x += bw) {
        const sx = x + shift;
        const toneVar = Math.sin(r * 4.3 + sx * 0.1) * 12;
        ctx.fillStyle = `rgb(${203 + toneVar}, ${194 + toneVar * 0.9}, ${182 + toneVar * 0.8})`;
        ctx.fillRect(sx + 2, y + 2, bw - 4, bh - 4);
        ctx.fillStyle = '#3c3832';
        ctx.fillRect(sx, y + bh - 2, bw, 2);
        ctx.fillRect(sx + bw - 2, y, 2, bh);
      }
    }

    // Doorway boundaries
    const doorL = 320;
    const doorR = 704;
    const doorT = 460;
    const doorB = 1024;
    const doorW = doorR - doorL;
    const doorCX = (doorL + doorR) / 2;
    const doorRad = doorW / 2;

    // 2. Base Plinth Horizontal Painted Stripes (Red, White, Yellow, Blue)
    const drawPlinth = (x1, x2, startY) => {
      const stripes = [
        ['#dc2626', 22],
        ['#ffffff', 18],
        ['#f59e0b', 22],
        ['#1d4ed8', 24],
        ['#ffffff', 18]
      ];
      let cy = startY;
      stripes.forEach(([col, h]) => {
        ctx.fillStyle = col;
        ctx.fillRect(x1, cy, x2 - x1, h);
        ctx.fillStyle = '#222222';
        ctx.fillRect(x1, cy + h - 1, x2 - x1, 1.5);
        cy += h;
      });
    };
    drawPlinth(40, doorL - 24, 880);
    drawPlinth(doorR + 24, 984, 880);

    // 3. Side Niche Shrines (Left & Right)
    const drawNiche = (cx, topY, nw, nh) => {
      const nl = cx - nw / 2;
      const nr = cx + nw / 2;
      const nrad = nw / 2;

      // Outer Blue
      ctx.strokeStyle = '#1d4ed8';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(cx, topY + nrad, nrad + 8, Math.PI, 0, false);
      ctx.lineTo(nr + 8, topY + nh);
      ctx.lineTo(nl - 8, topY + nh);
      ctx.closePath();
      ctx.stroke();

      // Middle Yellow
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(cx, topY + nrad, nrad + 2, Math.PI, 0, false);
      ctx.lineTo(nr + 2, topY + nh);
      ctx.lineTo(nl - 2, topY + nh);
      ctx.stroke();

      // Inner Red
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, topY + nrad, nrad - 4, Math.PI, 0, false);
      ctx.lineTo(nr - 4, topY + nh);
      ctx.lineTo(nl - 4, topY + nh);
      ctx.stroke();

      // Recess stone fill
      ctx.fillStyle = '#44403c';
      ctx.beginPath();
      ctx.arc(cx, topY + nrad, nrad - 8, Math.PI, 0, false);
      ctx.lineTo(nr - 8, topY + nh);
      ctx.lineTo(nl + 8, topY + nh);
      ctx.closePath();
      ctx.fill();

      // Sculpted deity silhouette
      ctx.fillStyle = '#a8a29e';
      ctx.beginPath();
      ctx.arc(cx, topY + 50, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - 20, topY + nh - 6);
      ctx.lineTo(cx + 20, topY + nh - 6);
      ctx.lineTo(cx + 14, topY + 70);
      ctx.lineTo(cx - 14, topY + 70);
      ctx.closePath();
      ctx.fill();
    };

    drawNiche(170, 580, 130, 260);
    drawNiche(854, 580, 130, 260);

    // 4. Main Concentric Painted Entrance Archway (Cobalt Blue, Yellow, Red)
    // A. Outer Cobalt Blue Arch
    const obT = 28;
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = obT;
    ctx.beginPath();
    ctx.arc(doorCX, doorT, doorRad + obT * 1.5, Math.PI, 0, false);
    ctx.lineTo(doorR + obT * 1.5, doorB);
    ctx.moveTo(doorL - obT * 1.5, doorT);
    ctx.lineTo(doorL - obT * 1.5, doorB);
    ctx.stroke();

    // B. Middle Golden Yellow Arch
    const myT = 26;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = myT;
    ctx.beginPath();
    ctx.arc(doorCX, doorT, doorRad + obT * 0.5 + myT * 0.5, Math.PI, 0, false);
    ctx.lineTo(doorR + obT * 0.5 + myT * 0.5, doorB);
    ctx.moveTo(doorL - (obT * 0.5 + myT * 0.5), doorT);
    ctx.lineTo(doorL - (obT * 0.5 + myT * 0.5), doorB);
    ctx.stroke();

    // C. Inner Vermilion Red Arch
    const irT = 24;
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = irT;
    ctx.beginPath();
    ctx.arc(doorCX, doorT, doorRad + irT * 0.5, Math.PI, 0, false);
    ctx.lineTo(doorR + irT * 0.5, doorB);
    ctx.moveTo(doorL - irT * 0.5, doorT);
    ctx.lineTo(doorL - irT * 0.5, doorB);
    ctx.stroke();

    // 5. Open Doorway Inner Portal leading to Garbhagriha
    ctx.fillStyle = '#0a0a0f';
    ctx.beginPath();
    ctx.arc(doorCX, doorT, doorRad, Math.PI, 0, false);
    ctx.lineTo(doorR, doorB);
    ctx.lineTo(doorL, doorB);
    ctx.closePath();
    ctx.fill();

    // Warm sanctum glow from inner Akhand Jyot diyas
    const radGlow = ctx.createRadialGradient(doorCX, 750, 20, doorCX, 750, 280);
    radGlow.addColorStop(0, 'rgba(255, 190, 60, 0.90)');
    radGlow.addColorStop(0.5, 'rgba(210, 110, 20, 0.45)');
    radGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radGlow;
    ctx.fillRect(doorL, doorT - doorRad, doorW, doorB - doorT + doorRad);

    // 6. Red Sacred Signboard Panel: "।। जय श्री केदार ।।"
    const bannerW = 660;
    const bannerH = 136;
    const bannerX1 = doorCX - bannerW / 2;
    const bannerY1 = 200;

    // Vermilion red background
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(bannerX1, bannerY1, bannerW, bannerH);

    // Signboard gold border
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 8;
    ctx.strokeRect(bannerX1, bannerY1, bannerW, bannerH);
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(bannerX1 + 6, bannerY1 + 6, bannerW - 12, bannerH - 12);

    // Devanagari Inscription: "।। जय श्री केदार ।।"
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 82px "Poppins", "Noto Sans Devanagari", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 10;
    ctx.fillText('।। जय श्री केदार ।।', doorCX, bannerY1 + bannerH / 2);
    ctx.shadowBlur = 0;

    // 7. Semicircular Carved Stone Pediment Arch above Signboard
    const pedR = 210;
    const pedY = bannerY1 - 8;
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(doorCX, pedY, pedR, Math.PI, 0, false);
    ctx.stroke();

    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(doorCX, pedY, pedR - 16, Math.PI, 0, false);
    ctx.stroke();

    // Central circular stone relief medallion
    ctx.fillStyle = '#b0a89d';
    ctx.beginPath();
    ctx.arc(doorCX, pedY - 95, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.stroke();

    // 8. Traditional Marigold Garlands
    for (let gx = doorL - 40; gx <= doorR + 40; gx += 22) {
      const sag = Math.sin((gx - (doorL - 40)) / (doorW + 80) * Math.PI) * 25;
      const gy = bannerY1 + bannerH + 16 + sag;
      const col = ((gx / 22) % 2 === 0) ? '#f59e0b' : '#ea580c';
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(gx, gy, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.entranceArch = texture;
    return texture;
  },

  // 7. Polished Brass / Gold (Kalash, Bells, Diyas)
  getGoldTexture() {
    if (this.cache.gold) return this.cache.gold;

    const canvas = this.createCanvas(256, 256);
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 256, 256);
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.3, '#eab308');
    grad.addColorStop(0.6, '#ca8a04');
    grad.addColorStop(0.8, '#fef08a');
    grad.addColorStop(1, '#a16207');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // Subtle brushed brass lines
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let i = 0; i < 50; i++) {
      ctx.fillRect(0, Math.random() * 256, 256, 1);
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.gold = texture;
    return texture;
  },

  // 8. Authentic Himalayan Dark Granite for Kedarnath Nandi Monolith
  getNandiGraniteTexture() {
    if (this.cache.nandiGranite) return this.cache.nandiGranite;

    const canvas = this.createCanvas(1024, 1024);
    const ctx = canvas.getContext('2d');

    // Deep Himalayan diorite/granite base
    ctx.fillStyle = '#2b2d31';
    ctx.fillRect(0, 0, 1024, 1024);

    // Granite crystalline mineral grain variation
    const imgData = ctx.getImageData(0, 0, 1024, 1024);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n1 = (Math.random() - 0.5) * 35;
      const n2 = (Math.random() - 0.5) * 15;
      data[i] = Math.min(255, Math.max(20, data[i] + n1 + n2));
      data[i + 1] = Math.min(255, Math.max(22, data[i + 1] + n1 + n2));
      data[i + 2] = Math.min(255, Math.max(25, data[i + 2] + n1 + n2));
    }
    ctx.putImageData(imgData, 0, 0);

    // Natural stone chisel marks and subtle weathered streaks
    ctx.fillStyle = 'rgba(200, 210, 225, 0.05)';
    for (let s = 0; s < 120; s++) {
      const sx = Math.random() * 1024;
      const sy = Math.random() * 1024;
      const sw = 20 + Math.random() * 80;
      ctx.fillRect(sx, sy, sw, 2);
    }

    // Wet stone Abhishek sheen patches
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let p = 0; p < 30; p++) {
      const px = Math.random() * 1024;
      const py = Math.random() * 1024;
      const rad = 25 + Math.random() * 50;
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.nandiGranite = texture;
    return texture;
  },

  // 9. Saffron Sacred "ॐ" (Om) Decal Texture for Nandi's Left Flank
  getNandiOmTexture() {
    if (this.cache.nandiOm) return this.cache.nandiOm;

    const canvas = this.createCanvas(512, 512);
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 512, 512);

    // Calligraphic Saffron/Turmeric Om (ॐ) matching media_1788940524306.png
    ctx.font = 'bold 290px "Arial Unicode MS", "Segoe UI Symbol", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Turmeric aura / soft glow
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('ॐ', 256, 266);

    // Core bright saffron stroke
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#ea580c';
    ctx.fillText('ॐ', 256, 260);

    // Golden inner highlight
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 275px "Arial Unicode MS", "Segoe UI Symbol", sans-serif';
    ctx.fillText('ॐ', 256, 258);

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.nandiOm = texture;
    return texture;
  }
};

