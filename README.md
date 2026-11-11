# ZETA — Web Portfolio

Sitio web / portfolio de **ZETA — Damián Lezcano**: cenas privadas, eventos, pop ups y colaboraciones gastronómicas en Buenos Aires.

Es un sitio editorial, minimalista y en español, con una estética de revista de cocina: tipografía serif grande, mucho aire y transiciones que imitan el pasaje de una hoja.

> **Estado:** en desarrollo. Las fotos de los proyectos son placeholders hasta que se carguen las reales (ver [Agregar fotos](#agregar-fotos-reales)).

---

## Tabla de contenidos

- [Características](#características)
- [Tecnologías y librerías](#tecnologías-y-librerías)
- [Requisitos](#requisitos)
- [Primeros pasos](#primeros-pasos)
- [Scripts disponibles](#scripts-disponibles)
- [Variables de entorno](#variables-de-entorno)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Cómo está organizado el código](#cómo-está-organizado-el-código)
- [Guía de edición](#guía-de-edición)
- [Detalles de diseño e interacción](#detalles-de-diseño-e-interacción)
- [Checklist antes de publicar](#checklist-antes-de-publicar)
- [Deploy](#deploy)
- [Solución de problemas](#solución-de-problemas)

---

## Características

- **Páginas:** Inicio, Trabajos (listado), detalle de cada proyecto, Sobre mí y Contacto.
- **Transición tipo revista:** al cambiar de página, una hoja de papel tapa la pantalla, cambia la ruta y se da vuelta sobre su lomo para revelar la página nueva.
- **Scroll al inicio:** tocar el link de la página en la que ya estás sube lentamente hasta arriba, con aceleración suave.
- **Header de vidrio:** al scrollear, la barra de navegación toma un fondo de vidrio esmerilado que se invierte solo (vidrio negro con texto blanco sobre fondos oscuros, vidrio claro con texto negro sobre fondos claros).
- **Formulario de contacto** que envía las consultas por mail (Resend) a través de un endpoint propio.
- **SEO:** metadatos, Open Graph, `sitemap.xml` y `robots.txt` generados automáticamente.
- **Imágenes optimizadas** (AVIF/WebP) con `next/image`.
- **Responsive:** pensado primero para celular, con menú a pantalla completa.

---

## Tecnologías y librerías

| Tecnología | Versión | Para qué se usa |
| --- | --- | --- |
| [Next.js](https://nextjs.org/) (App Router) | 14.2 | Framework: rutas, renderizado, imágenes, fuentes, API |
| [React](https://react.dev/) | 18.3 | Interfaz de usuario |
| [TypeScript](https://www.typescriptlang.org/) | 5.9 | Tipado estático |
| [Tailwind CSS](https://tailwindcss.com/) | 3.4 | Estilos con clases utilitarias |
| [PostCSS](https://postcss.org/) + [Autoprefixer](https://github.com/postcss/autoprefixer) | 8 | Procesamiento de CSS y prefijos de navegador |
| [Resend](https://resend.com/) | API REST | Envío de mails del formulario (sin SDK, con `fetch`) |
| [Google Fonts](https://fonts.google.com/) vía `next/font` | — | **Instrument Serif** (títulos) e **Inter** (texto) |

**Dependencias de ejecución:** `next`, `react`, `react-dom`.
**Dependencias de desarrollo:** `typescript`, `@types/node`, `@types/react`, `tailwindcss`, `postcss`, `autoprefixer`.

No se usan librerías de animación ni de UI: las transiciones y el scroll suave están hechos con la **Web Animations API** y `requestAnimationFrame` (ver [`PageTransition.tsx`](components/layout/PageTransition.tsx) y [`lib/scrollToTop.ts`](lib/scrollToTop.ts)). Menos peso y menos dependencias que mantener.

---

## Requisitos

- **Node.js 18.17 o superior** (recomendado: la versión LTS actual).
- **npm** (viene con Node).
- **Conexión a internet** la primera vez que se hace `npm run build`, porque Next descarga las tipografías de Google Fonts en tiempo de compilación.

---

## Primeros pasos

```bash
# 1. Instalar dependencias
npm install

# 2. (Opcional) configurar el envío de mails
cp .env.example .env.local
# y completar RESEND_API_KEY y CONTACT_TO

# 3. Levantar el servidor de desarrollo
npm run dev
```

Abrí <http://localhost:3000>. Los cambios se reflejan en el navegador al guardar.

> En Windows (PowerShell) el paso 2 es: `Copy-Item .env.example .env.local`

---

## Scripts disponibles

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con recarga automática |
| `npm run build` | Compila la versión optimizada para producción |
| `npm run start` | Sirve la versión compilada (hay que correr `build` antes) |
| `npx tsc --noEmit` | Revisa los tipos de TypeScript sin generar archivos |

---

## Variables de entorno

Se definen en un archivo `.env.local` (nunca se sube al repositorio). La plantilla está en [`.env.example`](.env.example).

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `RESEND_API_KEY` | No | API key de [Resend](https://resend.com/) para enviar mails |
| `CONTACT_TO` | No | Dirección que recibe las consultas del formulario |

**Sin estas variables el sitio funciona igual:** las consultas del formulario no se envían por mail, solo se imprimen en la consola del servidor. Esto es útil para desarrollar.

> El remitente actual es `onboarding@resend.dev` (el de pruebas de Resend). Para producción conviene verificar un dominio propio en Resend y cambiar el campo `from` en [`app/api/contact/route.ts`](app/api/contact/route.ts).

---

## Estructura del proyecto

```text
zeta-web/
├── app/                          Rutas (cada carpeta es una URL)
│   ├── layout.tsx                Estructura común: fuentes, header, footer, transición
│   ├── page.tsx                  Inicio (/)
│   ├── globals.css               Estilos globales y clases propias (.meta, .h-xl, .rv)
│   ├── about/page.tsx            Sobre mí (/about)
│   ├── contact/page.tsx          Contacto (/contact)
│   ├── work/
│   │   ├── page.tsx              Listado de trabajos (/work)
│   │   └── [slug]/page.tsx       Detalle de un proyecto (/work/pulpo, …)
│   ├── api/contact/route.ts      Endpoint que recibe el formulario
│   ├── robots.ts                 robots.txt
│   └── sitemap.ts                sitemap.xml
│
├── components/                   Piezas de interfaz, agrupadas por tema
│   ├── layout/                   Header, MobileMenu, Footer, NavLink, PageTransition
│   ├── ui/                       Piezas genéricas reutilizables: Photo, Reveal
│   ├── home/                     Secciones del inicio: Hero, SelectedWork, Services, ContactCta
│   ├── projects/                 ProjectEntry, ProjectGallery, ProjectMeta
│   └── contact/                  ContactForm
│
├── content/                      Datos del sitio (se edita acá, no en los componentes)
│   ├── projects.ts               Proyectos, galería genérica y tipos
│   ├── services.ts               Servicios del inicio
│   ├── site.ts                   URL, Instagram, título y descripción
│   └── navigation.ts             Links del menú
│
├── hooks/
│   └── useScrollState.ts         Scroll del usuario y color del fondo bajo el header
│
├── lib/
│   └── scrollToTop.ts            Animación de subida lenta al inicio
│
├── public/                       Archivos estáticos (fotos, og.jpg, favicon)
├── .env.example                  Plantilla de variables de entorno
├── next.config.js                Formatos de imagen (AVIF/WebP)
├── tailwind.config.ts            Colores y tipografías del diseño
├── postcss.config.js
└── tsconfig.json                 Incluye el alias `@/` que apunta a la raíz
```

---

## Cómo está organizado el código

El criterio es **una responsabilidad por archivo** y **agrupar por tema**, pensando en que el sitio puede crecer.

- **`app/` solo ensambla.** Las páginas arman la pantalla con componentes y datos; casi no tienen lógica propia.
- **`components/` se divide por función:**
  - `layout/` es lo que aparece en todas las páginas.
  - `ui/` son piezas sin lógica de negocio, reutilizables en cualquier lado.
  - El resto (`home/`, `projects/`, `contact/`) agrupa componentes por sección o funcionalidad. Una sección nueva (por ejemplo un blog) tendría su propia carpeta `components/blog/` y su archivo `content/blog.ts`, sin tocar lo existente.
- **`content/` separa los datos de la presentación.** Cambiar un texto, un servicio o agregar un proyecto no requiere tocar componentes.
- **`hooks/` y `lib/`** guardan lógica reutilizable que no es visual.
- **Imports con alias `@/`:** `import Photo from '@/components/ui/Photo'` funciona desde cualquier carpeta, así mover archivos no rompe rutas relativas.

---

## Guía de edición

### Agregar un proyecto nuevo

Editá [`content/projects.ts`](content/projects.ts) y sumá un objeto al array `projects`:

```ts
{
  slug: 'mi-proyecto',        // la URL será /work/mi-proyecto
  n: '009',                   // número que se muestra en pantalla
  title: 'MI PROYECTO',
  type: 'PRIVATE DINING',
  date: 'NOV 2026',
  place: 'BUENOS AIRES',
  guests: '12 GUESTS',        // opcional
  lines: ['Entrada.', 'Principal.', 'Postre.'],
  context: 'Texto editorial opcional.',   // opcional
  layout: 'full',             // 'full' | 'asym' | 'pair' (cómo se ve en el inicio)
}
```

El proyecto aparece solo en el inicio, en `/work`, en su propia página y en el `sitemap.xml`.

### Agregar fotos reales

1. Poné el archivo en `public/projects/<slug>/nombre.jpg`.
2. En `content/projects.ts`, dentro del proyecto, definí `images` con un `src` por foto. El `kind` indica qué foto va en cada lugar (HERO IMAGE, PROCESS IMAGE, FOOD IMAGE, SERVICE IMAGE, DETAIL, BACKSTAGE).

   ```ts
   images: [
     {src: '/projects/mi-proyecto/hero.jpg', kind: 'HERO IMAGE', ratio: '3/2', size: 'full'},
     {src: '/projects/mi-proyecto/plato.jpg', kind: 'FOOD IMAGE', ratio: '4/5', size: 'half'},
   ]
   ```

3. Si un proyecto no define `images`, usa el set genérico `gallery` (placeholders).
4. La foto del hero del inicio está en [`components/home/Hero.tsx`](components/home/Hero.tsx) y la de Sobre mí en [`app/about/page.tsx`](app/about/page.tsx).
5. Para que el sitio se vea bien al compartirlo en redes falta `public/og.jpg` (**1200 × 630 px**).

### Cambiar textos y datos generales

| Qué | Dónde |
| --- | --- |
| URL, usuario de Instagram, título | [`content/site.ts`](content/site.ts) |
| Links del menú (nombre y ruta) | [`content/navigation.ts`](content/navigation.ts) |
| Servicios del inicio | [`content/services.ts`](content/services.ts) |
| Texto de Sobre mí | [`app/about/page.tsx`](app/about/page.tsx) |
| Título del hero | [`components/home/Hero.tsx`](components/home/Hero.tsx) |
| Campos del formulario | [`components/contact/ContactForm.tsx`](components/contact/ContactForm.tsx) |

### Colores y tipografías

Los colores están en [`tailwind.config.ts`](tailwind.config.ts): `paper` (fondo crema), `ink` (negro) y dos grises (`g1`, `g2`). Las tipografías se cargan en [`app/layout.tsx`](app/layout.tsx).

Clases propias definidas en [`app/globals.css`](app/globals.css):

- `.h-xl`: título gigante en serif.
- `.meta`: texto chico en mayúsculas con espaciado, para datos y etiquetas.
- `.rv`: estado inicial de la animación de aparición (`Reveal`).

---

## Detalles de diseño e interacción

### Transición de página (efecto revista)

Implementada en [`components/layout/PageTransition.tsx`](components/layout/PageTransition.tsx), sin librerías externas:

La **dirección** depende del orden de las páginas, como en una revista (Inicio → Trabajos → Sobre mí → Contacto, definido por [`content/navigation.ts`](content/navigation.ts)): si avanzás, la hoja viene de derecha a izquierda; si retrocedés, de izquierda a derecha, con el lomo del lado contrario. Un proyecto cuenta como una página justo después de Trabajos.

1. **Tapar:** una hoja de papel entra desde el costado (≈ 650 ms).
2. **Navegar:** con la pantalla tapada se cambia la ruta con el router de Next y se espera a que cargue la página nueva (máximo 4 s).
3. **Dar vuelta:** la hoja gira sobre su lomo izquierdo con perspectiva 3D y una sombra de pliegue (≈ 950 ms), y revela la página nueva.

Para ajustar el efecto se editan las constantes de arriba del archivo (`COVER_MS`, `TURN_MS` y las curvas `EASE_*`). El hook `usePageTransition()` expone la función `navigate(href)` para usarla desde cualquier componente.

### Links de navegación

[`NavLink.tsx`](components/layout/NavLink.tsx) decide qué hacer al tocar un link:

- **Otra página** → transición de hoja.
- **La misma página** → sube lentamente al inicio ([`lib/scrollToTop.ts`](lib/scrollToTop.ts), 1,4 s, curva *ease-in-out*). Si el usuario scrollea a mano durante la subida, se cancela.
- **Ctrl/Cmd + click o click del medio** → se abre en una pestaña nueva, como cualquier link.

### Header de vidrio

[`useScrollState`](hooks/useScrollState.ts) detecta si el usuario bajó más de 40 px y, mirando el fondo del elemento que está justo debajo del header, decide si el vidrio es oscuro o claro. Funciona solo: si se agregan secciones oscuras nuevas no hay que configurar nada.

### Accesibilidad

El scroll lento al inicio y la transición de página **no** respetan la preferencia del sistema "reducir movimiento", porque el efecto es parte del diseño. Si se quiere respetar, hay que chequear `window.matchMedia('(prefers-reduced-motion: reduce)')` en [`lib/scrollToTop.ts`](lib/scrollToTop.ts) y en [`PageTransition.tsx`](components/layout/PageTransition.tsx) y saltear la animación.

---

## Checklist antes de publicar

- [ ] Reemplazar `https://zeta.example` por el dominio real en [`content/site.ts`](content/site.ts) (lo usan también `robots.ts` y `sitemap.ts`).
- [ ] Crear `.env.local` (o cargar las variables en el hosting) con `RESEND_API_KEY` y `CONTACT_TO`.
- [ ] Verificar un dominio propio en Resend y cambiar el remitente `from` del endpoint.
- [ ] Subir las fotos reales y `public/og.jpg` (1200 × 630 px).
- [ ] Completar el campo `context` de cada proyecto con las 2–3 líneas editoriales (no se inventó texto).
- [ ] Completar las fechas reales donde dice `MMM 2026`.
- [ ] Probar el formulario de contacto de punta a punta.
- [ ] Correr `npm run build` y revisar que no haya errores.

---

## Deploy

### Firebase App Hosting (en uso)

El sitio está desplegado en **Firebase App Hosting** (necesita plan Blaze, pago por uso) porque Next.js tiene una ruta de API (`/api/contact`).

- Proyecto: `zeta-web-41868` · Backend: `zeta` · Región: `us-central1`
- URL: https://zeta--zeta-web-41868.us-central1.hosted.app
- Archivos de configuración: [`firebase.json`](firebase.json), [`.firebaserc`](.firebaserc) y [`apphosting.yaml`](apphosting.yaml).
- Presupuesto con alertas de 1 USD en la cuenta de facturación (es un demo).

Para publicar cambios:

```bash
firebase login        # una sola vez
firebase deploy --only apphosting --project zeta-web-41868
```

Sin `RESEND_API_KEY` ni `CONTACT_TO` el formulario de contacto no envía mails: solo registra la consulta en el log. Para activarlos: `firebase apphosting:secrets:set RESEND_API_KEY` y declararlos en `apphosting.yaml` (ver comentario en el archivo).

### Otros hosts

También funciona en Vercel (importar el repo y cargar las variables de entorno) o en cualquier host con Next.js 14 y Node 18+.

---

## Animaciones de especias (próximo desarrollo)

Collage diagonal para el Hero, spinner ZETA con especias e intro con vórtice: ver [`README-ANIMACIONES.md`](README-ANIMACIONES.md), con el paso a paso y qué se hace en Photoshop, Illustrator y After Effects.

---

## Solución de problemas

| Problema | Solución |
| --- | --- |
| `npm run build` falla al descargar fuentes | Revisar la conexión a internet: Next baja Google Fonts al compilar. |
| El formulario dice "Recibido" pero no llega el mail | Revisar que `RESEND_API_KEY` y `CONTACT_TO` estén cargadas; sin ellas solo se imprime en la consola del servidor. |
| Los cambios en `.env.local` no se ven | Reiniciar `npm run dev`: las variables se leen al arrancar. |
| Error de importación tras mover archivos | Los imports usan el alias `@/` (raíz del proyecto); verificar la ruta nueva. |
| Al compartir el link no aparece imagen | Falta `public/og.jpg` (1200 × 630 px). |
