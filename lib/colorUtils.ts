
/**
 * Converts an HEX color value to HSL. Conversion formula
 * adapted from https://css-tricks.com/converting-color-spaces-in-javascript/.
 * Assumes H is a valid hex color string.
 * @param   {string}  H       The hex color.
 * @return  {string | null}   The HSL representation or null on error.
 */
export function hexToHsl(H: string): string | null {
  // Convert hex to RGB first
  let r_str: any, g_str: any, b_str: any;
  if (H.length === 4) {
    r_str = "0x" + H[1] + H[1];
    g_str = "0x" + H[2] + H[2];
    b_str = "0x" + H[3] + H[3];
  } else if (H.length === 7) {
    r_str = "0x" + H[1] + H[2];
    g_str = "0x" + H[3] + H[4];
    b_str = "0x" + H[5] + H[6];
  } else {
    return null; // Invalid hex length
  }

  let r = Number(r_str) / 255;
  let g = Number(g_str) / 255;
  let b = Number(b_str) / 255;
  
  // Find greatest and smallest channel values
  let cmin = Math.min(r, g, b),
      cmax = Math.max(r, g, b),
      delta = cmax - cmin,
      h = 0,
      s = 0,
      l = 0;

  // Calculate hue
  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);
    
  if (h < 0) h += 360;

  // Calculate lightness
  l = (cmax + cmin) / 2;

  // Calculate saturation
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return `${h} ${s}% ${l}%`;
}
