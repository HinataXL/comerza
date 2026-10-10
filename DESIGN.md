---
version: alpha
name: Comerza
description: Panel de operaciones para ventas y órdenes de taller.
colors:
  primary: "#6366f1"
  background: "#f4f6fb"
  surface: "#ffffff"
  text: "#111827"
  secondaryText: "#6b7280"
  border: "#e5e7eb"
  danger: "#ef4444"
  success: "#10b981"
typography:
  body:
    fontFamily: "Space Grotesk, Outfit, system-ui, sans-serif"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
omitted:
  - section: spacing
    reason: El proyecto usa medidas locales; no existe una escala global de espaciado.
components:
  button:
    source: "apps/web/src/app/globals.css (.btn)"
  input:
    source: "apps/web/src/app/globals.css (.form-input)"
---

# Comerza

## Overview

Interfaz de trabajo para negocios que registran ventas y gestionan vehículos en taller.
La referencia de la cotización es una hoja de trabajos: conceptos legibles, cantidades,
precios e importes alineados, con un total fácil de revisar. La claridad del presupuesto
prevalece sobre adornos. El idioma del módulo es español y la moneda existente es GTQ.

## Colors

Los valores documentados reflejan el sistema existente. La fuente canónica es
`apps/web/src/app/globals.css`: primary corresponde a `--accent`, background a
`--bg-base`, surface a `--bg-surface`, text a `--text-primary`, secondaryText a
`--text-secondary`, border a `--border`, danger a `--danger` y success a `--success`.
Los componentes consumen esas variables directamente; este documento no genera CSS.
Los mensajes de error usan texto oscuro sobre `--danger-bg` y explicación textual.

## Typography

Conservar las fuentes existentes. Usar números tabulares para cantidades monetarias
y formato `es-GT` para GTQ. Los títulos identifican la tarea, sin textos promocionales.

## Layout

La orden conserva sus pestañas, área principal y resumen lateral. Cada concepto de
cotización es un grupo con campos etiquetados. En pantallas estrechas, los campos se
distribuyen en dos columnas y el resumen pasa debajo de los ajustes. El documento
mantiene el desplazamiento natural; los borradores sobreviven al cambio de pestaña.

## Elevation & Depth

Conservar `--shadow-xs` en las tarjetas existentes. Los conceptos usan borde,
sin sombras adicionales que compitan con el resumen de la orden.

## Shapes

Los grupos de conceptos usan `--radius-md`; los avisos usan `--radius-sm`.

## Components

Botones e inputs reutilizan `.btn` y `.form-input`. Los selects del módulo conservan
el comportamiento nativo del navegador, con labels asociados y foco visible.
El dueño de la edición es `WorkOrderQuote`; el envío sigue en `OrdenDetailClient`.
Los errores permanecen junto al editor; el guardado se anuncia con `role=status`.
Los botones de edición se deshabilitan durante el guardado y tras la autorización.

## Do's and Don'ts

Conservar los datos al fallar una petición. Mostrar descuentos como importes en Q,
sin inferir tasas fiscales. No alterar una cotización aprobada ni enviar cambios
que todavía no se han guardado. No rediseñar otras pantallas para este módulo.
