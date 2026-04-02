import type { Metadata } from "next"

import { DesignSystemView } from "@/components/office/design-system-view"

export const metadata: Metadata = {
  title: "UI Kit — Office",
  description:
    "Kit de interfaz para diseño: nombres de componentes y variantes alineados a las pantallas ya construidas.",
  robots: "noindex, nofollow",
}

export default function OfficeDesignSystemPage() {
  return <DesignSystemView />
}
