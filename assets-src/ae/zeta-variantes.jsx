// After Effects: 3 variantes más del spinner ZETA (misma base visual que zeta-spinner.jsx).
// Ejecutar:  AfterFX.exe -r zeta-variantes.jsx
//
// Comps (1920x1080, 30 fps, 7.2 s, fondo #F4F1EB, ZETA negro #0E0E0E, sin contornos):
//   ZETA_V2_letras  Cada letra se llena de una especia distinta, una tras otra; luego cada una cambia de
//                   especia desde arriba; al final todas se van y queda ZETA negro.
//   ZETA_V3_lluvia  Columnas de especias (los lomos del Hero, verticales) caen desde arriba como lluvia y
//                   llenan las letras; luego caen hacia afuera; segunda lluvia con otro orden.
//   ZETA_V4_iris    En cada letra se abre un círculo con una especia; luego otro círculo con otra; al final
//                   los círculos se cierran.
var BASE = 'C:/Users/Naial/Downloads/zeta/';
var logPath = BASE + 'assets-src/ae/_log.txt';
var first = true;
function L(s) { var f = new File(logPath); f.open(first ? 'w' : 'a'); first = false; f.writeln(s); f.close(); }
L('inicio variantes');

try {
  var W = 1920, H = 1080, FPS = 30, DUR = 7.2;
  var FONT = 'InstrumentSerif-Regular', SIZE = 640;
  var PAPER = [244 / 255, 241 / 255, 235 / 255];
  var INK = [14 / 255, 14 / 255, 14 / 255];

  // Posición de cada letra en la comp (borde izquierdo y centro), medida del render de zeta-spinner
  var LETTERS = ['Z', 'E', 'T', 'A'];
  var INK_LEFT = [398, 672, 958, 1205];
  var CENTER_X = [521, 796, 1098, 1364];

  var proj = app.project;
  while (proj.renderQueue.numItems > 0) { proj.renderQueue.item(1).remove(); }
  while (proj.numItems > 0) { proj.item(1).remove(); }
  L('limpio');

  // ---------- Importación ----------
  var folder = proj.items.addFolder('Especias');
  var photoCache = {};
  function photo(name) {
    if (!photoCache[name]) {
      var it = proj.importFile(new ImportOptions(new File(BASE + 'public/especias/' + name + '.jpg')));
      it.parentFolder = folder;
      photoCache[name] = it;
    }
    return photoCache[name];
  }
  var SPINES = ['aji-rojo-fresco', 'aji-rojo-abundancia', 'aji-seco-rojo', 'aji-seco-pila', 'morron-rojo',
    'paprika-polvo', 'pimienta-rosa', 'morron-amarillo-naranja', 'azafran-hebras', 'curcuma-polvo',
    'morron-amarillo-apilado', 'oregano-hojas', 'morron-verde', 'pimientas-roja-blanca-negra',
    'pimientas-mixtas', 'canela-en-rama', 'anis-estrella', 'pimienta-negra-granos'];
  var HEIGHTS = [82, 96, 74, 100, 88, 92, 70, 98, 84, 94, 76, 100, 86, 72, 96, 80, 90, 78];
  var spineCache = {};
  function spine(k) {
    if (!spineCache[k]) {
      var num = (k < 9 ? '0' : '') + (k + 1);
      var it = proj.importFile(new ImportOptions(new File(BASE + 'assets-src/ae/lomos/' + num + '-' + SPINES[k] + '.jpg')));
      it.parentFolder = folder;
      spineCache[k] = it;
    }
    return spineCache[k];
  }

  // ---------- Utilidades ----------
  function addText(comp, name, str, color) {
    var t = comp.layers.addText(str);
    t.name = name;
    var d = t.property('Source Text').value;
    d.resetCharStyle();
    d.font = FONT;
    d.fontSize = SIZE;
    d.justification = ParagraphJustification.LEFT_JUSTIFY;
    d.applyFill = true; d.fillColor = color; d.applyStroke = false;
    t.property('Source Text').setValue(d);
    return t;
  }
  // Fondo + ZETA negro de base (lo que queda cuando no hay especias). Devuelve la posición del texto.
  function commonBase(comp) {
    comp.bgColor = PAPER;
    comp.layers.addSolid(PAPER, 'Fondo papel', W, H, 1, DUR);
    var base = addText(comp, 'Letras base (negro)', 'ZETA', INK);
    var r = base.sourceRectAtTime(0, false);
    var pos = [W / 2 - (r.left + r.width / 2), H / 2 - (r.top + r.height / 2)];
    base.property('Position').setValue(pos);
    return pos;
  }
  // Máscara de una sola letra, colocada exactamente donde cae en la palabra
  function letterMatte(comp, i, pos) {
    var t = addText(comp, 'Letra ' + LETTERS[i] + ' (mascara)', LETTERS[i], [1, 1, 1]);
    var r = t.sourceRectAtTime(0, false);
    t.property('Position').setValue([INK_LEFT[i] - r.left, pos[1]]);
    return t;
  }
  function circle(cx, cy, r) {
    var k = 0.5523 * r, s = new Shape();
    s.vertices = [[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]];
    s.inTangents = [[-k, 0], [0, -k], [k, 0], [0, k]];
    s.outTangents = [[k, 0], [0, k], [-k, 0], [0, -k]];
    s.closed = true;
    return s;
  }
  // Pre-comp de una letra: 2 fotos (A entra, B la cubre) con la animación que pida 'mode'
  function letterComp(name, i, photoA, photoB, tA, tB, tOut, mode) {
    var c = proj.items.addComp(name, W, H, 1, DUR, FPS);
    var specs = [{p: photoA, t: tA, from: 180}, {p: photoB, t: tB, from: 0}];
    for (var s = 0; s < 2; s++) {
      var sp = specs[s], f = photo(sp.p);
      var ly = c.layers.add(f, DUR);
      ly.name = (s === 0 ? 'A ' : 'B ') + sp.p;
      ly.inPoint = sp.t;
      var pct = (mode === 'iris' ? 70 : 60) * 1600 / f.width;
      var pct2 = pct * 1.12;
      ly.property('Position').setValue([CENTER_X[i], H / 2]);
      var scl = ly.property('Scale');
      scl.setValueAtTime(sp.t, [pct, pct]);
      scl.setValueAtTime(tOut, [pct2, pct2]);
      var op = ly.property('Opacity');
      if (mode === 'iris') {
        // círculo que se abre desde el centro de la letra y se cierra al final
        var mk = ly.property('Masks').addProperty('ADBE Mask Atom');
        mk.property('ADBE Mask Feather').setValue([36, 36]);
        var cx = f.width / 2, cy = f.height / 2, k = 100 / pct; // px de la comp -> px de la imagen
        var ms = mk.property('ADBE Mask Shape');
        ms.setValueAtTime(sp.t, circle(cx, cy, 2));
        ms.setValueAtTime(sp.t + 0.9, circle(cx, cy, 380 * k));
        ms.setValueAtTime(tOut, circle(cx, cy, 380 * k));
        ms.setValueAtTime(tOut + 0.6, circle(cx, cy, 2));
      } else {
        var wipe = ly.property('Effects').addProperty('ADBE Linear Wipe');
        wipe.property('ADBE Linear Wipe-0002').setValue(sp.from);   // A: de abajo a arriba; B: de arriba a abajo
        wipe.property('ADBE Linear Wipe-0003').setValue(140);
        var cmp = wipe.property('ADBE Linear Wipe-0001');
        cmp.setValueAtTime(sp.t, 100);
        cmp.setValueAtTime(sp.t + 0.6, 0);
        op.setValueAtTime(tOut, 100);
        op.setValueAtTime(tOut + 0.5, 0);
      }
    }
    return c;
  }
  // Compone las 4 letras (pre-comp + máscara de la letra arriba de cada una)
  function lettersMain(compName, mode, photosA, photosB) {
    var comp = proj.items.addComp(compName, W, H, 1, DUR, FPS);
    var pos = commonBase(comp);
    for (var i = 0; i < 4; i++) {
      var tA = 0.2 + i * 0.5, tB = 3.7 + i * 0.4, tOut = 6.0 + i * 0.2;
      var pre = letterComp(compName + '_' + LETTERS[i], i, photosA[i], photosB[i], tA, tB, tOut, mode);
      var layer = comp.layers.add(pre, DUR);
      layer.name = 'Letra ' + LETTERS[i] + ' fotos';
      var m = letterMatte(comp, i, pos);
      layer.setTrackMatte(m, TrackMatteType.ALPHA);
    }
    return comp;
  }

  // ---------- V2: letra por letra ----------
  var v2 = lettersMain('ZETA_V2_letras', 'wipe',
    ['aji-rojo-fresco', 'morron-amarillo-naranja', 'morron-verde', 'pimientas-roja-blanca-negra'],
    ['paprika-polvo', 'azafran-hebras', 'oregano-hojas', 'canela-en-rama']);
  L('v2 lista');

  // ---------- V4: iris circular ----------
  var v4 = lettersMain('ZETA_V4_iris', 'iris',
    ['azafran-hebras', 'aji-rojo-fresco', 'curcuma-polvo', 'morron-verde'],
    ['pimientas-roja-blanca-negra', 'morron-amarillo-naranja', 'paprika-polvo', 'canela-en-rama']);
  L('v4 lista');

  // ---------- V3: lluvia de columnas ----------
  var rain = proj.items.addComp('Lluvia_columnas', W, H, 1, DUR, FPS);
  rain.motionBlur = true;
  var N = SPINES.length, PITCH = 108, BOTTOM = 860;
  // orden pseudo-aleatorio fijo (para que el video sea reproducible)
  var ORDER1 = [7, 2, 13, 0, 10, 5, 16, 3, 11, 8, 17, 1, 14, 6, 12, 4, 15, 9];
  var ORDER2 = [9, 15, 4, 12, 6, 14, 1, 17, 8, 11, 3, 16, 5, 10, 0, 13, 2, 7];
  function addRain(order, shift, t0, tExit) {
    for (var k = N - 1; k >= 0; k--) {
      var idx = (k + shift) % N;
      var f = spine(idx);
      var ly = rain.layers.add(f, DUR);
      ly.name = 'Gota ' + (shift ? 'B ' : 'A ') + (k + 1) + ' ' + SPINES[idx];
      ly.motionBlur = true;
      ly.property('Scale').setValue([50, 50]);
      ly.property('Anchor Point').setValue([f.width / 2, f.height]);
      ly.inPoint = t0;
      var x = W / 2 + (k - (N - 1) / 2) * PITCH;
      var tIn = t0 + order[k] * 0.07;
      var d = 0.7 + (k % 3) * 0.1;
      var pr = ly.property('Position');
      pr.setValueAtTime(tIn, [x, -40]);
      pr.setValueAtTime(tIn + d * 0.8, [x, BOTTOM + 25]);
      pr.setValueAtTime(tIn + d, [x, BOTTOM]);
      var tOut = tExit + order[N - 1 - k] * 0.05;
      pr.setValueAtTime(tOut, [x, BOTTOM]);
      pr.setValueAtTime(tOut + 0.6, [x, BOTTOM + 1300]);
      ly.outPoint = tOut + 0.65;
      ly.property('Opacity').setValue(92);
    }
  }
  addRain(ORDER2, 9, 3.7, 6.1);   // segunda lluvia (arriba de la primera)
  addRain(ORDER1, 0, 0.2, 2.9);   // primera lluvia
  // La segunda va primero en el código para que la primera quede... (se reordena abajo)
  // Orden de capas: las gotas B deben quedar ARRIBA de las A -> mover las A al fondo
  for (var q = 1; q <= rain.numLayers; q++) {
    if (rain.layer(q).name.indexOf('Gota A') === 0) { /* se agregaron último: están arriba, se bajan */ }
  }
  for (var z = rain.numLayers; z >= 1; z--) {
    if (rain.layer(z).name.indexOf('Gota A') === 0) rain.layer(z).moveToEnd();
  }
  var v3 = proj.items.addComp('ZETA_V3_lluvia', W, H, 1, DUR, FPS);
  var pos3 = commonBase(v3);
  var rl = v3.layers.add(rain, DUR);
  rl.name = 'Lluvia dentro';
  var m3 = addText(v3, 'Letras (mascara)', 'ZETA', [1, 1, 1]);
  m3.property('Position').setValue(pos3);
  rl.setTrackMatte(m3, TrackMatteType.ALPHA);
  L('v3 lista');

  // ---------- Guardar y fotogramas de control ----------
  proj.save(new File(BASE + 'assets-src/ae/zeta-variantes.aep'));
  var comps = [[v2, 'v2'], [v3, 'v3'], [v4, 'v4']];
  var times = [0.9, 1.8, 2.8, 4.4, 5.2, 6.7];
  for (var a = 0; a < comps.length; a++) {
    for (var b = 0; b < times.length; b++) {
      comps[a][0].saveFrameToPng(times[b], new File(BASE + 'assets-src/ae/frame-' + comps[a][1] + '-' + times[b] + '.png'));
    }
  }
  L('OK');
} catch (e) {
  var m = '';
  try { m = e.message + ' @' + e.line; } catch (x) { m = 'sin detalle'; }
  L('ERROR ' + m);
}
L('FIN');
