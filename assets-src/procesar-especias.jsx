// Photoshop: recorta a cuadrado 1600x1600, afina y exporta JPG 80.
// Carpeta de entrada: especias/wallpapers/original  ->  salida: especias/wallpapers/procesadas
#target photoshop
app.displayDialogs = DialogModes.NO;
var origen = new Folder('C:/Users/Naial/Downloads/zeta/assets-src/especias/wallpapers/original');
var destino = new Folder('C:/Users/Naial/Downloads/zeta/assets-src/especias/wallpapers/procesadas');
if (!destino.exists) destino.create();
var logFile = new File(destino + '/_log.txt');
logFile.open('w');
var files = origen.getFiles('*.jpg');
var oldUnits = app.preferences.rulerUnits;
app.preferences.rulerUnits = Units.PIXELS;
for (var i = 0; i < files.length; i++) {
  var outName = decodeURI(files[i].name).replace(/\.jpg$/i, '') + '.jpg';
  try {
    var doc = app.open(files[i]);
    var w = doc.width.as('px'), h = doc.height.as('px');
    var s = Math.min(w, h);
    var l = (w - s) / 2, t = (h - s) / 2;
    doc.crop([l, t, l + s, t + s]);
    doc.resizeImage(UnitValue(1600, 'px'), UnitValue(1600, 'px'), null, ResampleMethod.BICUBICSHARPER);
    doc.activeLayer.applyUnSharpMask(40, 1.0, 0);
    var opts = new ExportOptionsSaveForWeb();
    opts.format = SaveDocumentType.JPEG;
    opts.quality = 80;
    opts.optimized = true;
    doc.exportDocument(new File(destino + '/' + outName), ExportType.SAVEFORWEB, opts);
    doc.close(SaveOptions.DONOTSAVECHANGES);
    logFile.writeln('OK ' + outName);
  } catch (e) {
    logFile.writeln('ERROR ' + outName + ': ' + e);
  }
}
app.preferences.rulerUnits = oldUnits;
logFile.writeln('FIN');
logFile.close();
