/**
 * Paleta primitiva Rootsy (50–950, estilo Tailwind).
 * Anclada a los tokens ya usados en app/globals.css (bosque POP, charts, bark, ink del shell).
 *
 * Convención: 50 = más claro, 950 = más oscuro. Los tokens semánticos shadcn (`primary`, etc.)
 * siguen siendo la capa de significado; acá tenés matices para feedback fino (“subí un paso en forest”).
 */

export const SHADES = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "950",
] as const

export type Shade = (typeof SHADES)[number]

export type RootsPaletteFamily = {
  /** id estable (prefijo Tailwind) */
  id: string
  /** Nombre en español para el UI Kit */
  label: string
  /** Para qué sirve en producto (design-role: intención antes que hex). */
  intent: string
  /** Paso que coincide con el uso más frecuente / marca en oscuro. */
  anchor?: Shade
  steps: Record<Shade, string>
}

/**
 * Bosque — primary / forest en modo oscuro (#10b981 ≈ 500). Escala esmeralda estándar (accesibilidad probada).
 */
const FOREST: Record<Shade, string> = {
  "50": "#ecfdf5",
  "100": "#d1fae5",
  "200": "#a7f3d0",
  "300": "#6ee7b7",
  "400": "#34d399",
  "500": "#10b981",
  "600": "#059669",
  "700": "#047857",
  "800": "#065f46",
  "900": "#064e3b",
  "950": "#022c22",
}

/**
 * Pradera — partículas y acentos claros (#34d399 en 500; 600 ancla al CTA para transiciones suaves).
 */
const MEADOW: Record<Shade, string> = {
  "50": "#effefa",
  "100": "#ccfbf1",
  "200": "#99f6e4",
  "300": "#5eead4",
  "400": "#3ee8b6",
  "500": "#34d399",
  "600": "#10b981",
  "700": "#0d9488",
  "800": "#0f766e",
  "900": "#115e59",
  "950": "#042f2e",
}

/**
 * Teal — chart-3 / acentos fríos (#2dd4bf).
 */
const TEAL: Record<Shade, string> = {
  "50": "#f0fdfa",
  "100": "#ccfbf1",
  "200": "#99f6e4",
  "300": "#5eead4",
  "400": "#2dd4bf",
  "500": "#14b8a6",
  "600": "#0d9488",
  "700": "#0f766e",
  "800": "#115e59",
  "900": "#134e4a",
  "950": "#042f2e",
}

/**
 * Ámbar — chart-2, alertas suaves, badges (#fbbf24 ≈ 400).
 */
const AMBER: Record<Shade, string> = {
  "50": "#fffbeb",
  "100": "#fef3c7",
  "200": "#fde68a",
  "300": "#fcd34d",
  "400": "#fbbf24",
  "500": "#f59e0b",
  "600": "#d97706",
  "700": "#b45309",
  "800": "#92400e",
  "900": "#78350f",
  "950": "#451a03",
}

/**
 * Naranja — chart-4, énfasis cálido (#f97316 ≈ 500).
 */
const ORANGE: Record<Shade, string> = {
  "50": "#fff7ed",
  "100": "#ffedd5",
  "200": "#fed7aa",
  "300": "#fdba74",
  "400": "#fb923c",
  "500": "#f97316",
  "600": "#ea580c",
  "700": "#c2410c",
  "800": "#9a3412",
  "900": "#7c2d12",
  "950": "#431407",
}

/**
 * Corteza — neutro cálido (#78716c ≈ 500, stone).
 */
const BARK: Record<Shade, string> = {
  "50": "#fafaf9",
  "100": "#f5f5f4",
  "200": "#e7e5e4",
  "300": "#d6d3d1",
  "400": "#a8a29e",
  "500": "#78716c",
  "600": "#57534e",
  "700": "#44403c",
  "800": "#292524",
  "900": "#1c1917",
  "950": "#0c0a09",
}

/**
 * Riesgo — destructivo / errores (alineado a rojo accesible; complementa `--destructive` oklch del tema).
 */
const RISK: Record<Shade, string> = {
  "50": "#fef2f2",
  "100": "#fee2e2",
  "200": "#fecaca",
  "300": "#fca5a5",
  "400": "#f87171",
  "500": "#ef4444",
  "600": "#dc2626",
  "700": "#b91c1c",
  "800": "#991b1b",
  "900": "#7f1d1d",
  "950": "#450a0a",
}

/**
 * Niebla — superficies claras con tinte vegetal sutil (encaja con background oklch claro).
 */
const MIST: Record<Shade, string> = {
  "50": "#fafcfb",
  "100": "#f0f5f2",
  "200": "#dce8e0",
  "300": "#bcd4c8",
  "400": "#8fb0a2",
  "500": "#648a7a",
  "600": "#4d6d60",
  "700": "#3f584e",
  "800": "#33463f",
  "900": "#2a3a34",
  "950": "#15221d",
}

/**
 * Tinta — carbono con tinte verdoso (shell oscuro POP: #070a09 ≈ 950, card #0c0f0e ≈ 900).
 */
const INK: Record<Shade, string> = {
  "50": "#f2f6f4",
  "100": "#dfe9e4",
  "200": "#bfd4ca",
  "300": "#92b0a2",
  "400": "#648a7a",
  "500": "#45685b",
  "600": "#335246",
  "700": "#283d35",
  "800": "#1a2b26",
  "900": "#0c0f0e",
  "950": "#070a09",
}

export const ROOTSY_PALETTE_FAMILIES: RootsPaletteFamily[] = [
  {
    id: "forest",
    label: "Forest (marca · esmeralda)",
    intent:
      "CTA, primario, anillos de foco, estados activos. En oscuro, `--primary` y `--forest` = 500.",
    anchor: "500",
    steps: FOREST,
  },
  {
    id: "meadow",
    label: "Meadow (pradera · acento claro)",
    intent:
      "Partículas, brillos, badges suaves. `--rootsy-particle` y chart-1 en oscuro ≈ 400–500.",
    anchor: "500",
    steps: MEADOW,
  },
  {
    id: "teal",
    label: "Teal (-chart frío)",
    intent: "Datos y acentos fríos; chart-3 en ambos temas.",
    anchor: "400",
    steps: TEAL,
  },
  {
    id: "amber",
    label: "Amber (ámbar)",
    intent: "Advertencias leves, ofertas, chart-2.",
    anchor: "400",
    steps: AMBER,
  },
  {
    id: "orange",
    label: "Orange (cítrico)",
    intent: "Énfasis secundario; chart-4.",
    anchor: "500",
    steps: ORANGE,
  },
  {
    id: "bark",
    label: "Bark (corteza · neutro cálido)",
    intent: "Neutros texturales, jerarquía sin competir con el verde.",
    anchor: "500",
    steps: BARK,
  },
  {
    id: "risk",
    label: "Risk (destructivo)",
    intent:
      "Errores y acciones peligrosas. Complementa el token `--destructive` (oklch) con matices para bordes y fondos.",
    anchor: "600",
    steps: RISK,
  },
  {
    id: "mist",
    label: "Mist (niebla · superficies claras)",
    intent:
      "Fondos y capas en modo claro sin usar blanco puro; coherente con `--background` oklch.",
    anchor: "50",
    steps: MIST,
  },
  {
    id: "ink",
    label: "Ink (tinta · superficies oscuras)",
    intent:
      "Capas del shell POP oscuro: `--background` ≈ 950, `--card` ≈ 900.",
    anchor: "950",
    steps: INK,
  },
]

/** Mapeo semántico → primitivo sugerido (feedback y código). */
export const ROOTSY_SEMANTIC_TO_PRIMITIVE: {
  token: string
  label: string
  hint: string
}[] = [
  { token: "background", label: "Fondo página", hint: "light: mist-50 · dark: ink-950" },
  { token: "foreground", label: "Texto base", hint: "light: ink-950 · dark: white" },
  { token: "card", label: "Tarjeta", hint: "light: white / mist-50 · dark: ink-900" },
  { token: "primary", label: "Acción principal", hint: "forest-500 (dark fijo #10b981)" },
  { token: "muted", label: "Superficie apagada", hint: "dark: blanco 6% · light: mist-100" },
  { token: "border", label: "Borde", hint: "dark: white/8% · light: mist-200" },
  { token: "forest", label: "Marca bosque", hint: "forest-500" },
  { token: "meadow", label: "Pradera", hint: "meadow-500" },
  { token: "rootsy-particle", label: "Partícula POP", hint: "meadow-500 / forest-400" },
  { token: "destructive", label: "Destructivo", hint: "risk-600 + risk-50 fondo" },
]
