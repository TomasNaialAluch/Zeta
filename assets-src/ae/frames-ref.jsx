var f = new File('C:/Users/Naial/Downloads/zeta/assets-src/ae/_probe.txt'); f.open('w');
try {
  var map = {};
  for (var i = 1; i <= app.project.numItems; i++) { map[app.project.item(i).name] = app.project.item(i); }
  var out = 'C:/Users/Naial/Downloads/zeta/assets-src/ai-videos/';
  var jobs = [['ZETA_V5_granos', 0, 'zeta-negro.png'], ['ZETA_V5_granos', 5.8, 'zeta-pimientas.png'],
              ['ZETA_V6_remolino', 1.8, 'zeta-especias.png'], ['ZETA_V7_polvo', 4.6, 'zeta-polvo.png']];
  for (var j = 0; j < jobs.length; j++) { map[jobs[j][0]].saveFrameToPng(jobs[j][1], new File(out + jobs[j][2])); }
  f.writeln('ok');
} catch (e) { f.writeln('ERR ' + e.message); }
f.close();
