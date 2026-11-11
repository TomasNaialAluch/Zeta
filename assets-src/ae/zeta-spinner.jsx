// After Effects: spinner "ZETA" con especias dentro de las letras (v2).
// Ejecutar:  AfterFX.exe -r zeta-spinner.jsx   (o Archivo > Scripts > Ejecutar archivo de script)
//
// Resultado: comp "ZETA_Spinner" 1920x1080, 30 fps, 7.2 s en bucle.
//   0.0 - 3.6 s  FOTOS: cada foto de especia entra de abajo hacia arriba dentro de las letras,
//                con zoom lento (Ken Burns), se mantiene y la siguiente la tapa.
//   3.6 - 7.2 s  PINTURA: los lomos de especias del Hero (estante inclinado, orden arcoíris) suben de
//                abajo hacia arriba de izquierda a derecha "pintando" las letras y luego se van igual.
//   Fondo del color de la página (#F4F1EB) y ZETA en negro (#0E0E0E) cuando no hay especias; sin contornos.
var BASE = 'C:/Users/Naial/Downloads/zeta/';
var logPath = BASE + 'assets-src/ae/_log.txt';
var first = true;
function L(s) { // se abre/cierra cada vez para que el log se vea aunque el script se corte
  var f = new File(logPath); f.open(first ? 'w' : 'a'); first = false; f.writeln(s); f.close();
}
L('inicio v2');

try {
  var W = 1920, H = 1080, FPS = 30;
  var PART = 3.6;            // duración de cada mitad (fotos / pintura)
  var DUR = PART * 2;        // 7.2 s en total
  var TILE = 640;            // lado de cada foto en la tira de colores (px)
  var FONT = 'InstrumentSerif-Regular'; // misma tipografía que la web
  var SIZE = 640;

  // Fotos de la mitad 1 (arcoíris: rojo, amarillo/naranja, verde, pimientas)
  var PHOTOS = ['aji-rojo-fresco', 'morron-amarillo-naranja', 'morron-verde', 'pimientas-roja-blanca-negra'];
  var PHOTO_STEP = PART / PHOTOS.length; // 0.9 s por foto
  var WIPE_T = 0.45;                     // lo que tarda cada foto en "llenar" la letra
  // Tira de colores de la mitad 2, en el mismo orden que el collage del Hero
  var SPICES = ['aji-rojo-fresco', 'paprika-polvo', 'morron-amarillo-naranja', 'azafran-hebras',
    'curcuma-polvo', 'oregano-hojas', 'morron-verde', 'pimientas-roja-blanca-negra', 'canela-en-rama'];

  var proj = app.project;
  while (proj.renderQueue.numItems > 0) { proj.renderQueue.item(1).remove(); }
  while (proj.numItems > 0) { proj.item(1).remove(); } // empezar limpio
  L('limpio');

  // --- 1. Importar fotos ---
  var folder = proj.items.addFolder('Especias');
  var foot = {};
  for (var i = 0; i < SPICES.length; i++) {
    var io = new ImportOptions(new File(BASE + 'public/especias/' + SPICES[i] + '.jpg'));
    var it = proj.importFile(io);
    it.parentFolder = folder;
    foot[SPICES[i]] = it;
  }
  L('importado');

  // --- 2. Comp "Fotos": secuencia, cada foto entra de abajo hacia arriba con zoom lento ---
  var fotos = proj.items.addComp('Fotos', W, H, 1, PART, FPS);
  for (var p2 = 0; p2 < PHOTOS.length; p2++) {
    var t0 = p2 * PHOTO_STEP;
    var f = foot[PHOTOS[p2]];
    var ly = fotos.layers.add(f, PART); // cada capa nueva queda arriba de las anteriores
    ly.name = 'Foto ' + (p2 + 1) + ' ' + PHOTOS[p2];
    ly.inPoint = t0;
    ly.outPoint = PART;
    var big = 1200 / f.width * 100;     // 1200 px: cubre las letras
    var big2 = 1320 / f.width * 100;    // zoom lento hasta 1320 px
    ly.property('Position').setValue([W / 2, H / 2]);
    var scl = ly.property('Scale');
    scl.setValueAtTime(t0, [big, big]);
    scl.setValueAtTime(Math.min(t0 + PHOTO_STEP + 0.6, PART), [big2, big2]);
    var wipe = ly.property('Effects').addProperty('ADBE Linear Wipe');
    wipe.property('ADBE Linear Wipe-0002').setValue(180); // empieza por abajo y sube
    wipe.property('ADBE Linear Wipe-0003').setValue(160); // borde suave
    var c = wipe.property('ADBE Linear Wipe-0001');
    c.setValueAtTime(t0, 100);
    c.setValueAtTime(t0 + WIPE_T, 0);
  }
  L('fotos listas');

  // --- 3. Comp "Especias_tira": estante de lomos como el collage del Hero ---
  // 18 lomos verticales, de distinta altura, ordenados como arcoíris e inclinados -9°.
  // Entran de abajo hacia arriba escalonados de izquierda a derecha, quedan, y se van igual.
  var SPINES = ['aji-rojo-fresco', 'aji-rojo-abundancia', 'aji-seco-rojo', 'aji-seco-pila', 'morron-rojo',
    'paprika-polvo', 'pimienta-rosa', 'morron-amarillo-naranja', 'azafran-hebras', 'curcuma-polvo',
    'morron-amarillo-apilado', 'oregano-hojas', 'morron-verde', 'pimientas-roja-blanca-negra',
    'pimientas-mixtas', 'canela-en-rama', 'anis-estrella', 'pimienta-negra-granos'];
  var HEIGHTS = [82, 96, 74, 100, 88, 92, 70, 98, 84, 94, 76, 100, 86, 72, 96, 80, 90, 78];
  var SP_W = 100, SP_GAP = 8, PITCH = SP_W + SP_GAP;
  var strip = proj.items.addComp('Especias_tira', W, H, 1, PART, FPS);
  var TH = -9 * Math.PI / 180, COS = Math.cos(TH), SIN = Math.sin(TH);
  var OX = W / 2, OY = 1000;                           // base del estante, debajo de las letras
  function shelfPos(x, dy) {                           // punto del estante inclinado -> posición en la comp
    return [OX + x * COS - dy * SIN, OY + x * SIN + dy * COS];
  }
  var N = SPINES.length;
  for (var k = N - 1; k >= 0; k--) {
    var num = (k < 9 ? '0' : '') + (k + 1);
    var sio = new ImportOptions(new File(BASE + 'assets-src/ae/lomos/' + num + '-' + SPINES[k] + '.jpg'));
    var sf = proj.importFile(sio);
    sf.parentFolder = folder;
    var sl = strip.layers.add(sf, PART);
    sl.name = 'Lomo ' + (k + 1) + ' ' + SPINES[k];
    sl.property('Scale').setValue([50, 50]);              // la imagen está a 2x
    sl.property('Anchor Point').setValue([sf.width / 2, sf.height]); // anclado en la base
    sl.property('Rotation').setValue(-9);
    var x = (k - (N - 1) / 2) * PITCH;
    var pr = sl.property('Position');
    var tin = 0.2 + k * 0.06;                             // entrada escalonada, izquierda -> derecha
    var tout = 2.3 + k * 0.04;                            // salida escalonada, izquierda -> derecha
    pr.setValueAtTime(0, shelfPos(x, 160));
    pr.setValueAtTime(tin, shelfPos(x, 160));
    pr.setValueAtTime(tin + 0.9, shelfPos(x, 0));
    pr.setValueAtTime(tout, shelfPos(x, 0));
    pr.setValueAtTime(tout + 0.5, shelfPos(x, 160));
    var po = sl.property('Opacity');
    po.setValueAtTime(0, 0);
    po.setValueAtTime(tin, 0);
    po.setValueAtTime(tin + 0.6, 88);
    po.setValueAtTime(tout, 88);
    po.setValueAtTime(tout + 0.5, 0);
  }
  L('tira lista');

  // --- 4. Comp principal ---
  var comp = proj.items.addComp('ZETA_Spinner', W, H, 1, DUR, FPS);
  var PAPER = [244 / 255, 241 / 255, 235 / 255]; // #F4F1EB, fondo de la página
  var INK = [14 / 255, 14 / 255, 14 / 255];      // #0E0E0E, negro de la página
  comp.bgColor = PAPER;

  function addTextLayer(name, color) {
    var t = comp.layers.addText('ZETA');
    t.name = name;
    var d = t.property('Source Text').value;
    d.resetCharStyle();
    d.font = FONT;
    d.fontSize = SIZE;
    d.justification = ParagraphJustification.LEFT_JUSTIFY;
    d.applyFill = true; d.fillColor = color; d.applyStroke = false; // sin borde
    t.property('Source Text').setValue(d);
    return t;
  }

  // Se agregan de abajo hacia arriba (cada capa nueva queda arriba)
  var bg = comp.layers.addSolid(PAPER, 'Fondo papel', W, H, 1, DUR);
  var base = addTextLayer('Letras base (negro)', INK);   // lo que queda cuando no hay especias

  var spF = comp.layers.add(fotos, PART);             // mitad 1
  spF.name = 'Fotos dentro';
  spF.startTime = 0;
  var fillA = addTextLayer('Letras (mascara fotos)', [1, 1, 1]);

  var spP = comp.layers.add(strip, PART);             // mitad 2
  spP.name = 'Pintura de colores';
  spP.startTime = PART;
  var fillB = addTextLayer('Letras (mascara pintura)', [1, 1, 1]);

  L('capas creadas');

  // Centrar todas las letras con el rectángulo real del texto
  var r = fillA.sourceRectAtTime(0, false);
  var pos = [W / 2 - (r.left + r.width / 2), H / 2 - (r.top + r.height / 2)];
  fillA.property('Position').setValue(pos);
  fillB.property('Position').setValue(pos);
  base.property('Position').setValue(pos);

  spF.setTrackMatte(fillA, TrackMatteType.ALPHA);
  spP.setTrackMatte(fillB, TrackMatteType.ALPHA);
  L('mattes ok');

  // Mitad 1: las fotos se van con un fundido justo antes de la pintura
  var opF = spF.property('Opacity');
  opF.setValueAtTime(PART - 0.3, 100);
  opF.setValueAtTime(PART - 0.05, 0);

  // Mitad 2: la animación de los lomos vive dentro de la comp 'Especias_tira'

  L('animacion lista');

  // --- 5. Guardar y dejar fotogramas de control ---
  proj.save(new File(BASE + 'assets-src/ae/zeta-spinner.aep'));
  var checks = [0.3, 0.9, 1.7, 2.6, 4.2, 4.8, 5.6, 6.4];
  for (var q = 0; q < checks.length; q++) {
    comp.saveFrameToPng(checks[q], new File(BASE + 'assets-src/ae/frame-' + checks[q] + '.png'));
  }
  L('OK');
} catch (e) {
  var m = '';
  try { m = e.message + ' @' + e.line; } catch (x) { m = 'sin detalle'; }
  L('ERROR ' + m);
}
L('FIN');
