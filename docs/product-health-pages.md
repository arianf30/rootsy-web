# Páginas de salud del producto (`/docs` bajo cada ruta)

## Cuándo crearlas

Al agregar una **pantalla de producto** nueva bajo `rootsy-web/app/<segmento>/`, sumá **`app/<segmento>/docs/page.tsx`** para documentar consumos (Supabase), rendimiento (cliente vs servidor) y seguridad (identidad, permisos, RLS) en lenguaje de producto.

## Cómo hacerlo

1. **Ruta:** `app/<misma-ruta-que-la-pantalla>/docs/page.tsx`. Ejemplos: `login/docs`, `home/docs`, `register/docs`, `recovery-password/docs`; rutas anidadas como `app/[siteId]/[popId]/menu/docs/page.tsx` junto a `menu/page.tsx`.
2. **UI reutilizable:** `@/components/product-health-docs/ProductHealthDocs` — `ProductHealthShell`, `FlowRow`, `FlowNode`, `FlowConnector`, `InsightGrid`, `ProductHealthCompactTable`.
3. **Contenido:** secciones numeradas (1 carga, 2 acción principal, 3 flujos alternativos si aplica). Sin briefing largo: primera línea = enlace “Volver” al segmento padre.
4. **Tono:** orientado a operación y producto; evitar nombres de API internos salvo que ayuden a soporte o auditoría.
5. **RLS / `public`:** si la pantalla hace `select`/`insert`/`rpc` a datos de negocio, la tabla compacta debe reflejarlo; si no, indicar “No aplica” o “Solo si…”.

## Referencia

Implementación de referencia: `app/login/docs/page.tsx`.

## Seguridad de la doc

Las rutas `*/docs` son públicas por defecto. Si no deben exponerse, restringir por entorno o middleware según política del equipo.
