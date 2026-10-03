// Convierte una foto en "rasgos" (números) que la IA puede comparar.
// Usa HOG: mide hacia dónde apuntan los bordes de la imagen en cada zona.
(function (root) {
  var LADO = 48, CELDA = 12, BINS = 9;
  var NC = LADO / CELDA;

  // gris: arreglo de LADO*LADO valores 0..255
  function hog(gris) {
    var v = new Array(NC * NC * BINS).fill(0);
    for (var y = 1; y < LADO - 1; y++) {
      for (var x = 1; x < LADO - 1; x++) {
        var gx = gris[y * LADO + x + 1] - gris[y * LADO + x - 1];
        var gy = gris[(y + 1) * LADO + x] - gris[(y - 1) * LADO + x];
        var mag = Math.sqrt(gx * gx + gy * gy);
        if (mag < 1e-6) continue;
        var ang = Math.atan2(gy, gx); if (ang < 0) ang += Math.PI; // sin signo: 0..π
        var pos = ang / Math.PI * BINS, b0 = Math.floor(pos) % BINS, b1 = (b0 + 1) % BINS, f = pos - Math.floor(pos);
        // reparte el borde entre las 4 celdas vecinas: tolera que la mano se mueva un poco
        var cy = (y + 0.5) / CELDA - 0.5, cx = (x + 0.5) / CELDA - 0.5, y0 = Math.floor(cy), x0 = Math.floor(cx);
        for (var dy = 0; dy < 2; dy++) for (var dx = 0; dx < 2; dx++) {
          var yy = y0 + dy, xx = x0 + dx;
          if (yy < 0 || xx < 0 || yy >= NC || xx >= NC) continue;
          var w = (dy ? cy - y0 : 1 - (cy - y0)) * (dx ? cx - x0 : 1 - (cx - x0));
          var c = yy * NC + xx;
          v[c * BINS + b0] += mag * (1 - f) * w;
          v[c * BINS + b1] += mag * f * w;
        }
      }
    }
    normalizar(v);
    for (var i = 0; i < v.length; i++) if (v[i] > 0.2) v[i] = 0.2; // evita que un borde fuerte domine
    normalizar(v);
    return v.map(function (n) { return Math.round(n * 10000) / 10000; });
  }
  function normalizar(v) {
    var s = 0, i;
    for (i = 0; i < v.length; i++) s += v[i] * v[i];
    s = Math.sqrt(s) || 1;
    for (i = 0; i < v.length; i++) v[i] /= s;
  }

  // En el navegador: de una imagen (foto) a rasgos
  function deImagen(img) {
    var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    var lado = Math.min(w, h), sx = (w - lado) / 2, sy = (h - lado) / 2;
    var pasos = [192, 96, LADO], origen = img, ox = sx, oy = sy, ol = lado, c;
    for (var i = 0; i < pasos.length; i++) { // reducir poco a poco para no perder calidad
      c = document.createElement('canvas'); c.width = c.height = pasos[i];
      var ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(origen, ox, oy, ol, ol, 0, 0, pasos[i], pasos[i]);
      origen = c; ox = 0; oy = 0; ol = pasos[i];
    }
    var d = c.getContext('2d').getImageData(0, 0, LADO, LADO).data, gris = [];
    for (var p = 0; p < LADO * LADO; p++) gris.push(0.299 * d[p * 4] + 0.587 * d[p * 4 + 1] + 0.114 * d[p * 4 + 2]);
    return hog(gris);
  }

  var api = { hog: hog, deImagen: deImagen, LADO: LADO, DIM: NC * NC * BINS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Rasgos = api;
})(this);
