// After Effects: 3 animaciones más del spinner ZETA (misma base visual: fondo #F4F1EB, ZETA negro #0E0E0E).
// Ejecutar:  AfterFX.exe -r zeta-variantes2.jsx
//
//   ZETA_V5_granos    Arranca la palabra ZETA (negra). Caen granos de pimienta y llenan las letras desde abajo.
//   ZETA_V6_remolino  ZETA con especias; se forma un remolino como el de una pileta: arcos de agua y
//                     especias giran hacia el centro y se llevan las letras.
//   ZETA_V7_polvo     Pantalla llena de polvo de cúrcuma; viene un viento de izquierda a derecha, empuja el
//                     polvo y queda ZETA formado con el polvo, como pegado.
var BASE = 'C:/Users/Naial/Downloads/zeta/';
var logPath = BASE + 'assets-src/ae/_log.txt';
var first = true;
function L(s) { var f = new File(logPath); f.open(first ? 'w' : 'a'); first = false; f.writeln(s); f.close(); }
L('inicio variantes2');

try {
  var W = 1920, H = 1080, FPS = 30, DUR = 7.2;
  var FONT = 'InstrumentSerif-Regular', SIZE = 640;
  var PAPER = [244 / 255, 241 / 255, 235 / 255];
  var INK = [14 / 255, 14 / 255, 14 / 255];
  var LETTERS = ['Z', 'E', 'T', 'A'];
  var INK_LEFT = [398, 672, 958, 1205];
  var CENTER_X = [521, 796, 1098, 1364];

  var proj = app.project;
  while (proj.renderQueue.numItems > 0) { proj.renderQueue.item(1).remove(); }
  while (proj.numItems > 0) { proj.item(1).remove(); }
  L('limpio');

  // ---------- Utilidades ----------
  var seed = 12345;
  function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function tryDo(label, fn) { try { fn(); } catch (e) { var m = ''; try { m = e.message; } catch (x) {} L('aviso ' + label + ': ' + m); } }

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
  function addText(comp, name, str, color) {
    var t = comp.layers.addText(str);
    t.name = name;
    var d = t.property('Source Text').value;
    d.resetCharStyle();
    d.font = FONT; d.fontSize = SIZE;
    d.justification = ParagraphJustification.LEFT_JUSTIFY;
    d.applyFill = true; d.fillColor = color; d.applyStroke = false;
    t.property('Source Text').setValue(d);
    return t;
  }
  function textPos() {   // posición del texto 'ZETA' centrado (se mide una vez con una comp temporal)
    var tmp = proj.items.addComp('tmp', W, H, 1, 1, FPS);
    var t = addText(tmp, 't', 'ZETA', INK);
    var r = t.sourceRectAtTime(0, false);
    var p = [W / 2 - (r.left + r.width / 2), H / 2 - (r.top + r.height / 2)];
    tmp.remove();
    return p;
  }
  var POS = textPos();
  function paperAndBase(comp, withBase) {
    comp.bgColor = PAPER;
    comp.layers.addSolid(PAPER, 'Fondo papel', W, H, 1, DUR);
    if (withBase) {
      var b = addText(comp, 'Letras base (negro)', 'ZETA', INK);
      b.property('Position').setValue(POS);
    }
  }
  function fullMatte(comp) {
    var m = addText(comp, 'Letras (mascara)', 'ZETA', [1, 1, 1]);
    m.property('Position').setValue(POS);
    return m;
  }
  function letterMatte(comp, i) {
    var t = addText(comp, 'Letra ' + LETTERS[i] + ' (mascara)', LETTERS[i], [1, 1, 1]);
    var r = t.sourceRectAtTime(0, false);
    t.property('Position').setValue([INK_LEFT[i] - r.left, POS[1]]);
    return t;
  }
  function ellipse(comp, name, d, color) {
    var sh = comp.layers.addShape();
    sh.name = name;
    var g = sh.property('Contents').addProperty('ADBE Vector Group');
    var gc = g.property('Contents');
    gc.addProperty('ADBE Vector Shape - Ellipse').property('ADBE Vector Ellipse Size').setValue([d, d]);
    gc.addProperty('ADBE Vector Graphic - Fill').property('ADBE Vector Fill Color').setValue(color);
    return sh;
  }
  function arc(comp, name, d, color, width, endPct) {
    var sh = comp.layers.addShape();
    sh.name = name;
    var g = sh.property('Contents').addProperty('ADBE Vector Group');
    var gc = g.property('Contents');
    gc.addProperty('ADBE Vector Shape - Ellipse').property('ADBE Vector Ellipse Size').setValue([d, d]);
    var st = gc.addProperty('ADBE Vector Graphic - Stroke');
    st.property('ADBE Vector Stroke Color').setValue(color);
    st.property('ADBE Vector Stroke Width').setValue(width);
    st.property('ADBE Vector Stroke Line Cap').setValue(2);   // puntas redondas
    var tr = gc.addProperty('ADBE Vector Filter - Trim');
    tr.property('ADBE Vector Trim Start').setValue(0);
    tr.property('ADBE Vector Trim End').setValue(endPct);
    return sh;
  }
  function wipe(layer, angle, feather, tA, vA, tB, vB) {
    var w = layer.property('Effects').addProperty('ADBE Linear Wipe');
    w.property('ADBE Linear Wipe-0002').setValue(angle);
    w.property('ADBE Linear Wipe-0003').setValue(feather);
    var c = w.property('ADBE Linear Wipe-0001');
    c.setValueAtTime(tA, vA);
    c.setValueAtTime(tB, vB);
    return w;
  }
  var SPICE_COLORS = [[0.85, 0.62, 0.10], [0.70, 0.15, 0.10], [0.30, 0.50, 0.15], [0.40, 0.25, 0.15], [0.93, 0.80, 0.55], [0.85, 0.35, 0.10]];

  // =====================================================================
  // V5 - Granos de pimienta que caen y completan ZETA
  // =====================================================================
  var v5 = proj.items.addComp('ZETA_V5_granos', W, H, 1, DUR, FPS);
  v5.motionBlur = true;
  paperAndBase(v5, true);
  var T0 = 0.9, TF = 3.4;                            // el nivel de la pila sube de 800 a 300 en TF s
  function level(t) { return 800 - 500 * clamp((t - T0) / TF, 0, 1); }

  var pile = v5.layers.add(photo('pimientas-roja-blanca-negra'), DUR);
  pile.name = 'Pila de pimientas';
  pile.property('Position').setValue([960, 540]);
  wipe(pile, 180, 40, T0, 100, T0 + TF + 0.15, 0);      // se llena de abajo hacia arriba
  wipe(pile, 0, 80, 6.0, 0, 6.9, 100);                  // al final se vacía (el borde baja)
  var pm = fullMatte(v5);
  pile.setTrackMatte(pm, TrackMatteType.ALPHA);

  var GRAIN = [[0.14, 0.09, 0.07], [0.72, 0.14, 0.11], [0.90, 0.85, 0.74], [0.33, 0.21, 0.14], [0.86, 0.32, 0.27], [0.55, 0.40, 0.28]];
  var NG = 260;
  for (var g = 0; g < NG; g++) {
    var tl = T0 + ((g + rnd()) / NG) * TF;           // instante de aterrizaje
    var x = 380 + rnd() * 1160;
    var yl = level(tl) + (rnd() - 0.5) * 18;
    var dd = 0.45 + rnd() * 0.3;
    var ts = tl - dd;
    var sz = 12 + rnd() * 14;
    var gl = ellipse(v5, 'Grano ' + (g + 1), sz, GRAIN[Math.floor(rnd() * GRAIN.length)]);
    gl.motionBlur = true;
    var pr = gl.property('Position');
    pr.setValueAtTime(ts, [x, -30]);
    pr.setValueAtTime(ts + dd * 0.55, [x + (rnd() - 0.5) * 20, -30 + 0.3 * (yl + 30)]);
    pr.setValueAtTime(tl, [x, yl]);
    gl.inPoint = Math.max(0, ts);
    gl.outPoint = tl + 0.02;
  }
  L('v5 lista');

  // =====================================================================
  // V6 - Remolino de pileta que se lleva las letras
  // =====================================================================
  // Precomp con ZETA lleno de especias (una distinta por letra)
  var pre6 = proj.items.addComp('Letras_con_especias', W, H, 1, DUR, FPS);
  var base6 = addText(pre6, 'Letras base (negro)', 'ZETA', INK);
  base6.property('Position').setValue(POS);
  var P6 = ['aji-rojo-fresco', 'morron-amarillo-naranja', 'morron-verde', 'paprika-polvo'];
  for (var i = 0; i < 4; i++) {
    var f6 = photo(P6[i]);
    var l6 = pre6.layers.add(f6, DUR);
    l6.name = 'Especia ' + LETTERS[i];
    l6.property('Position').setValue([CENTER_X[i], H / 2]);
    var sc6 = 60 * 1600 / f6.width;
    l6.property('Scale').setValue([sc6, sc6]);
    var m6 = letterMatte(pre6, i);
    l6.setTrackMatte(m6, TrackMatteType.ALPHA);
  }

  var v6 = proj.items.addComp('ZETA_V6_remolino', W, H, 1, DUR, FPS);
  paperAndBase(v6, false);
  // arcos de agua que giran hacia el centro (detrás de las letras)
  for (var k = 0; k < 9; k++) {
    var tR = 2.0 + k * 0.1;
    var ar = arc(v6, 'Agua ' + (k + 1), 1900 - k * 170, [0.42, 0.55, 0.64], 7 - k * 0.4, 28 + (k % 3) * 8);
    ar.property('Position').setValue([960, 540]);
    ar.inPoint = tR; ar.outPoint = tR + 2.9;
    var sa = ar.property('Scale');
    sa.setValueAtTime(tR, [100, 100]);
    sa.setValueAtTime(tR + 2.8, [4, 4]);
    var ra = ar.property('Rotation');
    ra.setValueAtTime(tR, k * 40);
    ra.setValueAtTime(tR + 2.8, k * 40 - 900);
    var oa = ar.property('Opacity');
    oa.setValueAtTime(tR, 0);
    oa.setValueAtTime(tR + 0.4, 65);
    oa.setValueAtTime(tR + 2.4, 65);
    oa.setValueAtTime(tR + 2.8, 0);
  }
  var main6 = v6.layers.add(pre6, DUR);
  main6.name = 'ZETA con especias';
  var op6 = main6.property('Opacity');
  op6.setValueAtTime(0.1, 0); op6.setValueAtTime(0.7, 100);
  op6.setValueAtTime(5.5, 100); op6.setValueAtTime(5.9, 0);
  var sc6m = main6.property('Scale');
  sc6m.setValueAtTime(0.1, [92, 92]); sc6m.setValueAtTime(0.9, [100, 100]);
  sc6m.setValueAtTime(2.2, [100, 100]); sc6m.setValueAtTime(4.3, [58, 58]); sc6m.setValueAtTime(5.8, [0, 0]);
  var rot6 = main6.property('Rotation');
  rot6.setValueAtTime(2.2, 0); rot6.setValueAtTime(5.8, -540);
  tryDo('twirl', function () {
    var tw = main6.property('Effects').addProperty('ADBE Twirl');
    tw.property(3).setValue([960, 540]);                // centro
    tw.property(2).setValue(100);                       // radio (0-100)
    var an = tw.property(1);
    an.setValueAtTime(2.0, 0);
    an.setValueAtTime(5.6, -1440);
  });
  // especias sueltas que giran hacia el desagüe
  for (var d6 = 0; d6 < 80; d6++) {
    var ts6 = 2.1 + rnd() * 2.5, dur6 = 1.4 + rnd() * 0.8;
    var r0 = 450 + rnd() * 560, a0 = rnd() * Math.PI * 2, sz6 = 10 + rnd() * 18;
    var dot = ellipse(v6, 'Especia suelta ' + (d6 + 1), sz6, SPICE_COLORS[Math.floor(rnd() * SPICE_COLORS.length)]);
    var pd = dot.property('Position');
    for (var j = 0; j <= 9; j++) {
      var s = j / 9, rr = r0 * Math.pow(1 - s, 1.15), aa = a0 - s * 3.2 * Math.PI;
      pd.setValueAtTime(ts6 + dur6 * s, [960 + rr * Math.cos(aa), 540 + rr * Math.sin(aa)]);
    }
    dot.inPoint = ts6; dot.outPoint = ts6 + dur6;
    var od = dot.property('Opacity');
    od.setValueAtTime(ts6, 0); od.setValueAtTime(ts6 + 0.2, 100);
    od.setValueAtTime(ts6 + dur6 * 0.85, 100); od.setValueAtTime(ts6 + dur6, 0);
  }
  L('v6 lista');

  // =====================================================================
  // V7 - Polvo de cúrcuma, viento y ZETA pegado
  // =====================================================================
  var v7 = proj.items.addComp('ZETA_V7_polvo', W, H, 1, DUR, FPS);
  v7.motionBlur = true;
  paperAndBase(v7, true);
  var cur = photo('curcuma-polvo');
  var cs = 125;   // 1600 px -> 2000 px, cubre toda la pantalla

  // Polvo pegado a las letras (queda cuando el viento se lleva el resto)
  var stuck = v7.layers.add(cur, DUR);
  stuck.name = 'Polvo pegado a las letras';
  stuck.property('Position').setValue([960, 540]);
  stuck.property('Scale').setValue([cs, cs]);
  var sm = fullMatte(v7);
  stuck.setTrackMatte(sm, TrackMatteType.ALPHA);
  var os = stuck.property('Opacity');
  os.setValueAtTime(5.9, 100); os.setValueAtTime(6.8, 0);
  tryDo('desplazar polvo pegado', function () {
    var td = stuck.property('Effects').addProperty('ADBE Turbulent Displace');
    td.property(3).setValue(160);                       // tamaño
    var am = td.property(2);
    am.setValueAtTime(5.9, 0); am.setValueAtTime(6.8, 90);
  });

  // Polvo que llena toda la pantalla y se va con el viento
  var screen = v7.layers.add(cur, DUR);
  screen.name = 'Polvo de pantalla';
  screen.property('Position').setValue([960, 540]);
  screen.property('Scale').setValue([cs, cs]);
  tryDo('desplazar pantalla', function () {
    var td = screen.property('Effects').addProperty('ADBE Turbulent Displace');
    td.property(3).setValue(220);
    var am = td.property(2);
    am.setValueAtTime(0.7, 0); am.setValueAtTime(3.4, 300);
    var ev = td.property(6);
    ev.setValueAtTime(0.7, 0); ev.setValueAtTime(3.4, 540);
  });
  tryDo('desenfoque direccional', function () {
    var db = screen.property('Effects').addProperty('ADBE Motion Blur');
    db.property(1).setValue(90);                        // 90 = horizontal
    var bl = db.property(2);
    bl.setValueAtTime(0.7, 0); bl.setValueAtTime(1.6, 90); bl.setValueAtTime(3.4, 160);
  });
  wipe(screen, 90, 900, 0.8, 0, 3.5, 100);              // el borde del viento recorre de izquierda a derecha
  var opn = screen.property('Opacity');
  opn.setValueAtTime(3.3, 100); opn.setValueAtTime(3.6, 0);

  // Nubes de polvo que sale volando con el frente del viento
  for (var p7 = 0; p7 < 110; p7++) {
    var u = rnd();
    var tp = 0.8 + u * 2.6;
    var front = -150 + 2250 * ((tp - 0.8) / 2.7);
    var y7 = 60 + rnd() * 960, len = 500 + rnd() * 700, life = 0.9 + rnd() * 0.7, sz7 = 14 + rnd() * 46;
    var dust = ellipse(v7, 'Polvo volando ' + (p7 + 1), sz7, [0.84 + rnd() * 0.1, 0.60 + rnd() * 0.12, 0.08 + rnd() * 0.08]);
    var pp = dust.property('Position');
    pp.setValueAtTime(tp, [front, y7]);
    pp.setValueAtTime(tp + life, [front + len, y7 + (rnd() - 0.5) * 160]);
    dust.inPoint = tp; dust.outPoint = tp + life;
    var od7 = dust.property('Opacity');
    od7.setValueAtTime(tp, 0); od7.setValueAtTime(tp + 0.15, 75); od7.setValueAtTime(tp + life, 0);
    tryDo('blur polvo', function () { dust.property('Effects').addProperty('ADBE Box Blur2').property(1).setValue(5); });
  }
  L('v7 lista');

  // ---------- Guardar y fotogramas de control ----------
  proj.save(new File(BASE + 'assets-src/ae/zeta-variantes2.aep'));
  var comps = [[v5, 'v5'], [v6, 'v6'], [v7, 'v7']];
  var times = [0.5, 1.8, 3.0, 4.6, 5.8, 6.8];
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
