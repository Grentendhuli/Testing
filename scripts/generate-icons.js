import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Icon sizes needed for PWA
const sizes = [
  // Standard PWA icons
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
  // Apple touch icons
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 120, name: 'apple-touch-icon-120x120.png' },
  { size: 152, name: 'apple-touch-icon-152x152.png' },
  { size: 167, name: 'apple-touch-icon-167x167.png' },
  // Maskable (Android adaptive icons) - generate separately
  { size: 192, name: 'maskable-icon-192x192.png', maskable: true },
  { size: 512, name: 'maskable-icon-512x512.png', maskable: true },
];

const inputSvg = path.join(__dirname, '../public/brand/landlordbot-logo.svg');
const outputDir = path.join(__dirname, '../public/icons');

async function generateIcons() {
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log('Created icons directory');
  }

  // Read SVG file
  const svgBuffer = fs.readFileSync(inputSvg);

  for (const { size, name, maskable } of sizes) {
    const outputPath = path.join(outputDir, name);
    
    try {
      if (maskable) {
        // For maskable icons, add padding and use safe area
        await sharp(svgBuffer)
          .resize(size, size, { fit: 'contain', background: { r: 30, g: 58, b: 95 } })
          .png()
          .toFile(outputPath);
        console.log(`✓ Generated ${name} (${size}x${size}) - maskable`);
      } else {
        // Regular icons with background
        await sharp(svgBuffer)
          .resize(size, size, { fit: 'contain', background: { r: 30, g: 58, b: 95 } })
          .png()
          .toFile(outputPath);
        console.log(`✓ Generated ${name} (${size}x${size})`);
      }
    } catch (error) {
      console.error(`✗ Failed to generate ${name}:`, error.message);
    }
  }

  console.log('\n🎉 Icon generation complete!');
  console.log(`Icons saved to: ${outputDir}`);
  console.log('\nNext steps:');
  console.log('1. Update manifest.json with new icon paths');
  console.log('2. Update index.html with apple-touch-icon meta tags');
}

generateIcons().catch(console.error);