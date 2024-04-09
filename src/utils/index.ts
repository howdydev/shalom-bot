function formatNumber(num: number): string {
  const decimal = num.toString().length;

  if (decimal < 6) return String(num);
  if (decimal < 8) return Math.round(num / 1000) + "K";

  return Math.round(num / 1000000) + "M";
}

function equate(xp: number) {
  return Math.floor(xp + 300 * Math.pow(2, xp / 7));
}

function levelToXP(level: number) {
  let xp = 0;
  for (let i = 1; i < level; i++) xp += equate(i);
  return Math.floor(xp / 4);
}

function XPToLevel(xp: number) {
  let level = 0;
  while (levelToXP(level) <= xp) level++;
  return level - 1;
}

export { formatNumber, equate, levelToXP, XPToLevel };
