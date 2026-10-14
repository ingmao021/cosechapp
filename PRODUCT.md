# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users
Caficultor colombiano (foco inicial: finca piloto en Nariño) que administra una finca con un celular Android. Alfabetización digital variable, en algunos casos baja. A veces comparte la cuenta con un familiar (por ejemplo, un hijo) desde otro teléfono. Es el único rol: los recolectores no usan la app.

## Product Purpose
Reemplazar el cuaderno de papel de la recolección de café: registrar pesadas por recolector, calcular y pagar lo que se le debe a cada uno (con descuento de alimentación), registrar la venta y los costos, y mostrar la ganancia real de cada cosecha. Éxito: el caficultor deja el cuaderno, no se equivoca en los pagos y sabe cuánto ganó.

## Positioning
Una sola app que combina pesadas ilimitadas por día, alimentación como descuento, cosechas con el nombre que el caficultor elija, ganancia en dos niveles (bruta y real) y funcionamiento sin señal. Resuelve pagar y contabilizar la cosecha, no conseguir recolectores (eso lo hace RECO de la FNC).

## Operating Context
- Se usa en el cafetal al momento de pesar, muchas veces sin señal y a pleno sol; también en la finca al cerrar el día o la cosecha.
- Las pesadas se guardan en el teléfono y se envían solas al volver la señal.
- Vocabulario propio: cosecha, pasón, mitaca, cuadrilla, recolector, pesada, kilos cereza y kilos secos, alimentación, liquidación.
- Moneda COP con formato colombiano (punto de miles, coma decimal).

## Capabilities and Constraints
- Login con cédula y contraseña, sin verificación de correo ni teléfono.
- Una sola cosecha activa a la vez; al cerrarla se le paga a todos y pasa al historial.
- Cuadrillas, catálogo de trabajadores, "pagar ahora", proyección de kilos secos, venta, costos de producción, ganancia.
- Precio oficial de la FNC con notificación de cambio; noticias del café elegidas con IA.
- App Ionic + Angular empaquetada con Capacitor, solo Android. Backend NestJS en Render.

## Brand Commitments
- Nombre: CosechApp. Voz en español colombiano, cercana y directa, en oración (sin mayúsculas sostenidas).
- Logo (`src/assets/brand/logo.png`) y el arranque con fondo de café y costal (`splash-bg.webp`, `splash-sack.webp`) se conservan.
- Verde de marca `#32591B` como color principal.
- Tema claro único: se usa a pleno sol. Sin modo oscuro.

## Evidence on Hand
PRD en `wiki/PRD_ES.md` con investigación de fuentes secundarias (FNC, Cenicafé, prensa). No hay testimonios, clientes ni métricas reales: no se deben inventar.

## Product Principles
1. Datos reales o nada: nunca mostrar valores de ejemplo como si fueran reales.
2. Funciona sin señal: cada acción de campo debe poder hacerse offline y decir qué queda pendiente.
3. Más claro que el cuaderno: las cifras importantes (kilos, saldo, ganancia) se leen de un vistazo.
4. Simple para cualquiera: pocos pasos, textos llanos, botones grandes.

## Accessibility & Inclusion
Usuarios con baja alfabetización digital y uso a pleno sol: contraste alto, objetivos táctiles de al menos 48dp, etiquetas siempre visibles y textos simples.
