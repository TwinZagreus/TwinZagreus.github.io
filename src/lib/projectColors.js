const BASE_COLOR_LIST = ["#C8A24A", "#4F7D5A", "#4A6B8C","#F2555A", "#8C4A6B"];

let BASE_COLOR = BASE_COLOR_LIST[0];

const LIGHT_STOPS = Object.freeze({
  100: 0.96,
  200: 0.92,
  300: 0.88,
  400: 0.84,
  500: 0.8,
  600: 0.76,
  700: 0.73,
  800: 0.71,
  900: 0.69,
  950: 0.58,
});

const DARK_STOPS = Object.freeze({
  950: { l: 0.08, s: 0.5 },
  900: { l: 0.14, s: 0.54 },
  800: { l: 0.2, s: 0.58 },
  700: { l: 0.26, s: 0.62 },
  600: { l: 0.32, s: 0.66 },
  500: { l: 0.4, s: 0.7 },
  400: { l: 0.48, s: 0.74 },
  300: { l: 0.56, s: 0.78 },
  200: { l: 0.63, s: 0.82 },
});

const MID_STOPS = Object.freeze({
  900: { l: 0.54, s: 0.14 },
  800: { l: 0.56, s: 0.18 },
  700: { l: 0.58, s: 0.22 },
  600: { l: 0.6, s: 0.28 },
  500: { l: 0.62, s: 0.34 },
  400: { l: 0.64, s: 0.4 },
  300: { l: 0.66, s: 0.46 },
  200: { l: 0.68, s: 0.52 },
  100: { l: 0.7, s: 0.58 },
});

const PALETTE_SPECS = Object.freeze([
  { key: "coral", label: "Coral", hueShift: 0 },
  { key: "lime", label: "Lime", hueShift: 72 },
  { key: "mint", label: "Mint", hueShift: 144 },
  { key: "azure", label: "Azure", hueShift: 216 },
  { key: "orchid", label: "Orchid", hueShift: 288 },
]);

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");

  return {
    b: Number.parseInt(normalized.slice(4, 6), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    r: Number.parseInt(normalized.slice(0, 2), 16),
  };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b]
    .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

function rgbToHsl({ r, g, b }) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;

  if (max === min) {
    return { h: 0, l: lightness, s: 0 };
  }

  const delta = max - min;
  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

  let hue;
  switch (max) {
    case red:
      hue = (green - blue) / delta + (green < blue ? 6 : 0);
      break;
    case green:
      hue = (blue - red) / delta + 2;
      break;
    default:
      hue = (red - green) / delta + 4;
      break;
  }

  return {
    h: hue * 60,
    l: lightness,
    s: saturation,
  };
}

function hslToRgb({ h, s, l }) {
  const hue = ((h % 360) + 360) % 360;
  const saturation = clamp01(s);
  const lightness = clamp01(l);

  if (saturation === 0) {
    const value = Math.round(lightness * 255);
    return { b: value, g: value, r: value };
  }

  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const segment = hue / 60;
  const x = chroma * (1 - Math.abs((segment % 2) - 1));
  const match = lightness - chroma / 2;

  let red = 0;
  let green = 0;
  let blue = 0;

  if (segment >= 0 && segment < 1) {
    red = chroma;
    green = x;
  } else if (segment < 2) {
    red = x;
    green = chroma;
  } else if (segment < 3) {
    green = chroma;
    blue = x;
  } else if (segment < 4) {
    green = x;
    blue = chroma;
  } else if (segment < 5) {
    red = x;
    blue = chroma;
  } else {
    red = chroma;
    blue = x;
  }

  return {
    b: (blue + match) * 255,
    g: (green + match) * 255,
    r: (red + match) * 255,
  };
}

function makeHexFromHsl(h, s, l) {
  return rgbToHex(hslToRgb({ h, l, s }));
}

function freezeEntries(record) {
  return Object.freeze(
    Object.fromEntries(
      Object.entries(record).sort(([left], [right]) => Number(left) - Number(right)),
    ),
  );
}

function buildToneGroup(hue, stops) {
  return freezeEntries(
    Object.fromEntries(
      Object.entries(stops).map(([step, value]) => {
        if (typeof value === "number") {
          return [step, makeHexFromHsl(hue, 1, value)];
        }

        return [step, makeHexFromHsl(hue, value.s, value.l)];
      }),
    ),
  );
}

function buildPalette({ key, label, hueShift }, baseHsl) {
  const hue = (baseHsl.h + hueShift) % 360;
  const base = makeHexFromHsl(hue, baseHsl.s, baseHsl.l);
  const light = buildToneGroup(hue, LIGHT_STOPS);
  const dark = buildToneGroup(hue, DARK_STOPS);
  const mid = buildToneGroup(hue, MID_STOPS);

  return Object.freeze({
    base,
    dark,
    hue,
    key,
    label,
    light,
    mid,
  });
}

const baseHsl = rgbToHsl(hexToRgb(BASE_COLOR));

export const PROJECT_COLOR_GROUPS = Object.freeze(
  PALETTE_SPECS.map((spec) => buildPalette(spec, baseHsl)),
);

const [
  coralPalette,
  limePalette,
  mintPalette,
  azurePalette,
  orchidPalette,
] = PROJECT_COLOR_GROUPS;

export const PROJECT_COLOR_MAP = Object.freeze({
  coral: coralPalette.base,
  lime: limePalette.base,
  mint: mintPalette.base,
  azure: azurePalette.base,
  orchid: orchidPalette.base,

  coral100: coralPalette.light[100],
  coral200: coralPalette.light[200],
  coral300: coralPalette.light[300],
  coral400: coralPalette.light[400],
  coral500: coralPalette.light[500],
  coral600: coralPalette.light[600],
  coral700: coralPalette.light[700],
  coral800: coralPalette.light[800],
  coral900: coralPalette.light[900],
  coral950: coralPalette.light[950],

  ink950: coralPalette.dark[950],
  ink900: coralPalette.dark[900],
  ink800: coralPalette.dark[800],
  ink700: coralPalette.dark[700],
  ink600: coralPalette.dark[600],
  ink500: coralPalette.dark[500],
  ink400: coralPalette.dark[400],
  ink300: coralPalette.dark[300],
  ink200: coralPalette.dark[200],

  neutral900: coralPalette.mid[900],
  neutral800: coralPalette.mid[800],
  neutral700: coralPalette.mid[700],
  neutral600: coralPalette.mid[600],
  neutral500: coralPalette.mid[500],
  neutral400: coralPalette.mid[400],
  neutral300: coralPalette.mid[300],
  neutral200: coralPalette.mid[200],
  neutral100: coralPalette.mid[100],
});

export const PROJECT_COLOR_SEQUENCE = Object.freeze([
  ...PROJECT_COLOR_GROUPS.flatMap((palette) => [
    palette.base,
    ...Object.values(palette.light),
    ...Object.values(palette.dark),
    ...Object.values(palette.mid),
  ]),
]);

export const PROJECT_COLORS = Object.freeze([...new Set(PROJECT_COLOR_SEQUENCE)]);

export function isProjectColor(color) {
  return PROJECT_COLORS.includes(String(color).toUpperCase());
}
