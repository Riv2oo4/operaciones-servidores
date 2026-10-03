(function () {
  var $ = function (id) { return document.getElementById(id); };
  var st = null, offset = 0, es = null, token = leer('os_token');
  var faseAnterior = null, alarmaVista = false, ptsAnteriores = null;

  function leer(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function guardar(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  // ---------------- Conexión ----------------
  function conectar() {
    if (es) es.close();
    es = new EventSource('/eventos?rol=jugador&token=' + encodeURIComponent(token || ''));
    es.onmessage = function (ev) {
      st = JSON.parse(ev.data);
      offset = st.ahora - Date.now();
      render();
    };
    es.onerror = function () { if (!st) mostrar('pDesconectado'); };
  }
  function api(accion, cuerpo) {
    cuerpo = cuerpo || {};
    cuerpo.token = token;
    return fetch('/api/' + accion, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) })
      .then(function (r) {
        return r.json().then(function (j) {
          if (r.status === 401) { token = null; guardar('os_token', null); conectar(); }
          if (!j || typeof j !== 'object') j = { error: 'Algo falló. Intenta de nuevo.' };
          return j;
        });
      })
      .catch(function () { aviso('Sin conexión con el servidor 📡', true); return { error: 'red' }; });
  }

  var tToast = null;
  function aviso(txt, mal) {
    var t = $('toast');
    t.textContent = txt; t.className = 'toast' + (mal ? ' mal' : '');
    clearTimeout(tToast); tToast = setTimeout(function () { t.className = 'toast oculto'; }, 2600);
  }
  function vibrar(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} }

  // Al terminar una ronda, el celular queda limpio para el siguiente grupo
  function limpiarRonda() {
    ptsAnteriores = null; alarmaVista = false; objetivoAnt = null; fotos = [];
    ['nombreEq', 'hackInput', 'protInput', 'wifiInput', 'dueloClave', 'dueloInput'].forEach(function (id) { $(id).value = ''; });
    $('pptMini').innerHTML = ''; $('iaPred').textContent = ''; $('alarma').classList.add('oculto');
    $('protInput').dispatchEvent(new Event('input'));
    limpiarLienzo();
  }
  var SECCIONES = ['pUnirse', 'pLobby', 'pIa', 'pPpt', 'pHuellas', 'pClaves', 'pDuelo', 'pWifi', 'pFinal', 'pDesconectado'];
  function mostrar(id) { SECCIONES.forEach(function (s) { $(s).classList.toggle('oculto', s !== id); }); }

  // ---------------- Render general ----------------
  function render() {
    if (!st.yo) {
      $('cab').classList.add('oculto');
      mostrar('pUnirse');
      if (faseAnterior !== null || ptsAnteriores !== null) limpiarRonda();
      faseAnterior = null;
      return;
    }
    var yo = st.yo;
    $('cab').classList.remove('oculto');
    $('cabColor').style.background = yo.color;
    $('cabIcono').textContent = yo.icono;
    $('cabNombre').textContent = yo.nombre;
    $('cabPts').textContent = yo.total + ' pts';
    if (ptsAnteriores != null && yo.total > ptsAnteriores) aviso('+' + (yo.total - ptsAnteriores) + ' puntos 🎉');
    ptsAnteriores = yo.total;

    var entrando = st.fase !== faseAnterior;
    faseAnterior = st.fase;
    if (entrando) window.scrollTo(0, 0);
    Array.prototype.forEach.call(document.querySelectorAll('.mision-tag'), function (el) { el.textContent = 'MISIÓN ' + st.numMision; });
    Array.prototype.forEach.call(document.querySelectorAll('.pj'), function (el) { el.textContent = st.personaje; });

    if (st.fase !== 'wifi') $('alarma').classList.add('oculto');
    if (st.fase === 'lobby') { mostrar('pLobby'); renderLobby(); }
    else if (st.fase === 'ia') { mostrar('pIa'); renderIa(entrando); }
    else if (st.fase === 'ppt') { mostrar('pPpt'); renderPpt(entrando); }
    else if (st.fase === 'duelo') { mostrar('pDuelo'); renderDuelo(entrando); }
    else if (st.fase === 'huellas') { mostrar('pHuellas'); renderHuellas(); }
    else if (st.fase === 'contrasenas') { mostrar('pClaves'); renderClaves(entrando); }
    else if (st.fase === 'wifi') { mostrar('pWifi'); renderWifi(entrando); }
    else if (st.fase === 'final') { mostrar('pFinal'); renderFinal(); }
    reloj();
  }

  function reloj() {
    var r = $('reloj');
    if (!st || !st.finFase || !st.yo || st.fase === 'lobby' || st.fase === 'final') { r.classList.add('oculto'); return; }
    var resta = Math.max(0, Math.round((st.finFase - (Date.now() + offset)) / 1000));
    r.classList.remove('oculto');
    r.textContent = resta > 0 ? Math.floor(resta / 60) + ':' + String(resta % 60).padStart(2, '0') : '⏰ 0:00';
    r.classList.toggle('urgente', resta <= 30);
  }
  setInterval(reloj, 500);

  // ---------------- Unirse ----------------
  var lineas = ['> conectando a servidor.taller ...', '> firewall detectado ...', '> buscando vulnerabilidad ...', '> ingrese apodo de hacker_'];
  (function escribir(i, j) {
    var t = $('termUnirse');
    if (i >= lineas.length) return;
    if (j === 0 && i === 0) t.textContent = '';
    t.textContent += lineas[i][j] || '';
    if (j < lineas[i].length) setTimeout(function () { escribir(i, j + 1); }, 28);
    else { t.textContent += '\n'; setTimeout(function () { escribir(i + 1, 0); }, 250); }
  })(0, 0);

  $('btnUnirse').onclick = function () {
    var n = $('nombreEq').value.trim();
    if (n.length < 2) { aviso('Escribe tu apodo', true); return; }
    $('btnUnirse').disabled = true;
    api('unirse', { nombre: n }).then(function (r) {
      $('btnUnirse').disabled = false;
      if (r.error) { aviso(r.error, true); $('nombreEq').classList.remove('sacudir'); void $('nombreEq').offsetWidth; $('nombreEq').classList.add('sacudir'); return; }
      token = r.token; guardar('os_token', token);
      vibrar(80);
      conectar();
    });
  };
  $('nombreEq').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('btnUnirse').click(); });

  function renderLobby() {
    var n = st.equipos.length;
    $('lobbyEquipos').innerHTML = '<p class="suave" style="width:100%;margin:0 0 4px">' + n + (n === 1 ? ' hacker conectado' : ' hackers conectados') + '</p>' + st.equipos.slice(0, 40).map(function (e) {
      return '<span class="chip" style="font-size:13px;padding:4px 10px">' + e.icono + ' ' + esc(e.nombre) + '</span>';
    }).join('');
  }

  // ---------------- Fase 1: IA ----------------
  var lienzo = $('lienzo'), ctx = lienzo.getContext('2d'), dibujando = false, hayTinta = false, ultimo = null;
  function limpiarLienzo() {
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, lienzo.width, lienzo.height);
    hayTinta = false; $('iaPred').textContent = '';
  }
  limpiarLienzo();
  function pos(e) {
    var r = lienzo.getBoundingClientRect();
    return { x: (e.clientX - r.left) * lienzo.width / r.width, y: (e.clientY - r.top) * lienzo.height / r.height };
  }
  lienzo.addEventListener('pointerdown', function (e) { dibujando = true; ultimo = pos(e); lienzo.setPointerCapture(e.pointerId); punto(ultimo, ultimo); });
  lienzo.addEventListener('pointermove', function (e) { if (!dibujando) return; var p = pos(e); punto(ultimo, p); ultimo = p; });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) { lienzo.addEventListener(t, function () { dibujando = false; }); });
  function punto(a, b) {
    ctx.strokeStyle = '#111'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x + 0.01, b.y); ctx.stroke();
    hayTinta = true;
  }
  // Convierte el dibujo en 256 números (16x16), recortado y centrado
  function vectorizar() {
    var W = lienzo.width, H = lienzo.height;
    var d = ctx.getImageData(0, 0, W, H).data;
    var x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      if (d[(y * W + x) * 4] < 128) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    if (x1 < 0) return null;
    var lado = Math.max(x1 - x0, y1 - y0) + 24;
    var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    var peq = document.createElement('canvas'); peq.width = 16; peq.height = 16;
    var pc = peq.getContext('2d');
    pc.fillStyle = '#fff'; pc.fillRect(0, 0, 16, 16);
    pc.imageSmoothingEnabled = true; pc.imageSmoothingQuality = 'high';
    pc.drawImage(lienzo, cx - lado / 2, cy - lado / 2, lado, lado, 0, 0, 16, 16);
    var pd = pc.getImageData(0, 0, 16, 16).data, v = [], norma = 0;
    for (var i = 0; i < 256; i++) { var t = 1 - pd[i * 4] / 255; v.push(t); norma += t * t; }
    norma = Math.sqrt(norma) || 1;
    return v.map(function (x) { return Math.round(x / norma * 10000) / 10000; });
  }
  $('btnBorrar').onclick = limpiarLienzo;
  $('btnDeshacer').onclick = function () { api('ia/deshacer').then(function () { aviso('Se quitó el último dibujo'); }); };
  $('btnPredecir').onclick = function () {
    var v = hayTinta && vectorizar();
    if (!v) { aviso('Primero dibuja algo ✏️', true); return; }
    api('ia/predecir', { v: v }).then(function (r) {
      if (r.error) { aviso(r.error, true); return; }
      var c = st.clases.find(function (x) { return x.id === r.clase; }) || {};
      $('iaPred').innerHTML = 'Tu IA cree que es: ' + c.emoji + ' ' + esc(c.nombre) + ' <span class="suave">(' + Math.round(r.confianza * 100) + '% segura)</span>';
    });
  };
  function guardarMuestra(clase) {
    var v = hayTinta && vectorizar();
    if (!v) { aviso('Primero dibuja algo ✏️', true); return; }
    api('ia/muestra', { clase: clase, v: v }).then(function (r) {
      if (r.error) { aviso(r.error, true); return; }
      vibrar(30); limpiarLienzo();
    });
  }
  var botonesIaHechos = false;
  function renderIa(entrando) {
    var cl = st.clases, yo = st.yo;
    $('iaInstr').innerHTML = 'Una IA aprende viendo <b>ejemplos</b>. Dibuja varios ' + cl.map(function (c) { return c.emoji + ' <b>' + esc(c.nombre) + '</b>'; }).join(' y ') +
      ' y guárdalos. Al final probamos tu IA con los dibujos de <b>los demás</b>. ¡Gana la IA que más acierte!';
    if (!botonesIaHechos) {
      $('iaBotones').innerHTML = cl.map(function (c) { return '<button data-c="' + c.id + '">Guardar como<br>' + c.emoji + ' ' + esc(c.nombre) + '</button>'; }).join('');
      Array.prototype.forEach.call($('iaBotones').querySelectorAll('button'), function (b) { b.onclick = function () { guardarMuestra(b.getAttribute('data-c')); }; });
      botonesIaHechos = true;
    }
    $('iaContadores').innerHTML = cl.map(function (c) {
      var n = yo.ia.muestras[c.id] || 0;
      return '<span class="chip" style="' + (n >= 5 ? 'border-color:var(--verde)' : '') + '">' + c.emoji + ' ' + n + ' / 5+</span>';
    }).join('');
    var rev = st.revelado && yo.ia.precision != null;
    $('iaJuego').classList.toggle('oculto', rev);
    $('iaResultado').classList.toggle('oculto', !rev);
    if (rev) {
      $('iaResultado').innerHTML = '<p>Tu IA acertó</p><div class="grande">' + yo.ia.precision + '%</div><p class="suave">' + esc(yo.ia.nota || '') + '</p>' +
        '<p style="font-size:20px;font-weight:800">+' + yo.puntos.ia + ' puntos</p>' +
        '<p>' + (yo.ia.precision >= 80 ? '🏆 ¡Entrenaste muy bien a tu IA!' : yo.ia.precision >= 60 ? '👍 Nada mal. Con más y mejores ejemplos aprendería más.' : '🤔 Tu IA se confundió. Una IA es tan buena como los datos que le damos.') + '</p>';
    }
  }


  // ---------------- Misión: piedra, papel o tijera con fotos ----------------
  var fotos = [], pptListo = false, pptOcupado = false;
  function leerFoto(input, listo) {
    var f = input.files && input.files[0];
    input.value = '';
    if (!f) return;
    var url = URL.createObjectURL(f), img = new Image();
    img.onload = function () {
      var v = null, mini = '';
      try {
        v = Rasgos.deImagen(img);
        var c = document.createElement('canvas'); c.width = c.height = 104;
        var w = img.naturalWidth, h = img.naturalHeight, l = Math.min(w, h);
        c.getContext('2d').drawImage(img, (w - l) / 2, (h - l) / 2, l, l, 0, 0, 104, 104);
        mini = c.toDataURL('image/jpeg', 0.6);
      } catch (e) {}
      URL.revokeObjectURL(url);
      if (!v) { aviso('No se pudo leer la foto 😕', true); return; }
      listo(v, mini);
    };
    img.onerror = function () { URL.revokeObjectURL(url); aviso('No se pudo leer la foto 😕', true); };
    img.src = url;
  }
  function ocupar(si) {
    pptOcupado = si;
    Array.prototype.forEach.call(document.querySelectorAll('#pPpt .foto-btn'), function (b) { b.classList.toggle('ocupado', si); });
  }
  function construirPpt() {
    $('pptBotones').innerHTML = st.clasesPpt.map(function (c) {
      return '<label class="foto-btn"><span class="em">' + c.emoji + '</span>📷 ' + esc(c.nombre) + '<small id="pptN_' + c.id + '">0 fotos</small><input type="file" accept="image/*" capture="environment" data-c="' + c.id + '"></label>';
    }).join('');
    Array.prototype.forEach.call($('pptBotones').querySelectorAll('input'), function (inp) {
      inp.addEventListener('change', function () {
        var clase = inp.getAttribute('data-c');
        leerFoto(inp, function (v, mini) {
          ocupar(true);
          api('ppt/muestra', { clase: clase, v: v }).then(function (r) {
            ocupar(false);
            if (r.error) { aviso(r.error, true); return; }
            var c = st.clasesPpt.find(function (x) { return x.id === clase; });
            fotos.push({ mini: mini, emoji: c.emoji }); pintarMini(); vibrar(30);
          });
        });
      });
    });
    $('pptRetoCaja').innerHTML =
      '<div id="pptBloq" class="reto-caja suave">🔒 Toma al menos <b>2 fotos de cada gesto</b> para desbloquear el reto.</div>' +
      '<div id="pptUltimo" class="reto-caja oculto"></div>' +
      '<button id="pptPedir" class="oculto" style="width:100%;margin-top:10px;font-size:18px">🎲 PEDIR RETO</button>' +
      '<div id="pptActivo" class="reto-caja oculto"><div>Haz este gesto y tómale foto:</div><div class="gesto" id="pptGesto"></div><b id="pptGestoN" style="font-size:22px"></b>' +
      '<label class="foto-btn" style="margin-top:12px">📷 TOMAR FOTO DEL RETO<input type="file" accept="image/*" capture="environment" id="pptRetoInput"></label></div>' +
      '<div id="pptAgotado" class="reto-caja oculto"></div>';
    $('pptPedir').onclick = function () { api('ppt/reto').then(function (r) { if (r.error) aviso(r.error, true); }); };
    $('pptRetoInput').addEventListener('change', function () {
      leerFoto($('pptRetoInput'), function (v) {
        ocupar(true);
        api('ppt/jugar', { v: v }).then(function (r) {
          ocupar(false);
          if (r.error) { aviso(r.error, true); return; }
          vibrar(r.acierto ? [80, 40, 160] : [60, 40, 60]);
        });
      });
    });
    pptListo = true;
  }
  function pintarMini() {
    $('pptMini').innerHTML = fotos.map(function (f) { return '<div><img src="' + f.mini + '" alt=""><span>' + f.emoji + '</span></div>'; }).join('');
  }
  $('pptDeshacer').onclick = function () {
    api('ppt/deshacer').then(function () { fotos.pop(); pintarMini(); aviso('Se quitó la última foto'); });
  };
  function clasePpt(id) { return st.clasesPpt.find(function (x) { return x.id === id; }) || {}; }
  function renderPpt(entrando) {
    if (!pptListo) construirPpt();
    var yo = st.yo, m = yo.ppt.muestras, totalFotos = 0;
    st.clasesPpt.forEach(function (c) { var n = m[c.id] || 0; totalFotos += n; $('pptN_' + c.id).textContent = n + (n === 1 ? ' foto' : ' fotos'); });
    if (totalFotos === 0 && fotos.length) { fotos = []; pintarMini(); }
    var rev = st.revelado;
    $('pptJuego').classList.toggle('oculto', rev);
    $('pptResultado').classList.toggle('oculto', !rev);
    $('pptRetos').textContent = yo.ppt.aciertos + ' ✔ de ' + yo.ppt.retos + ' (máx. ' + st.maxRetos + ')';
    var listo = st.clasesPpt.every(function (c) { return (m[c.id] || 0) >= 2; });
    var agotado = yo.ppt.retos >= st.maxRetos, activo = !!yo.pptReto && !agotado;
    $('pptBloq').classList.toggle('oculto', listo);
    $('pptPedir').classList.toggle('oculto', !listo || activo || agotado);
    $('pptActivo').classList.toggle('oculto', !listo || !activo);
    $('pptAgotado').classList.toggle('oculto', !agotado);
    if (activo) { var g = clasePpt(yo.pptReto); $('pptGesto').textContent = g.emoji; $('pptGestoN').textContent = (g.nombre || '').toUpperCase(); }
    if (agotado) $('pptAgotado').innerHTML = '🏁 Usaste tus ' + st.maxRetos + ' retos: <b class="verde">' + yo.ppt.aciertos + ' aciertos</b>. Puedes seguir tomando fotos para sumar puntos.';
    var u = yo.pptUltimo;
    $('pptUltimo').classList.toggle('oculto', !u || activo);
    if (u) {
      var visto = clasePpt(u.visto), pedido = clasePpt(u.pedido), jug = clasePpt(u.jugada);
      $('pptUltimo').innerHTML = (u.acierto
        ? '<b class="verde" style="font-size:20px">✅ ¡Tu IA te reconoció!</b>'
        : '<b class="rojo" style="font-size:20px">❌ Tu IA se confundió</b>') +
        '<div class="versus"><div>' + pedido.emoji + '<small>tú</small></div><div style="font-size:22px">→</div><div>' + visto.emoji + '<small>la IA vio (' + u.confianza + '%)</small></div></div>' +
        (u.acierto ? '<p>…y jugó ' + jug.emoji + ' <b>' + esc(jug.nombre) + '</b> para ganarte 😎 <b class="verde">+15 pts</b></p>' : '<p class="suave">Dale más fotos de ' + pedido.emoji + ' para que aprenda.</p>');
    }
    if (rev) {
      $('pptResultado').innerHTML = '<p>Tu IA acertó</p><div class="grande">' + yo.ppt.aciertos + ' / ' + yo.ppt.retos + '</div><p class="suave">retos con ' + totalFotos + ' fotos de entrenamiento</p>' +
        (yo.ppt.cruzada != null ? '<p>Con las manos de <b>los demás</b> acertó: <b class="mono" style="font-size:22px">' + yo.ppt.cruzada + '%</b></p><p class="suave">Una IA solo conoce los datos con los que fue entrenada. Eso se llama <b>sesgo</b>.</p>' : '') +
        '<p style="font-size:20px;font-weight:800">+' + yo.puntos.ppt + ' puntos</p>';
    }
  }

  // ---------------- Misión: duelo de contraseñas ----------------
  var objetivoAnt = null;
  function soloClave(v) { return v.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, ''); }
  $('dueloClave').addEventListener('input', function () { $('dueloClave').value = soloClave($('dueloClave').value).slice(0, st.dueloReglas.maximo); });
  $('dueloInput').addEventListener('input', function () { $('dueloInput').value = soloClave($('dueloInput').value); });
  $('dueloGuardar').onclick = function () {
    api('duelo/crear', { clave: $('dueloClave').value }).then(function (r) {
      if (r.error) { aviso(r.error, true); return; }
      vibrar(60); aviso('🔒 Bóveda cerrada');
    });
  };
  $('dueloBtn').onclick = function () {
    var v = $('dueloInput').value;
    if (!v) return;
    $('dueloBtn').disabled = true;
    api('duelo/atacar', { intento: v }).then(function (r) {
      $('dueloBtn').disabled = false;
      if (r.error) { aviso(r.error, true); return; }
      $('dueloInput').value = '';
      if (r.abierta) { vibrar([100, 50, 200]); aviso('🔓 ¡BÓVEDA ABIERTA! +20'); }
      else vibrar(30);
    });
  };
  $('dueloInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('dueloBtn').click(); });
  $('dueloClave').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('dueloGuardar').click(); });
  function casillas(texto, fb) {
    var h = '<div class="casillas">';
    for (var i = 0; i < texto.length; i++) h += '<span class="' + (fb ? fb[i] : (texto[i] !== '_' ? 'v' : '')) + '">' + (texto[i] === '_' ? '' : esc(texto[i])) + '</span>';
    return h + '</div>';
  }
  function renderDuelo(entrando) {
    var yo = st.yo, d = yo.dueloDetalle || {}, etapa = st.dueloEtapa, rev = st.revelado;
    $('dueloCrear').classList.toggle('oculto', etapa !== 'crear');
    $('dueloAtacar').classList.toggle('oculto', etapa !== 'atacar' || rev);
    $('dueloFin').classList.toggle('oculto', !rev);
    $('dueloReglas').textContent = 'De ' + st.dueloReglas.minimo + ' a ' + st.dueloReglas.maximo + ' letras o números. Entre más larga y rara, más difícil de romper.';
    $('dueloClave').maxLength = st.dueloReglas.maximo;
    $('dueloGuardada').classList.toggle('oculto', !d.miClave);
    if (d.miClave) $('dueloGuardada').innerHTML = '✅ Tu contraseña: <b class="mono verde" style="font-size:20px">' + esc(d.miClave) + '</b><br><span class="suave">Puedes cambiarla hasta que empiece el ataque. ¡Que nadie la vea!</span>';
    if (etapa === 'atacar' && !rev) {
      var o = d.objetivo;
      $('dueloInput').classList.toggle('oculto', !o); $('dueloBtn').classList.toggle('oculto', !o);
      if (o) {
        if (objetivoAnt !== o.id) { $('dueloInput').value = ''; objetivoAnt = o.id; }
        $('dueloInput').maxLength = o.largo;
        $('dueloInput').placeholder = o.largo + ' caracteres';
        $('dueloObjetivo').innerHTML = '<div class="objetivo" style="border-color:' + o.color + '"><div class="suave">🎯 Tu objetivo</div><div style="font-size:22px;font-weight:900">' + o.icono + ' ' + esc(o.nombre) + '</div>' + casillas(o.verdes) + '<div class="suave">' + o.largo + ' caracteres · intentos: ' + o.numIntentos + '</div></div>';
        $('dueloHistorial').innerHTML = o.intentos.map(function (i) { return casillas(i.g, i.fb); }).join('');
      } else {
        $('dueloObjetivo').innerHTML = '<div class="exito"><div class="big">🏆</div><h2 class="verde">¡Abriste todas las bóvedas!</h2></div>';
        $('dueloHistorial').innerHTML = '';
      }
      var mia = yo.duelo;
      $('dueloMia').innerHTML = '<b>Tu bóveda</b> <span class="mono suave">(' + esc(d.miClave || '') + ')</span><br>' +
        (d.defecto ? '<span class="rojo">⚠️ No creaste contraseña: te tocó <b>1234</b></span><br>' : '') +
        (mia.abiertaPor ? '<span class="rojo">💀 La abrió ' + esc(mia.abiertaPor) + '</span>' : '<span class="verde">🔒 Sigue cerrada</span> · tu atacante lleva ' + Math.round(mia.progreso * 100) + '%') +
        '<br>Bóvedas que has abierto: <b>' + mia.abiertas + '</b>';
    }
    if (rev) {
      var m2 = yo.duelo;
      $('dueloFin').innerHTML = (m2.abiertaPor
        ? '<div style="font-size:60px">💀</div><p>Tu bóveda fue abierta por <b>' + esc(m2.abiertaPor) + '</b></p>'
        : '<div style="font-size:60px">🛡️</div><p class="verde" style="font-weight:800">¡Tu bóveda sobrevivió!</p>') +
        '<p>Bóvedas que abriste: <b>' + m2.abiertas + '</b></p><p style="font-size:20px;font-weight:800">+' + yo.puntos.duelo + ' puntos</p>' +
        '<p class="suave">Cada carácter extra multiplica el trabajo del hacker.</p>';
    }
  }

  // ---------------- Fase 2: Huellas ----------------
  var perfilHecho = false, perfilEscucha = false;
  function segsHtml(segs) {
    return segs.map(function (s) { return s.id ? '<span class="tap" data-s="' + s.id + '">' + esc(s.t) + '</span>' : esc(s.t); }).join('');
  }
  function construirPerfil(p) {
    var h = '<div class="cab"><div class="av">' + p.avatar + '</div><div><b style="font-size:17px">' + esc(p.nombre) + '</b><div style="color:#666">' + esc(p.usuario) + ' · ' + p.seguidores + ' seguidores</div></div></div>';
    h += '<div class="bio">' + segsHtml(p.bio) + '</div>';
    p.posts.forEach(function (post) {
      h += '<div class="post"><div class="foto">' + post.foto + '</div><div class="likes">❤️ ' + post.likes + ' Me gusta</div><div class="txt">' + segsHtml(post.texto) + '</div>';
      if (post.comentario) h += '<div class="com">💬 <b>' + esc(post.comentario.autor) + '</b> ' + segsHtml(post.comentario.texto) + '</div>';
      h += '</div>';
    });
    $('perfil').innerHTML = h;
    if (perfilEscucha) { perfilHecho = p.usuario; return; }
    perfilEscucha = true;
    $('perfil').addEventListener('click', function (e) {
      var t = e.target.closest('.tap');
      if (!t || t.classList.contains('ok') || t.classList.contains('no')) return;
      var seg = t.getAttribute('data-s');
      api('huellas/tocar', { seg: seg }).then(function (r) {
        if (r.error) { aviso(r.error, true); return; }
        if (r.repetido) return;
        if (r.ok) { t.classList.add('ok'); vibrar(60); aviso(r.icono + ' ¡Dato encontrado! ' + r.nombre); }
        else { t.classList.add('no'); vibrar([40, 40, 40]); aviso('❌ Eso no es un dato personal (−3)', true); }
      });
    });
    perfilHecho = p.usuario;
  }
  function renderHuellas() {
    if (st.perfil && perfilHecho !== st.perfil.usuario) construirPerfil(st.perfil);
    var yo = st.yo, toc = yo.segTocados || {};
    Array.prototype.forEach.call(document.querySelectorAll('#perfil .tap'), function (t) {
      var s = toc[t.getAttribute('data-s')];
      t.classList.toggle('ok', s === 'ok'); t.classList.toggle('no', s === 'no');
    });
    $('huCuenta').textContent = yo.huellasDetalle.length + '/' + st.totalPistas;
    $('huBarra').style.width = (100 * yo.huellasDetalle.length / st.totalPistas) + '%';
    $('libreta').innerHTML = yo.huellasDetalle.length ? yo.huellasDetalle.map(function (p) {
      return '<div class="pista"><span class="ic">' + p.icono + '</span><div>' + esc(p.nombre) + ': <b>' + esc(p.valor) + '</b><small>' + esc(p.leccion) + '</small></div></div>';
    }).join('') : '<p class="suave">Aquí aparecerán los datos que encuentres.</p>';
  }

  // ---------------- Fase 3: Contraseñas ----------------
  function tab(b) {
    $('tabA').classList.toggle('act', !b); $('tabB').classList.toggle('act', b);
    $('clA').classList.toggle('oculto', b); $('clB').classList.toggle('oculto', !b);
  }
  $('tabA').onclick = function () { tab(false); };
  $('tabB').onclick = function () { tab(true); };
  $('irB').onclick = function () { tab(true); window.scrollTo(0, 0); };
  $('hackLimpiar').onclick = function () { $('hackInput').value = ''; };
  $('hackChips').addEventListener('click', function (e) {
    var c = e.target.closest('.chip'); if (!c) return;
    $('hackInput').value += c.getAttribute('data-v');
  });
  $('hackBtn').onclick = function () {
    var v = $('hackInput').value.trim();
    if (!v) { aviso('Escribe una contraseña', true); return; }
    $('hackBtn').disabled = true;
    api('hack/intentar', { clave: v }).then(function (r) {
      $('hackBtn').disabled = false;
      if (r.error) { aviso(r.error, true); return; }
      if (r.ok) { vibrar([100, 50, 200]); }
      else {
        vibrar([60, 40, 60]);
        $('hackForm').classList.remove('sacudir'); void $('hackForm').offsetWidth; $('hackForm').classList.add('sacudir');
        aviso('⛔ ACCESO DENEGADO', true);
      }
    });
  };
  $('hackInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('hackBtn').click(); });

  function medidor(r) {
    var colores = ['#ff4d6d', '#ff922b', '#ffd43b', '#a9e34b', '#39ff88'];
    Array.prototype.forEach.call($('medidor').children, function (el, i) { el.style.background = i <= r.nivel ? colores[r.nivel] : ''; });
    $('protTiempo').textContent = r.tiempo;
    $('protTiempo').style.color = colores[r.nivel];
    $('protConsejos').innerHTML = r.consejos.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('');
  }
  function extrasFuerza() { return [st.yo.nombre].concat((st.yo.huellasDetalle || []).map(function (p) { return p.valor; })); }
  $('protInput').addEventListener('input', function () {
    var v = $('protInput').value;
    if (!v) { medidor({ nivel: -1, tiempo: '—', consejos: [] }); return; }
    medidor(Fuerza.evaluar(v, extrasFuerza()));
  });
  $('protBtn').onclick = function () {
    var v = $('protInput').value;
    if (!v) { aviso('Escribe una contraseña', true); return; }
    api('hack/proteger', { clave: v }).then(function (r) {
      if (r.error) { aviso(r.error, true); return; }
      aviso(r.nivel >= 3 ? '🛡️ ¡Contraseña blindada!' : '😬 Un hacker la rompería rápido. ¡Mejórala!', r.nivel < 3);
    });
  };

  function renderClaves(entrando) {
    var yo = st.yo;
    if (entrando) tab(false);
    $('hackChips').innerHTML = (yo.huellasDetalle || []).map(function (p) {
      var v = p.id === 'cumple' ? p.valor : p.valor;
      return '<span class="chip" data-v="' + esc(v.replace(/\s+/g, '')) + '">' + p.icono + ' ' + esc(v) + '</span>';
    }).join('') || '<span class="suave">No tienes datos de Huellas digitales… ¡a adivinar!</span>';
    $('hackForm').classList.toggle('oculto', yo.hack.logrado);
    $('hackExito').classList.toggle('oculto', !yo.hack.logrado);
    if (yo.hack.logrado) $('hackExitoTxt').innerHTML = 'Lo lograste en <b>' + yo.hack.intentos + '</b> intento' + (yo.hack.intentos === 1 ? '' : 's') + ' · <b class="verde">+' + yo.puntos.hack + ' pts</b>';
    $('hackIntentos').textContent = yo.hack.intentos ? 'Intentos: ' + yo.hack.intentos : '';
    $('hackPistas').innerHTML = (yo.pistasHack || []).map(function (p) { return '<div class="pista"><span class="ic">💡</span><div>' + esc(p) + '</div></div>'; }).join('');
    var pr = yo.proteccionDetalle;
    $('protGuardada').classList.toggle('oculto', !pr);
    if (pr) $('protGuardada').innerHTML = '<b>Contraseña guardada (' + pr.largo + ' caracteres)</b><br>Un hacker tardaría: <b class="mono" style="color:' + (pr.nivel >= 3 ? 'var(--verde)' : 'var(--rojo)') + '">' + esc(pr.tiempo) + '</b><br><span class="verde">+' + yo.puntos.proteger + ' pts</span> <span class="suave">(puedes mejorarla)</span>';
  }

  // ---------------- Fase 4: WiFi ----------------
  function cifrar(txt) {
    var bytes = [], k = [];
    for (var i = 0; i < 8; i++) k.push(Math.floor(Math.random() * 256));
    var u = unescape(encodeURIComponent(txt));
    for (var j = 0; j < u.length; j++) bytes.push(u.charCodeAt(j) ^ k[j % 8] ^ ((j * 31) & 255));
    return 'U2FsdGVkX1' + btoa(String.fromCharCode.apply(null, k.concat(bytes))).replace(/=+$/, '');
  }
  $('wifiBtn').onclick = function () {
    var v = $('wifiInput').value.trim();
    if (!v) return;
    var usarCifrado = st.cifrado && $('wifiCifrar').checked;
    $('wifiBtn').disabled = true;
    api('wifi/enviar', usarCifrado ? { texto: v, cifrado: true, cifradoTexto: cifrar(v) } : { texto: v }).then(function (r) {
      $('wifiBtn').disabled = false;
      if (r.error) { aviso(r.error, true); return; }
      $('wifiInput').value = '';
    });
  };
  $('wifiInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('wifiBtn').click(); });
  $('cerrarAlarma').onclick = function () { $('alarma').classList.add('oculto'); };

  function renderWifi(entrando) {
    var yo = st.yo;
    if (entrando) alarmaVista = false;
    if (st.revelado && !alarmaVista) {
      alarmaVista = true;
      $('alarma').classList.remove('oculto');
      vibrar([300, 100, 300, 100, 300]);
    }
    if (!st.revelado) $('alarma').classList.add('oculto');
    $('wifiInstr').innerHTML = st.cifrado
      ? 'Activamos la <b>conexión segura 🔒</b>. Manda otro mensaje con el candado activado y mira qué ve el hacker ahora. <b class="verde">(+25 pts)</b>'
      : 'Estás conectado a un WiFi <b>gratis</b> del salón. Escribe un <b>mensaje secreto</b> para un amigo (por ejemplo, dónde esconderías las respuestas del examen). <span class="rojo">No escribas datos reales.</span>';
    $('wifiBanner').className = 'wifi-banner' + (st.cifrado ? ' seguro' : '');
    $('wifiBanner').innerHTML = st.cifrado ? '🔒 Conexión cifrada: nadie más puede leer tus mensajes' : '📶 Conectado a: <b>WiFi_Gratis</b> (abierta, sin contraseña)';
    $('wifiSwitch').classList.toggle('oculto', !st.cifrado);
    var msgs = yo.mensajes || [];
    $('wifiMensajes').innerHTML = msgs.length ? msgs.map(function (m) {
      return '<div class="burbuja">' + esc(m.texto) + '<small>' + (m.cifrado ? '🔒 cifrado' : '✓✓') + '</small></div>';
    }).join('') : '<p class="suave" style="text-align:center">Aún no hay mensajes</p>';
  }

  // ---------------- Final ----------------
  function renderFinal() {
    var yo = st.yo;
    var lugar = st.equipos.findIndex(function (e) { return e.id === yo.id; }) + 1;
    $('finLugar').textContent = lugar === 1 ? '🥇' : lugar === 2 ? '🥈' : lugar === 3 ? '🥉' : '🎖️';
    $('finTexto').textContent = 'Lugar ' + lugar + ' de ' + st.equipos.length + ' · ' + yo.total + ' puntos';
    var p = yo.puntos;
    $('finDesglose').innerHTML = [
      ['🤖 IA con dibujos', p.ia], ['✊ IA con fotos', p.ppt], ['🕵️ Huellas digitales', p.huellas], ['🔓 Hackear a ' + st.personaje, p.hack],
      ['🛡️ Proteger cuenta', p.proteger], ['⚔️ Duelo de contraseñas', p.duelo], ['📶 WiFi gratis', p.wifi], ['⭐ Extra', p.extra]
    ].filter(function (x) { return x[1]; })
      .map(function (x) { return '<div><span>' + x[0] + '</span><b>' + x[1] + '</b></div>'; }).join('');
  }

  conectar();
})();
