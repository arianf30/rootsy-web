"use client"

import Link from "next/link"
import { useState } from "react"
import {
  ChevronDown,
  ImagePlus,
  LayoutDashboard,
  Palette,
  Plus,
  User,
} from "lucide-react"

import { PopSaleHeader } from "@/components/pop/pop-sale-header"
import {
  DsFoundationColors,
  DsFoundationTypefaces,
  DsFoundationTypeScale,
} from "@/components/office/ds-foundations"
import {
  DesignTile,
  DsSection,
  DsVariantCell,
  DsVariantPanel,
} from "@/components/office/ds-section"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FORM_CONTROL_MD, FORM_LABEL_UPPER } from "@/lib/form-controls"
import { cn } from "@/lib/utils"

const toc = [
  { href: "#intro", label: "Intro" },
  { href: "#foundation-colors", label: "Paleta" },
  { href: "#foundation-type", label: "Tipografía" },
  { href: "#atoms-buttons", label: "Botones" },
  { href: "#atoms-fields", label: "Campos" },
  { href: "#atoms-badges", label: "Insignias" },
  { href: "#atoms-avatar", label: "Avatar" },
  { href: "#molecules", label: "Moléculas" },
  { href: "#organisms", label: "Organismos" },
] as const

const ventaDialogPrimaryBtn =
  "h-10 bg-emerald-600 font-semibold text-white shadow-sm hover:bg-emerald-500 active:bg-emerald-700"

const ventaDialogGhostBtn =
  "h-10 text-muted-foreground hover:text-foreground"

export function DesignSystemView() {
  const [dsSelectMd, setDsSelectMd] = useState("chaco")
  const [dsSelectDefault, setDsSelectDefault] = useState("a")

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header id="intro" className="mb-12 max-w-2xl scroll-mt-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
          <Palette className="size-3.5" aria-hidden />
          Office · UI Kit
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Kit de interfaz
        </h1>
        <p className="mt-3 text-muted-foreground">
          Referencia visual al estilo de la documentación de Tailwind: paleta,
          escala tipográfica y variantes nombradas. Los nombres coinciden con lo
          que ya está en login, landing, cuenta, POS, cajas y office. Usá el
          interruptor del Office para previsualizar claro y oscuro.
        </p>
      </header>

      <nav
        className="mb-10 flex gap-2 overflow-x-auto pb-1 lg:hidden [-webkit-overflow-scrolling:touch]"
        aria-label="Secciones"
      >
        {toc.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-full border border-border/80 bg-card/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10">
        <nav
          className="sticky top-6 mb-10 hidden h-fit space-y-1 text-sm lg:block"
          aria-label="Secciones"
        >
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            En esta página
          </p>
          {toc.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block rounded-lg px-2 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
          <Separator className="my-4" />
          <Link
            href="/office"
            className="block rounded-lg px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            ← Office
          </Link>
        </nav>

        <div className="min-w-0 space-y-16">
          <DsSection
            id="foundation-colors"
            eyebrow="Fundamentos"
            title="Paleta semántica"
            description="Colores mapeados a variables del tema (claro u oscuro según el interruptor del Office). Misma lógica que en la guía de colores de Tailwind: nombre + token + muestra."
          >
            <DsFoundationColors />
          </DsSection>

          <DsSection
            id="foundation-type"
            eyebrow="Fundamentos"
            title="Tipografía"
            description="Familias cargadas con Next (Nunito para toda la UI, Geist Mono para monoespaciado) y escala de tamaños con utilidades Tailwind alineadas a la tabla font-size de la documentación de Tailwind v4."
          >
            <DsFoundationTypefaces />
            <div className="mt-8 space-y-3">
              <h3 className="text-base font-semibold tracking-tight">
                Escala tipográfica
              </h3>
              <p className="text-sm text-muted-foreground">
                Clases <span className="font-mono text-xs">text-*</span> e
                interlineado como referencia para diseño y código.
              </p>
              <DsFoundationTypeScale />
            </div>
          </DsSection>

          <DsSection
            id="atoms-buttons"
            eyebrow="Átomos"
            title="Botones"
            description="Variantes del componente Button que ya aparecen en el producto. Cada celda = nombre de variante para citar en diseño."
          >
            <DsVariantPanel
              title="Variantes base"
              description="Principal, secundario, contorno, fantasma, destructivo y estado deshabilitado."
            >
              <DsVariantCell label="principal" sublabel="default">
                <Button type="button">Principal</Button>
              </DsVariantCell>
              <DsVariantCell label="secundario" sublabel="secondary">
                <Button type="button" variant="secondary">
                  Secundario
                </Button>
              </DsVariantCell>
              <DsVariantCell label="contorno" sublabel="outline">
                <Button type="button" variant="outline">
                  Contorno
                </Button>
              </DsVariantCell>
              <DsVariantCell label="fantasma" sublabel="ghost">
                <Button type="button" variant="ghost">
                  Fantasma
                </Button>
              </DsVariantCell>
              <DsVariantCell label="destructivo" sublabel="destructive">
                <Button type="button" variant="destructive">
                  Destructivo
                </Button>
              </DsVariantCell>
              <DsVariantCell label="deshabilitado" sublabel="secondary + disabled">
                <Button type="button" variant="secondary" disabled>
                  Deshabilitado
                </Button>
              </DsVariantCell>
            </DsVariantPanel>

            <DsVariantPanel
              title="Tamaños"
              description="Alturas habituales del componente (default, pequeño, icono)."
            >
              <DsVariantCell label="default" sublabel="h-9">
                <Button type="button" size="default">
                  Default
                </Button>
              </DsVariantCell>
              <DsVariantCell label="sm" sublabel="h-8">
                <Button type="button" size="sm">
                  Pequeño
                </Button>
              </DsVariantCell>
              <DsVariantCell label="icon" sublabel="size-9">
                <Button type="button" size="icon" aria-label="Agregar">
                  <Plus className="size-4" />
                </Button>
              </DsVariantCell>
            </DsVariantPanel>

            <DesignTile
              name="Botón · como enlace (Ingresar)"
              where="Login — principal de acceso estilizado como enlace a Home."
            >
              <Button
                asChild
                className="h-12 bg-linear-to-r from-emerald-500 to-teal-500 text-base font-semibold text-white shadow-[0_16px_30px_-14px_rgba(16,185,129,0.65)] hover:from-emerald-400 hover:to-teal-400"
              >
                <Link href="/home">Ingresar</Link>
              </Button>
            </DesignTile>

            <DesignTile
              name="Botón · descartar (panel claro POS)"
              where="Vender — barra inferior clara."
            >
              <div className="w-full max-w-md rounded-xl border border-border/50 bg-[#f8fafc] p-4">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full max-w-[11rem] border-rose-200/90 bg-white font-medium text-rose-700 shadow-none hover:border-rose-300 hover:bg-rose-50 hover:text-rose-800"
                >
                  Descartar
                </Button>
              </div>
            </DesignTile>

            <DesignTile
              name="Botón · confirmar (panel claro POS)"
              where="Vender — misma barra; acción principal."
            >
              <div className="w-full max-w-md rounded-xl border border-border/50 bg-[#f8fafc] p-4">
                <Button
                  type="button"
                  className="h-11 w-full max-w-[11rem] border-0 bg-emerald-600 font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] hover:bg-emerald-500 hover:text-white active:bg-emerald-700"
                >
                  Vender
                </Button>
              </div>
            </DesignTile>

            <DsVariantPanel
              title="Pie de modal POS"
              description="Mismas clases que comprobante, pago y descuento."
            >
              <DsVariantCell label="acción principal modal" sublabel="Listo / Aplicar">
                <Button type="button" className={ventaDialogPrimaryBtn}>
                  Listo
                </Button>
              </DsVariantCell>
              <DsVariantCell label="acción fantasma modal" sublabel="Quitar…">
                <Button
                  type="button"
                  variant="ghost"
                  className={ventaDialogGhostBtn}
                >
                  Quitar
                </Button>
              </DsVariantCell>
            </DsVariantPanel>
          </DsSection>

          <DsSection
            id="atoms-fields"
            eyebrow="Átomos"
            title="Campos, lista y separador"
            description="En grillas de formulario, Input y Select comparten altura usando el tamaño md del disparador y la clase compartida formControlMd (ver lib/form-controls.ts)."
          >
            <DsVariantPanel
              title="Input · altura"
              description="default (h-9) en login y formularios simples; md (h-11) alineado con Select en modales."
            >
              <DsVariantCell label="default" sublabel="h-9">
                <Input className="max-w-[200px]" placeholder="Texto" />
              </DsVariantCell>
              <DsVariantCell label="md + formControlMd" sublabel="h-11">
                <Input
                  className={cn(FORM_CONTROL_MD, "max-w-[200px]")}
                  placeholder="Texto"
                />
              </DsVariantCell>
              <DsVariantCell label="disabled" sublabel="md">
                <Input
                  className={cn(FORM_CONTROL_MD, "max-w-[200px]")}
                  disabled
                  placeholder="Deshabilitado"
                />
              </DsVariantCell>
            </DsVariantPanel>

            <DsVariantPanel
              title="Select · tamaño del disparador"
              description="sm y default para UI compacta; md = misma altura que input md en la misma fila."
            >
              <DsVariantCell label="sm" sublabel="h-8">
                <Select value={dsSelectDefault} onValueChange={setDsSelectDefault}>
                  <SelectTrigger size="sm" className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a">Opción A</SelectItem>
                    <SelectItem value="b">Opción B</SelectItem>
                  </SelectContent>
                </Select>
              </DsVariantCell>
              <DsVariantCell label="default" sublabel="h-9">
                <Select value={dsSelectDefault} onValueChange={setDsSelectDefault}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a">Opción A</SelectItem>
                    <SelectItem value="b">Opción B</SelectItem>
                  </SelectContent>
                </Select>
              </DsVariantCell>
              <DsVariantCell label="md" sublabel="h-11">
                <Select value={dsSelectMd} onValueChange={setDsSelectMd}>
                  <SelectTrigger size="md" className={cn(FORM_CONTROL_MD, "w-[160px]")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chaco">Chaco</SelectItem>
                    <SelectItem value="cba">Córdoba</SelectItem>
                  </SelectContent>
                </Select>
              </DsVariantCell>
            </DsVariantPanel>

            <DesignTile
              name="Fila · input + select + input (md)"
              where="Mi perfil y futuros modales con columnas mixtas."
            >
              <div className="grid w-full max-w-3xl gap-5 sm:grid-cols-3">
                <div className="space-y-2">
                  <span className={FORM_LABEL_UPPER}>Campo A</span>
                  <Input className={FORM_CONTROL_MD} defaultValue="Texto" />
                </div>
                <div className="space-y-2">
                  <span className={FORM_LABEL_UPPER}>Lista</span>
                  <Select value={dsSelectMd} onValueChange={setDsSelectMd}>
                    <SelectTrigger size="md" className={FORM_CONTROL_MD}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chaco">Chaco</SelectItem>
                      <SelectItem value="cba">Córdoba</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <span className={FORM_LABEL_UPPER}>Campo B</span>
                  <Input className={FORM_CONTROL_MD} defaultValue="Misma altura" />
                </div>
              </div>
            </DesignTile>

            <DesignTile
              name="Etiqueta · mayúsculas (formulario modal)"
              where="Perfil, POS — FORM_LABEL_UPPER."
            >
              <div className="flex w-full max-w-xs flex-col gap-2">
                <Label htmlFor="ds-label-upper" className={FORM_LABEL_UPPER}>
                  Etiqueta
                </Label>
                <Input id="ds-label-upper" className={FORM_CONTROL_MD} placeholder="Valor" />
              </div>
            </DesignTile>

            <DesignTile
              name="Acción · texto + icono (sin padding lateral)"
              where="Cambiar foto en Mi perfil — alineado al bloque de nombre y correo."
            >
              <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
                <p className="text-sm font-semibold">Nombre visible</p>
                <p className="text-xs text-muted-foreground">correo@ejemplo.com</p>
                <button
                  type="button"
                  className="mt-2.5 inline-flex items-center gap-2 p-0 text-sm font-medium text-primary"
                >
                  <ImagePlus className="size-4" aria-hidden />
                  Cambiar foto
                </button>
              </div>
            </DesignTile>

            <DesignTile
              name="Etiqueta + campo (cuerpo estándar)"
              where="Login, registro, recuperar contraseña."
            >
              <div className="flex w-full max-w-xs flex-col gap-2">
                <Label htmlFor="ds-label-demo">Etiqueta</Label>
                <Input id="ds-label-demo" placeholder="Valor" />
              </div>
            </DesignTile>

            <DesignTile
              name="Separador"
              where="Login, registro, modales de método de pago."
            >
              <div className="flex w-full max-w-xs flex-col gap-2">
                <span className="text-xs text-muted-foreground">Arriba</span>
                <Separator />
                <span className="text-xs text-muted-foreground">Abajo</span>
              </div>
            </DesignTile>
          </DsSection>

          <DsSection
            id="atoms-badges"
            eyebrow="Átomos"
            title="Insignias"
            description="Variante del componente Badge más usos con estilos ya definidos en pantalla."
          >
            <DsVariantPanel
              title="Variantes del componente"
              description="default, secondary, outline, destructive."
            >
              <DsVariantCell label="default">
                <Badge>Default</Badge>
              </DsVariantCell>
              <DsVariantCell label="secondary">
                <Badge variant="secondary">Secondary</Badge>
              </DsVariantCell>
              <DsVariantCell label="outline">
                <Badge variant="outline">Outline</Badge>
              </DsVariantCell>
              <DsVariantCell label="destructive">
                <Badge variant="destructive">Destructive</Badge>
              </DsVariantCell>
            </DsVariantPanel>

            <DsVariantPanel
              title="En contexto (producto)"
              description="Mismos estilos que Home, Vender y Office."
            >
              <DsVariantCell
                label="estado en tile"
                sublabel="Home · sucursal"
              >
                <Badge className="border-0 bg-black/70 text-[10px] uppercase tracking-wider text-emerald-200">
                  Activo
                </Badge>
              </DsVariantCell>
              <DsVariantCell label="oferta catálogo" sublabel="Vender">
                <Badge className="border border-emerald-400/40 bg-emerald-950/85 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-100 shadow-sm backdrop-blur-sm">
                  OFERTA
                </Badge>
              </DsVariantCell>
              <DsVariantCell label="chip office" sublabel="acceso">
                <Badge
                  variant="outline"
                  className="gap-1 border-amber-500/40 text-[10px] text-amber-800 dark:border-amber-400/40 dark:text-amber-300"
                >
                  Solo owners
                </Badge>
              </DsVariantCell>
            </DsVariantPanel>
          </DsSection>

          <DsSection id="atoms-avatar" eyebrow="Átomos" title="Avatar">
            <DsVariantPanel
              title="Con imagen y respaldo"
              description="Home y cabecera POS."
            >
              <DsVariantCell label="avatar · ring">
                <Avatar className="size-10 ring-2 ring-border">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=francisco" />
                  <AvatarFallback className="bg-primary/15 text-foreground">
                    FR
                  </AvatarFallback>
                </Avatar>
              </DsVariantCell>
            </DsVariantPanel>
          </DsSection>

          <DsSection
            id="molecules"
            eyebrow="Moléculas"
            title="Bloques compuestos"
          >
            <DesignTile
              name="Tarjeta (resumen)"
              where="Office inicio."
            >
              <Card className="w-full max-w-md border-primary/20 bg-primary/5">
                <CardHeader>
                  <div className="mb-1 flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Palette className="size-5" aria-hidden />
                  </div>
                  <CardTitle>UI Kit</CardTitle>
                  <CardDescription>
                    Mismo patrón que la tarjeta principal del Office.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Contenido de apoyo.
                </CardContent>
                <CardFooter>
                  <Button type="button" size="sm">
                    Acción
                  </Button>
                </CardFooter>
              </Card>
            </DesignTile>

            <DesignTile
              name="Menú desplegable de cuenta"
              where="Home."
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    Cuenta
                    <ChevronDown className="size-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>
                    <User className="size-4" />
                    Perfil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive">
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </DesignTile>

            <DesignTile
              name="Diálogo modal"
              where="POS — cliente, comprobante, pago, descuento."
            >
              <Dialog>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline">
                    Abrir ejemplo
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className={cn(
                    "gap-0 overflow-hidden rounded-2xl border border-border/60 bg-card p-0 shadow-2xl ring-1 ring-black/[0.04] dark:ring-white/[0.06] sm:max-w-md",
                  )}
                >
                  <DialogHeader className="space-y-1.5 border-b border-border/50 bg-muted/25 px-6 pb-4 pt-5 text-left">
                    <DialogTitle className="text-base font-semibold tracking-tight">
                      Título del modal
                    </DialogTitle>
                    <DialogDescription className="text-sm leading-relaxed">
                      Descripción breve.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="px-6 py-4 text-sm text-muted-foreground">
                    Cuerpo del contenido.
                  </div>
                  <DialogFooter className="border-t border-border/50 bg-muted/15 px-6 py-3.5 sm:justify-between">
                    <Button
                      type="button"
                      variant="ghost"
                      className={ventaDialogGhostBtn}
                    >
                      Secundario
                    </Button>
                    <Button type="button" className={ventaDialogPrimaryBtn}>
                      Confirmar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </DesignTile>

            <DesignTile
              name="Acordeón"
              where="Landing — preguntas frecuentes."
            >
              <Accordion type="single" collapsible className="w-full max-w-lg">
                <AccordionItem value="ejemplo">
                  <AccordionTrigger>Pregunta de ejemplo</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    Respuesta como en el sitio.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </DesignTile>

            <DesignTile
              name="Carrusel"
              where="Landing — testimonios."
            >
              <Carousel
                opts={{ loop: true, align: "center" }}
                className="w-full max-w-md"
                aria-label="Ejemplo de carrusel"
              >
                <CarouselContent>
                  <CarouselItem>
                    <div className="rounded-xl border border-border/60 bg-muted/30 p-6 text-center text-sm">
                      Diapositiva 1
                    </div>
                  </CarouselItem>
                  <CarouselItem>
                    <div className="rounded-xl border border-border/60 bg-muted/30 p-6 text-center text-sm">
                      Diapositiva 2
                    </div>
                  </CarouselItem>
                </CarouselContent>
              </Carousel>
            </DesignTile>
          </DsSection>

          <DsSection
            id="organisms"
            eyebrow="Organismos"
            title="Piezas de pantalla"
          >
            <DesignTile
              name="Cabecera · punto de venta"
              where="Vender, Cajas, etc."
            >
              <div className="w-full overflow-hidden rounded-2xl border border-border ring-1 ring-black/5 dark:ring-white/5">
                <PopSaleHeader
                  popSlug="demo"
                  title="Ejemplo"
                  isOnline
                  isFullscreen={false}
                  onToggleFullscreen={() => {}}
                  user={{
                    name: "Usuario",
                    role: "Admin",
                    avatarSrc:
                      "https://api.dicebear.com/7.x/avataaars/svg?seed=demo",
                    initials: "U",
                  }}
                  trailingActions={
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="size-9 rounded-xl border-emerald-400/35 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/16 dark:text-emerald-100 dark:hover:text-white"
                      aria-label="Acción extra"
                    >
                      <Plus className="size-4" />
                    </Button>
                  }
                />
              </div>
            </DesignTile>

            <DesignTile
              name="Listado · ítems de menú POS"
              where="Menú circular del punto de venta."
            >
              <div className="flex flex-col items-center gap-2">
                <div className="relative flex size-16 items-center justify-center rounded-[20px] bg-linear-to-br from-emerald-500/90 to-teal-600/90 shadow-md ring-1 ring-white/20">
                  <LayoutDashboard className="size-7 text-white" aria-hidden />
                </div>
                <span className="text-center text-xs font-medium text-foreground/70">
                  Módulo
                </span>
              </div>
            </DesignTile>

            <DesignTile
              name="Ficha · caja registradora"
              where="Cajas."
            >
              <div className="w-full max-w-md rounded-2xl border border-emerald-500/25 bg-card/90 p-5 shadow-lg ring-1 ring-emerald-500/10">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="font-bold">Caja 1</span>
                  <Badge className="border-emerald-400/40 bg-emerald-500/15 text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-200">
                    Abierta
                  </Badge>
                </div>
                <p className="mt-4 text-2xl font-black tabular-nums text-emerald-700 dark:text-emerald-200">
                  $ 0,00
                </p>
                <div className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    Resumen
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="flex-1 bg-foreground text-background"
                  >
                    Cerrar caja
                  </Button>
                </div>
              </div>
            </DesignTile>

            <DesignTile
              name="Bloque · precios (landing)"
              where="Marketing — plan."
            >
              <Card className="w-full max-w-sm border-border/80">
                <CardHeader>
                  <CardTitle>Plan ejemplo</CardTitle>
                  <CardDescription>Descripción corta.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Lista de beneficios.
                </CardContent>
                <CardFooter>
                  <Button type="button" variant="outline" className="w-full">
                    Elegir plan
                  </Button>
                </CardFooter>
              </Card>
            </DesignTile>
          </DsSection>
        </div>
      </div>
    </div>
  )
}
