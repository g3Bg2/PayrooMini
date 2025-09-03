
export function taxFromGross(gross: number): number {
  let g = gross;
  let tax = 0;
  if (g > 5000) { tax += (g - 5000) * 0.45; g = 5000; }
  if (g > 3000) { tax += (g - 3000) * 0.37; g = 3000; }
  if (g > 1500) { tax += (g - 1500) * 0.325; g = 1500; }
  if (g > 900)  { tax += (g - 900)  * 0.19;  g = 900;  }
  if (g > 370)  { tax += (g - 370)  * 0.10;  g = 370;  }
  return +tax.toFixed(2);
}
