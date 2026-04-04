# Supabase y contexto de datos (rootsy-web)

Documento para **desarrolladores y asistentes (IA)** al implementar pantallas, server actions o consultas contra Postgres en Rootsy. La **fuente normativa de seguridad** sigue siendo `rootsy-core`; esta app debe **reutilizar el mismo proyecto Supabase** y las mismas reglas de negocio.

---

## 1. Configuración en este repo

| Pieza | Ubicación |
|-------|-----------|
| Variables de entorno | `.env.local` (no commitear); plantilla en `.env.example` |
| Cliente servidor (RSC, actions, route handlers) | `utils/supabase/server.ts` → `createClient()` |
| Cliente navegador (Client Components) | `utils/supabase/client.ts` → `createClient()` |
| Refresco de sesión / cookies | `middleware.ts` (mismo patrón que rootsy-core) |

**Dependencias:** `@supabase/ssr`, `@supabase/supabase-js` (versiones alineadas con rootsy-core).

Uso típico en servidor:

```ts
import { createClient } from "@/utils/supabase/server"

const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
```

Uso típico en cliente:

```ts
"use client"
import { createClient } from "@/utils/supabase/client"

const supabase = createClient()
```

### 1.1 Autenticación (misma estrategia que rootsy-core)

| Pieza | Ubicación |
|-------|-----------|
| Contexto de sesión (cliente) | `context/AuthContextSupabase.tsx` — `AuthProvider`, `useAuth`, `logOut` |
| Solo usuarios logueados | `hoc/withAuth.tsx` — si no hay sesión → `/login` |
| Solo invitados (sin sesión) | `hoc/withGuestAuth.tsx` — si hay sesión → `/home` |
| Server actions / handlers | `lib/authHelpers.ts` — `requireAuthenticatedUser()`, `getAuthenticatedUserOrNull()` |
| OAuth (Google, etc.) | `app/auth/callback/route.ts` — `exchangeCodeForSession` |

**Rutas de auth (solo estas páginas en la app):** `/login`, `/register`, `/recovery-password`. El handler **`/auth/callback`** no es una página; intercambia el `code` (OAuth o enlace de recuperación) y redirige al `next` interno (solo paths que empiezan con `/`).

**Recuperar contraseña:** el correo debe apuntar al callback con `next` hacia `/recovery-password?paso=nueva` (ya configurado en `resetPasswordForEmail`). El mismo path `/recovery-password` también admite `token_hash` + `type` en query (mismo flujo que `auth/update-password` en core). **No** usar `withGuestAuth` en esta ruta: si el usuario ya tiene sesión y pide el formulario de email, se redirige a `/home`; el paso “nueva contraseña” requiere sesión temporal de recuperación.

En **Supabase → Authentication → URL configuration**, incluir **Redirect URLs** como `http://localhost:3000/auth/callback` y `http://localhost:3000/recovery-password` (y producción).

**Protegidas con `withAuth`:** `/home`, `/[pop]/menu`, `/[pop]/sale`. **Con `withGuestAuth`:** `/login`, `/register`.

---

## 2. Documentación canónica (rootsy-core)

Leer **antes** de tocar RLS, RPC o permisos:

| Documento | Contenido |
|-----------|-----------|
| `rootsy-core/docs/supabase-access-security.md` | Modelo multi-tenant (`pop_id`), owner, membresía activa, roles, `(resource, action)`, cadena §2.5 |
| `rootsy-core/docs/FEATURE_DEVELOPMENT_GUIDE.md` | Patrones de pantallas POP, `loadPopPermissionsSnapshot`, `POP_PERMS` |
| `rootsy-core/docs/DATABASE_RLS_RPC_INVENTORY.md` | Tablas con RLS, políticas resumidas, RPC expuestas |

**Reglas de oro**

- **Tenant = `pop_id`** en datos de negocio.
- **Owner** (`pops.owner_user_id`): todos los permisos en su POP; las RPC `user_has_permission` deben cortocircuitar (ver doc core).
- **Resto:** membresía **activa** en `user_pop_roles` + permiso explícito vía `role_permissions` para el par `(resource, action)`.
- **Nunca** usar `service_role` en código que corre en el navegador ni en server actions de usuario final.
- **RLS** es la barrera principal; el UI solo orienta.

---

## 3. Rutas y `pop_id` en rootsy-web

Las rutas bajo `app/[pop]/` usan el segmento dinámico **`pop`** (string en URL). Ese valor debe **corresponder al identificador del POP** que use la API de datos (UUID o slug según convención del producto). Al implementar datos reales:

- Validar que el usuario tenga acceso al POP (p. ej. RPC `user_has_pop_access` o equivalente).
- No confiar solo en el parámetro de URL: cruzar con `auth.uid()` y políticas RLS.

Hasta que exista esa capa en rootsy-web, las páginas pueden seguir con datos mock; al conectar Supabase, **cada query/mutación** debe respetar el modelo del §2.

---

## 4. RPC y tablas frecuentes (referencia rápida)

Inventario vivo en `rootsy-core/docs/DATABASE_RLS_RPC_INVENTORY.md`. Ejemplos usados en la plataforma:

| Necesidad | RPC / concepto |
|-----------|----------------|
| ¿Puede entrar a este POP? | `user_has_pop_access(pop_id)` (variantes con `user_id`) |
| ¿Puede hacer esta acción? | `user_has_permission(pop_id, user_id, resource, action)` |
| Snapshot para menú / UI | `get_user_all_permissions(p_pop_id, p_user_id)` |
| Listar POPs del usuario | `get_user_accessible_pops` |

Las funciones marcadas **SECURITY DEFINER** deben validar `auth.uid()` y permisos **dentro** de la función; no asumir que “cualquier llamada es segura”.

---

## 5. Tablas `public` con RLS (lista operativa)

Con RLS activo (marzo 2026, ver inventario): `pops`, `users`, `user_pop_roles`, `roles`, `role_permissions`, `permissions`, `articles`, `categories`, `pop_subscriptions`, `pop_subscription_features`, `pop_invitations`, tablas contables (`accounting_*`, `chart_of_accounts`), etc.

Al agregar una tabla nueva en Supabase: actualizar el inventario en rootsy-core y reflejar aquí solo si rootsy-web la consume de forma destacada.

---

## 6. Evolución de rootsy-web

Cuando una pantalla POP en rootsy-web pase de mock a datos reales:

1. Añadir server action o route handler con `createClient()` de `@/utils/supabase/server`.
2. Comprobar sesión (`getUser`) y acceso al POP según doc core.
3. Cargar permisos una vez por request cuando la UI lo requiera (mismo patrón que `loadPopPermissionsSnapshot` en core; se puede **importar o duplicar** el helper desde core si en el futuro se empaqueta código compartido).
4. Consultas: preferir filtros explícitos por `pop_id` además de confiar en RLS.

---

## 7. Prompt corto para IA (copiar al contexto)

> En rootsy-web, Supabase usa `utils/supabase/server` y `client`, `middleware` para cookies. Auth: `AuthProvider`, `withAuth` / `withGuestAuth`, `authHelpers`. Mismo proyecto que rootsy-core. Seguir `rootsy-core/docs/supabase-access-security.md` y `DATABASE_RLS_RPC_INVENTORY.md`. Tenant `pop_id`; owner y `user_has_permission`; sin `service_role` en acciones de usuario. Rutas `app/[pop]`: validar acceso al POP con sesión.
