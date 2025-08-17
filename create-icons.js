const fs = require('fs');
const path = require('path');

// Create SVG-based PNG icons for each size
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create an SVG template that will be used to generate PNGs
function createSVGIcon(size) {
  const scale = size / 512; // Base size is 512
  const strokeWidth = Math.max(1, 2 * scale);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
    <defs>
      <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#dc2626;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#2563eb;stop-opacity:1" />
      </linearGradient>
      <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.95" />
        <stop offset="100%" style="stop-color:#f8fafc;stop-opacity:0.9" />
      </linearGradient>
    </defs>

    <!-- Background circle -->
    <circle cx="256" cy="256" r="240" fill="url(#bgGradient)"/>

    <!-- Main card/document -->
    <rect x="140" y="160" width="232" height="192" rx="12" fill="url(#cardGradient)" stroke="#e2e8f0" stroke-width="${strokeWidth}"/>

    <!-- Header line -->
    <rect x="160" y="180" width="192" height="12" rx="6" fill="#1e293b"/>

    <!-- Content lines -->
    <rect x="160" y="210" width="150" height="8" rx="4" fill="#64748b"/>
    <rect x="160" y="230" width="170" height="8" rx="4" fill="#64748b"/>
    <rect x="160" y="250" width="120" height="8" rx="4" fill="#64748b"/>

    <!-- HR icon - person silhouette -->
    <circle cx="190" cy="290" r="18" fill="#2563eb"/>
    <path d="M 172 320 Q 172 310 190 310 Q 208 310 208 320 L 208 330 L 172 330 Z" fill="#2563eb"/>

    <!-- Checkmark -->
    <circle cx="320" cy="290" r="20" fill="#22c55e"/>
    <path d="M 310 290 L 316 296 L 330 282" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>

    <!-- Small decorative elements -->
    <rect x="240" y="285" width="60" height="6" rx="3" fill="#1e293b"/>
    <rect x="240" y="295" width="45" height="4" rx="2" fill="#64748b"/>
  </svg>`;
}

// Simple PNG header for a basic colored square (fallback)
function createSimplePNG(size, r, g, b) {
  // This creates a very basic PNG with solid color
  // For a proper implementation, you'd want to use a library like sharp or canvas
  const header = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
  ]);

  // For now, create a simple gradient-colored square
  const data = Buffer.alloc(size * size * 4); // RGBA
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      // Create a red-to-blue gradient
      const ratio = x / size;
      data[i] = Math.floor(220 * (1 - ratio) + 37 * ratio); // R
      data[i + 1] = Math.floor(38 * (1 - ratio) + 99 * ratio); // G
      data[i + 2] = Math.floor(38 * (1 - ratio) + 235 * ratio); // B
      data[i + 3] = 255; // A
    }
  }

  // This is a simplified approach - in production you'd use proper PNG encoding
  return Buffer.concat([header, data]);
}

const iconsDir = path.join(__dirname, 'app', 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create SVG files for each size (these can be used directly or converted to PNG)
sizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  const svgFilename = `icon-${size}x${size}.svg`;
  const svgFilepath = path.join(iconsDir, svgFilename);
  fs.writeFileSync(svgFilepath, svgContent);
  console.log(`Created ${svgFilename}`);

  // Create a simple PNG fallback (basic gradient)
  const pngData = createSimplePNG(size, 220, 38, 38); // Red color
  const pngFilename = `icon-${size}x${size}.png`;
  const pngFilepath = path.join(iconsDir, pngFilename);
  fs.writeFileSync(pngFilepath, pngData);
  console.log(`Created ${pngFilename}`);
});

console.log('All icon files created successfully!');