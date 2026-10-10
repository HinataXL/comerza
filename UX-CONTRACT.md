# Contrato del flujo de cotización de Taller

Este documento describe el comportamiento implementado en este flujo, no establece
políticas fiscales ni reemplaza las reglas del negocio.

## Fuentes

- `WorkOrder`, `WorkOrderItem` y `WorkOrderItemType`: campos y tipos de conceptos.
- `WorkOrderQuoteRequest` y `WorkOrderQuoteService`: validación, cantidades enteras,
  precios y descuentos con dos decimales, cálculo de importes y aislamiento por taller.
- `WorkOrderStatusService` y `PublicTallerService`: estados y autorización existente.
- `PublicTokenService`: expiración y revocación de enlaces.
- `WorkOrderService.createSaleFromWorkOrder`: conversión a venta e inventario.

## Propiedad de los elementos

| Capacidad | Responsable | Comportamiento |
| --- | --- | --- |
| Editor | `WorkOrderQuote` | Borrador local y guardado explícito dentro de la orden |
| Campos | `.form-input` | Labels asociados, errores en español, validación propia |
| Selects | Select nativo | Tipo e inventario con popup del navegador |
| Feedback | Editor y aviso de la orden | Error persistente; éxito anunciado con `role=status` |
| Confirmación | `DialogProvider` | Descartar borrador con foco inicial en seguir editando, Escape y foco contenido |
| Envío | `OrdenDetailClient.handleSendQuote` | Guarda primero; pasa a espera de autorización y abre WhatsApp |
| Totales | `WorkOrderQuoteService` | Servidor recalcula y no acepta subtotales del cliente |

## Guardado

Los conceptos admiten repuestos, servicios, mano de obra y otros conceptos. Los
repuestos pueden vincularse al inventario del taller o registrarse como externos.
El subtotal suma importes después de los descuentos de cada concepto. El total resta
el descuento general y suma el importe de impuestos introducido por el usuario.
Guardar no consume inventario. Se conserva el flujo existente al autorizar los trabajos.

Se permite editar antes de autorizar: recepción, diagnóstico y espera de autorización.
Las órdenes aprobadas, con venta o en fases posteriores son de consulta. Cada guardado
invalida los enlaces anteriores de aprobación. El usuario debe enviar un enlace nuevo.

El borrador permanece al cambiar de pestaña. Se pide confirmar antes de abandonar el
editor mediante un enlace interno. Al cerrar la página se usa la protección de salida
del navegador. Una petición fallida conserva los campos y explica cómo reintentar.
Un conflicto con una orden modificada devuelve 409; el editor
no sobrescribe esos cambios y pide recargar. El servidor bloquea la orden mientras
guarda o autoriza para que ambos flujos no modifiquen importes simultáneamente.

## Envío

No se envían borradores sin guardar ni cotizaciones vacías. Desde recepción o diagnóstico,
«Enviar cotización» mueve la orden a espera de autorización mediante el flujo existente.
La ventana de WhatsApp se abre al pulsar; se cierra si falla la preparación. Sin teléfono
se permite elegir destinatario. El mensaje contiene la URL de autorización con el origen
desde el que se abrió Comerza. El usuario confirma el envío dentro de WhatsApp.

## Verificación

Las pruebas del servicio cubren totales decimales, descuentos excesivos, versiones
obsoletas, restricciones por estado, aislamiento por taller e invalidación de enlaces.
Las comprobaciones de interfaz deben cubrir borrador vacío, conceptos, errores de
guardado, navegación entre pestañas, teclado y vista móvil.

## Dashboard de Taller

La ruta `/dashboard/taller` muestra Resumen y conserva Tablero como vista alternativa.
La fuente de datos sigue siendo `/api/taller/work-orders`, autorizada por el servidor.
La sesión ausente o vencida dirige a login. Una petición fallida no se presenta como
un taller vacío y puede reintentarse; una actualización fallida conserva las órdenes
ya cargadas. Actualizar y cambiar de etapa no se ejecutan simultáneamente.

Los períodos se calculan en la zona horaria del navegador: Día desde medianoche,
Semana los últimos siete días y Mes desde el primer día hasta el momento actual.
Se excluyen cancelaciones y fechas futuras. Cotizaciones agrupa el importe de órdenes
por fecha de creación; Trabajos entregados agrupa por `deliveredAt` y usa
`approvedTotal` cuando existe. No se identifica ese valor como dinero cobrado.
Los importes se suman en centavos y se muestran en GTQ con formato `es-GT`.
Los filtros temporales y la vista elegida son controles de exploración locales.

El gráfico de estados incluye las siete etapas activas, incluso Aprobado. La actividad
ordena las órdenes por última actualización; cada enlace abre su detalle. «Listas para
entregar» muestra órdenes READY y no inventa citas ni fechas de entrega previstas.
«Registrar vehículo», «Nueva orden» y «Ver todas» usan las rutas existentes.

El tablero permite arrastrar órdenes o elegir una etapa mediante select nativo. El
servidor valida cada transición; el tablero ofrece únicamente los destinos permitidos.
Autorizar presencialmente e iniciar reparación, o marcar una orden entregada, requiere
confirmación del diálogo compartido. Una petición fallida conserva la etapa anterior.
El select usa el popup del sistema operativo; no se exige una geometría propia.

### Canonical UI Map del dashboard

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
| --- | --- | --- | --- | --- |
| Select/Listbox | Select nativo con label del módulo Taller | Transiciones de WorkOrderStatusService y este contrato | Nativo para mover órdenes y conceptos | Popup y teclado en navegador |
| Scrollbar | globals.css y variante taller-dashboard.css | Tokens de la ruta | Riel, actividad y tablero; desplazamiento visible | Medidas y vista móvil |
| Toast | Avisos inline del módulo y DialogProvider | Este contrato | Error persistente, role=status, confirmación | Fallo, éxito, Escape y foco |
| CRUD | Rutas existentes de Taller y WorkOrderStatusService | API y este contrato | Consulta, registro y cambio de etapa | Navegación y cambio de estado |

El título de la ruta es «COMERZA — Dashboard de Taller». Sidebar y Topbar conservan
el filtrado por funciones del comercio y la navegación existente. El menú abierto
contiene el foco, cierra con Escape, restaura el foco e inhabilita el fondo.
