"use client"

import Link from "next/link"
import React, { useState, useEffect, useRef } from "react"
import {
  ArrowRight,
  Check,
  ChevronRight,
  ChevronDown,
  MonitorPlay,
  CornerDownRight,
  Plus,
  Sparkles,
  Info,
  Minus,
  Menu,
  X,
} from "lucide-react"

const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL ?? "/login"
/** Devuelve [ref, inView]: inView pasa a true la primera vez que el
 *  elemento entra en el viewport. Ideal para reveals de scroll. */
function useInView<T extends HTMLElement>(
  options: IntersectionObserverInit = { threshold: 0.2 }
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      });
    }, options);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

/** Wrapper que se observa a sí mismo y revela su contenido con fade-up
 *  al entrar en el viewport. `delay` agrega un stagger dentro de la misma fila. */
function RevealItem({
  delay = 0,
  className,
  children,
}: {
  delay?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.12 });
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(30px)",
        transition: `opacity 0.65s ease ${delay}s, transform 0.65s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

function RootsyLogo({ className }: { className?: string }) {
  return (
    <img
      src="/landing/logo-rootsy-white.svg"
      alt="Rootsy"
      width={308}
      height={102}
      className={className}
    />
  )
}

/** Capturas de producto — nombres alineados al Make (Home_-_Hero, Comercio_-_*, Gastronomia_-_*). */
const productCapture = "/landing/home-hero.png"
const comercioHero = "/landing/comercio-hero.png"
const comercioBenef1 = "/landing/comercio-beneficio-1.png"
const comercioBenef2 = "/landing/comercio-beneficio-2.png"
const comercioBenef3 = "/landing/comercio-beneficio-3.png"
const gastronomiaHero = "/landing/gastronomia-hero.png"
const gastronomiaSol1 = "/landing/gastronomia-solucion-1.png"
const gastronomiaSol2 = "/landing/gastronomia-solucion-2.png"
const gastronomiaSol3 = "/landing/gastronomia-solucion-3.png"
const gastronomiaSol4 = "/landing/gastronomia-solucion-4.png"

type SegmentId = "comercio" | "gastronomia" | "elaboracion";

interface Plan {
  name: string;
  /** USD per month when billed monthly */
  monthly: number;
  /** USD per month when billed annually (2 months free) */
  annualMonthly: number;
  features: string[];
  highlight: boolean;
  /** Optional "Incluye todo lo del plan X, más:" line shown above the feature list */
  subtitle?: string;
}

interface AddOn {
  name: string;
  desc: string;
  price: number;
  /** "mes" = recurring monthly, "unica" = one-time charge */
  billing: "mes" | "unica";
}

interface FeatureGroup {
  /** Group heading, e.g. "Ventas", "Operación" */
  group: string;
  /** Functionality names under this group */
  items: string[];
}

/** A single functionality row in the plan comparison table.
 *  `values` is indexed to match the segment's `plans` order.
 *  Each value: `true` = incluido, `false` = no incluido, string = detalle (p.ej. "Hasta 2.000"). */
interface ComparisonRow {
  label: string;
  /** Short explanation shown in a tooltip. Content to be finalized by the client. */
  tooltip: string;
  values: (boolean | string)[];
}

interface ComparisonGroup {
  /** Collapsible group heading */
  group: string;
  rows: ComparisonRow[];
}

interface Benefit {
  title: string;
  desc: string;
  /** Group of functionalities that make up this benefit — shown as a checklist */
  features: string[];
  /** Label shown on the product placeholder — replace with a real screenshot later */
  shot: string;
  imageSrc?: string;
}

interface Testimonial {
  text: string;
  author: string;
  role: string;
  avatar?: string;
}

interface Faq {
  q: string;
  a: string;
}

const FAQ_OFFLINE: Faq = {
  q: "¿Qué pasa si me quedo sin conexión?",
  a: "Podés seguir usando Rootsy sin problemas. Lo que hagas mientras no hay internet queda registrado, y cuando vuelve la conexión se sincroniza solo con lo que se hizo en ese tiempo.",
}

interface SegmentData {
  id: SegmentId;
  label: string;
  emoji: string;
  tagline: string;
  valueProp: string;
  /** One-line "what changes for you" intro shown when this segment is active */
  intro: string;
  useCases: string[];
  heroImageSrc?: string;
  benefits: Benefit[];
  /** Heading for the "Todo lo que incluye" section, varies per segment */
  featureGroupsTitle: string;
  /** "Todo lo que incluye" — functionalities organized in groups (scales to 3–5 columns) */
  featureGroups: FeatureGroup[];
  plans: Plan[];
  /** Optional add-ons the user can toggle on top of a plan */
  addOns: AddOn[];
  /** Detailed feature-by-feature comparison across all plans, grouped and collapsible */
  comparison: ComparisonGroup[];
  /** Heading for the testimonials section */
  testimonialsTitle: string;
  /** 3 testimonials from real-looking users of this segment */
  testimonials: Testimonial[];
  /** Rubro-specific questions */
  faqs: Faq[];
}

const segments: Record<SegmentId, SegmentData> = {
  comercio: {
    id: "comercio",
    label: "Comercio",
    emoji: "🏪",
    tagline: "Tiendas, bazares y locales minoristas",
    valueProp: "De la caja registradora al control total de tu local.",
    intro: "Cobrá más rápido, controlá tu stock y entendé tu negocio desde un solo lugar.",
    useCases: ["Bazar", "Kiosco", "Indumentaria", "Ferretería", "Perfumería"],
    heroImageSrc: comercioHero,
    benefits: [
      {
        title: "Vendé más rápido, atendé mejor.",
        desc: "Un punto de venta pensado para que cada cobro sea simple, rápido y sin errores.",
        features: [
          "Cobrá con efectivo, QR, tarjeta o transferencia",
          "Descuentos y promociones en un toque",
          "Buscá productos por nombre o código de barras",
          "Cierre de caja simple y seguro",
        ],
        shot: "Punto de venta",
        imageSrc: comercioBenef1,
      },
      {
        title: "Nunca más te quedes sin stock.",
        desc: "Cada venta actualiza el inventario automáticamente para que siempre sepas qué tenés disponible.",
        features: [
          "Stock actualizado en tiempo real",
          "Alertas de productos por agotarse",
          "Compras y reposición más simples",
          "Reportes y ajustes desde un solo lugar",
        ],
        shot: "Inventario en tiempo real",
        imageSrc: comercioBenef2,
      },
      {
        title: "Tomá decisiones con información real.",
        desc: "Dejá de adivinar. Conocé qué vendés, cuánto ganás y dónde están las oportunidades.",
        features: [
          "Ventas por período, producto y vendedor",
          "Productos más y menos vendidos",
          "Rentabilidad del negocio",
          "Reportes exportables cuando los necesites",
        ],
        shot: "Dashboard de ventas",
        imageSrc: comercioBenef3,
      },
    ],
    featureGroupsTitle: "Todo lo que tu negocio necesita. En un solo lugar.",
    featureGroups: [
      { group: "Ventas", items: ["Punto de venta", "Clientes", "Promociones", "Medios de pago"] },
      { group: "Operación", items: ["Stock", "Compras", "Proveedores", "Inventario", "Caja"] },
      { group: "Administración", items: ["Gastos", "Usuarios", "Permisos", "Auditoría"] },
      { group: "Información", items: ["Reportes", "Estadísticas", "Rentabilidad", "Exportaciones"] },
    ],
    plans: [
      {
        name: "Inicial",
        monthly: 10,
        annualMonthly: 8,
        features: [
          "Hasta 2.000 productos",
          "Hasta 3 usuarios",
          "Punto de venta y control de caja",
          "Control de stock",
          "Gastos y estadísticas básicas",
          "Cobros con Mercado Pago",
        ],
        highlight: false,
      },
      {
        name: "Crecimiento",
        monthly: 15,
        annualMonthly: 12,
        subtitle: "Incluye todo lo del plan Inicial, más:",
        features: [
          "Hasta 10.000 productos",
          "Hasta 5 usuarios",
          "Clientes y proveedores",
          "Promociones y hasta 3 listas de precios",
          "Presupuestos comerciales",
          "Reportes y estadísticas avanzadas",
        ],
        highlight: true,
      },
      {
        name: "Pro",
        monthly: 20,
        annualMonthly: 16,
        subtitle: "Incluye todo lo del plan Crecimiento, más:",
        features: [
          "Productos ilimitados",
          "Usuarios, cajas e impresoras ilimitadas",
          "Listas de precios ilimitadas",
          "Cuentas corrientes",
          "Exportación a Excel",
          "Multi-sucursal y API",
        ],
        highlight: false,
      },
    ],
    addOns: [
      { name: "Módulo fiscal", desc: "Emití comprobantes fiscales conectando con ARCA (facturación electrónica).", price: 10, billing: "unica" },
      { name: "Catálogo Online + QR", desc: "Publicá tus productos en la web y compartilos con un código QR.", price: 5, billing: "mes" },
    ],
    comparison: [
      {
        group: "Operación diaria",
        rows: [
          { label: "Cantidad de artículos", tooltip: "Cantidad máxima de productos que podés cargar en tu catálogo.", values: ["Hasta 2.000", "Hasta 10.000", "Ilimitados"] },
          { label: "Vender productos", tooltip: "Registrá ventas desde el punto de venta con todos tus medios de pago.", values: [true, true, true] },
          { label: "Comprar productos", tooltip: "Cargá compras a proveedores y actualizá tu stock automáticamente.", values: [true, true, true] },
          { label: "Gestión de stock", tooltip: "Controlá el inventario en tiempo real con cada venta y compra.", values: [true, true, true] },
          { label: "Listas de precio", tooltip: "Manejá distintos precios según canal, cliente o temporada.", values: ["1", "3", "Ilimitadas"] },
          { label: "Manejo de cajas", tooltip: "Cantidad de cajas o puntos de cobro que podés operar en simultáneo.", values: ["1", "2", "Ilimitadas"] },
          { label: "Arqueo de caja", tooltip: "Cerrá la caja y cuadrá los movimientos del día automáticamente.", values: [true, true, true] },
          { label: "Crear promociones", tooltip: "Armá descuentos y ofertas por producto, categoría o período.", values: [false, true, true] },
          { label: "Cuentas corrientes", tooltip: "Gestioná saldos y pagos a cuenta de tus clientes.", values: [false, false, true] },
          { label: "Crear presupuestos", tooltip: "Generá presupuestos comerciales y convertilos en ventas con un clic.", values: [false, true, true] },
          { label: "Alertas por falta de stock", tooltip: "Recibí un aviso cuando un producto llega a su stock mínimo.", values: [true, true, true] },
          { label: "Impresión inalámbrica", tooltip: "Imprimí tickets desde impresoras conectadas por red o Bluetooth.", values: [false, false, true] },
        ],
      },
      {
        group: "Administración del negocio",
        rows: [
          { label: "Gastos fijos y variables", tooltip: "Registrá y clasificá todos los gastos de tu negocio.", values: [true, true, true] },
          { label: "Gestión de cuentas bancarias", tooltip: "Seguí el saldo y los movimientos de tus cuentas bancarias.", values: [true, true, true] },
          { label: "Estadísticas básicas", tooltip: "Ventas del día, medios de pago y productos más vendidos.", values: [true, true, true] },
          { label: "Estadísticas ampliadas", tooltip: "Análisis por período, rentabilidad y comparativas avanzadas.", values: [false, true, true] },
          { label: "Gestión de clientes", tooltip: "Base de clientes con historial de compras y datos de contacto.", values: [false, true, true] },
          { label: "Gestión de proveedores", tooltip: "Administrá tus proveedores, compras y condiciones de pago.", values: [false, true, true] },
          { label: "Historial de operaciones", tooltip: "Registro completo y auditable de todo lo que pasa en tu negocio.", values: [true, true, true] },
          { label: "Reportes de stock, ventas, compras e ingresos", tooltip: "Reportes detallados de stock, ventas, compras, ingresos y egresos.", values: [false, true, true] },
          { label: "Exportar listas en Excel", tooltip: "Descargá cualquier listado en Excel para analizarlo por fuera.", values: [false, false, true] },
        ],
      },
      {
        group: "Configuración y accesos",
        rows: [
          { label: "Cantidad de usuarios", tooltip: "Personas del equipo que pueden acceder al sistema con su propio usuario.", values: ["Hasta 3", "Hasta 5", "Ilimitados"] },
          { label: "Logo en tickets", tooltip: "Sumá el logo de tu negocio a los tickets y comprobantes.", values: [false, true, true] },
          { label: "Impresoras", tooltip: "Cantidad de impresoras que podés conectar en simultáneo.", values: ["1", "Hasta 2", "Ilimitadas"] },
          { label: "Integración con Mercado Pago", tooltip: "Cobrá con Mercado Pago y conciliá los pagos automáticamente.", values: [true, true, true] },
        ],
      },
    ],
    testimonialsTitle: "Lo dicen quienes ya cambiaron la forma de gestionar su local.",
    testimonials: [
      {
        text: "Rootsy me permitió dejar de perder tiempo contando mercadería. Ahora sé exactamente qué tengo, qué necesito pedir y cuánto gané en el mes.",
        author: "Daniela G.",
        role: "Dueña de bazar — Buenos Aires",
        avatar: "https://i.pravatar.cc/96?img=47",
      },
      {
        text: "Antes el cierre de caja me llevaba casi una hora. Hoy lo hago en diez minutos y sé exactamente cuánto facturé y por qué medio.",
        author: "Rodrigo P.",
        role: "Dueño de ferretería — Rosario",
        avatar: "https://i.pravatar.cc/96?img=12",
      },
      {
        text: "Lo que más me sorprendió fue el stock en tiempo real. Abrís la app y ya sabés qué se está por agotar sin tener que ir a revisar físicamente.",
        author: "Valentina M.",
        role: "Encargada de indumentaria — Córdoba",
        avatar: "https://i.pravatar.cc/96?img=56",
      },
    ],
    faqs: [
      FAQ_OFFLINE,
      { q: "¿Necesito una computadora o algún equipo especial?", a: "No. Rootsy funciona desde cualquier notebook, tablet o celular con navegador. Si ya tenés lector de código de barras o impresora de tickets, los conectás sin problema." },
      { q: "¿Emite factura electrónica ARCA?", a: "Sí. Emitís facturas A, B, C y remitos integrados con ARCA directamente desde el punto de venta, sin pasar a otro sistema." },
      { q: "¿Puedo migrar mi lista de productos actual?", a: "Sí. Importás tu stock y tus precios desde una planilla de Excel en minutos, y te ayudamos en la puesta a punto inicial." },
      { q: "¿Sirve si tengo más de un local?", a: "Sí. Gestionás todas tus sucursales desde un solo panel, con stock y reportes consolidados o por local. Está disponible desde el plan Escalable." },
    ],
  },
  elaboracion: {
    id: "elaboracion",
    label: "Elaboración",
    emoji: "⚗️",
    tagline: "Producción y manufactura artesanal",
    valueProp: "Vendé lo que hacés. Controlá todo desde el mismo sistema.",
    intro: "Pensado para negocios que además de vender, preparan, fraccionan o elaboran sus propios productos.",
    useCases: ["Carnicería", "Panadería", "Dietética", "Fábrica de pastas", "Cosmética artesanal"],
    benefits: [
      {
        title: "Sabé cuánto te cuesta cada producto.",
        desc: "Cargá cómo preparás cada artículo y Rootsy calcula automáticamente el costo para ayudarte a vender con mejor margen.",
        features: [
          "Recetas y preparaciones simples",
          "Costos automáticos",
          "Precio sugerido según margen",
          "Actualización automática al cambiar un insumo",
        ],
        shot: "Ficha de receta y costeo",
      },
      {
        title: "Elaborá sin perder el control del stock.",
        desc: "Cada preparación actualiza automáticamente el inventario para que siempre sepas qué tenés disponible.",
        features: [
          "Descuento automático de insumos",
          "Stock actualizado en tiempo real",
          "Alertas por faltantes",
          "Compras y reposición más simples",
        ],
        shot: "Stock de materias primas",
      },
      {
        title: "Vendé con información, no con intuición.",
        desc: "Conocé qué productos dejan más ganancia, qué se vende más y cuándo conviene volver a producir.",
        features: [
          "Rentabilidad por producto",
          "Productos más vendidos",
          "Reportes de ventas y producción",
          "Exportación a Excel",
        ],
        shot: "Reportes de producción",
      },
    ],
    featureGroupsTitle: "Todo lo que necesitás para producir y vender.",
    featureGroups: [
      { group: "Producción", items: ["Recetas y preparaciones", "Costeo automático", "Producción", "Rendimiento"] },
      { group: "Stock", items: ["Materias primas", "Productos terminados", "Compras", "Proveedores"] },
      { group: "Ventas", items: ["Punto de venta", "Clientes", "Promociones", "Reportes"] },
      { group: "Administración", items: ["Usuarios", "Auditoría", "Exportaciones", "Estadísticas"] },
    ],
    plans: [
      {
        name: "Inicial",
        monthly: 15,
        annualMonthly: 12,
        features: [
          "Hasta 5.000 artículos",
          "Hasta 5 usuarios",
          "Punto de venta y control de caja",
          "Fabricación y fragmentación de artículos",
          "Control de stock",
          "Estadísticas básicas",
        ],
        highlight: false,
      },
      {
        name: "Crecimiento",
        monthly: 20,
        annualMonthly: 16,
        subtitle: "Incluye todo lo del plan Inicial, más:",
        features: [
          "Hasta 15.000 artículos",
          "Hasta 8 usuarios",
          "Clientes y proveedores",
          "Promociones y hasta 3 listas de precios",
          "Crear presupuestos",
          "Estadísticas avanzadas",
        ],
        highlight: true,
      },
      {
        name: "Pro",
        monthly: 25,
        annualMonthly: 20,
        subtitle: "Incluye todo lo del plan Crecimiento, más:",
        features: [
          "Artículos ilimitados",
          "Usuarios, cajas e impresoras ilimitadas",
          "Cuentas corrientes",
          "Listas de precios ilimitadas",
          "Alertas por falta de stock",
          "Integración con Pedidos Ya & Rappi",
        ],
        highlight: false,
      },
    ],
    addOns: [
      { name: "Módulo fiscal", desc: "Enlazá con ARCA para emitir comprobantes fiscales (facturación electrónica).", price: 10, billing: "unica" },
      { name: "Impresión inalámbrica", desc: "Vendé desde celulares o tablets y enviá la señal de impresión a distancia.", price: 10, billing: "unica" },
      { name: "Catálogo Online + QR", desc: "Publicá tus productos en la web y compartilos con un código QR.", price: 5, billing: "mes" },
    ],
    comparison: [
      {
        group: "Operación diaria",
        rows: [
          { label: "Cantidad de artículos", tooltip: "Cantidad máxima de productos que podés cargar en tu catálogo.", values: ["Hasta 5.000", "Hasta 15.000", "Ilimitados"] },
          { label: "Vender productos", tooltip: "Registrá ventas desde el punto de venta con todos tus medios de pago.", values: [true, true, true] },
          { label: "Comprar productos", tooltip: "Cargá compras a proveedores y actualizá tu stock automáticamente.", values: [true, true, true] },
          { label: "Gestión de stock", tooltip: "Controlá el inventario en tiempo real con cada venta y producción.", values: [true, true, true] },
          { label: "Listas de precio", tooltip: "Manejá distintos precios según canal, cliente o temporada.", values: ["1", "3", "Ilimitadas"] },
          { label: "Fabricación y fragmentación", tooltip: "Elaborá tus propios productos o fraccioná mercadería para la venta.", values: [true, true, true] },
          { label: "Productos por peso (balanza)", tooltip: "Vendé productos pesables conectando tu balanza al sistema.", values: [true, true, true] },
          { label: "Manejo de cajas", tooltip: "Cantidad de cajas o puntos de cobro que podés operar en simultáneo.", values: ["1", "2", "Ilimitadas"] },
          { label: "Arqueo de caja", tooltip: "Cerrá la caja y cuadrá los movimientos del día automáticamente.", values: [true, true, true] },
          { label: "Crear promociones", tooltip: "Armá descuentos y ofertas por producto, categoría o período.", values: [false, true, true] },
          { label: "Cuentas corrientes", tooltip: "Gestioná saldos y pagos a cuenta de tus clientes.", values: [false, false, true] },
          { label: "Crear presupuestos", tooltip: "Generá presupuestos comerciales y convertilos en ventas con un clic.", values: [false, true, true] },
          { label: "Alertas por falta de stock", tooltip: "Recibí un aviso cuando un producto llega a su stock mínimo.", values: [true, true, true] },
          { label: "Impresión inalámbrica", tooltip: "Imprimí tickets desde celulares, tablets o impresoras en red.", values: [false, false, true] },
        ],
      },
      {
        group: "Administración del negocio",
        rows: [
          { label: "Gastos fijos y variables", tooltip: "Registrá y clasificá todos los gastos de tu negocio.", values: [true, true, true] },
          { label: "Gestión de cuentas bancarias", tooltip: "Seguí el saldo y los movimientos de tus cuentas bancarias.", values: [true, true, true] },
          { label: "Estadísticas básicas", tooltip: "Ventas del día, medios de pago y productos más vendidos.", values: [true, true, true] },
          { label: "Estadísticas ampliadas", tooltip: "Análisis por período, rentabilidad y comparativas avanzadas.", values: [false, true, true] },
          { label: "Gestión de clientes", tooltip: "Base de clientes con historial de compras y datos de contacto.", values: [false, true, true] },
          { label: "Gestión de proveedores", tooltip: "Administrá tus proveedores, compras y condiciones de pago.", values: [false, true, true] },
          { label: "Historial de operaciones", tooltip: "Registro completo y auditable de todo lo que pasa en tu negocio.", values: [true, true, true] },
          { label: "Reportes de stock, ventas, compras e ingresos", tooltip: "Reportes detallados de stock, ventas, compras, ingresos y egresos.", values: [false, true, true] },
          { label: "Exportar listas en Excel", tooltip: "Descargá cualquier listado en Excel para analizarlo por fuera.", values: [false, false, true] },
        ],
      },
      {
        group: "Configuración y accesos",
        rows: [
          { label: "Cantidad de usuarios", tooltip: "Personas del equipo que pueden acceder al sistema con su propio usuario.", values: ["Hasta 5", "Hasta 8", "Ilimitados"] },
          { label: "Logo en tickets", tooltip: "Sumá el logo de tu negocio a los tickets y comprobantes.", values: [false, true, true] },
          { label: "Impresoras", tooltip: "Cantidad de impresoras que podés conectar en simultáneo.", values: ["1", "Hasta 3", "Ilimitadas"] },
          { label: "Integración con Mercado Pago", tooltip: "Cobrá con Mercado Pago y conciliá los pagos automáticamente.", values: [true, true, true] },
          { label: "Integración con Pedidos Ya & Rappi", tooltip: "Recibí pedidos de Pedidos Ya y Rappi directo en tu sistema.", values: [false, false, true] },
        ],
      },
    ],
    testimonialsTitle: "Lo dicen quienes ya dejaron las planillas atrás.",
    testimonials: [
      {
        text: "Antes calculábamos los costos a mano. Hoy sabemos exactamente cuánto ganamos con cada producto.",
        author: "María G.",
        role: "Panadería · Rosario",
        avatar: "https://i.pravatar.cc/96?img=49",
      },
      {
        text: "La preparación descuenta automáticamente los insumos. Dejamos de tener diferencias de stock.",
        author: "Carlos M.",
        role: "Carnicería · Córdoba",
        avatar: "https://i.pravatar.cc/96?img=15",
      },
      {
        text: "Ahora sabemos qué productos conviene seguir elaborando y cuáles no.",
        author: "Lucía R.",
        role: "Dietética · Mendoza",
        avatar: "https://i.pravatar.cc/96?img=44",
      },
    ],
    faqs: [
      FAQ_OFFLINE,
      { q: "¿Puedo cargar recetas con sub-recetas o preparaciones intermedias?", a: "Sí. Podés armar recetas compuestas por otras preparaciones, y Rootsy calcula el costo total propagando cada nivel automáticamente." },
      { q: "¿Cómo se actualiza el costo cuando cambia el precio de un insumo?", a: "Al actualizar el precio de una materia prima, todos los productos que la usan recalculan su costo y su precio sugerido al instante." },
      { q: "¿Puedo vender productos por peso, con balanza?", a: "Sí. Rootsy está pensado para dietéticas, carnicerías, verdulerías y otros negocios que venden por kilo o por gramo: pesás, cobrás y el stock se actualiza solo." },
      { q: "¿Sirve si produzco y también vendo al público?", a: "Totalmente. Rootsy integra producción, stock y punto de venta, así lo que producís se descuenta y se vende en el mismo sistema." },
      { q: "¿Puedo fabricar o fraccionar mis propios productos para vender?", a: "Sí. Comprás a granel, por ejemplo una bolsa de 25 kg de almendras, y Rootsy te permite fraccionar y vender en bolsitas de 100 g, descontando el insumo del stock." },
    ],
  },
  gastronomia: {
    id: "gastronomia",
    label: "Gastronomía",
    emoji: "🍽️",
    tagline: "Restaurantes, bares y cafeterías",
    valueProp: "Todo tu restaurante, sincronizado de punta a punta.",
    intro: "Pensado para restaurantes, bares y cafeterías que necesitan atender más rápido, vender más y mantener toda la operación bajo control.",
    useCases: ["Restaurante", "Bar", "Cafetería", "Pizzería", "Rotisería"],
    heroImageSrc: gastronomiaHero,
    benefits: [
      {
        title: "Un salón que trabaja a tu manera.",
        desc: "Diseñá el plano de tu restaurante exactamente como es en la vida real. Administrá mesas, unilas, separalas y gestioná cada cuenta sin complicaciones.",
        features: [
          "Diseño libre de salones y mesas",
          "Mesas unidas o divididas en segundos",
          "Cobros parciales o individuales",
          "Pedidos desde tablets o celulares",
        ],
        shot: "Mapa de salón y mesas",
        imageSrc: gastronomiaSol1,
      },
      {
        title: "Cada pedido llega donde tiene que llegar.",
        desc: "Los pedidos pasan automáticamente del salón a cocina, sin papeles, sin gritos y sin errores.",
        features: [
          "Comandas digitales (KDS)",
          "Estado de cada pedido en tiempo real",
          "Menos impresoras y menos papel",
          "Cocina y salón siempre sincronizados",
        ],
        shot: "Comandas digitales en vivo",
        imageSrc: gastronomiaSol2,
      },
      {
        title: "Vendé más. Controlá menos.",
        desc: "Cada venta actualiza automáticamente el stock, descuenta ingredientes y mantiene toda la operación bajo control.",
        features: [
          "Recetas intuitivas para platos, tragos y postres",
          "Descuento automático de ingredientes",
          "Stock siempre actualizado",
          "Costos y rentabilidad por producto",
        ],
        shot: "Stock e ingredientes",
        imageSrc: gastronomiaSol3,
      },
      {
        title: "Vendé donde quieran comprarte.",
        desc: "Salón, mostrador, delivery o carta digital. Todos los canales funcionan conectados entre sí.",
        features: [
          "Venta rápida por mostrador",
          "Delivery integrado",
          "Carta Online con QR",
          "Integración con PedidosYa y Rappi",
        ],
        shot: "Canales de venta",
        imageSrc: gastronomiaSol4,
      },
    ],
    featureGroupsTitle: "Todo lo que tu restaurante necesita. En un solo lugar.",
    featureGroups: [
      { group: "Servicio", items: ["Salones personalizados", "Mesas", "Mozos", "Mostrador"] },
      { group: "Cocina", items: ["Recetas", "Comandas digitales", "Stock", "Producción"] },
      { group: "Ventas", items: ["Delivery", "Carta QR", "Promociones", "Reportes"] },
      { group: "Administración", items: ["Clientes", "Estadísticas", "Usuarios", "Auditoría"] },
    ],
    plans: [
      {
        name: "Simple",
        monthly: 25,
        annualMonthly: 20,
        features: [
          "Hasta 80 platos y tragos",
          "Hasta 3 usuarios",
          "1 salón, venta por mostrador y delivery",
          "Elaboración de platos y cocktails",
          "Control de stock",
          "Estadísticas básicas",
        ],
        highlight: false,
      },
      {
        name: "Intermedio",
        monthly: 35,
        annualMonthly: 28,
        subtitle: "Incluye todo lo del plan Simple, más:",
        features: [
          "Hasta 250 platos y tragos",
          "Hasta 10 usuarios",
          "Hasta 3 salones y 20 mesas",
          "Clientes y proveedores",
          "Promociones y 3 listas de precios",
          "Integración con PedidosYa & Rappi",
        ],
        highlight: true,
      },
      {
        name: "Full",
        monthly: 45,
        annualMonthly: 36,
        subtitle: "Incluye todo lo del plan Intermedio, más:",
        features: [
          "Platos y tragos ilimitados",
          "Usuarios, cajas e impresoras ilimitadas",
          "Salones y mesas ilimitados",
          "Cuentas corrientes",
          "Listas de precios ilimitadas",
          "Alertas por falta de stock",
        ],
        highlight: false,
      },
    ],
    addOns: [
      { name: "Módulo fiscal", desc: "Enlazá con ARCA para emitir comprobantes fiscales (facturación electrónica).", price: 10, billing: "unica" },
      { name: "Impresión inalámbrica", desc: "Vendé desde celulares o tablets y enviá la señal de impresión a distancia.", price: 10, billing: "unica" },
      { name: "Carta Online + QR", desc: "Publicá tu carta en la web y compartila con un código QR.", price: 10, billing: "mes" },
      { name: "Pedidos Online", desc: "Recibí pedidos online sin aplicaciones intermediarias.", price: 20, billing: "mes" },
      { name: "Monitor de Cocina (KDS)", desc: "Pantalla de visualización y gestión de comandas en cocina.", price: 10, billing: "mes" },
    ],
    comparison: [
      {
        group: "Operación diaria",
        rows: [
          { label: "Cantidad de platos y tragos", tooltip: "Cantidad máxima de ítems de carta que podés cargar en el sistema.", values: ["Hasta 80", "Hasta 250", "Ilimitados"] },
          { label: "Cantidad de salones", tooltip: "Salones o ambientes que podés configurar en el mapa de mesas.", values: ["1", "Hasta 3", "Ilimitados"] },
          { label: "Cantidad de mesas", tooltip: "Mesas que podés gestionar en el mapa de salón.", values: [false, "Hasta 20", "Ilimitadas"] },
          { label: "Venta por delivery y mostrador", tooltip: "Tomá pedidos y cobrá directamente en el mostrador o para llevar.", values: [true, true, true] },
          { label: "Comprar productos", tooltip: "Cargá compras a proveedores y actualizá tu stock automáticamente.", values: [true, true, true] },
          { label: "Gestión de stock", tooltip: "Controlá el inventario en tiempo real con cada venta y elaboración.", values: [true, true, true] },
          { label: "Elaboración de platos y cocktails", tooltip: "Cargá recetas con ingredientes y Rootsy descuenta el stock por cada venta.", values: [true, true, true] },
          { label: "Listas de precio", tooltip: "Manejá distintos precios según canal, mesa o temporada.", values: ["1", "3", "Ilimitadas"] },
          { label: "Manejo de cajas", tooltip: "Cantidad de cajas o puntos de cobro que podés operar en simultáneo.", values: ["1", "2", "Ilimitadas"] },
          { label: "Arqueo de caja", tooltip: "Cerrá la caja y cuadrá los movimientos del día automáticamente.", values: [true, true, true] },
          { label: "Crear promociones", tooltip: "Armá descuentos y ofertas por producto, categoría o período.", values: [false, true, true] },
          { label: "Cuentas corrientes", tooltip: "Gestioná saldos y pagos a cuenta de tus clientes.", values: [false, false, true] },
          { label: "Crear presupuestos", tooltip: "Generá presupuestos y convertilos en ventas con un clic.", values: [false, true, true] },
          { label: "Alertas por falta de stock", tooltip: "Recibí un aviso cuando un producto llega a su stock mínimo.", values: [false, true, true] },
          { label: "Pantalla de estado de pedidos", tooltip: "Visualizá en tiempo real el estado de cada pedido en el salón y cocina.", values: [false, true, true] },
          { label: "Impresión de comandas", tooltip: "Cantidad de impresoras de comandas que podés conectar en simultáneo.", values: ["2", "Hasta 3", "Ilimitadas"] },
          { label: "Impresión inalámbrica", tooltip: "Imprimí desde celulares, tablets o impresoras en red.", values: [false, true, true] },
        ],
      },
      {
        group: "Administración del negocio",
        rows: [
          { label: "Gastos fijos y variables", tooltip: "Registrá y clasificá todos los gastos de tu negocio.", values: [true, true, true] },
          { label: "Gestión de cuentas bancarias", tooltip: "Seguí el saldo y los movimientos de tus cuentas bancarias.", values: [true, true, true] },
          { label: "Estadísticas básicas", tooltip: "Ventas del día, medios de pago y productos más vendidos.", values: [true, true, true] },
          { label: "Estadísticas ampliadas", tooltip: "Análisis por período, rentabilidad y comparativas avanzadas.", values: [false, true, true] },
          { label: "Gestión de clientes", tooltip: "Base de clientes con historial de compras y datos de contacto.", values: [false, true, true] },
          { label: "Gestión de proveedores", tooltip: "Administrá tus proveedores, compras y condiciones de pago.", values: [false, true, true] },
          { label: "Historial de operaciones", tooltip: "Registro completo y auditable de todo lo que pasa en tu negocio.", values: [true, true, true] },
          { label: "Reportes de stock, ventas, compras e ingresos", tooltip: "Reportes detallados de stock, ventas, compras, ingresos y egresos.", values: [false, true, true] },
          { label: "Exportar listas en Excel", tooltip: "Descargá cualquier listado en Excel para analizarlo por fuera.", values: [false, false, true] },
        ],
      },
      {
        group: "Configuración y accesos",
        rows: [
          { label: "Cantidad de usuarios", tooltip: "Personas del equipo que pueden acceder al sistema con su propio usuario.", values: ["Hasta 3", "Hasta 10", "Ilimitados"] },
          { label: "Logo en tickets", tooltip: "Sumá el logo de tu negocio a los tickets y comprobantes.", values: [false, true, true] },
          { label: "Integración con Mercado Pago", tooltip: "Cobrá con Mercado Pago y conciliá los pagos automáticamente.", values: [true, true, true] },
          { label: "Integración con PedidosYa & Rappi", tooltip: "Recibí pedidos de PedidosYa y Rappi directo en tu sistema.", values: [false, true, true] },
        ],
      },
    ],
    testimonialsTitle: "Lo dicen quienes ya tienen la cocina y la sala en un solo lugar.",
    testimonials: [
      {
        text: "Antes las comandas se perdían y el salón era un caos. Hoy cocina y caja trabajan sincronizadas.",
        author: "Lucas P.",
        role: "Restaurante · Córdoba",
        avatar: "https://i.pravatar.cc/96?img=11",
      },
      {
        text: "Reducimos muchísimo los tiempos de atención y el control del delivery mejoró desde el primer día.",
        author: "Carolina M.",
        role: "Rotisería · Rosario",
        avatar: "https://i.pravatar.cc/96?img=53",
      },
      {
        text: "Ahora sabemos cuáles son los platos que realmente dejan margen y cuáles conviene sacar de la carta.",
        author: "Matías G.",
        role: "Cervecería · Buenos Aires",
        avatar: "https://i.pravatar.cc/96?img=18",
      },
    ],
    faqs: [
      FAQ_OFFLINE,
      { q: "¿Los mozos pueden tomar el pedido desde el celular?", a: "Sí. Cada mozo toma la comanda desde su celular o una tablet y el pedido llega a cocina y barra en el acto, sin volver al mostrador." },
      { q: "¿Puedo dividir la cuenta entre varios comensales?", a: "Sí. Dividís por comensal, por producto o en partes iguales, y cobrás cada parte con el medio de pago que prefiera cada uno." },
      { q: "¿La carta QR se actualiza sola?", a: "Sí. Cambiás precios, platos o disponibilidad desde tu celular y la carta QR de tus clientes se actualiza al instante." },
      { q: "¿Descuenta ingredientes del stock con cada venta?", a: "Sí. Al cargar las recetas, cada plato vendido descuenta sus ingredientes del inventario automáticamente." },
      { q: "¿Puedo gestionar delivery y salón en el mismo lugar?", a: "Sí. Los pedidos de salón, mostrador y delivery conviven en un solo panel, con la posibilidad de sumar el módulo de Delivery multicanal." },
      { q: "¿Puedo vender por Pedidos Ya?", a: "Sí. Rootsy se integra con Pedidos Ya y otras apps de delivery, como Rappi, para que esos pedidos convivan con el salón y el mostrador en un solo lugar." },
      { q: "¿Puedo cobrar con Mercado Pago y MODO?", a: "Sí. Podés cobrar con QR, tarjetas, efectivo y los medios que ya usás en el local, incluido Mercado Pago y MODO." },
      { q: "¿Puedo usar pantalla de cocina para las comandas, en lugar de impresora?", a: "Sí. Los pedidos pasan del salón a una pantalla de cocina (KDS), sin papeles, sin gritos y sin errores. Ves el estado de cada comanda en tiempo real y cocina y salón quedan sincronizados." },
    ],
  },
};

/* ── Placeholder brand logos for the marquee ──────────────────────────────
   Replace with real client logos (SVG or <img>) once available.
   Each entry: name shown on hover-title, a small icon path, viewBox, width.
─────────────────────────────────────────────────────────────────────────── */
const MARQUEE_LOGOS: { name: string; color: string; viewBox: string; width: number; paths: React.ReactNode }[] = [
  {
    name: "Bazar Norte",
    color: "#F59E0B",
    viewBox: "0 0 24 24",
    width: 20,
    paths: <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" />,
  },
  {
    name: "Birra & Co.",
    color: "#F97316",
    viewBox: "0 0 24 24",
    width: 18,
    paths: <path d="M17 11h1a3 3 0 010 6h-1M5 11h12v10H5zM7 11V7a3 3 0 016 0v4" />,
  },
  {
    name: "Café del Sur",
    color: "#A78BFA",
    viewBox: "0 0 24 24",
    width: 20,
    paths: <><path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4z" /><path d="M6 1v3M10 1v3M14 1v3" /></>,
  },
  {
    name: "ModaBA",
    color: "#F472B6",
    viewBox: "0 0 24 24",
    width: 18,
    paths: <path d="M20.38 3.46L16 2l-4 4-4-4L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z" />,
  },
  {
    name: "Dulcería",
    color: "#34D399",
    viewBox: "0 0 24 24",
    width: 20,
    paths: <path d="M12 2a5 5 0 015 5c0 2.76-2.24 5-5 5S7 9.76 7 7a5 5 0 015-5zM4 22c0-4.42 3.58-8 8-8s8 3.58 8 8" />,
  },
  {
    name: "La Parrilla",
    color: "#EF4444",
    viewBox: "0 0 24 24",
    width: 20,
    paths: <path d="M3 11l19-9-9 19-2-8-8-2z" />,
  },
  {
    name: "TuKiosco",
    color: "#38BDF8",
    viewBox: "0 0 24 24",
    width: 18,
    paths: <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />,
  },
  {
    name: "Oleatum",
    color: "#86EFAC",
    viewBox: "0 0 24 24",
    width: 16,
    paths: <path d="M12 22a7 7 0 007-7c0-2-1-3.9-3-5.5S11 6 11 4c0 0-4.2 3.5-4 7.5S5 15 5 15a7 7 0 007 7z" />,
  },
  {
    name: "Ferretería Central",
    color: "#FBBF24",
    viewBox: "0 0 24 24",
    width: 18,
    paths: <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />,
  },
  {
    name: "Ramen Casa",
    color: "#FB923C",
    viewBox: "0 0 24 24",
    width: 20,
    paths: <><path d="M3 11c0-1.1.9-2 2-2h14a2 2 0 012 2v2a9 9 0 01-9 9 9 9 0 01-9-9v-2z" /><path d="M12 2c0 0-3 3-3 5s3 5 3 5 3-3 3-5-3-5-3-5z" /></>,
  },
];

function MarqueeLogoItem({ logo }: { logo: typeof MARQUEE_LOGOS[number] }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="flex-shrink-0 flex items-center gap-2.5 cursor-default select-none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={logo.name}
    >
      <svg
        viewBox={logo.viewBox}
        height="24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          width: logo.width * 1.2,
          color: hovered ? "#02FE85" : "rgba(255,255,255,0.22)",
          transition: "color 0.4s ease",
        }}
        aria-hidden
      >
        {logo.paths}
      </svg>
      <span
        className="text-[15.5px] font-semibold tracking-tight whitespace-nowrap"
        style={{
          color: hovered ? "#02FE85" : "rgba(255,255,255,0.22)",
          transition: "color 0.4s ease",
        }}
      >
        {logo.name}
      </span>
    </div>
  );
}

const painPoints = [
  {
    icon: "⏳",
    title: "Tiempo perdido en tareas operativas",
    desc: "Horas contando mercadería, haciendo planillas, reconciliando cuentas. Tiempo valioso que no vas a recuperar.",
  },
  {
    icon: "🧩",
    title: "Información dispersa, decisiones a ciegas",
    desc: "Tus datos están en cuadernos, planillas y memorias. Sin información centralizada, crecer es imposible.",
  },
  {
    icon: "📦",
    title: "Inventario que nunca cierra",
    desc: "Mercadería faltante sin explicación, productos agotados cuando más los necesitás, pérdidas invisibles.",
  },
  {
    icon: "🚧",
    title: "Crecimiento frenado por el caos",
    desc: "Querés escalar pero el negocio te consume. Sin sistemas robustos, cada paso nuevo suma más desorden.",
  },
];

/* Tarjeta de problema — ícono 3D (emoji) sobre un tile con relieve sutil,
   al estilo de las cards de rubro. `row` = ícono al costado (cards anchas),
   `stack` = ícono arriba y texto abajo (cards angostas). */
function ProblemCard({
  pain,
  className = "",
  layout = "stack",
}: {
  pain: { icon: string; title: string; desc: string };
  className?: string;
  layout?: "row" | "stack";
}) {
  const tile = (
    <div className="relative shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_10px_24px_-12px_rgba(0,0,0,0.8)] group-hover:border-[#02FE85]/25 transition-colors duration-300">
      <span className="text-[2rem] leading-none select-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.45)]">
        {pain.icon}
      </span>
    </div>
  );

  const text = (
    <div>
      <h3 className="font-bold text-lg text-white mb-2 leading-snug">{pain.title}</h3>
      <p className="text-sm text-white/45 leading-relaxed max-w-md">
        {pain.desc}
      </p>
    </div>
  );

  return (
    <div
      className={`group relative bg-[#0d1210] rounded-3xl border border-white/[0.06] p-9 hover:border-white/[0.12] hover:bg-[#0f1613] transition-colors duration-300 ${className}`}
    >
      {layout === "row" ? (
        <div className="flex items-center gap-7 h-full">
          <div className="flex-1">{text}</div>
          {tile}
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {tile}
          <div className="mt-8">{text}</div>
        </div>
      )}
    </div>
  );
}

const SEGMENT_IDS: SegmentId[] = ["comercio", "gastronomia", "elaboracion"];

/* Unified content shell for the 1440px frame — ~1280px container with generous gutters */
const SHELL = "w-full max-w-[1280px] mx-auto px-8 lg:px-14";

/* ── Product placeholder frame ──────────────────────────────────────────
   Browser-chrome mock with a labelled placeholder area. Swap `imageSrc`
   for a real screenshot later; without it, it shows a replaceable slot. */
function ProductFrame({
  label,
  imageSrc,
  aspect = "16/10",
  compact = false,
}: {
  label: string;
  imageSrc?: string;
  aspect?: string;
  compact?: boolean;
}) {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/[0.09] shadow-[0_28px_70px_rgba(0,0,0,0.55)] bg-[#0f1410]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#151a15] border-b border-white/[0.06]">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#D8695B]" />
          <div className="w-2 h-2 rounded-full bg-[#EAC213]" />
          <div className="w-2 h-2 rounded-full bg-[#79C743]" />
        </div>
        <span className="text-[11px] text-white/30">rootsy.app</span>
      </div>
      <div className="w-full relative" style={imageSrc ? undefined : { aspectRatio: aspect }}>
        {imageSrc ? (
          <img src={imageSrc} alt={label} className="w-full h-auto block" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_50%_35%,rgba(2,254,133,0.06),transparent_60%)]">
            <div
              className={`flex flex-col items-center text-center rounded-xl border border-dashed border-white/[0.12] ${
                compact ? "px-8 py-8" : "px-12 py-14"
              }`}
            >
              <div className="w-11 h-11 rounded-xl bg-[#02FE85]/[0.08] border border-[#02FE85]/[0.18] flex items-center justify-center">
                <MonitorPlay className="w-5 h-5 text-[#02FE85]" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* Small pill group to switch segment — reused in the selector and the sticky bar */
function SegmentPills({
  selected,
  onSelect,
  size = "md",
}: {
  selected: SegmentId;
  onSelect: (id: SegmentId) => void;
  size?: "sm" | "md";
}) {
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] p-1 ${
        size === "sm" ? "" : ""
      }`}
    >
      {SEGMENT_IDS.map((id) => {
        const seg = segments[id];
        const active = selected === id;
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`flex items-center gap-2 rounded-full font-bold transition-all duration-200 ${
              size === "sm" ? "px-3.5 py-1.5 text-xs" : "px-5 py-2.5 text-sm"
            } ${
              active
                ? "bg-[#02FE85] text-black"
                : "text-white/55 hover:text-white hover:bg-white/[0.05]"
            }`}
          >
            <span>{seg.emoji}</span>
            {seg.label}
          </button>
        );
      })}
    </div>
  );
}

/* Info tooltip shown next to each functionality name in the comparison table.
   Opens on hover and on keyboard focus for accessibility. */
function FeatureTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex leading-none">
      <button
        type="button"
        aria-label={`Más información: ${text}`}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="text-white/25 hover:text-[#02FE85] focus:text-[#02FE85] focus:outline-none transition-colors duration-150"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2.5 z-40 w-60 rounded-xl bg-[#0f1410] border border-white/[0.1] px-3.5 py-2.5 text-xs leading-relaxed text-white/70 shadow-[0_16px_48px_rgba(0,0,0,0.6)] pointer-events-none"
        >
          {text}
          <span className="absolute left-1/2 -translate-x-1/2 top-full -mt-1 w-2 h-2 rotate-45 bg-[#0f1410] border-r border-b border-white/[0.1]" />
        </span>
      )}
    </span>
  );
}

/* Detailed plan comparison — collapsible feature groups with per-plan values.
   Follows SaaS comparison-table patterns (Supabase / Notion): a sticky plan
   header, quiet rows, checks for included features and a muted dash otherwise,
   and the recommended plan column tinted through the whole table. */
function PlanComparison({
  segment,
  billingAnnual,
  selectedPlan,
  onSelectPlan,
}: {
  segment: SegmentData;
  billingAnnual: boolean;
  selectedPlan: string;
  onSelectPlan: (name: string) => void;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(segment.comparison.slice(1).map((g) => [g.group, true]))
  );
  const selectedIdx = segment.plans.findIndex((p) => p.name === selectedPlan);
  const [mobilePlanIdx, setMobilePlanIdx] = useState(Math.max(0, selectedIdx));

  useEffect(() => {
    setCollapsed(Object.fromEntries(segment.comparison.slice(1).map((g) => [g.group, true])));
    setMobilePlanIdx(Math.max(0, segment.plans.findIndex((p) => p.name === selectedPlan)));
  }, [segment.id]);

  const desktopCols = `minmax(0,1.7fr) repeat(${segment.plans.length}, minmax(0,1fr))`;
  const toggle = (g: string) => setCollapsed((c) => ({ ...c, [g]: !c[g] }));

  const renderCell = (val: boolean | string) => {
    if (val === true) return <Check className="w-[18px] h-[18px] text-[#02FE85]" strokeWidth={3} />;
    if (val === false) return <Minus className="w-4 h-4 text-white/15" strokeWidth={2.5} />;
    return <span className="text-sm text-white/75 text-center leading-snug">{val}</span>;
  };

  const mobilePlan = segment.plans[mobilePlanIdx];
  const mobilePlanPrice = billingAnnual ? mobilePlan.annualMonthly : mobilePlan.monthly;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.012]">

      {/* ── MOBILE: tabs de plan + 2 columnas ─────────────────── */}
      <div className="md:hidden">
        {/* Selector de plan sticky */}
        <div className="sticky top-16 z-20 bg-[#0b100e]/95 backdrop-blur-md border-b border-white/[0.1] rounded-t-2xl px-4 py-3">
          {/* Tabs */}
          <div className="flex gap-1.5 mb-3">
            {segment.plans.map((plan, i) => (
              <button
                key={plan.name}
                onClick={() => { setMobilePlanIdx(i); onSelectPlan(plan.name); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  i === mobilePlanIdx
                    ? "bg-[#02FE85] text-black"
                    : "bg-white/[0.04] text-white/50 hover:text-white hover:bg-white/[0.08]"
                }`}
              >
                {plan.name}
              </button>
            ))}
          </div>
          {/* Info del plan seleccionado */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/30">
              Funcionalidad
            </span>
            <span className="text-xs text-white/50">
              <span className="font-bold text-white/80">${mobilePlanPrice}</span> USD/mes
            </span>
          </div>
        </div>

        {/* Grupos — 2 columnas */}
        {segment.comparison.map((group) => {
          const isCollapsed = collapsed[group.group];
          return (
            <div key={group.group}>
              <button
                type="button"
                onClick={() => toggle(group.group)}
                aria-expanded={!isCollapsed}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white/[0.025] hover:bg-white/[0.045] border-b border-white/[0.06] transition-colors duration-150 text-left"
              >
                <ChevronDown
                  className={`w-4 h-4 text-[#02FE85] transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}
                  strokeWidth={2.5}
                />
                <span className="font-bold text-sm text-white">{group.group}</span>
                <span className="text-xs text-white/30">{group.rows.length}</span>
              </button>
              {!isCollapsed && group.rows.map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3.5 border-b border-white/[0.04] bg-[#02FE85]/[0.02]"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm text-white/60 leading-snug">{row.label}</span>
                    <FeatureTooltip text={row.tooltip} />
                  </div>
                  <div className="flex justify-center items-center min-w-[48px]">
                    {renderCell(row.values[mobilePlanIdx])}
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        {/* CTA del plan en mobile */}
        <div className="p-4">
          <button
            onClick={() => onSelectPlan(mobilePlan.name)}
            className={`w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
              selectedIdx === mobilePlanIdx
                ? "bg-[#02FE85] text-black"
                : "border border-white/20 text-white hover:border-[#02FE85] hover:text-[#02FE85]"
            }`}
          >
            {selectedIdx === mobilePlanIdx ? "Plan seleccionado" : `Elegir plan ${mobilePlan.name}`}
          </button>
        </div>
      </div>

      {/* ── DESKTOP: layout multi-columna original ─────────────── */}
      <div className="hidden md:block">
        <div className="sticky top-16 z-20 bg-[#0b100e]/95 backdrop-blur-md border-b border-white/[0.1] rounded-t-2xl overflow-hidden">
          <div className="grid" style={{ gridTemplateColumns: desktopCols }}>
            <div className="px-5 py-5 flex items-end">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/30">
                Funcionalidad
              </span>
            </div>
            {segment.plans.map((plan, i) => {
              const price = billingAnnual ? plan.annualMonthly : plan.monthly;
              const isSel = i === selectedIdx;
              return (
                <div
                  key={plan.name}
                  className={`relative px-4 py-5 text-center flex flex-col items-center gap-1.5 transition-colors duration-300 ${isSel ? "bg-[#02FE85]/[0.06]" : ""}`}
                >
                  {isSel && <div className="absolute inset-x-0 top-0 h-0.5 bg-[#02FE85]" />}
                  <p className={`font-bold text-base transition-colors duration-300 ${isSel ? "text-[#02FE85]" : "text-white"}`}>{plan.name}</p>
                  <p className="text-xs text-white/40">
                    <span className="text-white/70 font-bold">${price}</span> USD/mes
                  </p>
                  <button
                    onClick={() => onSelectPlan(plan.name)}
                    className={`mt-1 px-3.5 py-1 rounded-full text-[11px] font-bold transition-all duration-200 ${
                      isSel
                        ? "bg-[#02FE85] text-black"
                        : "border border-white/20 text-white/50 hover:text-white hover:border-white/40"
                    }`}
                  >
                    {isSel ? "Seleccionado" : "Elegir"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {segment.comparison.map((group) => {
          const isCollapsed = collapsed[group.group];
          return (
            <div key={group.group}>
              <button
                type="button"
                onClick={() => toggle(group.group)}
                aria-expanded={!isCollapsed}
                className="w-full flex items-center gap-3 px-5 py-3.5 bg-white/[0.025] hover:bg-white/[0.045] border-b border-white/[0.06] transition-colors duration-150 text-left"
              >
                <ChevronDown
                  className={`w-4 h-4 text-[#02FE85] transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}
                  strokeWidth={2.5}
                />
                <span className="font-bold text-sm text-white">{group.group}</span>
                <span className="text-xs text-white/30">{group.rows.length}</span>
              </button>
              {!isCollapsed &&
                group.rows.map((row) => (
                  <div
                    key={row.label}
                    className="grid items-center border-b border-white/[0.04] hover:bg-white/[0.015] transition-colors duration-150"
                    style={{ gridTemplateColumns: desktopCols }}
                  >
                    <div className="flex items-center gap-2 px-5 py-3.5">
                      <span className="text-sm text-white/60">{row.label}</span>
                      <FeatureTooltip text={row.tooltip} />
                    </div>
                    {row.values.map((v, i) => (
                      <div
                        key={i}
                        className={`px-4 py-3.5 flex justify-center items-center min-h-[52px] transition-colors duration-300 ${
                          i === selectedIdx ? "bg-[#02FE85]/[0.045]" : ""
                        }`}
                      >
                        {renderCell(v)}
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LandingPage() {
  const [selectedSegment, setSelectedSegment] = useState<SegmentId>("comercio");
  const [scrolled, setScrolled] = useState(false);
  const [showStickySelector, setShowStickySelector] = useState(false);
  const [planesMenuOpen, setPlanesMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [billingAnnual, setBillingAnnual] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState("Crecimiento");
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [existeRef, existeInView] = useInView<HTMLElement>({ threshold: 0.25 });
  const [problemaRef, problemaInView] = useInView<HTMLElement>({ threshold: 0.15 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);
  const configRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 48);
      if (selectorRef.current) {
        const rect = selectorRef.current.getBoundingClientRect();
        // Reveal the sticky bar once the selector section scrolls above the navbar
        setShowStickySelector(rect.bottom < 72);
      }
      if (configRef.current) {
        const rect = configRef.current.getBoundingClientRect();
        // The floating summary is only useful while the configurator is on screen
        setShowSummary(rect.top < window.innerHeight * 0.85 && rect.bottom > 140);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const segment = segments[selectedSegment];

  // Reset the configurator whenever the rubro changes — plans and add-ons differ
  useEffect(() => {
    const seg = segments[selectedSegment];
    const highlighted = seg.plans.find((p) => p.highlight) ?? seg.plans[0];
    setSelectedPlan(highlighted.name);
    setSelectedAddOns([]);
    setActiveTestimonial(0);
  }, [selectedSegment]);

  const toggleAddOn = (name: string) =>
    setSelectedAddOns((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );

  const activePlan = segment.plans.find((p) => p.name === selectedPlan) ?? segment.plans[0];
  const planMonthly = billingAnnual ? activePlan.annualMonthly : activePlan.monthly;
  const chosenAddOns = segment.addOns.filter((a) => selectedAddOns.includes(a.name));
  const monthlyTotal = planMonthly + chosenAddOns.filter((a) => a.billing === "mes").reduce((s, a) => s + a.price, 0);
  const oneTimeTotal = chosenAddOns.filter((a) => a.billing === "unica").reduce((s, a) => s + a.price, 0);

  const scrollToSelector = () => {
    selectorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-[#080c0b] text-white overflow-x-hidden">

      {/* ── NAVBAR ─────────────────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || mobileMenuOpen ? "bg-[#080c0b]/96 backdrop-blur-xl border-b border-white/[0.06]" : ""
        }`}
      >
        <div className={`${SHELL} h-16 flex items-center justify-between`}>
          {/* Logo */}
          <a href="#inicio" onClick={() => { setPlanesMenuOpen(false); setMobileMenuOpen(false); }} aria-label="Rootsy — inicio">
            <RootsyLogo className="h-7 w-auto" />
          </a>

          {/* Desktop links — visible desde lg (1024px) */}
          <div className="hidden lg:flex items-center gap-7 text-sm font-semibold text-white/55">
            <a href="#problema" onClick={() => setPlanesMenuOpen(false)} className="hover:text-white transition-colors duration-150">
              ¿Por qué Rootsy?
            </a>
            <a href="#soluciones" onClick={() => setPlanesMenuOpen(false)} className="hover:text-white transition-colors duration-150">
              Soluciones
            </a>

            {/* Planes — dropdown con selector de rubro */}
            <div className="relative">
              <button
                onClick={() => setPlanesMenuOpen((v) => !v)}
                className={`flex items-center gap-1.5 text-sm font-semibold hover:text-white transition-colors duration-150 ${planesMenuOpen ? "text-white" : ""}`}
              >
                Planes
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${planesMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {planesMenuOpen && (
                <div className="absolute top-[calc(100%+14px)] left-1/2 -translate-x-1/2 z-50">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-[#0f1512] border-l border-t border-white/[0.10] rotate-45" />
                  <div className="relative bg-[#0f1512] border border-white/[0.10] rounded-2xl p-3 shadow-2xl min-w-[260px]">
                    <p className="text-[10px] font-bold text-white/30 tracking-widest uppercase px-2 pb-2">
                      Ver planes de
                    </p>
                    {SEGMENT_IDS.map((id) => {
                      const seg = segments[id];
                      const active = selectedSegment === id;
                      return (
                        <button
                          key={id}
                          onClick={() => {
                            setSelectedSegment(id);
                            setPlanesMenuOpen(false);
                            setTimeout(() => {
                              document.getElementById("planes")?.scrollIntoView({ behavior: "smooth", block: "start" });
                            }, 60);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 ${
                            active ? "bg-[#02FE85]/10 text-[#02FE85]" : "text-white/60 hover:text-white hover:bg-white/[0.05]"
                          }`}
                        >
                          <span className="text-base">{seg.emoji}</span>
                          {seg.label}
                          {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#02FE85]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <a href="#faqs" onClick={() => setPlanesMenuOpen(false)} className="hover:text-white transition-colors duration-150">
              Preguntas frecuentes
            </a>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <Link href={LOGIN_URL} className="text-sm font-semibold text-white/55 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/[0.04]">
              Iniciar sesión
            </Link>
            <a href="#planes" className="text-sm font-bold bg-white text-[#000347] px-5 py-2.5 rounded-full hover:bg-[#02FE85] transition-colors duration-200">
              Contratar
            </a>
          </div>

          {/* Mobile: Contratar + hamburguesa */}
          <div className="flex lg:hidden items-center gap-2">
            <a href="#planes" className="text-sm font-bold bg-white text-[#000347] px-4 py-2 rounded-full hover:bg-[#02FE85] transition-colors duration-200">
              Contratar
            </a>
            <button
              onClick={() => { setMobileMenuOpen((v) => !v); setPlanesMenuOpen(false); }}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/[0.06] transition-all duration-150"
              aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen ? (
        <div className="lg:hidden overflow-hidden border-t border-white/[0.06] bg-[#080c0b]/98 backdrop-blur-xl">
          <div className={`${SHELL} py-5 flex flex-col gap-1`}>
              {/* Links principales */}
              {[
                { href: "#problema", label: "¿Por qué Rootsy?" },
                { href: "#soluciones", label: "Soluciones" },
                { href: "#faqs", label: "Preguntas frecuentes" },
              ].map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3.5 rounded-xl text-base font-semibold text-white/65 hover:text-white hover:bg-white/[0.05] transition-all duration-150"
                >
                  {label}
                  <ChevronRight className="w-4 h-4 text-white/25" />
                </a>
              ))}

              {/* Planes — sub-items inline */}
              <div className="px-4 pt-3 pb-1">
                <p className="text-[10px] font-bold text-white/30 tracking-widest uppercase mb-2">
                  Planes por rubro
                </p>
                <div className="flex flex-col gap-1">
                  {SEGMENT_IDS.map((id) => {
                    const seg = segments[id];
                    const active = selectedSegment === id;
                    return (
                      <button
                        key={id}
                        onClick={() => {
                          setSelectedSegment(id);
                          setMobileMenuOpen(false);
                          setTimeout(() => {
                            document.getElementById("planes")?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }, 60);
                        }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 ${
                          active ? "bg-[#02FE85]/10 text-[#02FE85]" : "text-white/55 hover:text-white hover:bg-white/[0.05]"
                        }`}
                      >
                        <span className="text-base">{seg.emoji}</span>
                        {seg.label}
                        {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#02FE85]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Divider + Iniciar sesión */}
              <div className="border-t border-white/[0.06] mt-2 pt-3">
                <Link
                  href={LOGIN_URL}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-base font-semibold text-white/55 hover:text-white hover:bg-white/[0.05] transition-all duration-150"
                >
                  Iniciar sesión
                  <ChevronRight className="w-4 h-4 text-white/25" />
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </nav>

      {/* Overlay para cerrar menús al click fuera */}
      {(planesMenuOpen || mobileMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setPlanesMenuOpen(false); setMobileMenuOpen(false); }}
        />
      )}

      {/* ── STICKY SEGMENT BAR ─── appears after the selector, keeps rubro switchable ── */}
      {showStickySelector ? (
      <div className="fixed top-16 left-0 right-0 z-40">
        <div className="bg-[#080c0b]/90 backdrop-blur-xl border-b border-white/[0.06]">
          <div className={`${SHELL} h-14 flex items-center justify-between gap-4`}>
            <p className="text-xs text-white/45 hidden sm:flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#02FE85] animate-pulse" />
              Estás viendo Rootsy para
              <span className="font-bold text-white">{segment.label}</span>
            </p>
            <SegmentPills selected={selectedSegment} onSelect={setSelectedSegment} size="sm" />
          </div>
        </div>
      </div>
      ) : null}

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section id="inicio" className="relative min-h-screen flex flex-col pt-16">
        <style>{`
          @keyframes hero-fade-up {
            from { opacity: 0; transform: translateY(18px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .hero-in {
            animation: hero-fade-up 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
          }
          .hero-in-slow {
            animation: hero-fade-up 0.85s cubic-bezier(0.22, 1, 0.36, 1) both;
          }
          @media (prefers-reduced-motion: reduce) {
            .hero-in, .hero-in-slow { animation: none; }
          }

          /* Deriva ambiental muy lenta para los orbes y el halo */
          @keyframes hero-drift-a {
            0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
            40%      { transform: translate3d(-9%, 8%, 0) scale(1.18); }
            70%      { transform: translate3d(5%, 3%, 0) scale(1.10); }
          }
          @keyframes hero-drift-b {
            0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
            50%      { transform: translate3d(6%, -4%, 0) scale(1.14); }
          }
          @keyframes hero-halo-breathe {
            0%, 100% { transform: translate(-50%, 0) scale(1);    opacity: 0.88; }
            35%      { transform: translate(-50%, -3%) scale(1.09); opacity: 1; }
            65%      { transform: translate(-50%, 2%) scale(1.04); opacity: 0.94; }
          }
          .hero-orb-a  { animation: hero-drift-a 7s ease-in-out infinite; }
          .hero-orb-b  { animation: hero-drift-b 14s ease-in-out infinite; }
          .hero-halo   { animation: hero-halo-breathe 10s ease-in-out infinite; }
          @media (prefers-reduced-motion: reduce) {
            .hero-orb-a, .hero-orb-b, .hero-halo { animation: none; }
          }
        `}</style>

        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{
            /* Máscara: el color se apaga en la franja de los titulares y al pie */
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.35) 14%, #000 34%, #000 88%, transparent 100%)",
            maskImage:
              "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.35) 14%, #000 34%, #000 88%, transparent 100%)",
          }}
        >
          {/* Halo radial envolvente detrás del producto */}
          <div
            className="hero-halo absolute left-1/2 rounded-full"
            style={{
              top: "42%",
              width: "1200px",
              height: "1200px",
              transform: "translate(-50%, 0)",
              background:
                "radial-gradient(circle at center, rgba(2,254,133,0.34) 0%, rgba(2,254,133,0.16) 26%, rgba(2,254,209,0.08) 46%, rgba(2,254,133,0) 66%)",
              filter: "blur(30px)",
            }}
          />
          {/* Aros concéntricos alrededor del halo */}
          <div
            className="hero-halo absolute left-1/2 rounded-full"
            style={{
              top: "44%",
              width: "980px",
              height: "980px",
              transform: "translate(-50%, 0)",
              border: "1px solid rgba(2,254,133,0.13)",
              boxShadow: "0 0 0 1px rgba(2,254,133,0.05), inset 0 0 160px rgba(2,254,133,0.10)",
            }}
          />
          <div
            className="hero-halo absolute left-1/2 rounded-full"
            style={{
              top: "50%",
              width: "620px",
              height: "620px",
              transform: "translate(-50%, 0)",
              border: "1px solid rgba(2,254,133,0.08)",
            }}
          />

          {/* Orbe verde superior-derecha */}
          <div
            className="hero-orb-a absolute rounded-full opacity-[0.22] blur-[130px]"
            style={{ top: "-6%", right: "6%", width: "620px", height: "560px", background: "#02FE85" }}
          />
          {/* Orbe teal inferior-izquierda */}
          <div
            className="hero-orb-b absolute rounded-full opacity-[0.16] blur-[120px]"
            style={{ top: "38%", left: "-8%", width: "520px", height: "520px", background: "#02FED1" }}
          />
        </div>

        <div className={`relative z-10 flex-1 flex flex-col items-center text-center ${SHELL} pt-6 sm:pt-10 pb-10`}>
          {/* Eyebrow */}
          <span
            className="hero-in inline-flex items-center gap-2 text-xs font-semibold text-[#02FE85] bg-[#02FE85]/10 border border-[#02FE85]/20 rounded-full px-4 py-1.5 mb-7 sm:mb-8"
            style={{ animationDelay: "0ms" }}
          >
            Software de gestión y ventas
          </span>

          {/* Headline */}
          <h1
            className="hero-in font-bold leading-[1.03] tracking-[-0.03em] text-white mb-6 sm:mb-7 max-w-[18ch] text-balance"
            style={{ fontSize: "clamp(2rem, 5vw, 4.25rem)", animationDelay: "120ms" }}
          >
            Recuperá el control de tu negocio.{" "}
            <span className="text-[#02FE85]">Dejá atrás el caos.</span>
          </h1>

          {/* Sub */}
          <p
            className="hero-in text-base sm:text-lg text-white/50 leading-relaxed max-w-xl mb-8 sm:mb-9 font-medium text-pretty"
            style={{ animationDelay: "240ms" }}
          >
            Gestioná ventas, stock, compras, gastos y mucho más desde un solo lugar. Rootsy te ayuda a
            simplificar la operación diaria para que puedas enfocarte en hacer crecer tu negocio.
          </p>

          {/* CTAs */}
          <div
            className="hero-in flex flex-col sm:flex-row items-center justify-center gap-3 mb-20 w-full sm:w-auto"
            style={{ animationDelay: "350ms" }}
          >
            <a href="#planes" className="flex items-center justify-center gap-2.5 bg-white text-[#000347] font-bold text-sm px-8 py-3.5 rounded-full hover:bg-[#02FE85] transition-colors duration-200 w-full sm:w-auto">
              Contratar ahora
              <ArrowRight className="w-4 h-4" />
            </a>
            <a href="#faqs" className="flex items-center justify-center gap-2 border border-white/20 text-white font-semibold text-sm px-8 py-3.5 rounded-full hover:border-white/40 hover:bg-white/[0.04] transition-all duration-200 w-full sm:w-auto">
              Agendar una demo
            </a>
          </div>

          {/* Product — full width below */}
          <div
            className="hero-in-slow relative w-full max-w-5xl"
            style={{ animationDelay: "560ms" }}
          >
            <ProductFrame label="Panel de gestión Rootsy" imageSrc={productCapture} aspect="16/9" />
            <div className="absolute -bottom-px left-0 right-0 h-[30%] bg-gradient-to-t from-[#080c0b] via-[#080c0b]/70 to-transparent pointer-events-none" />
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF MARQUEE ────────────────────────────────────────── */}
      <section className="relative py-14 overflow-hidden">
        <style>{`
          @keyframes marquee-scroll {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
          .marquee-track {
            animation: marquee-scroll 38s linear infinite;
          }
          .marquee-track:hover {
            animation-play-state: paused;
          }
          @media (prefers-reduced-motion: reduce) {
            .marquee-track { animation: none; }
          }
        `}</style>

        {/* Label */}
        <p className="text-center text-[11px] font-semibold text-white/22 tracking-[0.24em] uppercase mb-10">
          Más de 100 negocios ya trabajan con Rootsy
        </p>

        {/* Track */}
        <div
          className="relative overflow-hidden"
          style={{ maskImage: "linear-gradient(to right, transparent 0%, black 9%, black 91%, transparent 100%)" }}
        >
          <div className="marquee-track flex items-center gap-20 w-max">
            {[...MARQUEE_LOGOS, ...MARQUEE_LOGOS].map((logo, i) => (
              <MarqueeLogoItem key={i} logo={logo} />
            ))}
          </div>
        </div>
      </section>

      {/* ── EL PROBLEMA ────────────────────────────────────────────────── */}
      <section
        id="problema"
        ref={problemaRef}
        className={`relative py-28 scroll-mt-20 overflow-hidden ${problemaInView ? "is-revealed" : ""}`}
      >
        {/* Patrón de reveal reutilizable — fade-up al entrar en viewport,
            mismo espíritu que el hero. Reusar .reveal + --rv-delay en otras secciones. */}
        <style>{`
          .reveal {
            opacity: 0;
            transform: translateY(18px);
            transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1);
            transition-delay: var(--rv-delay, 0s);
          }
          .is-revealed .reveal { opacity: 1; transform: translateY(0); }
          @media (prefers-reduced-motion: reduce) {
            .reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
          }
        `}</style>
        {/* Ambiente sutil — misma lógica que el Hero, con más transparencia */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, #000 22%, #000 82%, transparent 100%)",
            maskImage:
              "linear-gradient(to bottom, transparent 0%, #000 22%, #000 82%, transparent 100%)",
          }}
        >
          {/* Orbe verde superior-izquierda */}
          <div
            className="hero-orb-a absolute rounded-full opacity-[0.10] blur-[140px]"
            style={{ top: "-4%", left: "2%", width: "560px", height: "520px", background: "#02FE85" }}
          />
          {/* Orbe teal inferior-derecha */}
          <div
            className="hero-orb-b absolute rounded-full opacity-[0.08] blur-[130px]"
            style={{ bottom: "-6%", right: "-4%", width: "520px", height: "500px", background: "#02FED1" }}
          />
        </div>

        <div className={`relative z-10 ${SHELL}`}>
          <div className="max-w-2xl mb-16">
            <p className="reveal text-xs font-semibold text-[#02FE85] tracking-widest uppercase mb-5" style={{ ["--rv-delay" as any]: "0.05s" }}>
              El problema
            </p>
            <h2 className="reveal font-bold text-4xl lg:text-5xl leading-tight tracking-tight text-white mb-6" style={{ ["--rv-delay" as any]: "0.15s" }}>
              Administrar un negocio no debería consumirte.
            </h2>
            <p className="reveal text-lg text-white/45 leading-relaxed" style={{ ["--rv-delay" as any]: "0.25s" }}>
              Manejar ventas, stock, compras, gastos y clientes desde distintas herramientas termina
              convirtiendo cada día en una carrera contra el reloj. Cuando el negocio depende de apagar
              incendios constantemente, queda cada vez menos tiempo para hacerlo crecer.
            </p>
          </div>

          {/* Bento — filas asimétricas (ancho + angosto, luego angosto + ancho).
              Sin numeración: los problemas no siguen un orden. Cada bloque abre
              con un ícono 3D al estilo de las cards de rubro. */}
          <div className="flex flex-col gap-5">
            {/* Fila 1 */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
              <RevealItem delay={0} className="md:col-span-3 flex">
                <ProblemCard pain={painPoints[0]} layout="row" className="flex-1" />
              </RevealItem>
              <RevealItem delay={0.13} className="md:col-span-2 flex">
                <ProblemCard pain={painPoints[1]} layout="stack" className="flex-1" />
              </RevealItem>
            </div>
            {/* Fila 2 — espejada */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
              <RevealItem delay={0} className="md:col-span-2 flex">
                <ProblemCard pain={painPoints[2]} layout="stack" className="flex-1" />
              </RevealItem>
              <RevealItem delay={0.13} className="md:col-span-3 flex">
                <ProblemCard pain={painPoints[3]} layout="row" className="flex-1" />
              </RevealItem>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ POR ESO EXISTE ROOTSY — cambio de capítulo (luz) ══════════
          Un bloque claro que emerge como una tarjeta flotante sobre la narrativa
          oscura del problema. Composición editorial, no grilla de cards: el
          objetivo es transmitir alivio y propósito, no explicar funcionalidades. */}
      <section
        ref={existeRef}
        className={`existe-block relative z-10 -mt-6 rounded-t-[2.75rem] rounded-b-[2.75rem] bg-[#F3F5EF] text-[#0A0F0C] overflow-hidden ${existeInView ? "is-revealed" : ""}`}
      >
        <style>{`
          /* El bloque claro "se prende" como respuesta a los problemas */
          .existe-block {
            opacity: 0;
            transform: translateY(28px) scale(0.985);
            transition: opacity 0.9s cubic-bezier(0.22,1,0.36,1), transform 0.9s cubic-bezier(0.22,1,0.36,1);
          }
          .existe-block.is-revealed { opacity: 1; transform: translateY(0) scale(1); }

          /* Un pulso de luz verde que barre al encenderse */
          .existe-flash {
            opacity: 0;
          }
          .is-revealed .existe-flash {
            animation: existe-flash 1.4s ease-out 0.15s both;
          }
          @keyframes existe-flash {
            0%   { opacity: 0;    transform: translateX(-50%) scale(0.9); }
            35%  { opacity: 0.55; }
            100% { opacity: 0.1;  transform: translateX(-50%) scale(1); }
          }

          /* Reveal escalonado del contenido editorial */
          .existe-reveal {
            opacity: 0;
            transform: translateY(22px);
            transition: opacity 0.75s cubic-bezier(0.22,1,0.36,1), transform 0.75s cubic-bezier(0.22,1,0.36,1);
            transition-delay: var(--rv-delay, 0s);
          }
          .is-revealed .existe-reveal { opacity: 1; transform: translateY(0); }

          @media (prefers-reduced-motion: reduce) {
            .existe-block, .existe-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
            .existe-flash { animation: none !important; opacity: 0.1 !important; }
          }
        `}</style>

        {/* Calidez de marca — el glow que "enciende" el bloque */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="existe-flash absolute left-1/2 rounded-full blur-[150px]"
            style={{ top: "-15%", transform: "translateX(-50%)", width: "1000px", height: "500px", background: "#02FE85" }}
          />
          <div
            className="hero-orb-b absolute rounded-full opacity-[0.07] blur-[140px]"
            style={{ bottom: "-18%", right: "-6%", width: "620px", height: "460px", background: "#02FED1" }}
          />
        </div>

        <div className={`relative ${SHELL} flex flex-col items-center text-center min-h-[80vh] justify-center px-[56px] py-[80px]`}>
          {/* Eyebrow — apenas un susurro */}
          <p className="existe-reveal inline-flex items-center gap-2.5 text-[11px] font-bold text-[#05713F] tracking-[0.28em] uppercase mb-12" style={{ ["--rv-delay" as any]: "0.05s" }}>
            Por eso existe Rootsy
          </p>

          {/* La única idea protagonista — dos frases, un giro tipográfico */}
          <h2 className="existe-reveal font-bold text-[2.4rem] sm:text-5xl lg:text-[4rem] leading-[1.06] tracking-[-0.03em] text-[#0A0F0C] max-w-[16ch] text-balance" style={{ ["--rv-delay" as any]: "0.18s" }}>
            Cada negocio es diferente.
            <span className="block text-[#8A948B] mt-2">Tu sistema también debería serlo.</span>
          </h2>

          {/* Bajada — contenida, sin explicar de más */}
          <p className="existe-reveal text-lg lg:text-xl text-[#4A554C] leading-relaxed max-w-xl mx-auto mt-10 text-pretty" style={{ ["--rv-delay" as any]: "0.32s" }}>
            A partir de acá, contanos sobre tu negocio y adaptamos el producto y la experiencia a tu medida.
          </p>

          {/* Transición — expectativa, no explicación: la línea baja hacia la elección */}
          <div className="existe-reveal mt-24 lg:mt-28 flex flex-col items-center gap-4" style={{ ["--rv-delay" as any]: "0.46s" }}>
            <span className="text-[11px] font-semibold text-[#8A948B] tracking-[0.24em] uppercase">
              Elegí tu rubro
            </span>
            <div className="relative h-16 w-px overflow-hidden">
              <span className="absolute inset-0 bg-black/[0.09]" />
              <span className="absolute inset-x-0 -top-8 h-8 bg-[linear-gradient(to_bottom,transparent,#02FE85)] animate-[trickle_2.4s_ease-in-out_infinite] motion-reduce:hidden" />
            </div>
          </div>
        </div>
      </section>

      {/* ── ENCONTRÁ TU ROOTSY — SELECTOR (turning point) ──────────────── */}
      <section ref={selectorRef} id="soluciones" className="relative scroll-mt-20 py-24">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-1/2 -translate-x-1/2 rounded-full opacity-[0.08] blur-[130px]" style={{ top: "20%", width: "800px", height: "700px", background: "#02FE85" }} />
        </div>

        <div className={`relative ${SHELL}`}>
          <RevealItem delay={0} className="text-center w-full sm:max-w-2xl sm:mx-auto mb-14 px-0 sm:px-[40px]">
            <p className="text-xs font-semibold text-[#02FE85] tracking-widest uppercase mb-5">
              Encontrá tu Rootsy
            </p>
            <h2 className="font-bold text-4xl lg:text-5xl leading-tight tracking-tight text-white mb-5">
              Elegí tu rubro y personalizamos todo.
            </h2>
            <p className="text-base text-white/45">
              A partir de acá, el producto, los beneficios, los planes y los módulos se adaptan a vos.
            </p>
          </RevealItem>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {SEGMENT_IDS.map((segId, i) => {
              const seg = segments[segId];
              const isActive = selectedSegment === segId;
              return (
                <RevealItem key={segId} delay={i * 0.13} className="flex">
                  <button
                    onClick={() => setSelectedSegment(segId)}
                    className={`relative text-left rounded-2xl border transition-all duration-300 flex-1 ${ isActive ? "border-[#02FE85] bg-[#02FE85]/[0.06] shadow-[0_0_48px_rgba(2,254,133,0.10)]" : "border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] opacity-65 hover:opacity-90" } px-[32px] py-[40px]`}
                  >
                    <span className="text-4xl mb-6 block">{seg.emoji}</span>
                    <h3 className={`font-bold text-2xl mb-2 transition-colors duration-300 ${isActive ? "text-[#02FE85]" : "text-white"}`}>
                      {seg.label}
                    </h3>
                    <p className="text-sm text-white/45 leading-relaxed">{seg.tagline}</p>
                    {isActive && (
                      <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#02FE85] flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                </RevealItem>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════ SEGUNDA MITAD — CONTENIDO PERSONALIZADO ═══════════════ */}

      {/* ── HERO DEL RUBRO: composición centrada, captura recortada a 3/4 ──
          Layout deliberadamente distinto a los beneficios que siguen: centrado
          como el hero general, todo dentro del viewport, con la captura debajo
          desvaneciéndose para leerse como recurso ilustrativo, no como detalle. */}
      <section className="relative border-t border-white/[0.04] pt-24 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-1/2 -translate-x-1/2 rounded-full opacity-[0.10] blur-[150px]" style={{ top: "-12%", width: "1000px", height: "560px", background: "#02FE85" }} />
        </div>
        <div className={`relative ${SHELL} flex flex-col items-center text-center`}>
          <RevealItem delay={0}>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#02FE85] bg-[#02FE85]/10 border border-[#02FE85]/20 rounded-full px-4 py-1.5 mb-7">
              <span>{segment.emoji}</span>
              Rootsy para {segment.label}
            </div>
          </RevealItem>

          <RevealItem delay={0.12}>
            <h2
              className="font-bold tracking-[-0.03em] text-white leading-[1.06] mb-6 max-w-[20ch] text-balance"
              style={{ fontSize: "clamp(2rem, 4.2vw, 3.5rem)" }}
            >
              {segment.valueProp}
            </h2>
          </RevealItem>

          <RevealItem delay={0.22}>
            <p className="text-base lg:text-lg text-white/50 leading-relaxed mb-7 max-w-2xl text-pretty">
              {segment.intro}
            </p>
          </RevealItem>

          <RevealItem delay={0.32} className="flex flex-wrap justify-center gap-2 mb-6">
            {segment.useCases.map((uc) => (
              <span
                key={uc}
                className="text-xs font-medium text-white/55 bg-white/[0.03] border border-white/[0.08] rounded-full px-3.5 py-1.5"
              >
                {uc}
              </span>
            ))}
          </RevealItem>

          {/* Captura recortada: el contenedor limita la altura y el fundido
              inferior la corta a ~3/4, dejándola como recurso de diseño */}
          <RevealItem delay={0.44} className="relative w-full max-w-5xl max-h-[46vh] overflow-hidden">
            <ProductFrame label={`Rootsy para ${segment.label}`} imageSrc={segment.heroImageSrc} aspect="16/10" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#080c0b] via-[#080c0b]/80 to-transparent pointer-events-none" />
          </RevealItem>
        </div>
      </section>

      {/* ── BENEFICIOS CON PRODUCTO EN CONTEXTO (personalizado) ────────── */}
      <section className="relative py-8">
        <div className={SHELL}>
          <div className="flex items-center gap-3 mb-16">
            <p className="text-xs font-semibold text-[#02FE85] tracking-widest uppercase">
              Cómo te ayuda
            </p>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          <div className="space-y-24">
            {segment.benefits.map((benefit, i) => (
              <div
                key={benefit.title}
                className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
              >
                <RevealItem delay={0} className={i % 2 === 1 ? "lg:order-2" : ""}>
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-[#02FE85] text-sm font-bold">0{i + 1}</span>
                    <span className="text-xs text-white/30 uppercase tracking-widest">Solución</span>
                  </div>
                  <h3 className="font-bold text-2xl lg:text-3xl text-white leading-tight mb-4 max-w-md">
                    {benefit.title}
                  </h3>
                  <p className="text-base text-white/50 leading-relaxed max-w-md mb-8">
                    {benefit.desc}
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 max-w-md">
                    {benefit.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-[#02FE85] shrink-0 mt-0.5" strokeWidth={2.75} />
                        <span className="text-sm text-white/60 leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>
                </RevealItem>
                <RevealItem delay={0.18} className={i % 2 === 1 ? "lg:order-1" : ""}>
                  <ProductFrame label={benefit.shot} imageSrc={benefit.imageSrc} aspect="16/10" compact />
                </RevealItem>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FUNCIONALIDADES (personalizado) ────────────────────────────── */}
      <section className="relative py-24 mt-8 border-t border-white/[0.04]">
        <div className={SHELL}>
          <RevealItem delay={0} className="flex items-start justify-between gap-4 mb-14 flex-wrap">
            <div>
              <p className="text-xs font-semibold text-[#02FE85] tracking-widest uppercase mb-4">
                Todo lo que incluye
              </p>
              <h2 className="font-bold text-3xl lg:text-4xl tracking-tight text-white max-w-2xl leading-snug">
                {segment.featureGroupsTitle}
              </h2>
            </div>
          </RevealItem>

          {/* Columnas por grupo — se adaptan a la cantidad de grupos del rubro
              (3, 4 o 5) vía --cols; separadores hairline entre columnas */}
          <div
            className="grid grid-cols-2 lg:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))] gap-px bg-white/[0.05] rounded-2xl overflow-hidden border border-white/[0.05]"
            style={{ ["--cols" as string]: segment.featureGroups.length }}
          >
            {segment.featureGroups.map((fg, i) => (
              <RevealItem key={fg.group} delay={i * 0.1} className="bg-[#080c0b] p-7 lg:p-8">
                <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-white/[0.07]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#02FE85]" />
                  <h4 className="font-bold text-xs text-white uppercase tracking-[0.16em]">
                    {fg.group}
                  </h4>
                </div>
                <ul className="space-y-3.5">
                  {fg.items.map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <Check className="w-3.5 h-3.5 text-[#02FE85]/80 shrink-0" strokeWidth={2.75} />
                      <span className="text-sm text-white/65">{item}</span>
                    </li>
                  ))}
                </ul>
              </RevealItem>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CONFIGURADOR: PLANES + ADD-ONS ══════════
          Pricing como checkout, no como tabla: el usuario elige plan (radio) y
          suma add-ons (toggles). Una barra-resumen flotante actualiza el total
          en vivo — plan + recurrentes /mes y cargos de pago único por separado —
          y desde ahí contrata todo junto. Patrón "build-your-plan" de SaaS. */}
      <section id="planes" ref={configRef} className="relative py-28 border-t border-white/[0.04] scroll-mt-24">
        <div className={SHELL}>
          <RevealItem delay={0} className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-14">
            <div className="max-w-xl">
              <p className="text-xs font-semibold text-[#02FE85] tracking-widest uppercase mb-4">
                Armá tu Rootsy
              </p>
              <h2 className="font-bold text-4xl lg:text-5xl tracking-tight text-white leading-tight mb-4">
                Elegí tu plan y sumá lo que necesites.
              </h2>
              <p className="text-base text-white/45 leading-relaxed">
                Configurás tu sistema a medida y ves el total en el momento. Sin permanencia. Cambiás de plan o add-ons cuando quieras.
              </p>
            </div>

            {/* Toggle de facturación */}
            <div className="shrink-0">
              <div className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] p-1">
                <button
                  onClick={() => setBillingAnnual(false)}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
                    !billingAnnual ? "bg-white text-black" : "text-white/55 hover:text-white"
                  }`}
                >
                  Mensual
                </button>
                <button
                  onClick={() => setBillingAnnual(true)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
                    billingAnnual ? "bg-white text-black" : "text-white/55 hover:text-white"
                  }`}
                >
                  Anual
                  <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${
                    billingAnnual ? "bg-[#02FE85] text-black" : "bg-[#02FE85]/15 text-[#02FE85]"
                  }`}>
                    2 meses gratis
                  </span>
                </button>
              </div>
            </div>
          </RevealItem>

          {/* Paso 1 — Planes seleccionables */}
          <RevealItem delay={0} className="flex items-center gap-3 mb-6">
            <span className="w-6 h-6 rounded-full bg-[#02FE85] text-black text-xs font-bold flex items-center justify-center">1</span>
            <p className="text-sm font-bold text-white">Elegí tu plan</p>
          </RevealItem>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16" role="radiogroup" aria-label="Planes">
            {segment.plans.map((plan, i) => {
              const selected = selectedPlan === plan.name;
              const price = billingAnnual ? plan.annualMonthly : plan.monthly;
              return (
                <RevealItem key={plan.name} delay={i * 0.12} className="flex">
                <button
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setSelectedPlan(plan.name)}
                  className={`relative flex flex-col text-left p-9 rounded-2xl border transition-all duration-300 flex-1 ${
                    selected
                      ? "border-[#02FE85] bg-[#02FE85]/[0.05] shadow-[0_0_60px_rgba(2,254,133,0.10)]"
                      : "border-white/[0.08] bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.035]"
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-9 bg-[#02FE85] text-black text-[11px] font-bold px-3.5 py-1 rounded-full">
                      Más elegido
                    </div>
                  )}
                  {/* Radio indicator */}
                  <span className={`absolute top-6 right-6 w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-200 ${
                    selected ? "border-[#02FE85] bg-[#02FE85]" : "border-white/25"
                  }`}>
                    {selected && <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />}
                  </span>

                  <h3 className="font-bold text-lg text-white mb-6">{plan.name}</h3>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-bold leading-none text-white" style={{ fontSize: "2.6rem" }}>${price}</span>
                    <span className="text-sm text-white/40">USD/mes</span>
                  </div>
                  <p className="text-xs text-white/35 mt-2 mb-8">
                    {billingAnnual ? `Facturado anual · $${plan.annualMonthly * 12} USD/año` : "Facturado mes a mes en USD"}
                  </p>
                  {plan.subtitle && (
                    <p className="text-[11px] text-white/35 italic mb-3.5 -mt-4">
                      {plan.subtitle}
                    </p>
                  )}
                  <ul className="space-y-3.5 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-[#02FE85] shrink-0 mt-0.5" strokeWidth={2.5} />
                        <span className="text-sm text-white/55">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className={`mt-8 pt-5 border-t text-sm font-bold text-center transition-colors ${
                    selected ? "border-[#02FE85]/20 text-[#02FE85]" : "border-white/[0.08] text-white/50"
                  }`}>
                    {selected ? "Plan seleccionado" : "Elegir este plan"}
                  </div>
                </button>
                </RevealItem>
              );
            })}
          </div>

          {/* Paso 2 — Add-ons seleccionables */}
          <RevealItem delay={0} className="flex items-center gap-3 mb-2">
            <span className="w-6 h-6 rounded-full bg-[#02FE85] text-black text-xs font-bold flex items-center justify-center">2</span>
            <p className="text-sm font-bold text-white">Sumá add-ons</p>
          </RevealItem>
          <p className="text-sm text-white/40 mb-6 ml-9">
            Activá sólo lo que tu negocio necesita. Se suman a tu plan y los sacás cuando quieras.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {segment.addOns.map((addon, i) => {
              const selected = selectedAddOns.includes(addon.name);
              return (
                <RevealItem key={addon.name} delay={i * 0.12}>
                  <button
                    aria-pressed={selected}
                    onClick={() => toggleAddOn(addon.name)}
                    className={`flex items-start gap-4 text-left p-6 rounded-xl border transition-all duration-200 w-full ${
                      selected
                        ? "border-[#02FE85] bg-[#02FE85]/[0.05]"
                        : "border-white/[0.08] bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.035]"
                    }`}
                  >
                    <span className={`mt-0.5 w-6 h-6 shrink-0 rounded-md border flex items-center justify-center transition-all duration-200 ${
                      selected ? "border-[#02FE85] bg-[#02FE85]" : "border-white/25"
                    }`}>
                      {selected ? <Check className="w-4 h-4 text-black" strokeWidth={3} /> : <Plus className="w-4 h-4 text-white/40" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-white mb-1.5">{addon.name}</h4>
                      <p className="text-xs text-white/40 leading-relaxed">{addon.desc}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-base text-white leading-none">
                        {addon.billing === "unica" ? `$${addon.price}` : `+$${addon.price}`}
                      </p>
                      <p className="text-[11px] text-white/40 mt-1 whitespace-nowrap">
                        {addon.billing === "unica" ? "pago único" : "/mes"}
                      </p>
                    </div>
                  </button>
                </RevealItem>
              );
            })}
          </div>

          {/* Comparativa detallada — tabla colapsable de todos los planes */}
          <div className="mt-16 pt-12 border-t border-white/[0.05]">
            <RevealItem delay={0} className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between mb-8">
              <h3 className="text-2xl font-bold text-white/55 tracking-tight text-center sm:text-left">
                Compará los planes, en detalle.
              </h3>
              <div className="inline-flex self-center sm:self-auto items-center gap-0.5 rounded-full border border-white/[0.08] bg-white/[0.03] p-1 shrink-0">
                <button
                  onClick={() => setBillingAnnual(false)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                    !billingAnnual ? "bg-white text-black" : "text-white/50 hover:text-white"
                  }`}
                >
                  Mensual
                </button>
                <button
                  onClick={() => setBillingAnnual(true)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                    billingAnnual ? "bg-white text-black" : "text-white/50 hover:text-white"
                  }`}
                >
                  Anual
                  <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${
                    billingAnnual ? "bg-[#02FE85] text-black" : "bg-[#02FE85]/15 text-[#02FE85]"
                  }`}>
                    2 meses gratis
                  </span>
                </button>
              </div>
            </RevealItem>
            <RevealItem delay={0.15}>
              <PlanComparison
                segment={segment}
                billingAnnual={billingAnnual}
                selectedPlan={selectedPlan}
                onSelectPlan={setSelectedPlan}
              />
            </RevealItem>
          </div>
        </div>
      </section>

      {/* ── RAZONES PARA CREER: TESTIMONIALES ──────────────────────────── */}
      <section className="relative py-24 border-t border-white/[0.04]">
        <div className={SHELL}>
          {/* Header */}
          <RevealItem delay={0} className="max-w-2xl mb-14">
            <p className="text-xs font-semibold text-[#02FE85] tracking-widest uppercase mb-5">
              Razones para creer
            </p>
            <h2 className="font-bold text-3xl lg:text-4xl tracking-tight text-white leading-snug">
              {segment.testimonialsTitle}
            </h2>
          </RevealItem>

          {/* Cards — grilla de altura uniforme */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {segment.testimonials.map((t, i) => (
              <RevealItem key={i} delay={i * 0.12} className="flex">
                <div className="flex flex-col flex-1 p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-colors duration-300">
                  <blockquote className="flex-1 text-[15px] text-white/70 leading-relaxed mb-8">
                    "{t.text}"
                  </blockquote>
                  <div className="w-6 h-px bg-[#02FE85]/30 mb-6" />
                  <div className="flex items-center gap-3">
                    {t.avatar ? (
                      <img
                        src={t.avatar}
                        alt={t.author}
                        className="w-11 h-11 rounded-full object-cover shrink-0 border border-white/10"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-[#02FE85]/10 border border-[#02FE85]/20 flex items-center justify-center shrink-0">
                        <span className="text-[#02FE85] font-bold text-sm">{t.author[0]}</span>
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-sm text-white leading-tight">{t.author}</p>
                      <p className="text-xs text-white/40 mt-0.5">{t.role}</p>
                    </div>
                  </div>
                </div>
              </RevealItem>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ──────────────────────────────────────────────────── */}
      <section className="relative py-36 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-[#080c0b] via-[#08110d] to-[#080c0b]" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.16] blur-[130px]" style={{ width: "800px", height: "450px", background: "#02FE85" }} />
        </div>

        <div className={`relative ${SHELL} max-w-4xl text-center`}>
          <RevealItem delay={0} className="inline-flex items-center justify-center">
            <p className="text-xs font-semibold text-[#02FE85] tracking-widest uppercase mb-7 flex items-center gap-2">
              <CornerDownRight className="w-3.5 h-3.5" />
              Comenzá con Rootsy para {segment.label}
            </p>
          </RevealItem>
          <RevealItem delay={0.12}>
            <h2
              className="font-bold leading-[1.03] tracking-[-2px] text-white mb-6"
              style={{ fontSize: "clamp(2.4rem, 6.5vw, 5rem)" }}
            >
              Tu negocio merece<br />
              <span className="text-[#02FE85]">operar sin caos.</span>
            </h2>
          </RevealItem>
          <RevealItem delay={0.22}>
            <p className="text-lg text-white/45 max-w-xl mx-auto mb-12">
              Sumarte a Rootsy es simple. Sin permanencia ni contratos, empezá cuando quieras y crecé a tu ritmo.
            </p>
          </RevealItem>
          <RevealItem delay={0.32} className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#planes" className="flex items-center justify-center gap-2.5 bg-[#02FE85] text-black font-bold text-sm px-12 py-4 rounded-full hover:bg-white transition-colors duration-200">
              Contratar ahora
              <ArrowRight className="w-4 h-4" />
            </a>
            <a href="#faqs" className="flex items-center justify-center gap-2 border border-white/20 text-white font-semibold text-sm px-12 py-4 rounded-full hover:border-white/40 hover:bg-white/[0.04] transition-all duration-200">
              Agendar una demo
            </a>
          </RevealItem>
        </div>
      </section>

      {/* ── FAQs (personalizado por rubro) ─────────────────────────────── */}
      <section id="faqs" className="relative py-28 border-t border-white/[0.04] scroll-mt-20">
        <div className={`${SHELL}`}>
          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.6fr] gap-12 lg:gap-20 items-start">
            <RevealItem delay={0} className="lg:sticky lg:top-28">
              <p className="text-xs font-semibold text-[#02FE85] tracking-widest uppercase mb-5">
                Preguntas frecuentes
              </p>
              <h2 className="font-bold text-3xl lg:text-4xl tracking-tight text-white leading-snug mb-5">
                Lo que suelen preguntar los negocios de {segment.label.toLowerCase()}.
              </h2>
              <p className="text-base text-white/45 leading-relaxed mb-7 max-w-sm">
                ¿Te quedó otra duda? Escribinos y te respondemos antes de que empieces.
              </p>
              <a href="#planes" className="inline-flex items-center gap-2 text-sm font-bold text-[#02FE85] hover:gap-3 transition-all duration-200">
                Hablar con el equipo
                <ArrowRight className="w-4 h-4" />
              </a>
            </RevealItem>

            <div className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
              {segment.faqs.map((faq, i) => {
                const open = openFaq === i;
                return (
                  <RevealItem key={faq.q} delay={i * 0.08}>
                    <button
                      onClick={() => setOpenFaq(open ? null : i)}
                      className="w-full flex items-start justify-between gap-6 py-6 text-left group"
                      aria-expanded={open}
                    >
                      <span className={`font-bold text-base lg:text-lg leading-snug transition-colors duration-200 ${open ? "text-white" : "text-white/75 group-hover:text-white"}`}>
                        {faq.q}
                      </span>
                      <span className={`shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${open ? "border-[#02FE85] bg-[#02FE85]/10 rotate-180" : "border-white/15 group-hover:border-white/35"}`}>
                        <ChevronDown className={`w-4 h-4 transition-colors ${open ? "text-[#02FE85]" : "text-white/50"}`} />
                      </span>
                    </button>
                    <div
                      className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                    >
                      <div className="overflow-hidden">
                        <p className="text-base text-white/50 leading-relaxed pb-7 max-w-2xl">
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  </RevealItem>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER (sin prioridad esta iteración) ──────────────────────── */}
      <footer className="border-t border-white/[0.06] py-10">
        <div className={`${SHELL} flex flex-col md:flex-row items-center justify-between gap-6`}>
          <RootsyLogo className="h-6 w-auto opacity-50" />
          <p className="text-xs text-white/25">
            © 2026 Rootsy. Todos los derechos reservados.
          </p>
          <div className="flex gap-7 text-xs text-white/30">
            <a href="#faqs" className="hover:text-white/60 transition-colors">Privacidad</a>
            <a href="#faqs" className="hover:text-white/60 transition-colors">Términos</a>
            <a href="#faqs" className="hover:text-white/60 transition-colors">Contacto</a>
          </div>
        </div>
      </footer>

      {showSummary ? (
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="bg-[#0c110e]/95 backdrop-blur-xl border-t border-white/[0.09] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
          <div className={`${SHELL} py-4 flex flex-col sm:flex-row items-center justify-between gap-4`}>
            <div className="flex items-center gap-4 min-w-0">
              <span className="hidden sm:flex w-9 h-9 shrink-0 rounded-lg bg-[#02FE85]/10 border border-[#02FE85]/20 items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#02FE85]" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] text-white/40 uppercase tracking-wider">
                  Tu Rootsy para {segment.label}
                </p>
                <p className="text-sm font-bold text-white truncate">
                  Plan {activePlan.name}
                  <span className="text-white/45 font-medium">
                    {" · "}
                    {chosenAddOns.length} {chosenAddOns.length === 1 ? "add-on" : "add-ons"}
                    {" · "}
                    {billingAnnual ? "Anual" : "Mensual"}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-5 sm:gap-7">
              <div className="text-right">
                <p className="leading-none">
                  <span className="font-bold text-white" style={{ fontSize: "1.6rem" }}>${monthlyTotal}</span>
                  <span className="text-sm text-white/45">/mes</span>
                </p>
                {oneTimeTotal > 0 && (
                  <p className="text-[11px] text-white/45 mt-1">
                    + ${oneTimeTotal} pago único inicial
                  </p>
                )}
              </div>
              <a href="#planes" className="flex items-center gap-2 bg-[#02FE85] text-black font-bold text-sm px-7 py-3 rounded-full hover:bg-white transition-colors duration-200 whitespace-nowrap">
                Contratar
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
      ) : null}

    </div>
  );
}
