# ZETA — Plan del formulario de contacto interactivo

Hoy el contacto es un formulario clásico con todos los campos juntos ([ContactForm.tsx](components/contact/ContactForm.tsx)). La idea es reemplazarlo por una **experiencia paso a paso**: una pregunta por pantalla, con un input grande, una barra de progreso y recorrido tipo breadcrumb. Que completarlo dé gusto y la persona se explaye.

> Estado: **implementado con placeholders**. El formulario por pasos funciona completo (`components/contact/ContactWizard.tsx`, `DatePicker.tsx`, `PeopleTables.tsx`). Comensales y mesas son formas simples en código; **falta reemplazarlos por el arte final de Illustrator** (sección 5.1). Pendiente además: animación al *sacar* comensales (hoy desaparecen de golpe) y pruebas en celular.

---

## 1. Objetivo

- Una sola pregunta visible a la vez, a pantalla completa, con tipografía grande (la serif del sitio).
- Sensación de conversación, no de trámite: textos cálidos, animaciones suaves, mínimo ruido.
- Que el usuario responda con ganas y deje información útil (fecha, cantidad de personas, qué tiene en mente).
- Mantener lo que ya funciona: envío por `/api/contact` (Resend) y fallback a Instagram si falla.

---

## 2. Flujo de pasos

Orden propuesto (se puede ajustar):

| # | Pregunta | Campo | Tipo de input | Obligatorio |
| --- | --- | --- | --- | --- |
| 1 | ¿Cómo te llamás? | `nombre` | texto | sí |
| 2 | ¿Cómo te contactamos? | `contacto` | email o WhatsApp (un solo campo, se valida que sea uno de los dos) | sí |
| 3 | ¿Qué tipo de evento tenés en mente? | `tipo` | opciones grandes clickeables (Private Dining, Event, Pop Up, Collaboration, Otro) | sí |
| 4 | ¿Para cuándo? | `fecha` | **calendario** (ver sección 4) | no ("Todavía no sé") |
| 5 | ¿Cuántas personas? | `personas` | **mesas con personas** (ver sección 5) | no |
| 6 | Contanos qué tenés en mente | `mensaje` | textarea grande | no |
| 7 | Revisión + enviar | — | resumen de respuestas, editable, botón enviar | — |
| 8 | Gracias | — | pantalla de confirmación | — |

Los datos que viajan al backend son los mismos nombres de campo que hoy (`nombre`, `contacto`, `fecha`, `personas`, `tipo`, `mensaje`), así que [route.ts](app/api/contact/route.ts) casi no cambia.

---

## 3. Navegación y progreso

**Barra de progreso**
- Barra fina arriba (o abajo) que se llena a medida que se avanza. Animación suave al cambiar de paso.
- Contador discreto: `03 / 06`.

**Breadcrumb**
- Fila de pasos clickeables: NOMBRE · CONTACTO · EVENTO · FECHA · PERSONAS · MENSAJE.
- Los pasos ya respondidos quedan marcados y se puede volver a ellos; los que faltan, apagados.
- No se puede saltar adelante a un paso obligatorio sin completar el anterior.

**Controles**
- `Enter` o botón `SIGUIENTE →` avanza. `← VOLVER` retrocede.
- Los pasos opcionales tienen un `SALTEAR`.
- Se conservan las respuestas al ir y volver.

**Transición entre preguntas**
- La pregunta actual sale hacia arriba con fade y la siguiente entra desde abajo (movimiento corto, frenada larga, como `Reveal`). Se puede hacer con GSAP, que ya está en el proyecto.
- Con `prefers-reduced-motion` se reduce a un fade simple.

---

## 4. Calendario (paso FECHA)

- Calendario propio, mes a mes, estilo del sitio (papel/tinta, sin colores nuevos). Se prefiere hacerlo a mano antes que sumar una librería pesada.
- Flechas para cambiar de mes; los días pasados aparecen deshabilitados.
- Selección de un día; al elegir, se muestra la fecha escrita en grande ("Sábado 14 de marzo").
- Botón **"Todavía no sé"** para dejar la fecha abierta.
- **Decidido:** por ahora no se marcan fechas ocupadas. Todos los días futuros están disponibles.
- Debe poder usarse con teclado (flechas para moverse entre días, Enter para elegir).

---

## 5. Cantidad de personas (paso PERSONAS)

Una interfaz **interactiva y divertida para ir poniendo gente**: la persona suma comensales y ve cómo se arma la mesa. **No hay máximo de personas.**

**Cómo evoluciona la mesa**
1. Arranca con una **mesa redonda** y pocos comensales alrededor.
2. A medida que se suma gente, la mesa **crece y se transforma**: la redonda pasa a ser una **mesa rectangular larga**, tipo quincho.
3. Con más personas, la rectangular se alarga y después se agregan **varias filas de mesas** (como un banquete o evento grande).
4. Para cantidades muy altas la escena se acerca/aleja (zoom out) para que siempre entre completa en pantalla, y cada comensal se achica.

Umbrales orientativos (a afinar al probarlo):

| Personas | Escena |
| --- | --- |
| 1–8 | Una mesa redonda; cada comensal ocupa una silla |
| 9–14 | La redonda se estira hasta una mesa ovalada / rectangular chica |
| 15–40 | Una mesa rectangular larga, que se alarga con cada persona |
| 40+ | Varias filas de mesas rectangulares, con zoom out progresivo |

**Interacción**
- Botones `−` / `+` (mantener apretado para sumar rápido), y un campo numérico para escribir una cantidad exacta (ej. 120) sin tener que apretar 120 veces.
- Cada comensal nuevo **aparece sentado con una animación** (pop + leve rebote); los comensales con pequeñas variaciones (pelo, ropa, colores) para que se vea vivo y no repetido.
- Al sacar gente, se van de a uno con animación inversa.
- Número grande con la cantidad, que cuenta animado.
- Opción "No sé todavía".

**Animaciones: en código** (GSAP, ya instalado). Las hago yo; solo hace falta que el material gráfico esté bien preparado.

**Lo que falta diseñar (Illustrator + IA de Illustrator)**
Ver el detalle en la sección 5.1.

### 5.1 Brief de ilustración para Illustrator

Lo que hay que producir son piezas sueltas en vector; las animaciones y la lógica se arman después en código.

**Estilo común**
- Vista **cenital (desde arriba)** para mesas y sillas, con los comensales vistos desde arriba o en 3/4 muy simple. Elegir una sola vista y mantenerla en todo.
- Estilo lineal o plano de pocos colores, a tono con el sitio: tinta `#0E0E0E`, papel `#F4F1EB`, grises `#8A8783` y `#D9D6D0`. Se puede sumar un solo color de acento si hace falta (por ejemplo, el de las especias).
- Trazos limpios y de grosor parejo, formas simples, que se lean bien chicas (en eventos grandes cada comensal mide pocos píxeles).

**Piezas a entregar**
1. **Mesa redonda**: vista cenital, con mantel o platos opcionales.
2. **Mesa rectangular** de quincho, que se pueda **estirar sin deformar** (ver nota técnica) y en versión de **módulo repetible** (un tramo de mesa) para alargarla.
3. **Silla** (cenital), en versión para rodear la redonda y para alinear a los costados de la rectangular.
4. **Comensales**: set de **8–12 variaciones** (distinto pelo, ropa, tono de piel, algún accesorio), todos sentados y con el mismo punto de anclaje, para poder asignarlos al azar.
5. **Extras divertidos** (opcionales): platos, copas, botellas, una parrilla/fuego para el quincho, algo de "chispa" por comensal nuevo.

**Cómo usar la IA de Illustrator**
- **Generative Shape Fill / Text to Vector Graphic**: para generar comensales y mesas a partir de una descripción. Prompt de partida (ajustar en inglés si rinde mejor):
  - *"Top-down view of a round dining table with chairs, minimalist flat vector illustration, black ink line on off-white background, clean uniform strokes, no gradients."*
  - *"Set of 10 simple seated diner characters seen from above, different hair and clothing, flat vector, limited palette black, grey and off-white, consistent style."*
  - *"Long rectangular communal table, top view, rustic quincho style, with benches on both sides, minimalist flat vector."*
- Generar varias opciones, **elegir una y repetir su estilo** en el resto (usar la primera como referencia de estilo para que las piezas hagan juego).
- Después de generar, **limpiar a mano**: unir formas, simplificar nodos, unificar grosores y colores. Lo que sale de la IA suele necesitar retoque antes de animarse.

**Requisitos técnicos para poder animar en código**
- Entrega en **SVG**, un archivo por pieza (o un solo SVG con grupos bien nombrados).
- **Cada comensal, silla y mesa en su propio grupo** con un `id` claro (`diner-01`, `chair`, `table-round`, `table-rect-module`...).
- Mismo **tamaño de lienzo y punto de anclaje** en todos los comensales y sillas, así se posicionan por código sin ajustes.
- Sin efectos raster, sin degradados complejos, sin texto convertido ni máscaras innecesarias: hacen el SVG pesado y difícil de animar.
- Exportar con **"Responsive"** activado y con ids/estilos limpios (Opciones SVG → ids de capas, estilos "presentation attributes").
- Verificar la **licencia comercial** de la IA generativa de Illustrator (Adobe Firefly) y de cualquier recurso externo, ya que el sitio es comercial.

**Si no se llega a tiempo**: se puede arrancar con formas geométricas simples hechas en código (círculos y rectángulos) como placeholder, y reemplazarlas por el arte final cuando esté.

---

## 6. Pantalla de revisión y confirmación

- Antes de enviar, un resumen con todas las respuestas, cada una con un `EDITAR` que vuelve a ese paso.
- Botón `ENVIAR CONSULTA`; estado "ENVIANDO…".
- Éxito: mensaje cálido ("Recibido. Te escribimos pronto.") con una animación breve.
- Error: mantiene todas las respuestas y muestra el fallback ya existente: `Algo falló. Probá por Instagram: @{site.ig}`.

---

## 7. Aspectos técnicos

- **Componentes** (propuesta, en `components/contact/`):
  - `ContactWizard` — controla el paso actual, las respuestas y el envío.
  - `StepShell` — marco común de cada pregunta (título, input, controles).
  - `ProgressBar` y `Breadcrumb`.
  - `DatePicker` — el calendario.
  - `PeopleTables` — las mesas con personas.
  - `ReviewStep`.
- Estado en React (un objeto con las respuestas); no hace falta librería extra.
- Animaciones con GSAP (ya instalado).
- Mismo envío por `POST /api/contact`. Agregar en el backend validación básica de campos obligatorios, que hoy no existe.
- Se puede guardar un borrador en `sessionStorage` por si la persona recarga o vuelve atrás (opcional).
- Mobile primero: una pregunta por pantalla funciona muy bien en celular; el input tiene que quedar visible con el teclado abierto.

**Accesibilidad**
- Un `<form>` real con labels asociados; foco automático en el input de cada paso.
- Avisar a lectores de pantalla el cambio de pregunta y el progreso (`aria-live`).
- Todo operable con teclado, incluido el calendario y las mesas.
- Respetar `prefers-reduced-motion`.

---

## 8. Plan de trabajo

1. **Ilustración de mesas y comensales** (en paralelo a todo lo demás): diseñarlas en Illustrator con su IA, según el brief de la sección 5.1.
2. Armar el esqueleto del wizard con los pasos de texto simples (nombre, contacto, tipo, mensaje), barra de progreso, breadcrumb y navegación.
3. Transiciones entre pasos.
4. Calendario.
5. Mesas con personas: primero con formas simples como placeholder, y después con el arte final cuando esté el SVG.
6. Pantalla de revisión, envío y estados de error/éxito.
7. Validación en el backend.
8. Pruebas en celular y con teclado, y revisión de accesibilidad.

---

## 9. Decisiones y preguntas abiertas

**Decidido**
- No se marcan fechas ocupadas en el calendario (por ahora).
- No hay máximo de personas.
- Las mesas arrancan redondas y, al sumar gente, pasan a rectangulares largas y luego a varias filas.
- Las animaciones se programan en código; el arte (mesas y comensales) se diseña en Illustrator con ayuda de su IA.

**Abiertas**
- ¿El orden de pasos y los textos de cada pregunta están bien, o se quiere otro tono (más formal / más casual)?
- ¿Cuántos lugares tiene la mesa redonda antes de pasar a la rectangular (propuesto: 8)?
- ¿Se quiere sonido (los tics del índice) o animaciones solamente?
- ¿Se pide el contacto como un solo campo (email o WhatsApp) o conviene separarlos?
