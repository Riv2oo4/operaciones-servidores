(function () {
  var $ = function (id) { return document.getElementById(id); };
  // El PIN se guarda y se quita de la barra de direcciones para que no se vea en el proyector
  var pin = new URLSearchParams(location.search).get('pin') || '';
  try {
    if (pin) { sessionStorage.setItem('os_pin', pin); history.replaceState(null, '', location.pathname); }
    else pin = sessionStorage.getItem('os_pin') || '';
  } catch (e) {}
  var st = null, offset = 0, audio = null, faseAnt = null, revAnt = false, qrHecho = '', etapaAnt = null;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  // ---------------- Sonido (sin archivos) ----------------
  $('sonido').onclick = function () {
    try { audio = new (window.AudioContext || window.webkitAudioContext)(); beep(660, .12); } catch (e) {}
    $('sonido').classList.add('oculto');
  };
  function beep(f, dur, tipo, cuando) {
    if (!audio) return;
    var o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime + (cuando || 0);
    o.type = tipo || 'square'; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(.08, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(audio.destination); o.start(t); o.stop(t + dur);
  }
  function sirena() { for (var i = 0; i < 6; i++) { beep(880, .22, 'sawtooth', i * .45); beep(620, .22, 'sawtooth', i * .45 + .22); } }
  function fanfarria() { [523, 659, 784, 1047].forEach(function (f, i) { beep(f, .3, 'triangle', i * .15); }); }
  function blip() { beep(1200, .05, 'square'); }

  // ---------------- Conexión ----------------
  function conectar() {
    var es = new EventSource('/eventos?rol=pantalla&pin=' + encodeURIComponent(pin));
    es.onmessage = function (ev) {
      st = JSON.parse(ev.data);
      offset = st.ahora - Date.now();
      $('error').classList.add('oculto');
      render();
    };
    es.onerror = function () {
      if (!st) { $('error').innerHTML = '🔒 No se pudo conectar.<br><span class="suave">Abre esta página con tu PIN: /pantalla?pin=TU_PIN<br>(si fallaste varias veces, espera 1 minuto)</span>'; $('error').classList.remove('oculto'); }
    };
  }

  function qr(texto) {
    var q = qrcode(0, 'M');
    q.addData(unescape(encodeURIComponent(texto)), 'Byte');
    q.make();
    return q.createDataURL(10, 2);
  }
  function wifiQr(ssid, clave) {
    var e = function (s) { return String(s).replace(/([\\;,:"])/g, '\\$1'); };
    return 'WIFI:T:WPA;S:' + e(ssid) + ';P:' + e(clave) + ';;';
  }

  var NOMBRES_FASE = { lobby: 'ESPERANDO HACKERS', final: 'FIN DE LA MISIÓN' };
  var VISTAS = { lobby: 'vLobby', ia: 'vIa', ppt: 'vPpt', huellas: 'vHuellas', contrasenas: 'vClaves', duelo: 'vDuelo', wifi: 'vWifi', final: 'vFinal' };

  function render() {
    $('grupo').textContent = 'Grupo ' + st.grupo + ' · ' + st.grupoNombre;
    $('latGrupo').textContent = st.grupo;
    Array.prototype.forEach.call(document.querySelectorAll('.pj'), function (el) { el.textContent = st.personaje; });
    $('faseTxt').textContent = NOMBRES_FASE[st.fase] || ('MISIÓN ' + st.numMision);
    Object.keys(VISTAS).forEach(function (f) { $(VISTAS[f]).classList.toggle('act', f === st.fase); });

    var cambioFase = st.fase !== faseAnt;
    var acabaDeRevelar = st.revelado && !revAnt && !cambioFase;
    if (st.fase === 'duelo' && st.dueloEtapa === 'atacar' && etapaAnt === 'crear') sirena();
    etapaAnt = st.fase === 'duelo' ? st.dueloEtapa : null;
    faseAnt = st.fase; revAnt = st.revelado;

    marcador();
    var final = st.fase === 'final';
    $('latMarcador').classList.toggle('oculto', final);
    $('latRanking').classList.toggle('oculto', !final);

    if (st.fase === 'lobby') lobby();
    if (st.fase === 'ia') ia();
    if (st.fase === 'ppt') ppt();
    if (st.fase === 'duelo') duelo();
    if (st.fase === 'huellas') huellas();
    if (st.fase === 'contrasenas') claves();
    if (st.fase === 'wifi') wifi(acabaDeRevelar);
    if (final) fin(cambioFase);
    document.body.classList.toggle('alarma', st.fase === 'wifi' && st.revelado && !st.cifrado);
    if (acabaDeRevelar) { if (st.fase === 'wifi') sirena(); else fanfarria(); }
    if (cambioFase && st.fase !== 'lobby' && st.fase !== 'final') blip();
    reloj();
  }

  var puntosAnt = {}, MAX_MARCADOR = 12;
  function marcador() {
    var h = st.equipos.slice(0, MAX_MARCADOR).map(function (e, i) {
      var sube = puntosAnt[e.id] != null && e.total > puntosAnt[e.id];
      return '<div class="f" style="border-color:' + e.color + (sube ? ';background:#12301f' : '') + '"><span class="pos">' + (i + 1) + '</span><span>' + e.icono + '</span><span class="n">' + esc(e.nombre) + '</span><span class="p">' + e.total + '</span></div>';
    }).join('');
    st.equipos.forEach(function (e) { puntosAnt[e.id] = e.total; });
    if (st.equipos.length > MAX_MARCADOR) h += '<p class="suave" style="text-align:center;margin:.4em 0 0">… y ' + (st.equipos.length - MAX_MARCADOR) + ' más. Tu lugar sale en tu celular.</p>';
    $('marcador').innerHTML = h || '<p class="suave">Aún no entra nadie</p>';
  }
  // Una ficha por jugador: caben unas 60 en pantalla
  function ficha(e, dato, clase) {
    return '<div class="ficha ' + (clase || '') + '" style="border-left-color:' + e.color + '"><span class="n">' + e.icono + ' ' + esc(e.nombre) + '</span><span class="d">' + dato + '</span></div>';
  }
  function resumen(numero, texto) { return '<div class="resumen"><b>' + numero + '</b> ' + texto + '</div>'; }
  function promedio(lista) { return lista.length ? Math.round(lista.reduce(function (a, b) { return a + b; }, 0) / lista.length) : 0; }
  var TOPE = 8; // filas que caben en tablas y barras

  function reloj() {
    var r = $('reloj');
    if (!st || !st.finFase || st.fase === 'lobby' || st.fase === 'final') { r.classList.add('oculto'); return; }
    var resta = Math.max(0, Math.round((st.finFase - (Date.now() + offset)) / 1000));
    r.classList.remove('oculto');
    r.textContent = Math.floor(resta / 60) + ':' + String(resta % 60).padStart(2, '0');
    r.classList.toggle('urgente', resta <= 30 && resta > 0);
    if (resta === 0 && r.getAttribute('data-fin') !== String(st.finFase)) { r.setAttribute('data-fin', String(st.finFase)); beep(300, .6, 'sawtooth'); }
  }
  setInterval(reloj, 500);

  // ---------------- Vistas ----------------
  function lobby() {
    var w = st.wifi; // en la nube no hay WiFi propio: solo se muestra el QR del juego
    var clave = st.url + '|' + (w ? w.nombre + '|' + w.clave : '');
    if (qrHecho !== clave) {
      $('pasoWifi').style.display = w ? '' : 'none'; $('pasoDatos').style.display = w ? 'none' : '';
      if (w) { $('qrWifi').src = qr(wifiQr(w.nombre, w.clave)); $('ssid').textContent = w.nombre; }
      $('qrUrl').src = qr(st.url);
      $('urlTxt').textContent = st.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
      qrHecho = clave;
    }
    var n = st.equipos.length;
    $('lobbyEq').className = 'equipos-lobby' + (n > 14 ? ' muchos' : '');
    $('vLobby').classList.toggle('muchos-lobby', n > 14);
    $('lobbyEq').innerHTML = (n ? '<div class="cuenta">' + n + (n === 1 ? ' hacker conectado' : ' hackers conectados') + '</div>' : '') + st.equipos.slice(-(n > 14 ? 24 : 14)).map(function (e) { // los últimos en entrar
      return '<span class="chip" style="border-color:' + e.color + '">' + e.icono + ' ' + esc(e.nombre) + '</span>';
    }).join('');
  }

  function ia() {
    var cl = st.clases;
    $('iaSub').innerHTML = 'Dibujen muchos ' + cl.map(function (c) { return c.emoji + ' ' + esc(c.nombre); }).join(' y ') + ' para enseñarle a su IA. Al final probamos cada IA con los dibujos de los demás.';
    var rev = st.revelado;
    $('iaTarjetas').classList.toggle('oculto', rev);
    $('iaBarras').classList.toggle('oculto', !rev);
    if (!rev) {
      var total = 0;
      var fichas = st.equipos.map(function (e) {
        var n = 0, cuenta = cl.map(function (c) { var k = e.ia.muestras[c.id] || 0; n += k; return c.emoji + k; }).join(' ');
        total += n;
        return ficha(e, cuenta, n >= 10 ? 'bien' : '');
      }).join('');
      $('iaTarjetas').innerHTML = resumen(total, 'dibujos para entrenar') + '<div class="fichas">' + fichas + '</div>';
      $('iaLeccion').innerHTML = '💡 Así aprenden las IA de verdad: con <b>millones</b> de ejemplos etiquetados por personas. Su IA solo sabe lo que ustedes le enseñen.';
    } else {
      var orden = st.equipos.slice().sort(function (a, b) { return (b.ia.precision || 0) - (a.ia.precision || 0); });
      var prom = promedio(orden.map(function (e) { return e.ia.precision || 0; }));
      $('iaBarras').innerHTML = '<h2 style="margin:0 0 .6em">🎯 Las IA que más acertaron <span class="suave" style="font-weight:400">· promedio del grupo: ' + prom + '%</span></h2>' + orden.slice(0, TOPE).map(function (e) {
        var p = e.ia.precision || 0;
        return '<div class="b"><span>' + e.icono + ' <b>' + esc(e.nombre) + '</b></span><div class="barra"><i style="width:' + p + '%;background:' + e.color + '"></i></div><span class="v">' + p + '%</span></div>';
      }).join('') + (orden.length > TOPE ? '<p class="suave">Tu resultado está en tu celular.</p>' : '');
      $('iaLeccion').innerHTML = '💡 Una IA es tan buena como sus <b>datos</b>. Más ejemplos y más variados = IA más inteligente. Datos malos = IA confundida.';
    }
  }

  function ppt() {
    var cl = st.clasesPpt, rev = st.revelado;
    $('pptTarjetas').classList.toggle('oculto', rev);
    $('pptBarras').classList.toggle('oculto', !rev);
    if (!rev) {
      var ac = 0, re = 0;
      var fichas = st.equipos.map(function (e) {
        var n = 0; cl.forEach(function (c) { n += e.ppt.muestras[c.id] || 0; });
        ac += e.ppt.aciertos; re += e.ppt.retos;
        return ficha(e, '📷' + n + ' · 🎯' + e.ppt.aciertos + '/' + e.ppt.retos, e.ppt.aciertos >= 3 ? 'bien' : '');
      }).join('');
      $('pptTarjetas').innerHTML = resumen(ac + ' de ' + re, 'retos acertados por las IA') + '<div class="fichas">' + fichas + '</div>';
      $('pptLeccion').innerHTML = '💡 Así funciona el desbloqueo con la cara o los filtros de Instagram: una IA que aprendió con <b>miles de fotos</b>. La suya aprende con las que ustedes le tomen.';
    } else {
      var orden = st.equipos.slice().sort(function (a, b) { return b.puntos.ppt - a.puntos.ppt; });
      var conCruce = orden.filter(function (e) { return e.ppt.cruzada != null; });
      var pProp = promedio(orden.filter(function (e) { return e.ppt.retos; }).map(function (e) { return 100 * e.ppt.aciertos / e.ppt.retos; }));
      var pOtros = promedio(conCruce.map(function (e) { return e.ppt.cruzada; }));
      $('pptBarras').innerHTML = '<h2 style="margin:0 0 .3em">🎯 ¿Reconoce cada IA la mano de su dueño… y la de los demás?</h2>' +
        '<p style="font-size:1.2em;margin:0 0 .7em">Promedio del grupo: con su propia mano <b class="verde">' + pProp + '%</b> · con manos ajenas <b style="color:#8b9bab">' + (conCruce.length ? pOtros + '%' : '—') + '</b></p>' +
        orden.slice(0, TOPE - 2).map(function (e) {
          var propia = e.ppt.retos ? Math.round(100 * e.ppt.aciertos / e.ppt.retos) : 0, cr = e.ppt.cruzada;
          return '<div class="b"><span>' + e.icono + ' <b>' + esc(e.nombre) + '</b></span><div><div class="barra" style="margin-bottom:.3em"><i style="width:' + propia + '%;background:' + e.color + '"></i></div><div class="barra" style="height:.7em"><i style="width:' + (cr || 0) + '%;background:#8b9bab"></i></div></div>' +
            '<span class="v">' + propia + '%<br><span class="suave" style="font-size:.75em">' + (cr == null ? '—' : cr + '%') + '</span></span></div>';
        }).join('') + '<p class="suave">Barra de color: su propia mano (retos) · Barra gris: manos de los demás</p>';
      $('pptLeccion').innerHTML = '💡 La IA reconoce mejor lo que <b>ya vio</b>. Si solo la entrenas con tu mano y tu fondo, falla con los demás. Eso es el <b>sesgo</b>: por eso una IA necesita datos <b>variados</b>.';
    }
  }

  function duelo() {
    var rev = st.revelado && st.dueloClaves, etapa = st.dueloEtapa;
    $('dueloBovedas').classList.toggle('oculto', !!rev);
    $('dueloTabla').classList.toggle('oculto', !rev);
    if (!rev) {
      var abiertas = st.equipos.filter(function (e) { return e.duelo.abiertaPor; }).length;
      var listas = st.equipos.filter(function (e) { return e.duelo.lista; }).length;
      $('dueloSub').innerHTML = etapa === 'crear'
        ? 'Cada quien crea la <b>contraseña de su bóveda</b>. En un momento, alguien más va a intentar abrirla… 👀'
        : '¡ATAQUE! Descifren la bóveda de su objetivo. 🟩 lugar correcto · 🟨 está en otro lugar.';
      $('dueloBovedas').innerHTML = (etapa === 'crear' ? resumen(listas + ' de ' + st.equipos.length, 'bóvedas cerradas') : resumen(abiertas + ' de ' + st.equipos.length, 'bóvedas abiertas')) +
        '<div class="fichas">' + st.equipos.map(function (e) {
          var d = e.duelo;
          if (etapa === 'crear') return ficha(e, d.lista ? '🔒' : '⏳', d.lista ? 'bien' : '');
          if (d.abiertaPor) return ficha(e, '🔓', 'mal');
          var cas = '', verdes = Math.round(d.progreso * (d.largo || 0));
          for (var i = 0; i < (d.largo || 0); i++) cas += '<i class="' + (i < verdes ? 'v' : '') + '"></i>';
          return ficha(e, '<span class="cas">' + cas + '</span>');
        }).join('') + '</div>';
      $('dueloLeccion').innerHTML = etapa === 'crear'
        ? '💡 Piensa como hacker: ¿qué probaría primero quien te ataque? <b>1234</b>, tu nombre, tu grado…'
        : '💡 Cada carácter extra <b>multiplica</b> el trabajo del atacante. 4 números = 10 mil combinaciones. 8 letras y números = <b>2.8 billones</b>.';
    } else {
      var todas = st.dueloClaves, vivas = todas.filter(function (c) { return !c.abiertaPor; });
      var largoVivas = promedio(vivas.map(function (c) { return c.clave.length * 10; })) / 10, caidas = todas.filter(function (c) { return c.abiertaPor; });
      var largoCaidas = promedio(caidas.map(function (c) { return c.clave.length * 10; })) / 10;
      $('dueloSub').innerHTML = 'Sobrevivieron <b class="verde">' + vivas.length + '</b> de ' + todas.length + ' bóvedas.' +
        (vivas.length && caidas.length ? ' Las que resistieron tenían en promedio <b>' + largoVivas + '</b> caracteres; las que cayeron, <b>' + largoCaidas + '</b>.' : '');
      // primero las que cayeron (las más cortas), luego las que resistieron
      var muestra = caidas.slice().sort(function (a, b) { return a.clave.length - b.clave.length; }).slice(0, 3).concat(vivas.slice(0, 3));
      $('dueloTabla').innerHTML = '<tr><td class="suave">Jugador</td><td class="suave">Contraseña</td><td class="suave">En el duelo</td></tr>' +
        muestra.map(function (c) {
          return '<tr><td>' + c.icono + ' <b>' + esc(c.nombre) + '</b></td><td class="c">' + esc(c.clave) + (c.defecto ? ' <span class="suave" style="font-size:.6em">(no creó)</span>' : '') + '</td>' +
            '<td>' + (c.abiertaPor ? '<span class="rojo">💀 abierta por ' + esc(c.abiertaPor) + '</span>' : '<span class="verde">🛡️ sobrevivió</span> <span class="suave">(' + Math.round(c.progreso * 100) + '% descifrada)</span>') + '</td></tr>';
        }).join('');
      $('dueloLeccion').innerHTML = '💡 En la vida real no hay pistas de colores… pero una computadora prueba <b>miles de millones</b> de contraseñas por segundo. Solo las <b>largas y raras</b> resisten.';
    }
  }

  function huellas() {
    var rev = st.revelado;
    $('huTarjetas').classList.toggle('oculto', rev);
    $('huPistas').classList.toggle('oculto', !rev);
    if (!rev) {
      var completos = st.equipos.filter(function (e) { return e.huellas >= st.totalPistas; }).length;
      $('huTarjetas').innerHTML = resumen(completos + ' de ' + st.equipos.length, 'ya encontraron los ' + st.totalPistas + ' datos') + '<div class="fichas">' + st.equipos.map(function (e) {
        return ficha(e, '🕵️ ' + e.huellas + '/' + st.totalPistas, e.huellas >= st.totalPistas ? 'bien' : '');
      }).join('') + '</div>';
    } else {
      $('huPistas').innerHTML = (st.pistasDiego || []).map(function (p, i) {
        return '<div class="p" style="animation-delay:' + (i * .25) + 's"><span style="font-size:1.4em">' + p.icono + '</span> ' + esc(p.nombre) + ': <b>' + esc(p.valor) + '</b><small>' + esc(p.leccion) + '</small></div>';
      }).join('');
    }
  }

  var COLORES_NIVEL = ['#ff4d6d', '#ff922b', '#ffd43b', '#a9e34b', '#39ff88'];
  function claves() {
    var rev = st.revelado && st.claveDiego;
    $('clJuego').classList.toggle('oculto', !!rev);
    $('clRev').classList.toggle('oculto', !rev);
    if (!rev) {
      var dentro = st.equipos.filter(function (e) { return e.hack.logrado; }).length;
      $('clTarjetas').innerHTML = resumen(dentro + ' de ' + st.equipos.length, 'ya entraron a la cuenta') + '<div class="fichas">' + st.equipos.map(function (e) {
        var h = e.hack, pr = h.proteccion;
        return ficha(e, (h.logrado ? '🔓' : '🔒' + (h.intentos || '')) + (pr ? ' <span style="color:' + COLORES_NIVEL[pr.nivel] + '">🛡️</span>' : ''), h.logrado ? 'bien' : '');
      }).join('') + '</div>';
    } else {
      $('claveDiego').textContent = st.claveDiego;
      var con = st.equipos.filter(function (e) { return e.hack.proteccion; });
      var debiles = con.filter(function (e) { return e.hack.proteccion.nivel <= 1; }).length;
      var orden = con.slice().sort(function (a, b) { return b.hack.proteccion.nivel - a.hack.proteccion.nivel; });
      // las más fuertes y las más débiles
      var muestra = orden.length > 6 ? orden.slice(0, 3).concat(orden.slice(-3)) : orden;
      $('clTabla').innerHTML = (con.length ? '<tr><td colspan="2" style="border:0;padding-top:0">De las <b>' + con.length + '</b> contraseñas que crearon, <b class="rojo">' + debiles + '</b> caerían en menos de un día.</td></tr>' : '') +
        muestra.map(function (e) {
          var pr = e.hack.proteccion;
          return '<tr><td>' + e.icono + ' <b>' + esc(e.nombre) + '</b></td><td class="t" style="color:' + COLORES_NIVEL[pr.nivel] + '">' + esc(pr.tiempo) + (pr.nivel >= 3 ? ' 🛡️' : ' 💀') + '</td></tr>';
        }).join('');
    }
  }

  var vistos = {};
  function wifi(acabaDeRevelar) {
    var rev = st.revelado;
    $('wfInocente').classList.toggle('oculto', rev);
    $('wfHacker').classList.toggle('oculto', !rev);
    $('wfCuenta').textContent = st.totalMensajes || 0;
    if (!rev) { vistos = {}; return; }
    var msgs = st.interceptados || [];
    var lineas = ['<div class="l">root@hacker:~$ sniff --red "WiFi_Gratis" --mostrar-todo</div>', '<div class="l">[+] ' + st.equipos.length + ' dispositivos conectados. Capturando paquetes…</div>'];
    msgs.forEach(function (m) {
      var hora = new Date(m.t).toTimeString().slice(0, 8);
      if (m.cifrado) lineas.push('<div class="l cif">[' + hora + '] 🔒 <span class="eq">' + m.icono + ' ' + esc(m.equipo) + '</span> → ' + esc(m.texto) + '  <i>(ilegible)</i></div>');
      else lineas.push('<div class="l">[' + hora + '] <span class="eq" style="color:' + m.color + '">' + m.icono + ' ' + esc(m.equipo) + '</span> → "' + esc(m.texto) + '"</div>');
      if (!vistos[m.id] && !acabaDeRevelar) blip();
      vistos[m.id] = 1;
    });
    $('terminal').innerHTML = lineas.join('');
    $('wfLeccion').innerHTML = st.cifrado
      ? '🔒 Con <b>cifrado</b> (el candado de <b>https</b> en el navegador) el hacker solo ve basura. WhatsApp cifra tus mensajes así.'
      : '💡 En un WiFi abierto, cualquiera conectado puede <b>espiar</b> lo que envías si la página no está cifrada. Por eso: cuidado con las WiFi gratis.';
  }

  function fin(entrando) {
    if (entrando) fanfarria();
    var top = st.equipos.slice(0, 3);
    $('finResto').textContent = st.equipos.length > 3 ? 'Jugaron ' + st.equipos.length + ' hackers. Tu lugar está en tu celular.' : '';
    var orden = [top[1], top[0], top[2]];
    var alturas = [6, 9, 4], medallas = ['2', '1', '3'], colores = ['#c0c7d0', '#ffd43b', '#e8a15b'];
    $('podio').innerHTML = orden.map(function (e, i) {
      if (!e) return '';
      return '<div class="col"><div style="font-size:3em">' + e.icono + '</div><div class="nom">' + esc(e.nombre) + '</div><div class="pts">' + e.total + ' pts</div>' +
        '<div class="bloque" style="height:' + alturas[i] + 'em;background:' + colores[i] + '">' + medallas[i] + '</div></div>';
    }).join('');
    $('rankingGlobal').innerHTML = (st.ranking || []).map(function (r, i) {
      return '<div class="f"><span class="mono suave">' + (i + 1) + '</span><span>' + r.icono + '</span><span class="n">' + esc(r.equipo) + ' <span class="suave">(' + r.grupo + ')</span></span><b class="mono verde">' + r.puntos + '</b></div>';
    }).join('') || '<p class="suave">Se llena cuando guardes cada ronda.</p>';
    $('rankingGrupos').innerHTML = (st.rankingGrupos || []).map(function (g) {
      return '<div class="f"><b>' + g.grupo + '</b><span class="n">' + esc(g.nombre || '') + '</span><b class="mono verde">' + g.promedio + '</b></div>';
    }).join('') || '<p class="suave">—</p>';
  }

  conectar();
})();
