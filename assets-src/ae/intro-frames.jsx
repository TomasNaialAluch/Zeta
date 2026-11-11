// Guarda cuadros de un clip (para revisarlo y usar su último cuadro como primer fotograma del siguiente).
var logPath = 'C:/Users/Naial/Downloads/zeta/assets-src/ae/_log.txt';
var first = true;
function L(s) { var f = new File(logPath); f.open(first ? 'w' : 'a'); first = false; f.writeln(s); f.close(); }
try {
  var cfg = new File('C:/Users/Naial/Downloads/zeta/assets-src/ae/_intro-job.txt'); cfg.open('r');
  var lines = cfg.read().split('\n'); cfg.close();
  var src = lines[0].replace(/\r/g, ''), prefix = lines[1].replace(/\r/g, ''), times = lines[2].replace(/\r/g, '').split(',');
  var proj = app.project;
  while (proj.numItems > 0) { proj.item(1).remove(); }
  var vid = proj.importFile(new ImportOptions(new File(src)));
  var comp = proj.items.addComp('F', vid.width, vid.height, vid.pixelAspect, vid.duration, vid.frameRate);
  comp.layers.add(vid);
  L('dur ' + vid.duration + ' ' + vid.width + 'x' + vid.height + ' fps ' + vid.frameRate);
  for (var i = 0; i < times.length; i++) {
    var t = parseFloat(times[i]); if (t < 0) t = vid.duration + t;
    comp.saveFrameToPng(t, new File('C:/Users/Naial/Downloads/zeta/assets-src/intro/' + prefix + '-' + i + '.png'));
  }
  L('OK');
} catch (e) { var m = ''; try { m = e.message + ' @' + e.line; } catch (x) { m = 'sin detalle'; } L('ERROR ' + m); }
L('FIN');
