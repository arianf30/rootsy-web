import Link from "next/link"
import { ArrowRight, Palette, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function OfficeHomePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Administración
        </h1>
        <p className="mt-3 text-muted-foreground">
          Espacio para herramientas internas, métricas y documentación de
          producto. El interruptor{" "}
          <span className="font-medium text-foreground/80">Tema Office</span> en
          la barra lateral aplica claro u oscuro solo mientras navegás acá; al
          salir a otras rutas el producto vuelve al aspecto oscuro habitual.
        </p>
      </header>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="mb-1 flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Palette className="size-5" aria-hidden />
            </div>
            <CardTitle>UI Kit</CardTitle>
            <CardDescription>
              Nombres de piezas y variantes para diseñar alineado a lo que ya
              está en login, landing, cuenta, POS y office.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Referencia solo para diseño: sin especificaciones técnicas de
            implementación.
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/office/design-system" className="gap-2">
                Abrir kit
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="mb-1 flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Shield className="size-5" aria-hidden />
            </div>
            <CardTitle>Próximas secciones</CardTitle>
            <CardDescription>
              Placeholder para páginas de owners (usuarios, billing, flags,
              auditoría).
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Crear nuevos archivos bajo{" "}
            <code className="rounded bg-muted px-1 font-mono text-xs">
              app/office/
            </code>{" "}
            y enlazarlos desde el layout lateral.
          </CardContent>
          <CardFooter>
            <Button variant="secondary" disabled>
              Próximamente
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
