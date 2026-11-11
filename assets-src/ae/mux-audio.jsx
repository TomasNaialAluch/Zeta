// Pega un audio (WAV) a un video ya generado y lo manda a Media Encoder (H.264 con audio).
var logPath = 'C:/Users/Naial/Downloads/zeta/assets-src/ae/_render.txt';
var first = true;
function L(s) { var f = new File(logPath); f.open(first ? 'w' : 'a'); first = false; f.writeln(s); f.close(); }
try {
  var D = 'C:/Users/Naial/Downloads/zeta/assets-src/ai-videos/';
  var jobs = [['remolino.mp4', 'remolino-audio.wav', 'remolino-sonido.mp4'], ['polvo.mp4', 'polvo-audio.wav', 'polvo-sonido.mp4']];
  var proj = app.project;
  while (proj.renderQueue.numItems > 0) { proj.renderQueue.item(1).remove(); }
  while (proj.numItems > 0) { proj.item(1).remove(); }
  var comps = [];
  for (var j = 0; j < jobs.length; j++) {
    var vid = proj.importFile(new ImportOptions(new File(D + jobs[j][0])));
    var aud = proj.importFile(new ImportOptions(new File(D + jobs[j][1])));
    var comp = proj.items.addComp('MUX_' + (j + 1), vid.width, vid.height, vid.pixelAspect, vid.duration, vid.frameRate);
    comp.layers.add(aud);
    comp.layers.add(vid);
    comps.push(comp);
    L('comp ' + comp.name + ' ' + vid.width + 'x' + vid.height + ' dur ' + vid.duration + ' audio dur ' + aud.duration + ' hasAudio ' + aud.hasAudio);
  }
  var rq = proj.renderQueue;
  for (var k = 0; k < comps.length; k++) {
    var item = rq.items.add(comps[k]);
    var om = item.outputModule(1);
    om.applyTemplate(om.templates[5]);   // H.264, 5 Mbps
    om.file = new File(D + jobs[k][2]);
    L('en cola: ' + jobs[k][2]);
  }
  proj.save(new File('C:/Users/Naial/Downloads/zeta/assets-src/ae/mux-audio.aep'));
  rq.queueInAME(true);
  L('enviado a Media Encoder');
} catch (e) { var m = ''; try { m = e.message + ' @' + e.line; } catch (x) { m = 'sin detalle'; } L('ERROR ' + m); }
L('FIN');
