# Rootsy — Design system y lineamientos de producto

Este documento es la referencia para construir vistas de la aplicación con coherencia visual, narrativa y técnica. La **implementación de referencia** del shell oscuro vive en `app/[pop]/menu/page.tsx`; los **tokens** están en `app/globals.css` (bloque `.dark` y `@theme inline`).

---

## 1. Qué es Rootsy (marca y tono)

- **Producto:** sistema de gestión online que se adapta a distintos tipos de negocios (operación, administración, configuración).
- **Promesa:** **simple en la superficie, profundo cuando hace falta** — como la naturaleza: orden aparentemente fácil sobre complejidad bien resuelta.
- **Mundo de marca:** Rootsy es una **mascota** que vive en un **parque natural**. En ese contexto organiza de manera **potente y sencilla** los negocios de los usuarios.
- **Voz en UI:** clara, calmada, sin ruido; celebrar logros y estados con toques orgánicos (verdes, luz suave), no con artificio agresivo.

Las pantallas deben **sentirse** coherentes con ese mundo: no es un panel “oficina genérica”, es un **espacio digital cuidado** donde el usuario navega con la misma claridad que un buen menú de sistema.

---

## 2. Dirección visual: menús premium tipo PS5

Objetivo: que la app recuerde a los **menús de juegos premium en PS5** (limpieza, profundidad, foco, sensación de capas), sin copiar assets ni marcas ajenas.

### Pilares

| Pilar | Qué implica en Rootsy |
|--------|------------------------|
| **Profundidad** | Fondos muy oscuros (`background`), capas elevadas (`card`, `muted`), bordes casi invisibles (`border`, `rootsy-hairline`), sombras y **blur** suaves donde aporte. |
| **Luz focal** | **Glow radial** que sigue al cursor o a la jerarquía de la pantalla (como en el menú); acentos **esmeralda / teal** en CTAs e íconos importantes (`primary`, `meadow`). |
| **Cristal y precisión** | `backdrop-blur`, bordes en blanco muy baja opacidad, **esquinas redondeadas** generosas (`rounded-xl`, `rounded-2xl`) en controles “de consola”. |
| **Iconografía hero** | Bloques con **gradiente** `from-emerald-500 to-teal-600`, brillo en hover, borde interno sutil (`border-white/20` en el tile), sombra `shadow-emerald-*` ligera. |
| **Movimiento** | Transiciones **200–500 ms**, `ease-out` o equivalente; **hover** que escala levemente o eleva; **partículas** o elementos ambientales muy sutiles (`animate-float`, opacidad baja). |
| **Foco y accesibilidad** | Estados de foco visibles (`ring` / `focus-visible`); respetar `prefers-reduced-motion` cuando el movimiento sea decorativo (reducir o desactivar animaciones no esenciales). |

### Anti-patrones

- Fondos claros para el **shell de aplicación** (el producto autenticado va en **dark** con los tokens actuales).
- Sombras duras, bordes gruesos negros, o demasiados colores saturados fuera de la paleta de marca.
- Animaciones largas o repetitivas que cansen; el movimiento debe **acompañar**, no distraer.

---

## 3. Tokens y tipografía (fuente técnica)

- **Archivo:** `app/globals.css`.
- **Modo app:** `html` con clase `dark` (ver `app/layout.tsx`).
- **Referencia visual del shell:** `app/[pop]/menu/page.tsx`.

### Nombres útiles (Tailwind)

- Fondo: `bg-background` (`#070a09`).
- Superficies: `bg-card`, `bg-muted`, `bg-secondary`.
- Texto: `text-foreground`, `text-muted-foreground`, opacidades `text-foreground/65`, etc.
- Bordes: `border-border`; líneas muy finas tipo cabecera PS5: `border-rootsy-hairline`.
- Acentos: `text-primary`, `bg-primary`, `text-meadow` (acento “hoja / partícula”).
- Partículas / highlights: `bg-rootsy-particle` o `var(--rootsy-particle)`.
- Bandas de sección (marketing / landing): `bg-rootsy-section-alt`, pie `bg-rootsy-footer`.

### Tipografía

- **Sans:** Nunito (`font-sans`, variable `--font-nunito`).
- **Mono:** Geist Mono (`font-mono`, variable `--font-geist-mono`) para atajos, códigos, datos tabulares.

---

## 4. Arquitectura de componentes (reutilización)

Dos capas, sin mezclar responsabilidades:

| Capa | Ubicación | Uso |
|------|-----------|-----|
| **Primitivos UI** | `components/ui/*` | Componentes estilo shadcn (botón, input, diálogo). No meter lógica de negocio ni layout de shell completo. |
| **Design system Rootsy** | `components/rootsy/*` | Piezas **compuestas y reutilizables** del producto: fondos atmosféricos, tiles con gradiente, barras tipo dock, cabeceras de shell, etc. |

### Cuándo crear algo en `components/rootsy/`

- El mismo patrón visual se repite en **2+ pantallas** (o está claro que se repetirá).
- Incluye **comportamiento** estable (hover, foco, medidas) alineado a la sección 2.
- No es solo una variante de un primitivo: es un **bloque de experiencia** (por ejemplo “tile de acción con glow”).

Convenciones:

- Un componente por archivo, nombre en **PascalCase**.
- Props tipadas; estilos con **tokens** (`bg-card`, `border-border`, …), no hex sueltos salvo excepción documentada.
- Exportar desde `components/rootsy/index.ts` cuando haya varios exports públicos (ir sumando a medida que crezca la carpeta).

### Ejemplos de candidatos a extraer (evolutivo)

- Fondo con glow + partículas (hoy en menú y landing).
- Tile de icono con gradiente y badge (ítems del menú / dock).
- Cabecera de shell con zona de marca / búsqueda / usuario.

Extraer **cuando** haya segunda pantalla que lo necesite, para no abstraer demasiado pronto.

---

## 5. Checklist rápido para una nueva vista

1. Fondo: `bg-background` + capas de profundidad si aplica (blur, gradientes radiales discretos).
2. Texto y bordes: tokens; hairline en separadores finos como el menú PS5.
3. CTAs e íconos fuertes: gradiente emerald/teal + `text-white` donde el contraste lo pida.
4. Motion: transiciones cortas; considerar `motion-safe:` o `prefers-reduced-motion` en animaciones decorativas.
5. Si el patrón se repite, subirlo a `components/rootsy/` y documentar en este archivo en la sección **“Componentes Rootsy”** (tabla breve: nombre, props, dónde se usa).

---

## 6. Componentes Rootsy (inventario vivo)

| Componente | Archivo | Uso |
|------------|---------|-----|
| — | — | Completar al crear cada pieza en `components/rootsy/`. |

---

## 7. Referencias en el repo

- Menú shell (fuente de verdad visual): `app/[pop]/menu/page.tsx`
- Landing pública (misma familia de tokens): `components/landing/LandingPage.tsx`
- Tokens y utilidades globales: `app/globals.css`

---

*Última actualización: coherente con el enfoque “parque + mascota + menú premium”; ajustar tokens solo en `globals.css` y reflejar cambios relevantes aquí.*
