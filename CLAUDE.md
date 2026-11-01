# Contexto del proyecto — Sitio web Almacén HyundaiKia S.A.S

## La necesidad (en una frase)

**Atraer compradores y vender repuestos para carros, principalmente HYUNDAI y KIA.**
Hyundai y Kia son las marcas principales (especialidad y nombre del almacén), pero **también se venden repuestos de otras marcas**: el sitio no debe dar a entender que solo atienden Hyundai/Kia.
Cada decisión del sitio se mide contra esto: ¿trae más búsquedas orgánicas o más conversaciones de WhatsApp que terminan en venta?

## El negocio

- **Razón social:** ALMACEN HYUNDAIKIA S.A.S — NIT 900.690.717-6
- **Desde:** 10 de enero de 2014 (12+ años en el mercado). Microempresa, punto de venta único.
- **Actividad:** comercio de autopartes y accesorios (CIIU G4530).
- **Dirección:** Av. Palacé #38-115, La Candelaria, Medellín (en registros oficiales figura como Carrera 50 #38-115 — es la misma vía; usar **una sola forma** en web, Google Maps y directorios).
- **Contacto:** WhatsApp/Cel 310 830 7228 · PBX 604 444 1961 · hyundaikia@outlook.com
- **Horario:** L–V 8:00–18:00 · Sáb 8:00–14:00
- **Cobertura:** venta en mostrador + domicilios en Medellín y Valle de Aburrá.

## Clientes objetivo

1. **Talleres mecánicos** del Valle de Aburrá (compra recurrente, volumen).
2. **Dueños de Hyundai / Kia** que buscan un repuesto puntual en Google desde el celular.

Ambos terminan la compra por **WhatsApp**: piden referencia, modelo/año (idealmente VIN), y se les confirma disponibilidad y precio.

## Productos

Especialidad en repuestos originales Hyundai y Kia, y venta de repuestos para otras marcas bajo pedido/consulta: motor y sincronización (kits, correas, bujías), suspensión y rodamiento (amortiguadores, bocines, bujes), eléctrico e iluminación (luces, exploradoras, espejos, módulos), baterías.
Modelos con más demanda a priorizar en contenido: Tucson / IX35, Santa Fe, Accent, i10, Staria, Picanto, Rio, Cerato, Sportage, Sorento, Soul.

## Objetivos del sitio

- **Crecimiento orgánico:** aparecer en Google para "repuestos Hyundai Medellín", "repuestos Kia Medellín" y búsquedas por modelo + repuesto (prioridad); en segundo plano, "repuestos para carros Medellín / La Candelaria / Palacé" para captar otras marcas.
- **Otras marcas:** incluir en el sitio un mensaje y CTA tipo "¿Tu carro es de otra marca? Escríbenos y te lo conseguimos" (el buscador de WhatsApp debe permitir "Otra marca").
- **Conversión a WhatsApp:** todo CTA lleva a `wa.me/573108307228` con mensaje prellenado (marca, modelo/año, repuesto).
- **Medición:** cada clic a WhatsApp debe registrarse como evento en Analytics.

## Competencia

- **Almacén Hyunkia** (almacenhyunkia.com, Cra 43A #19A-87, WhatsApp 314 623 5701): nombre muy parecido — riesgo de confusión; diferenciarse con NIT, dirección en Palacé y "desde 2014". Su SEO es de baja calidad (keyword stuffing, una sola página), pero nombra modelos concretos.
- **C3 Care Car Center:** domina Google con muchos artículos de blog sobre repuestos Hyundai/Kia en Medellín.
- Concesionarios oficiales (Car Hyundai, Kia Medellín) para repuesto de concesionario.

## Estado técnico (oct-2026)

- Sitio estático en GitHub Pages: https://edtabares-coet.github.io/almacen-hyundaikia/ (repo `edtabares-coet/almacen-hyundaikia`, rama `main`, raíz).
- `index.html` (una página, ~35 KB) + imágenes optimizadas en `img/`; `assets/` guarda las imágenes fuente en alta resolución.
- Hecho (Paso 1, nov-2026): `<head>` real con viewport, título, description, canonical y Open Graph; favicon; `sitemap.xml` y `robots.txt`; botón flotante de WhatsApp; opción "Otra marca" en el buscador; eventos `whatsapp_click` / `phone_click`.
- Pendiente:
  - **Analytics:** el código está listo pero inactivo hasta poner el ID de GA4 en la variable `GA_ID` de `index.html`.
  - Canonical, sitemap y Open Graph apuntan a la URL de GitHub Pages; cambiarlos cuando haya dominio propio.
  - Convertir imágenes a WebP (no hay herramienta instalada en el equipo).
  - Revisar la afirmación "Distribuidor autorizado" con el cliente (debe ser verificable).

## Ficha de Google (Google Business Profile)

- Nombre en Maps: "HYUNDAIKIA SAS" · categoría "Tienda de repuestos para automóviles" · 4,5 ★ (33 reseñas, oct-2026).
- Enlace estable: https://www.google.com/maps?cid=13270207349620666020 (usado en el sitio y en el schema).
- **No está reclamada** (aparece "Reclamar esta empresa"): el dueño debe reclamarla con su cuenta de Google.
- Su sitio web apunta a `tarjetainfo.com` (tercero) y su teléfono es el PBX; cambiar a la URL del sitio y agregar WhatsApp.
- Horario coincide con el sitio. Si cambia la calificación, actualizar el chip "4,5 en Google" del hero.

## Hoja de ruta

1. **Base técnica:** `<head>` real, viewport, botón flotante WhatsApp, Analytics con evento de clic, imágenes como archivos WebP, sitemap/robots.
2. **SEO local:** Perfil de Empresa en Google (categoría, fotos, horario, reseñas de talleres), dominio propio, directorios con NAP idéntico.
3. **Contenido:** una página por modelo y por categoría de repuesto, cada una con CTA de WhatsApp prellenado; FAQ con schema.
4. **WhatsApp Business:** catálogo, respuestas rápidas, pedir VIN para cotizar.

## Convenciones

- Idioma del sitio y de la documentación: español (Colombia).
- Mantener el sitio estático y sin dependencias de build (solo Google Fonts).
- No publicar en el repo información financiera, de socios ni el informe comercial de la empresa (el repo es público).
- Cambios en ramas; `main` es lo que publica GitHub Pages.
