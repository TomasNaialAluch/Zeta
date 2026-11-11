var logPath = 'C:/Users/Naial/Downloads/zeta/assets-src/ae/_render.txt';
var first = true;
function L(s) { var f = new File(logPath); f.open(first ? 'w' : 'a'); first = false; f.writeln(s); f.close(); }
try {
  var jobs = [['ZETA_V5_granos', 'zeta-spinner-5.mp4'], ['ZETA_V6_remolino', 'zeta-spinner-6.mp4'], ['ZETA_V7_polvo', 'zeta-spinner-7.mp4']];
  var rq = app.project.renderQueue;
  while (rq.numItems > 0) { rq.item(1).remove(); }
  for (var j = 0; j < jobs.length; j++) {
    var comp = null;
    for (var i = 1; i <= app.project.numItems; i++) { var it = app.project.item(i); if (it instanceof CompItem && it.name === jobs[j][0]) comp = it; }
    var item = rq.items.add(comp);
    var om = item.outputModule(1);
    om.applyTemplate(om.templates[5]);   // H.264, 5 Mbps
    om.file = new File('C:/Users/Naial/Downloads/zeta/public/animaciones/' + jobs[j][1]);
    L('en cola: ' + jobs[j][1]);
  }
  app.project.save();
  rq.queueInAME(true);
  L('enviado a Media Encoder');
} catch (e) { var m = ''; try { m = e.message + ' @' + e.line; } catch (x) { m = 'sin detalle'; } L('ERROR ' + m); }
L('FIN');
