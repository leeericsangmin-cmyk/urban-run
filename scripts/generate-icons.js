import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Create clean generic SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="96" fill="#f8f6f0" />
  <g stroke="#d5d0c0" stroke-width="2" opacity="0.6">
    <line x1="64" y1="0" x2="64" y2="512" />
    <line x1="128" y1="0" x2="128" y2="512" />
    <line x1="192" y1="0" x2="192" y2="512" />
    <line x1="256" y1="0" x2="256" y2="512" />
    <line x1="320" y1="0" x2="320" y2="512" />
    <line x1="384" y1="0" x2="384" y2="512" />
    <line x1="448" y1="0" x2="448" y2="512" />
    <line x1="0" y1="64" x2="512" y2="64" />
    <line x1="0" y1="128" x2="512" y2="128" />
    <line x1="0" y1="192" x2="512" y2="192" />
    <line x1="0" y1="256" x2="512" y2="256" />
    <line x1="0" y1="320" x2="512" y2="320" />
    <line x1="0" y1="384" x2="512" y2="384" />
    <line x1="0" y1="448" x2="512" y2="448" />
  </g>
  <!-- Architectural outline box -->
  <rect x="36" y="36" width="440" height="440" rx="32" fill="none" stroke="#242426" stroke-width="8" />
  <rect x="44" y="44" width="424" height="424" rx="26" fill="none" stroke="#242426" stroke-width="2" stroke-dasharray="12 12" />
  <!-- Running Stickman Sketch -->
  <g transform="translate(256, 256) scale(2.8)" stroke="#242426" stroke-linecap="round" stroke-linejoin="round">
    <!-- Drop shadow -->
    <ellipse cx="4" cy="22" rx="24" ry="7" fill="rgba(36, 36, 38, 0.12)" stroke="none" />
    <!-- Limbs -->
    <line x1="-4" y1="0" x2="-22" y2="18" stroke-width="6.5" />
    <circle cx="-22" cy="18" r="4" fill="#242426" />
    <line x1="-4" y1="0" x2="16" y2="14" stroke-width="6.5" />
    <circle cx="16" cy="14" r="4" fill="#242426" />
    <line x1="8" y1="-8" x2="-14" y2="-18" stroke-width="6.5" />
    <circle cx="-14" cy="-18" r="3.5" fill="#242426" />
    <line x1="8" y1="-8" x2="26" y2="-2" stroke-width="6.5" />
    <circle cx="26" cy="-2" r="3.5" fill="#242426" />
    <!-- Spine & Torso -->
    <line x1="8" y1="-8" x2="-4" y2="0" stroke-width="7.5" />
    <!-- Head -->
    <circle cx="12" cy="-22" r="14" fill="#ffffff" stroke-width="5.5" />
    <!-- Pencil hair strokes -->
    <line x1="4" y1="-32" x2="1" y2="-38" stroke-width="3" />
    <line x1="10" y1="-34" x2="10" y2="-41" stroke-width="3" />
    <line x1="16" y1="-33" x2="19" y2="-39" stroke-width="3" />
    <!-- Speed motion arcs -->
    <path d="M -30 -10 C -40 0, -40 10, -32 20" fill="none" stroke="#0284c7" stroke-width="3.5" stroke-dasharray="4 6" />
    <path d="M -40 -18 C -52 -4, -52 8, -42 22" fill="none" stroke="#ea580c" stroke-width="3" stroke-dasharray="5 7" />
  </g>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf8');

// Function to generate raw PNG buffer in pure Node.js
function createPng(width, height, isMaskable = false) {
  // RGBA buffer
  const buffer = Buffer.alloc(width * height * 4);
  const bgR = 0xf8, bgG = 0xf6, bgB = 0xf0;
  const darkR = 0x24, darkG = 0x24, darkB = 0x26;
  const gridR = 0xd5, gridG = 0xd0, gridB = 0xc0;
  const blueR = 0x02, blueG = 0x84, blueB = 0xc7;
  const orangeR = 0xea, orangeG = 0x58, orangeB = 0x0c;

  const cx = width / 2;
  const cy = height / 2;
  const scale = (width / 512) * (isMaskable ? 0.72 : 0.88);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      let r = bgR;
      let g = bgG;
      let b = bgB;
      let a = 255;

      // Drafting grid lines
      const gridSpacing = Math.round(40 * (width / 512));
      if (gridSpacing > 0 && (x % gridSpacing === 0 || y % gridSpacing === 0)) {
        r = Math.round(r * 0.88 + gridR * 0.12);
        g = Math.round(g * 0.88 + gridG * 0.12);
        b = Math.round(b * 0.88 + gridB * 0.12);
      }

      // Outer border box
      const margin = Math.round(36 * scale);
      if (
        (Math.abs(x - margin) < 3 && y >= margin && y <= height - margin) ||
        (Math.abs(x - (width - margin)) < 3 && y >= margin && y <= height - margin) ||
        (Math.abs(y - margin) < 3 && x >= margin && x <= width - margin) ||
        (Math.abs(y - (height - margin)) < 3 && x >= margin && x <= width - margin)
      ) {
        r = darkR;
        g = darkG;
        b = darkB;
      }

      // Head circle
      const headX = cx + 24 * scale;
      const headY = cy - 45 * scale;
      const headR = 34 * scale;
      const distHead = Math.hypot(x - headX, y - headY);
      if (distHead <= headR) {
        if (distHead >= headR - 6 * scale) {
          r = darkR; g = darkG; b = darkB;
        } else {
          r = 0xff; g = 0xff; b = 0xff;
        }
      }

      // Torso & limbs
      const distTorso = Math.hypot(x - cx, y - (cy - 10 * scale));
      if (distTorso <= 14 * scale) {
        r = darkR; g = darkG; b = darkB;
      }

      // Left leg
      const leg1Dist = Math.hypot(x - (cx - 40 * scale), y - (cy + 40 * scale));
      if (leg1Dist <= 12 * scale) {
        r = darkR; g = darkG; b = darkB;
      }

      // Right leg
      const leg2Dist = Math.hypot(x - (cx + 38 * scale), y - (cy + 30 * scale));
      if (leg2Dist <= 12 * scale) {
        r = darkR; g = darkG; b = darkB;
      }

      // Right arm
      const armDist = Math.hypot(x - (cx + 50 * scale), y - (cy - 10 * scale));
      if (armDist <= 10 * scale) {
        r = darkR; g = darkG; b = darkB;
      }

      // Speed accent arcs
      const arc1Dist = Math.hypot(x - (cx - 70 * scale), y - cy);
      if (Math.abs(arc1Dist - 30 * scale) < 3) {
        r = blueR; g = blueG; b = blueB;
      }

      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
      buffer[idx + 3] = a;
    }
  }

  // Build raw uncompressed PNG with zlib
  const rowBytes = width * 4 + 1;
  const scanlines = Buffer.alloc(height * rowBytes);
  for (let y = 0; y < height; y++) {
    const scanOffset = y * rowBytes;
    scanlines[scanOffset] = 0; // Filter: None
    buffer.copy(scanlines, scanOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  const deflated = zlib.deflateSync(scanlines);

  // PNG Signature
  const pngSig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT chunk
  const idatChunk = makeChunk('IDAT', deflated);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([pngSig, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(4 + 4 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crc = crc32(buf.subarray(4, 8 + len));
  buf.writeUInt32BE(crc >>> 0, 8 + len);
  return buf;
}

// CRC32 table & function
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

// Write out standard resolutions
const png192 = createPng(192, 192, false);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);

const png512 = createPng(512, 512, false);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);

const pngMaskable512 = createPng(512, 512, true);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pngMaskable512);

const appleTouchIcon = createPng(180, 180, false);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouchIcon);

console.log('Successfully generated PWA icons in /public:');
console.log(' - icon.svg');
console.log(' - pwa-192x192.png');
console.log(' - pwa-512x512.png');
console.log(' - pwa-maskable-512x512.png');
console.log(' - apple-touch-icon.png');
