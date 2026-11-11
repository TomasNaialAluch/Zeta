var logPath = 'C:/Users/Naial/Downloads/zeta/assets-src/ae/_render.txt';
var first = true;
function L(s) { var f = new File(logPath); f.open(first ? 'w' : 'a'); first = false; f.writeln(s); f.close(); }
try {
  var comp = null;
  for (var i = 1; i <= app.project.numItems; i++) { var it = app.project.item(i); if (it instanceof CompItem && it.name === 'ZETA_Spinner') comp = it; }
  var rq = app.project.renderQueue;
  while (rq.numItems > 0) { rq.item(1).remove(); }
  var item = rq.items.add(comp);
  var om = item.outputModule(1);
  var tpl = null; for (var k = 0; k < om.templates.length; k++) { if (om.templates[k].indexOf('H.264') === 0 && om.templates[k].indexOf('5 Mbps') > -1) tpl = om.templates[k]; }
  var nm = []; for (var q = 0; q < om.templates.length; q++) nm.push(q + '=' + om.templates[q]); L(nm.join(' | '));
  tpl = om.templates[5];
  om.applyTemplate(tpl);
  om.file = new File('C:/Users/Naial/Downloads/zeta/public/animaciones/zeta-spinner.mp4');
  L('salida: ' + om.file.fsName);
  app.project.save();
  rq.queueInAME(true);
  L('enviado a Media Encoder');
} catch (e) { var m = ''; try { m = e.message + ' @' + e.line; } catch (x) { m = 'sin detalle'; } L('ERROR ' + m); }
L('FIN');
