// remove-bg.mjs  —  fjerner blå himmel-bakgrunn fra måk-bilde
// Usage: node remove-bg.mjs seagull.jpg seagull-cutout.png

import { Jimp } from 'jimp';
import { writeFileSync } from 'fs';

const [,, input = 'seagull.jpg', output = 'seagull-cutout.png'] = process.argv;

const img = await Jimp.read(input);
const { width, height } = img.bitmap;

// Helper: convert RGB → HSL (H in 0-360, S/L in 0-1)
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h, s, l = (max+min)/2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch(max){
      case r: h = ((g-b)/d + (g<b?6:0))/6; break;
      case g: h = ((b-r)/d + 2)/6; break;
      case b: h = ((r-g)/d + 4)/6; break;
    }
  }
  return [h*360, s, l];
}

// Process pixels
img.scan(0, 0, width, height, function(x, y, idx) {
  const r = this.bitmap.data[idx];
  const g = this.bitmap.data[idx+1];
  const b = this.bitmap.data[idx+2];
  const [h, s, l] = rgbToHsl(r, g, b);

  let alpha = 255;

  // Sky / water: blue-cyan range, fairly saturated and bright
  if (
    ((h >= 170 && h <= 250) && s > 0.25 && l > 0.35) ||  // sky blues
    ((h >= 170 && h <= 220) && s > 0.20 && l > 0.30) ||  // teal water
    (l > 0.90 && s < 0.12)                                // near-white clouds/foam
  ) {
    // Soft edge: blend based on how "sky-like" the pixel is
    const skyness = Math.min(1, (s - 0.18) / 0.25 + (l - 0.30) / 0.45);
    alpha = Math.max(0, Math.round(255 * (1 - Math.min(1, skyness))));
  }

  this.bitmap.data[idx+3] = alpha;
});

// Save as PNG (supports transparency)
await img.write(output);
console.log(`Saved: ${output}  (${width}×${height})`);
