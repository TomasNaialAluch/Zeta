// Recodifica la intro (Firefly, ~5,9 MB) a un MP4 liviano H.264 con audio, para el respaldo del <video>.
var logPath = 'C:/Users/Naial/Downloads/zeta/assets-src/ae/_render.txt';
var first = true;
function L(s) { var f = new File(logPath); f.open(first ? 'w' : 'a'); first = false; f.writeln(s); f.close(); }
try {
  var proj = app.project;
  while (proj.renderQueue.numItems > 0) { proj.renderQueue.item(1).remove(); }
  while (proj.numItems > 0) { proj.item(1).remove(); }
  var vid = proj.importFile(new ImportOptions(new File('C:/Users/Naial/Downloads/zeta/assets-src/intro/kling-v2.mp4')));
  var comp = proj.items.addComp('INTRO', vid.width, vid.height, vid.pixelAspect, vid.duration, vid.frameRate);
  comp.layers.add(vid);
  var rq = proj.renderQueue;
  var item = rq.items.add(comp);
  var om = item.outputModule(1);
  om.applyTemplate(om.templates[5]);   // H.264 5 Mbps (el máximo real lo marca el contenido; ver peso final)
  om.file = new File('C:/Users/Naial/Downloads/zeta/assets-src/intro/zeta-intro-ae.mp4');
  rq.queueInAME(true);
  L('enviado a Media Encoder ' + vid.width + 'x' + vid.height);
} catch (e) { var m = ''; try { m = e.message + ' @' + e.line; } catch (x) { m = 'sin detalle'; } L('ERROR ' + m); }
L('FIN');
