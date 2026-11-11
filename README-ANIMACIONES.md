# ZETA — Plan de animaciones de especias

Guía de desarrollo para las tres piezas visuales nuevas del sitio, con qué herramienta se hace cada una (Adobe o código) y cómo integrarla en el proyecto.

Las tres usan **especias para cocinar en foto de alta resolución** como material común, así que primero se arma ese banco de imágenes.

| # | Pieza | Dónde se usa | Se hace en |
| --- | --- | --- | --- |
| 1 | Collage diagonal de especias con brillo de cristal | Fondo del Hero (inicio negro con "ZETA" grande) | Photoshop (recortes) + código (animación) |
| 2 | Spinner "ZETA" con especias dentro de las letras | Pantalla de carga | Illustrator (letras) + After Effects (o CSS/SVG) |
| 3 | Intro: "Z" que crece, salen "E T A" y especias cayendo a un agujero negro | Animación de entrada del sitio | After Effects (+ Illustrator y Photoshop) |

---

## 0. Banco de imágenes de especias

**Objetivo:** 12–20 especias distintas, fotos de muy buena resolución, con colores variados para poder formar el arcoíris (rojo → naranja → amarillo → verde → azul/violeta → marrón/negro).

**Criterio:** ZETA cocina de todo (asado y cocina regional argentina, pescados y pulpo, cocina oriental), así que el banco tiene que mezclar los tres mundos y verse **muy colorido**. Apuntar a 4–6 especias por cocina, repartidas por todo el arcoíris.

**Especias sugeridas, por cocina y color**

| Color | Argentina / asado | Mar (pescado, pulpo) | Oriental |
| --- | --- | --- | --- |
| Rojo | ají molido, pimentón ahumado, merkén | pimentón de la Vera, pimienta rosa | chile en hojuelas, guindilla seca, goji |
| Naranja | pimentón dulce | azafrán, cúrcuma | curry, polvo de curry madras |
| Amarillo | mostaza en grano, comino | limón seco / ralladura deshidratada | cúrcuma, jengibre en polvo |
| Verde | orégano, perejil seco, chimichurri deshidratado, romero | laurel, eneldo, alcaparras | wasabi en polvo, matcha, cardamomo verde, té verde |
| Violeta / azul | flores de lavanda, hibisco seco | sal de remolacha, flores comestibles | arroz negro, flor de guisante azul (butterfly pea) |
| Marrón / negro | pimienta negra, sal gruesa, provenzal | pimienta negra, sal marina en escamas | anís estrella, canela en rama, clavo de olor, pimienta de Sichuan, sésamo negro, cinco especias chinas |

Además del polvo, sumar fotos de **especias enteras en cuenco** (cucharas de madera, morteros, bolsitas de arpillera): dan textura y se leen mejor dentro de las letras del spinner que un polvo liso.

**Dónde conseguirlas**

- Bancos con licencia de uso libre: Unsplash, Pexels, Pixabay (buscar "spices flat lay", "spice bowls overhead", "paprika powder macro").
- Adobe Stock, ya incluido en el pack de Adobe (se licencia y se descarga desde Photoshop o la web).
- **No usar** imágenes de Google Imágenes sin revisar la licencia: el sitio es comercial.

**Requisitos de cada foto**

- Mínimo 3000 px de lado largo. Vista cenital (desde arriba) o macro.
- Fondo lo más limpio posible, o la especia ocupando todo el encuadre (sirve para llenar rectángulos y letras).
- Guardar el original sin tocar en `assets-src/especias/original/` (carpeta fuera de `public`, no se publica).

**Preparación en Photoshop**

1. Abrir la foto y recortarla en cuadrado (`C` → relación 1:1).
2. Ajustar color con *Imagen → Ajustes → Curvas* y *Vibrance* para que cada especia tenga un color bien definido y saturado (clave para el arcoíris).
3. Redimensionar a **1600 × 1600 px** (*Imagen → Tamaño de imagen*), sharpening suave.
4. Exportar con *Archivo → Exportar → Guardar para web* en **WebP calidad 80** (o JPG 80 si no hay WebP). Nombre: `paprika.webp`, `curcuma.webp`, etc.
5. Guardar en `public/especias/` (carpeta nueva, hoy el proyecto no tiene `public/`).
6. Para la pieza 3 (agujero negro) hacer además versión **recortada con fondo transparente** (*Seleccionar sujeto → Máscara de capa*, exportar PNG/WebP con transparencia) de unos pocos granos y montoncitos: `grano-*.webp`.

Para después poder pasar de colores a orden de arcoíris, anotar el color dominante de cada archivo en un `public/especias/especias.json`:

```json
[
  {"file": "paprika.webp", "color": "#c1272d", "hue": 0},
  {"file": "curcuma.webp", "color": "#e8a317", "hue": 40}
]
```

---

## 1. Fondo del Hero: collage diagonal con brillo de cristal

**Qué se ve:** cada tantos segundos aparece sobre el fondo negro un collage de **rectángulos inclinados en diagonal** (hacia la izquierda o la derecha, alternando), cada uno con una especia distinta, ordenados como arcoíris. Después, de a una y al azar, cada imagen se resalta con un efecto de **zoom + brillo de cristal**.

**Dónde se hace:** código (React + CSS). Photoshop solo prepara las imágenes (sección 0). Se integra en [`components/home/Hero.tsx`](components/home/Hero.tsx), detrás del texto `ZETA`.

### Componente nuevo: `components/home/SpiceCollage.tsx`

Ciclo de vida (todo con `setTimeout`/`setInterval` y limpieza al desmontar):

1. **Espera** de 6–10 s (el hero queda negro con solo "ZETA").
2. **Entrada:** el collage aparece (fade + leve desplazamiento) y se queda ~8 s.
3. **Brillo aleatorio:** cada 900–1400 ms se elige **una** imagen al azar (distinta de la anterior) y se le aplica la clase `is-lit` durante ~1,2 s.
4. **Salida:** el collage se desvanece y el ciclo se repite, alternando la inclinación (`-12deg` / `+12deg`).

### Maquetación diagonal

- Contenedor a pantalla completa, `position: absolute; inset: 0; overflow: hidden; z-index: 0`, con el texto del hero por encima (`z-index: 1`).
- Una grilla CSS de 5–7 columnas dentro de un wrapper más grande que la pantalla (ej. `width: 140%; height: 140%`) rotado:

```css
.collage { transform: rotate(var(--tilt)) scale(1.3); }   /* --tilt: -12deg o 12deg */
.collage-cell { aspect-ratio: 3 / 5; overflow: hidden; }
```

- Para el **arcoíris**: ordenar las celdas por `hue` (del JSON) de izquierda a derecha. Opcional: desplazar cada columna verticalmente un poco más que la anterior para que forme un abanico.
- Cada celda usa `next/image` con `fill` y `object-fit: cover`, `sizes` ajustado y `priority={false}`.

### Efecto "cristal + brillo + zoom"

Combinación de tres capas sobre la celda resaltada:

```css
.collage-cell img { transition: transform 1.2s ease, filter 1.2s ease; }
.collage-cell.is-lit img { transform: scale(1.12); filter: saturate(1.3) brightness(1.15); }

/* destello que cruza en diagonal */
.collage-cell::after {
  content: ""; position: absolute; inset: -50%;
  background: linear-gradient(115deg, transparent 40%, rgba(255,255,255,.55) 50%, transparent 60%);
  transform: translateX(-120%);
}
.collage-cell.is-lit::after { transform: translateX(120%); transition: transform 1.2s ease; }

/* borde de vidrio */
.collage-cell.is-lit { box-shadow: inset 0 0 0 1px rgba(255,255,255,.5), 0 0 40px rgba(255,255,255,.25); }
```

- Para más sensación de vidrio, agregar `backdrop-filter: blur(2px)` en un pseudo-elemento y un degradé sutil en el borde.
- Las celdas **no resaltadas** se bajan a `opacity: .55` para que la iluminada destaque.

### Rendimiento y accesibilidad

- Cargar el collage solo cuando el hero está visible (`IntersectionObserver`).
- Máximo ~12 imágenes WebP de ≤ 200 KB cada una en este fondo.
- En móvil bajar a 3 columnas.
- Respetar `prefers-reduced-motion`: mostrar el collage estático, sin brillo.

---

## 2. Spinner: "ZETA" con especias dentro de las letras

**Qué se ve:** la palabra ZETA en la **tipografía del sitio** (Instrument Serif, ver [`app/layout.tsx`](app/layout.tsx)) y, **dentro de las letras**, las fotos de especias van apareciendo y cambiando, como una barra de carga.

**Dónde se hace:**

- **Illustrator:** vectorizar la palabra para tener el SVG de las letras como máscara.
- **Código (recomendado para producción):** SVG con `clipPath` / `background-clip: text` — liviano, nítido y en vivo.
- **After Effects (alternativa):** exportar un video/Lottie si se quiere un acabado más cinematográfico.

### Opción A — CSS/SVG (recomendada)

1. En Illustrator: escribir `ZETA` con Instrument Serif, *Texto → Crear contornos*, exportar SVG (*Guardar como → SVG*, "Propiedades de estilo: atributos de presentación", "Responsivo").
2. Pegar el `<path>` de las letras como `<clipPath id="zeta">` en `components/ui/ZetaSpinner.tsx`.
3. Dentro del SVG, un `<g clip-path="url(#zeta)">` con las especias como `<image>` apiladas.
4. Animación: cada imagen entra con `clip-path` o `mask` que se "llena" de abajo hacia arriba, se mantiene ~1 s y pasa a la siguiente (con `@keyframes` y `animation-delay` escalonado). El ciclo total es de unos 6–8 s en loop.
5. Contorno fino de la letra (`stroke: rgba(255,255,255,.25)`) para que se lea la palabra aún con la imagen oscura.

Variante simple sin SVG: `background-clip: text; color: transparent;` con `background-image` rotando las fotos. Funciona en todos los navegadores actuales con el prefijo `-webkit-`.

### Opción B — After Effects

1. Composición 1920 × 1080, fondo negro (o transparente), 30 fps, 6 s en loop.
2. Texto `ZETA` con la tipografía del sitio (instalar Instrument Serif desde Google Fonts).
3. Debajo del texto, capas con las fotos de especias; en cada capa de imagen, *Modo de pista de mate → Mate alfa del texto*.
4. Animar posición/escala de cada foto (movimiento lento tipo "Ken Burns") y encadenar con *Cross Dissolve* o *Linear Wipe* de abajo hacia arriba.
5. Exportar: **Lottie** con el plugin Bodymovin (liviano, pero no soporta bien imágenes pesadas) o **WebM con alfa** (VP9) para usar con `<video autoplay loop muted playsinline>`.

### Cómo se usa

- Mostrarlo como pantalla de carga mientras la app inicializa: Next permite un `app/loading.tsx`, y también puede usarse dentro de [`PageTransition.tsx`](components/layout/PageTransition.tsx) mientras se espera la página nueva.
- Mostrar el spinner **mínimo 1,2 s** para que se llegue a apreciar.

---

## 3. Intro: "Z" que crece, salen "E T A" y especias cayendo al vacío

**Qué se ve:**

1. Fondo negro. Aparece una **Z pequeña** en el centro.
2. La Z **crece hasta el tamaño máximo** (ocupa casi todo el alto).
3. Desde abajo **suben las letras E, T, A**, una tras otra, y se acomodan a la derecha de la Z formando "ZETA".
4. **De fondo, detrás de las letras (no dentro de ellas)**, una lluvia de especias cae girando en espiral hacia adentro, como un **vórtice / agujero negro** que las traga.

**Dónde se hace:** esta es la pieza para **After Effects**, con insumos de Illustrator y Photoshop. Se exporta a video y se reproduce en el sitio (o se recrea en código si se quiere en vivo).

### Insumos

| Herramienta | Qué se prepara |
| --- | --- |
| **Illustrator** | Las 4 letras Z, E, T, A como capas/formas separadas (*Crear contornos*, cada letra en su capa). Importar el `.ai` a After Effects. |
| **Photoshop** | Granos y montoncitos de especias recortados con fondo transparente (sección 0, paso 6) en varios tamaños. Opcional: un degradé radial negro para el centro del vórtice. |
| **After Effects** | Armado, animación, vórtice y render final. |

### Armado en After Effects (paso a paso)

**Composición:** 1920 × 1080, 30 fps, 8 s, fondo negro.

**Capas de letras**

1. Importar el `.ai` como *Composición — Conservar tamaños de capa*; quedan Z, E, T, A en capas separadas.
2. **Z:** *Escala* de 8 % → 100 % entre 0:10 y 1:30 con *Easy Ease* y curva exponencial en el editor de gráficos; opcional, leve *Opacity* de 0 → 100 % al inicio.
3. **E, T, A:** cada una arranca **debajo del cuadro** (*Position Y* fuera de pantalla) y sube a su lugar con *Overshoot* leve (expresión `overshoot` o *Ease* con rebote), escalonadas 0:08 entre sí desde 1:30.
4. Si hace falta que quede centrado, usar una capa nula como padre de todas las letras y moverla al final.

**Vórtice de especias (en una capa/composición detrás de las letras)**

Opción 1, sin plugins (suficiente y controlable):

1. Crear una composición `Vortice` con los granos de especias importados desde Photoshop.
2. Usar **CC Particle World** (viene con AE): *Particle Type → Textured QuadPolygon*, textura = capa de especia; *Physics → Gravity* positiva, *Velocity* baja, *Birth Rate* alto, *Longevity* 4 s.
3. Para la espiral: en *Producer* poner un radio grande (0,8–1,0) y animar *Position* hacia el centro; sumar **Twirl** (*Efecto → Distorsionar → Girar*) con ángulo alto y radio grande para que todo gire hacia adentro.
4. Para el "agujero": un círculo negro en el centro con *Feather* alto y un leve **Glow** blanco en el borde (*Efecto → Estilizar → Brillo*).
5. Dar escala decreciente al acercarse al centro (*Size over Life* en la partícula) para sugerir profundidad.

Opción 2, 3D real (más trabajo): importar cada grano como capa 3D y animar la posición con una expresión en espiral:

```js
// Posición de cada grano: espiral hacia el centro
t = time - thisLayer.startTime;
r = linear(t, 0, 4, 900, 0);          // radio: de afuera hacia el centro
a = t * 4 + index * 0.6;              // ángulo
[960 + Math.cos(a) * r, 540 + Math.sin(a) * r, linear(t, 0, 4, 0, 800)]
```

Duplicar la capa 60–100 veces, con variaciones de escala y de inicio (*Time → Time Stretch* o *Layer → Time → Enable Time Remapping*).

**Profundidad y acabado**

- *Capa de ajuste* arriba: **Curves** para contraste, **Gaussian Blur** de 4–8 px solo en las especias lejanas (profundidad de campo), y un viñeteado negro.
- Las letras Z E T A van **encima** del vórtice (orden de capas) con una sutil sombra proyectada.
- Música/sonido: opcional, un *whoosh* grave que acompañe el giro.

### Exportación para el sitio

1. *Composición → Agregar a la cola de Adobe Media Encoder*.
2. Formato **H.264 MP4** (1920 × 1080, 8–10 Mbps) **y** **WebM VP9** para navegadores que lo prefieran. Si querés que se vea sobre transparente: WebM con alfa (VP9 + alpha) o ProRes 4444 para edición.
3. Pesar el resultado: objetivo **menos de 4 MB**. Si pesa más, bajar bitrate o resolución a 1280 × 720.
4. Exportar también un **fotograma final** en JPG (`intro-poster.jpg`) para usar como `poster` mientras carga.
5. Guardar en `public/intro/` (`intro.mp4`, `intro.webm`, `intro-poster.jpg`).

### Integración en el sitio

Componente `components/home/IntroVideo.tsx`:

```tsx
<video autoPlay muted playsInline preload="auto" poster="/intro/intro-poster.jpg"
       onEnded={onFinish}>
  <source src="/intro/intro.webm" type="video/webm" />
  <source src="/intro/intro.mp4" type="video/mp4" />
</video>
```

- Se muestra una sola vez por sesión (`sessionStorage.setItem('zeta-intro', '1')`).
- Botón "Saltar" siempre visible.
- Al terminar (`onEnded`) se hace un fundido a negro y se revela el Hero.
- Respetar `prefers-reduced-motion`: saltear la intro directamente.

Alternativa 100 % código: Z y letras animadas con **Framer Motion** y el vórtice en un `<canvas>` con partículas (Three.js o canvas 2D). Es más liviano en datos y se adapta a cualquier pantalla, pero lleva bastante más desarrollo. Conviene empezar con el video de After Effects y migrar si hace falta.

---

## Flujo de trabajo recomendado

1. **Banco de especias** (Photoshop) — sección 0.
2. **Collage del Hero** (código) — sección 1. Es lo más rápido de ver en el sitio.
3. **Letras ZETA en Illustrator** — sirven tanto para el spinner como para la intro.
4. **Spinner** (SVG/CSS, o AE si se quiere video) — sección 2.
5. **Intro con vórtice** (After Effects) — sección 3.
6. Integrar la intro y probar todo junto: carga, rendimiento (Lighthouse) y móvil.

## Estructura de archivos sugerida

```
assets-src/               # material de trabajo, NO se publica
  especias/original/      # fotos originales
  zeta-letras.ai          # letras vectorizadas (Illustrator)
  intro.aep               # proyecto de After Effects
public/
  especias/               # WebP optimizados + especias.json
  intro/                  # intro.mp4, intro.webm, intro-poster.jpg
components/
  home/SpiceCollage.tsx   # pieza 1
  home/IntroVideo.tsx     # pieza 3
  ui/ZetaSpinner.tsx      # pieza 2
```

Agregar `assets-src/` al `.gitignore` si los archivos son muy pesados (o usar Git LFS).

## Checklist

- [ ] 12–20 fotos de especias, licencia verificada, optimizadas en WebP.
- [ ] `especias.json` con color/hue de cada una.
- [ ] Letras ZETA vectorizadas en Illustrator con Instrument Serif.
- [ ] Collage diagonal funcionando en el Hero, con brillo aleatorio.
- [ ] Spinner ZETA con especias dentro de las letras.
- [ ] Intro de After Effects exportada (MP4 + WebM + poster) y menor a 4 MB.
- [ ] Todo respeta `prefers-reduced-motion` y se ve bien en móvil.
