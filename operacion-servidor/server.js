// OPERACIÓN SERVIDOR — servidor del taller (sin dependencias, solo Node.js)
// Uso: node server.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const CONFIG = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const { PISTAS, CASOS } = require('./contenido');
const Fuerza = require('./public/fuerza.js');
const Rasgos = require('./public/rasgos.js');
const { crearFiltro, emojiPara } = require('./filtro');
const esOfensivo = crearFiltro(CONFIG.palabrasCensuradas);

const PUBLIC = path.join(__dirname, 'public');
const DATA = path.join(__dirname, 'data');
if (!fs.existsSync(DATA)) fs.mkdirSync(DATA);
const ARCHIVO_RANKING = path.join(DATA, 'ranking.json');
const ARCHIVO_ESTADO = path.join(DATA, 'estado.json');

const VERSION = 5;
function hoy() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
const MISIONES = ['ia', 'ppt', 'huellas', 'contrasenas', 'duelo', 'wifi'];
const FASES = ['lobby'].concat(MISIONES, ['final']);
const COLORES = ['#ff4d6d', '#4dabf7', '#ffd43b', '#69db7c', '#b197fc', '#ff922b', '#3bc9db', '#f783ac', '#a9e34b', '#e599f7', '#ffa8a8', '#74c0fc'];
const MAX_JUGADORES = CONFIG.maxJugadores || 60; // cada jugador con su celular
const DIM = 256; // dibujo de 16x16
const CLASES_PPT = [
  { id: 'piedra', nombre: 'Piedra', emoji: '✊' },
  { id: 'papel', nombre: 'Papel', emoji: '✋' },
  { id: 'tijera', nombre: 'Tijera', emoji: '✌️' }
];
const LE_GANA = { piedra: 'papel', papel: 'tijera', tijera: 'piedra' }; // qué le gana a cada uno
const MAX_RETOS = 5;
const DUELO = Object.assign({ minimo: 4, maximo: 8, claveBot: 'gato12' }, CONFIG.duelo || {});
const MENSAJE_OFENSIVO = 'No se permiten palabras ofensivas. Prueba con otra 😉';

// ---------------- Personajes: un caso distinto por grupo ----------------
const MESES = { enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12 };
const MODOS = ['basico', 'practico', 'avanzado'];
const sinTildes = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '');
function formaEnClave(tipo, valor) { // cómo entra cada dato en la contraseña
  if (tipo === 'cumple') {
    const m = sinTildes(valor).toLowerCase().match(/(\d+)\s+de\s+([a-z]+)/);
    return String(m[1]).padStart(2, '0') + String(MESES[m[2]]).padStart(2, '0');
  }
  if (tipo === 'telefono') return valor.replace(/\D/g, '').slice(-4);
  if (tipo === 'colegio') return sinTildes(valor).toLowerCase().replace(/^(colegio|instituto|liceo)\s+/, '').replace(/[^a-z0-9]/g, '');
  return sinTildes(valor).toLowerCase().replace(/[^a-z0-9]/g, '');
}
function compilarCaso(caso, idx) {
  let n = 0;
  const segPista = {}, valor = {};
  function parsear(texto) { // separa el texto en palabras tocables
    const segs = [];
    const re = /\{\{(\w+)\|([^}]+)\}\}/g;
    let ultimo = 0, m;
    const palabras = (t) => t.split(/(\s+)/).forEach((w) => {
      if (!w) return;
      if (/^\s+$/.test(w) || !/[\p{L}\p{N}]/u.test(w)) segs.push({ t: w });
      else segs.push({ id: 'c' + idx + 's' + (n++), t: w });
    });
    while ((m = re.exec(texto))) {
      palabras(texto.slice(ultimo, m.index));
      if (!PISTAS[m[1]]) throw new Error('contenido.js: tipo de dato desconocido "' + m[1] + '" en ' + caso.nombre);
      const id = 'c' + idx + 's' + (n++);
      segPista[id] = m[1]; valor[m[1]] = m[2];
      segs.push({ id, t: m[2] });
      ultimo = re.lastIndex;
    }
    palabras(texto.slice(ultimo));
    return segs;
  }
  const pub = {
    usuario: caso.usuario, nombre: caso.nombre, avatar: caso.avatar, seguidores: caso.seguidores,
    bio: parsear(caso.bio),
    posts: caso.posts.map((p) => ({
      foto: p.foto, likes: p.likes, texto: parsear(p.texto),
      comentario: p.comentario ? { autor: p.comentario.autor, texto: parsear(p.comentario.texto) } : null
    }))
  };
  const [a, b] = caso.receta;
  if (!valor[a] || !valor[b]) throw new Error('contenido.js: la receta de ' + caso.nombre + ' usa un dato que no está en su perfil');
  const corto = caso.nombre.split(' ')[0];
  const base = formaEnClave(a, valor[a]) + formaEnClave(b, valor[b]);
  const [letra, num] = caso.leet;
  const pa = formaEnClave(a, valor[a]);
  const dificil = pa[0].toUpperCase() + pa.slice(1).split(letra).join(num) + formaEnClave(b, valor[b]);
  const listo = caso.genero === 'f' ? 'lista' : 'listo';
  const p1 = corto + ' usa ' + PISTAS[a].frase + ' ' + PISTAS[a].icono, p2 = '...seguido de ' + PISTAS[b].frase + ' ' + PISTAS[b].icono;
  const claves = {
    basico: { clave: base, mayusculas: false, pistas: [{ tras: 2, texto: p1 }, { tras: 4, texto: p2 }, { tras: 6, texto: 'Todo junto, en minúsculas, sin espacios ni tildes' }] },
    practico: { clave: base, mayusculas: false, pistas: [{ tras: 3, texto: p1 }, { tras: 5, texto: p2 }, { tras: 7, texto: 'Todo junto, sin espacios ni tildes' }] },
    avanzado: { clave: dificil, mayusculas: true, pistas: [
      { tras: 3, texto: p1 + ' y luego ' + PISTAS[b].frase + ' ' + PISTAS[b].icono },
      { tras: 5, texto: corto + ' se cree ' + listo + ': cambió las "' + letra + '" por "' + num + '"' },
      { tras: 7, texto: 'La primera letra va en mayúscula, todo junto y sin tildes' }] }
  };
  return { pub, segPista, valor, total: Object.keys(valor).length, claves, nombre: caso.nombre, corto, genero: caso.genero, boveda: caso.boveda || 'gato12' };
}
const COMPILADOS = CASOS.map(compilarCaso);
function casoDeGrupo(g) {
  const cfg = CONFIG.grupos[g] || {};
  const i = Number.isInteger(cfg.personaje) ? cfg.personaje : Math.max(0, Object.keys(CONFIG.grupos).indexOf(g));
  return ((i % COMPILADOS.length) + COMPILADOS.length) % COMPILADOS.length;
}
function caso() { return COMPILADOS[S.caso] || COMPILADOS[0]; }

// ---------------- Estado ----------------
function dueloVacio() { return { etapa: 'crear', orden: [], premiado: false }; }
function estadoVacio(grupo) {
  grupo = grupo || sugerirGrupo() || 'A';
  return {
    v: VERSION, dia: hoy(), inicioRonda: null, grupo, modo: (CONFIG.grupos[grupo] || {}).modo || 'basico', caso: casoDeGrupo(grupo),
    fase: 'lobby', finFase: null, revelado: false, cifrado: false, jugadas: [],
    equipos: {}, tokens: {}, interceptados: [], primerHackeo: null, ip: null, duelo: dueloVacio()
  };
}
let S;
try { S = JSON.parse(fs.readFileSync(ARCHIVO_ESTADO, 'utf8')); if (S.v !== VERSION || S.dia !== hoy()) throw 0; } catch (e) { S = estadoVacio(); }
let RANKING = [];
try { RANKING = JSON.parse(fs.readFileSync(ARCHIVO_RANKING, 'utf8')); if (!Array.isArray(RANKING)) RANKING = []; } catch (e) { RANKING = []; }
function rankingHoy() { const d = hoy(); return RANKING.filter((r) => r.dia === d); }

let tGuardar = null;
function guardarEstado() {
  if (tGuardar) return; // como mucho una vez cada 3 s, aunque haya mucha actividad
  tGuardar = setTimeout(() => { tGuardar = null; fs.writeFile(ARCHIVO_ESTADO, JSON.stringify(S), () => {}); }, 3000);
}
function guardarRanking() { fs.writeFileSync(ARCHIVO_RANKING, JSON.stringify(RANKING, null, 1)); }

function sugerirGrupo() {
  const ahora = new Date();
  const min = ahora.getHours() * 60 + ahora.getMinutes();
  let g = null;
  for (const h of CONFIG.horario || []) {
    const [hh, mm] = h.hora.split(':').map(Number);
    if (min >= hh * 60 + mm - 10) g = h.grupo;
  }
  return g;
}

// ---------------- Utilidades ----------------
function limpiar(txt, max) { return String(txt || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max); }
function total(e) { return Math.max(0, Object.values(e.puntos).reduce((a, b) => a + b, 0)); }
function token() { return crypto.randomBytes(12).toString('hex'); }
function azar(n) { return crypto.randomInt(n); }

// ---------------- IA: vecinos más cercanos (k-NN) ----------------
function dist(a, b) { let s = 0; for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; } return s; }
function predecir(muestras, v, excluir) {
  const vecinos = [];
  muestras.forEach((m, i) => { if (i !== excluir) vecinos.push({ c: m.c, d: dist(m.v, v) }); });
  if (!vecinos.length) return null;
  vecinos.sort((a, b) => a.d - b.d);
  const k = Math.min(3, vecinos.length);
  const votos = {};
  for (let i = 0; i < k; i++) votos[vecinos[i].c] = (votos[vecinos[i].c] || 0) + 1 / (1e-6 + vecinos[i].d);
  let mejor = null, suma = 0;
  for (const c in votos) { suma += votos[c]; if (!mejor || votos[c] > votos[mejor]) mejor = c; }
  return { clase: mejor, confianza: votos[mejor] / suma };
}
function contarClases(muestras, clases) {
  const n = {}; clases.forEach((c) => (n[c.id] = 0));
  muestras.forEach((m) => (n[m.c] = (n[m.c] || 0) + 1));
  return n;
}
function vectorValido(v, dim) { return Array.isArray(v) && v.length === dim && v.every((x) => typeof x === 'number' && isFinite(x)); }

function evaluarIAs() {
  const equipos = Object.values(S.equipos);
  for (const e of equipos) {
    const n = contarClases(e.ia.muestras, CONFIG.clasesIA);
    const suficientes = CONFIG.clasesIA.every((c) => n[c.id] >= 2);
    if (!suficientes) { e.ia.precision = 0; e.ia.nota = 'Muy pocos datos: tu IA no aprendió'; e.puntos.ia = 0; continue; }
    let prueba = [];
    equipos.forEach((o) => { if (o.id !== e.id) prueba = prueba.concat(o.ia.muestras); });
    let ok = 0, tot = 0;
    if (prueba.length >= 4) {
      prueba.forEach((m) => { const p = predecir(e.ia.muestras, m.v); tot++; if (p && p.clase === m.c) ok++; });
      e.ia.nota = 'Probada con ' + tot + ' dibujos de los demás';
    } else {
      e.ia.muestras.forEach((m, i) => { const p = predecir(e.ia.muestras, m.v, i); tot++; if (p && p.clase === m.c) ok++; });
      e.ia.nota = 'Probada con tus propios dibujos';
    }
    const prec = tot ? ok / tot : 0;
    e.ia.precision = Math.round(prec * 100);
    e.puntos.ia = Math.max(0, Math.round((prec - 0.5) * 2 * 100));
  }
}
// Piedra, papel o tijera: ¿qué tan bien reconoce cada IA las manos de OTROS equipos?
function evaluarCruzadaPpt() {
  const equipos = Object.values(S.equipos);
  for (const e of equipos) {
    const n = contarClases(e.ppt.muestras, CLASES_PPT);
    let prueba = [];
    equipos.forEach((o) => { if (o.id !== e.id) prueba = prueba.concat(o.ppt.muestras); });
    if (!CLASES_PPT.every((c) => n[c.id] >= 1) || prueba.length < 3) { e.ppt.cruzada = null; continue; }
    let ok = 0;
    prueba.forEach((m) => { const p = predecir(e.ppt.muestras, m.v); if (p && p.clase === m.c) ok++; });
    e.ppt.cruzada = Math.round(100 * ok / prueba.length);
  }
}
function puntosPpt(e) { e.puntos.ppt = e.ppt.aciertos * 15 + Math.min(12, e.ppt.muestras.length) * 2; }

// ---------------- Duelo de contraseñas ----------------
function limpiarClave(txt) { return String(txt || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '').slice(0, DUELO.maximo); }
function dueloClave(id) { return id === 'bot' ? caso().boveda : (S.equipos[id] && S.equipos[id].duelo.clave) || null; }
function dueloDatos(id) {
  if (id === 'bot') return { id, nombre: 'Bóveda del profe', icono: '🧑‍🏫', color: '#8b9bab' };
  const e = S.equipos[id]; return { id, nombre: e.nombre, icono: e.icono, color: e.color };
}
function dueloObjetivos(e) { // en rueda: cada equipo ataca al siguiente
  const o = S.duelo.orden.filter((id) => S.equipos[id]);
  const i = o.indexOf(e.id), lista = [];
  for (let k = 1; k < o.length; k++) lista.push(o[(i + k) % o.length]);
  if (!lista.length) lista.push('bot');
  return lista;
}
function dueloObjetivoActual(e) { return dueloObjetivos(e).find((id) => !e.duelo.hechos.includes(id)) || null; }
function dueloAsegurar(e) { // equipos que llegan tarde o no crearon contraseña
  if (S.duelo.etapa !== 'atacar') return;
  if (!e.duelo.clave) { e.duelo.clave = '1234'; e.duelo.defecto = true; }
  if (!S.duelo.orden.includes(e.id)) S.duelo.orden.push(e.id);
}
function colores(intento, clave) { // v = verde (posición correcta), a = amarillo (está en otra posición), n = no está
  const n = clave.length, fb = Array(n).fill('n'), resto = {};
  for (let i = 0; i < n; i++) { if (intento[i] === clave[i]) fb[i] = 'v'; else resto[clave[i]] = (resto[clave[i]] || 0) + 1; }
  for (let i = 0; i < n; i++) if (fb[i] !== 'v' && resto[intento[i]] > 0) { fb[i] = 'a'; resto[intento[i]]--; }
  return fb.join('');
}
function dueloProgresoContra(id) { // qué tanto han descifrado los demás la bóveda de este equipo
  const clave = dueloClave(id); if (!clave) return 0;
  let max = 0;
  Object.values(S.equipos).forEach((o) => {
    const p = o.duelo.prog[id];
    if (p) max = Math.max(max, p.verdes.replace(/_/g, '').length / clave.length);
  });
  return max;
}

// ---------------- Vistas del estado ----------------
function vistaEquipo(e) {
  return {
    id: e.id, nombre: e.nombre, color: e.color, icono: e.icono, total: total(e), puntos: e.puntos,
    ia: { muestras: contarClases(e.ia.muestras, CONFIG.clasesIA), precision: e.ia.precision, nota: e.ia.nota },
    ppt: { muestras: contarClases(e.ppt.muestras, CLASES_PPT), retos: e.ppt.retos, aciertos: e.ppt.aciertos, cruzada: e.ppt.cruzada },
    huellas: e.huellas.encontradas.length,
    hack: { logrado: e.hack.logrado, intentos: e.hack.intentos, proteccion: e.hack.proteccion ? { tiempo: e.hack.proteccion.tiempo, nivel: e.hack.proteccion.nivel } : null },
    duelo: {
      lista: !!e.duelo.clave, largo: S.duelo.etapa === 'atacar' && e.duelo.clave ? e.duelo.clave.length : null,
      abiertaPor: e.duelo.abiertaPor, progreso: S.duelo.etapa === 'atacar' ? dueloProgresoContra(e.id) : 0,
      abiertas: e.duelo.hechos.length, defecto: e.duelo.defecto
    },
    wifi: { enviados: e.wifi.enviados, cifrado: e.wifi.cifradoOk }
  };
}
function publico() {
  const g = CONFIG.grupos[S.grupo] || {};
  return {
    ahora: Date.now(), grupo: S.grupo, grupoNombre: g.nombre || '', modo: S.modo,
    fase: S.fase, finFase: S.finFase, revelado: S.revelado, cifrado: S.cifrado,
    numMision: Math.max(1, S.jugadas.indexOf(S.fase) + 1), dueloEtapa: S.duelo.etapa, dueloReglas: { minimo: DUELO.minimo, maximo: DUELO.maximo },
    clases: CONFIG.clasesIA, clasesPpt: CLASES_PPT, maxRetos: MAX_RETOS, totalPistas: caso().total, personaje: caso().corto, personajeGenero: caso().genero,
    equipos: Object.values(S.equipos).map(vistaEquipo).sort((a, b) => b.total - a.total)
  };
}
function pistasVisibles(e) {
  const def = caso().claves[S.modo];
  return def.pistas.filter((p) => e.hack.intentos >= p.tras || e.hack.logrado).map((p) => p.texto);
}
function baseJugadores() { // se calcula una sola vez por envío y se comparte entre todos los celulares
  const p = publico();
  p.equipos = p.equipos.map((e) => ({ id: e.id, nombre: e.nombre, icono: e.icono }));
  return p;
}
function vistaJugador(tk, base) {
  const id = S.tokens[tk];
  const e = id && S.equipos[id];
  const p = Object.assign({}, base || baseJugadores());
  if (!e) return Object.assign(p, { yo: null });
  p.yo = Object.assign(vistaEquipo(e), {
    huellasDetalle: e.huellas.encontradas.map((pid) => Object.assign({ id: pid, valor: caso().valor[pid] }, PISTAS[pid])),
    segTocados: e.huellas.tocados,
    pistasHack: pistasVisibles(e),
    proteccionDetalle: e.hack.proteccion,
    mensajes: e.wifi.mensajes,
    pptReto: e.ppt.reto, pptUltimo: e.ppt.ultimo
  });
  if (S.fase === 'duelo') {
    const d = { miClave: e.duelo.clave, defecto: e.duelo.defecto, objetivo: null, terminado: false };
    if (S.duelo.etapa === 'atacar') {
      const obj = dueloObjetivoActual(e);
      if (obj) {
        const clave = dueloClave(obj), pr = e.duelo.prog[obj] || { verdes: '_'.repeat(clave.length), intentos: [] };
        d.objetivo = Object.assign(dueloDatos(obj), { largo: clave.length, verdes: pr.verdes, intentos: pr.intentos.slice(-8), numIntentos: pr.intentos.length });
      } else d.terminado = true;
    }
    p.yo.dueloDetalle = d;
  }
  if (S.fase === 'huellas' || S.fase === 'contrasenas') p.perfil = caso().pub;
  return p;
}
function urls() {
  const ips = [];
  const ifs = os.networkInterfaces();
  for (const k in ifs) for (const a of ifs[k]) if (a.family === 'IPv4' && !a.internal) ips.push(a.address);
  ips.sort((a, b) => puntajeIp(b) - puntajeIp(a));
  return ips.map((ip) => 'http://' + ip + ':' + CONFIG.puerto + '/');
}
function puntajeIp(ip) { return ip.startsWith('172.20.10.') ? 3 : ip.startsWith('192.168.') ? 2 : ip.startsWith('10.') ? 1 : 0; }
function vistaPantalla(esControl) {
  const p = publico();
  const lista = urls();
  p.urls = lista;
  p.url = (S.ip && lista.includes(S.ip)) ? S.ip : (lista[0] || 'http://localhost:' + CONFIG.puerto + '/');
  p.wifi = CONFIG.wifi;
  p.minutos = CONFIG.minutosPorFase;
  p.jugadas = S.jugadas;
  const visibles = S.interceptados.filter((m) => !m.oculto);
  p.totalMensajes = S.interceptados.length;
  if (esControl || (S.fase === 'wifi' && S.revelado)) p.interceptados = (esControl ? S.interceptados : visibles).slice(-60);
  if (esControl || (S.fase === 'huellas' && S.revelado) || S.fase === 'contrasenas')
    p.pistasDiego = Object.keys(caso().valor).map((id) => Object.assign({ id, valor: caso().valor[id] }, PISTAS[id]));
  if (esControl || ((S.fase === 'contrasenas' || S.fase === 'final') && S.revelado)) p.claveDiego = caso().claves[S.modo].clave;
  if (S.fase === 'duelo' && S.revelado) {
    p.dueloClaves = Object.values(S.equipos).filter((e) => e.duelo.clave).map((e) => ({
      nombre: e.nombre, icono: e.icono, color: e.color, clave: e.duelo.clave, defecto: e.duelo.defecto,
      abiertaPor: e.duelo.abiertaPor, progreso: dueloProgresoContra(e.id), tiempo: Fuerza.evaluar(e.duelo.clave, [e.nombre]).tiempo
    })).sort((a, b) => (a.abiertaPor ? 1 : 0) - (b.abiertaPor ? 1 : 0) || b.clave.length - a.clave.length);
  }
  p.perfil = caso().pub;
  let rk = rankingHoy();
  if (S.fase === 'final') rk = rk.concat(Object.values(S.equipos).map((e) => ({ grupo: S.grupo, equipo: e.nombre, icono: e.icono, color: e.color, puntos: total(e), actual: true })));
  p.ranking = rk.sort((a, b) => b.puntos - a.puntos).slice(0, 10);
  p.rankingGrupos = rankingGrupos();
  if (esControl) {
    p.grupos = CONFIG.grupos; p.horario = CONFIG.horario; p.sugerido = sugerirGrupo();
    p.personajes = COMPILADOS.map((c) => c.nombre); p.casoActual = S.caso;
    p.rondasGuardadas = [...new Set(rankingHoy().map((r) => r.grupo))];
    p.rotacion = rotacion(); p.plan = CONFIG.planSugerido || ['ia', 'huellas', 'contrasenas', 'wifi']; p.inicioRonda = S.inicioRonda;
    p.siguienteGrupo = siguienteGrupo(S.grupo); p.pinPorDefecto = String(CONFIG.pinHugo) === '2026';
  }
  return p;
}
function rankingGrupos() {
  const g = {};
  rankingHoy().forEach((r) => { (g[r.grupo] = g[r.grupo] || []).push(r.puntos); });
  return Object.keys(g).map((k) => ({ grupo: k, nombre: (CONFIG.grupos[k] || {}).nombre, mejor: Math.max(...g[k]), promedio: Math.round(g[k].reduce((a, b) => a + b, 0) / g[k].length) }))
    .sort((a, b) => b.promedio - a.promedio);
}

// ---------------- Tiempo real (Server-Sent Events) ----------------
const clientes = new Set();
let tEmitir = null;
function emitir() {
  guardarEstado();
  if (tEmitir) return;
  tEmitir = setTimeout(() => {
    tEmitir = null;
    let pant = null, ctrl = null, base = null;
    for (const c of clientes) {
      let datos;
      if (c.rol === 'jugador') datos = vistaJugador(c.token, base || (base = baseJugadores()));
      else if (c.rol === 'control') datos = ctrl || (ctrl = vistaPantalla(true));
      else datos = pant || (pant = vistaPantalla(false));
      try { c.res.write('data: ' + JSON.stringify(datos) + '\n\n'); } catch (e) {}
    }
  }, 250);
}
setInterval(() => { for (const c of clientes) { try { c.res.write(': ping\n\n'); } catch (e) {} } }, 15000);

// ---------------- Acciones de los equipos ----------------
function equipoDe(body) { const id = S.tokens[body.token]; return id ? S.equipos[id] : null; }
function nuevoEquipo(nombre) {
  const id = 'e' + Date.now().toString(36) + Math.floor(Math.random() * 1000);
  const lista = Object.values(S.equipos);
  const color = COLORES.find((c) => !lista.some((e) => e.color === c)) || COLORES[lista.length % COLORES.length];
  return {
    id, nombre, color, icono: emojiPara(nombre, lista.map((e) => e.icono)),
    puntos: { ia: 0, ppt: 0, huellas: 0, hack: 0, proteger: 0, duelo: 0, wifi: 0, extra: 0 },
    ia: { muestras: [], precision: null, nota: null },
    ppt: { muestras: [], retos: 0, aciertos: 0, reto: null, ultimo: null, cruzada: null },
    huellas: { encontradas: [], tocados: {}, errores: 0 },
    hack: { intentos: 0, logrado: false, proteccion: null },
    duelo: { clave: null, defecto: false, hechos: [], prog: {}, abiertaPor: null, ataque: 0, defensa: 0 },
    wifi: { enviados: 0, planoOk: false, cifradoOk: false, mensajes: [] }
  };
}

const ACCIONES = {
  unirse(b) {
    const nombre = limpiar(b.nombre, 18);
    if (nombre.replace(/[^\p{L}\p{N}]/gu, '').length < 2) return { error: 'Escribe tu apodo (mínimo 2 letras)' };
    if (esOfensivo(nombre)) return { error: 'Ese apodo no está permitido. Elige otro 😉' };
    // Juego individual: cada apodo es de una sola persona
    if (Object.values(S.equipos).some((x) => sinTildes(x.nombre).toLowerCase() === sinTildes(nombre).toLowerCase())) return { error: 'Ese apodo ya lo tiene alguien más. Elige otro 😉' };
    if (Object.keys(S.equipos).length >= MAX_JUGADORES) return { error: 'El servidor está lleno. Juega junto a un compañero.' };
    const e = nuevoEquipo(nombre); S.equipos[e.id] = e;
    if (S.fase === 'duelo') dueloAsegurar(e);
    const tk = token(); S.tokens[tk] = e.id;
    return { token: tk, equipo: e.id };
  },

  // --- Misión: entrenar IA con dibujos ---
  'ia/muestra'(b, e) {
    if (S.fase !== 'ia') return { error: 'Esta misión no está activa' };
    if (S.revelado) return { error: 'Esta misión ya terminó' };
    if (!CONFIG.clasesIA.some((c) => c.id === b.clase) || !vectorValido(b.v, DIM)) return { error: 'Dibujo inválido' };
    if (contarClases(e.ia.muestras, CONFIG.clasesIA)[b.clase] >= 15) return { error: 'Máximo 15 dibujos por tipo' };
    e.ia.muestras.push({ c: b.clase, v: b.v });
    e.ia.precision = null;
    return { ok: true };
  },
  'ia/deshacer'(b, e) { if (S.fase !== 'ia' || S.revelado) return { error: 'Esta misión ya terminó' }; e.ia.muestras.pop(); e.ia.precision = null; return { ok: true }; },
  'ia/predecir'(b, e) {
    if (!vectorValido(b.v, DIM)) return { error: 'Dibujo inválido' };
    const n = contarClases(e.ia.muestras, CONFIG.clasesIA);
    if (!CONFIG.clasesIA.every((c) => n[c.id] >= 1)) return { error: 'Primero enséñale al menos un dibujo de cada tipo' };
    return predecir(e.ia.muestras, b.v);
  },

  // --- Misión: piedra, papel o tijera con fotos ---
  'ppt/muestra'(b, e) {
    if (S.fase !== 'ppt') return { error: 'Esta misión no está activa' };
    if (S.revelado) return { error: 'Esta misión ya terminó' };
    if (!CLASES_PPT.some((c) => c.id === b.clase) || !vectorValido(b.v, Rasgos.DIM)) return { error: 'Foto inválida' };
    if (contarClases(e.ppt.muestras, CLASES_PPT)[b.clase] >= 10) return { error: 'Máximo 10 fotos por gesto' };
    e.ppt.muestras.push({ c: b.clase, v: b.v });
    puntosPpt(e);
    return { ok: true };
  },
  'ppt/deshacer'(b, e) { if (S.fase !== 'ppt' || S.revelado) return { error: 'Esta misión ya terminó' }; e.ppt.muestras.pop(); puntosPpt(e); return { ok: true }; },
  'ppt/reto'(b, e) {
    if (S.fase !== 'ppt') return { error: 'Esta misión no está activa' };
    if (S.revelado) return { error: 'Esta misión ya terminó' };
    const n = contarClases(e.ppt.muestras, CLASES_PPT);
    if (!CLASES_PPT.every((c) => n[c.id] >= 2)) return { error: 'Primero toma al menos 2 fotos de cada gesto' };
    if (e.ppt.retos >= MAX_RETOS) return { error: 'Ya usaste tus ' + MAX_RETOS + ' retos' };
    if (!e.ppt.reto) e.ppt.reto = CLASES_PPT[azar(3)].id;
    return { reto: e.ppt.reto };
  },
  'ppt/jugar'(b, e) {
    if (S.fase !== 'ppt') return { error: 'Esta misión no está activa' };
    if (S.revelado) return { error: 'Esta misión ya terminó' };
    if (!e.ppt.reto) return { error: 'Primero pide un reto' };
    if (!vectorValido(b.v, Rasgos.DIM)) return { error: 'Foto inválida' };
    const p = predecir(e.ppt.muestras, b.v);
    const acierto = p.clase === e.ppt.reto;
    e.ppt.retos++; if (acierto) e.ppt.aciertos++;
    e.ppt.ultimo = { pedido: e.ppt.reto, visto: p.clase, confianza: Math.round(p.confianza * 100), acierto, jugada: LE_GANA[p.clase] };
    e.ppt.reto = null;
    puntosPpt(e);
    return e.ppt.ultimo;
  },

  // --- Misión: huellas digitales ---
  'huellas/tocar'(b, e) {
    if (S.fase !== 'huellas' || S.revelado) return { error: 'Esta misión no está activa' };
    const seg = String(b.seg || '');
    if (e.huellas.tocados[seg]) return { repetido: true };
    const pid = caso().segPista[seg];
    if (pid) {
      e.huellas.tocados[seg] = 'ok';
      if (!e.huellas.encontradas.includes(pid)) e.huellas.encontradas.push(pid);
    } else {
      e.huellas.tocados[seg] = 'no';
      e.huellas.errores++;
    }
    e.puntos.huellas = Math.max(0, e.huellas.encontradas.length * 10 - e.huellas.errores * 3);
    return pid ? Object.assign({ ok: true, id: pid, valor: caso().valor[pid] }, PISTAS[pid]) : { ok: false };
  },

  // --- Misión: hackear a Diego ---
  'hack/intentar'(b, e) {
    if (S.fase !== 'contrasenas') return { error: 'Esta misión no está activa' };
    if (S.revelado) return { error: 'Esta misión ya terminó' };
    if (e.hack.logrado) return { ok: true, ya: true };
    const def = caso().claves[S.modo];
    const intento = limpiar(b.clave, 40);
    if (!intento) return { error: 'Escribe una contraseña' };
    e.hack.intentos++;
    const escrito = sinTildes(intento).replace(/\s+/g, '');
    const ok = def.mayusculas ? escrito === def.clave : escrito.toLowerCase() === def.clave.toLowerCase();
    if (ok) {
      e.hack.logrado = true;
      let pts = Math.max(20, 60 - 4 * (e.hack.intentos - 1));
      if (!S.primerHackeo) { S.primerHackeo = e.id; pts += 10; }
      e.puntos.hack = pts;
    }
    return { ok, intentos: e.hack.intentos, pistas: pistasVisibles(e) };
  },
  'hack/proteger'(b, e) {
    if (S.fase !== 'contrasenas') return { error: 'Esta misión no está activa' };
    if (S.revelado) return { error: 'Esta misión ya terminó' };
    const clave = String(b.clave || '').slice(0, 64);
    if (!clave) return { error: 'Escribe una contraseña' };
    const r = Fuerza.evaluar(clave, [e.nombre].concat(Object.values(caso().valor)));
    e.hack.proteccion = { tiempo: r.tiempo, nivel: r.nivel, consejos: r.consejos, largo: clave.length };
    e.puntos.proteger = r.puntos;
    return r;
  },

  // --- Misión: duelo de contraseñas ---
  'duelo/crear'(b, e) {
    if (S.fase !== 'duelo') return { error: 'Esta misión no está activa' };
    if (S.duelo.etapa !== 'crear') return { error: 'El ataque ya empezó: ya no se puede cambiar' };
    const clave = limpiarClave(b.clave);
    if (clave.length < DUELO.minimo) return { error: 'Mínimo ' + DUELO.minimo + ' letras o números (sin espacios ni símbolos)' };
    if (esOfensivo(clave)) return { error: MENSAJE_OFENSIVO };
    e.duelo.clave = clave; e.duelo.defecto = false;
    return { ok: true, clave };
  },
  'duelo/atacar'(b, e) {
    if (S.fase !== 'duelo' || S.duelo.etapa !== 'atacar' || S.revelado) return { error: 'El ataque no está activo' };
    dueloAsegurar(e);
    const obj = dueloObjetivoActual(e);
    if (!obj) return { error: '¡Ya abriste todas las bóvedas!' };
    const clave = dueloClave(obj);
    const intento = limpiarClave(b.intento);
    if (intento.length !== clave.length) return { error: 'La contraseña tiene ' + clave.length + ' caracteres' };
    const pr = e.duelo.prog[obj] || (e.duelo.prog[obj] = { verdes: '_'.repeat(clave.length), intentos: [] });
    const fb = colores(intento, clave);
    let nuevos = 0;
    const verdes = pr.verdes.split('');
    for (let i = 0; i < clave.length; i++) if (fb[i] === 'v' && verdes[i] === '_') { verdes[i] = clave[i]; nuevos++; }
    pr.verdes = verdes.join('');
    pr.intentos.push({ g: intento, fb });
    if (pr.intentos.length > 40) pr.intentos.shift();
    e.duelo.ataque += nuevos * 3;
    const abierta = intento === clave;
    if (abierta) {
      e.duelo.hechos.push(obj);
      e.duelo.ataque += 20;
      if (obj !== 'bot' && S.equipos[obj] && !S.equipos[obj].duelo.abiertaPor) S.equipos[obj].duelo.abiertaPor = e.nombre;
    }
    e.puntos.duelo = e.duelo.ataque + e.duelo.defensa;
    return { ok: true, fb, abierta, nuevos };
  },

  // --- Misión: WiFi gratis ---
  'wifi/enviar'(b, e) {
    if (S.fase !== 'wifi') return { error: 'Esta misión no está activa' };
    const cifrado = !!b.cifrado && S.cifrado;
    const plano = limpiar(b.texto, 140);
    if (!plano) return { error: 'Escribe un mensaje' };
    if (esOfensivo(plano)) return { error: MENSAJE_OFENSIVO };
    const texto = cifrado ? limpiar(b.cifradoTexto, 400).replace(/[^A-Za-z0-9+/]/g, '') : plano;
    if (!texto) return { error: 'Escribe un mensaje' };
    const msg = { id: 'm' + Date.now() + Math.floor(Math.random() * 1000), equipo: e.nombre, color: e.color, icono: e.icono, texto, cifrado, oculto: false, t: Date.now() };
    S.interceptados.push(msg);
    if (S.interceptados.length > 300) S.interceptados.shift();
    e.wifi.enviados++;
    e.wifi.mensajes.push({ texto: plano, cifrado, t: msg.t });
    if (e.wifi.mensajes.length > 20) e.wifi.mensajes.shift();
    if (!cifrado && !e.wifi.planoOk) { e.wifi.planoOk = true; e.puntos.wifi += 5; }
    if (cifrado && !e.wifi.cifradoOk) { e.wifi.cifradoOk = true; e.puntos.wifi += 25; }
    return { ok: true };
  }
};

const ACCIONES_HUGO = {
  grupo(b) { if (CONFIG.grupos[b.grupo]) { S.grupo = b.grupo; S.modo = CONFIG.grupos[b.grupo].modo; ACCIONES_HUGO.personaje({ i: casoDeGrupo(b.grupo) }); } },
  modo(b) { if (MODOS.includes(b.modo)) S.modo = b.modo; },
  personaje(b) { // cambiar de personaje borra el avance de huellas y del hackeo
    const i = Number(b.i);
    if (!COMPILADOS[i] || i === S.caso) return;
    S.caso = i; S.primerHackeo = null;
    Object.values(S.equipos).forEach((e) => {
      e.huellas = { encontradas: [], tocados: {}, errores: 0 }; e.hack = { intentos: 0, logrado: false, proteccion: null };
      e.puntos.huellas = 0; e.puntos.hack = 0; e.puntos.proteger = 0;
    });
  },
  ip(b) { S.ip = b.ip; },
  fase(b) {
    if (!FASES.includes(b.fase)) return;
    S.fase = b.fase; S.revelado = false;
    if (MISIONES.includes(b.fase) && !S.jugadas.includes(b.fase)) S.jugadas.push(b.fase);
    if (MISIONES.includes(b.fase) && !S.inicioRonda) S.inicioRonda = Date.now();
    const min = CONFIG.minutosPorFase[b.fase];
    S.finFase = min ? Date.now() + min * 60000 : null;
    if (b.fase === 'wifi') S.cifrado = false;
    if (b.fase === 'duelo' && S.duelo.etapa === 'atacar' && S.duelo.premiado) { // jugar otro duelo desde cero
      S.duelo = dueloVacio();
      Object.values(S.equipos).forEach((e) => { e.duelo = nuevoEquipo('x').duelo; e.puntos.duelo = 0; });
    }
  },
  tiempo(b) {
    const base = S.finFase && S.finFase > Date.now() ? S.finFase : Date.now();
    S.finFase = base + (Number(b.min) || 1) * 60000;
  },
  pararTiempo() { S.finFase = null; },
  iniciarAtaque() {
    if (S.fase !== 'duelo' || S.duelo.etapa !== 'crear') return;
    S.duelo.etapa = 'atacar';
    S.duelo.orden = Object.keys(S.equipos);
    Object.values(S.equipos).forEach(dueloAsegurar);
    const min = CONFIG.minutosPorFase.duelo;
    S.finFase = min ? Date.now() + min * 60000 : null;
  },
  revelar() {
    if (S.fase === 'ia') evaluarIAs();
    if (S.fase === 'ppt') evaluarCruzadaPpt();
    if (S.fase === 'duelo') {
      if (S.duelo.etapa !== 'atacar') return; // primero hay que iniciar el ataque
      if (!S.duelo.premiado) {
        S.duelo.premiado = true;
        Object.values(S.equipos).forEach((e) => { // bóveda que sobrevive: +30 (la contraseña por defecto no cuenta)
          if (e.duelo.clave && !e.duelo.abiertaPor && !e.duelo.defecto) e.duelo.defensa = 30;
          e.puntos.duelo = e.duelo.ataque + e.duelo.defensa;
        });
      }
    }
    S.revelado = true;
    S.finFase = null; // al revelar se detiene el reloj
  },
  cifrado() { S.cifrado = true; },
  puntos(b) { const e = S.equipos[b.equipo]; if (e) e.puntos.extra += Number(b.delta) || 0; },
  borrarEquipo(b) {
    delete S.equipos[b.equipo];
    for (const t in S.tokens) if (S.tokens[t] === b.equipo) delete S.tokens[t];
  },
  ocultarMensaje(b) { const m = S.interceptados.find((x) => x.id === b.id); if (m) m.oculto = !m.oculto; },
  guardarRonda() {
    if (!Object.keys(S.equipos).length) return; // evita saltarse un grupo si se presiona dos veces
    const fecha = new Date().toISOString(), dia = hoy();
    Object.values(S.equipos).forEach((e) => {
      const t = total(e);
      if (t > 0) RANKING.push({ dia, grupo: S.grupo, grupoNombre: (CONFIG.grupos[S.grupo] || {}).nombre, equipo: e.nombre, icono: e.icono, color: e.color, puntos: t, fecha });
    });
    guardarRanking();
    S = estadoVacio(siguienteGrupo(S.grupo));
  },
  reiniciarRonda() { S = estadoVacio(S.grupo); },
  borrarRanking() { const d = hoy(); RANKING = RANKING.filter((r) => r.dia !== d); guardarRanking(); }
};
function rotacion() { // a qué hora termina el turno de este grupo en la estación
  const h = (CONFIG.horario || []).find((x) => x.grupo === S.grupo);
  if (!h) return null;
  const [hh, mm] = h.hora.split(':').map(Number);
  const ini = new Date(); ini.setHours(hh, mm, 0, 0);
  return { hora: h.hora, inicio: ini.getTime(), fin: ini.getTime() + (CONFIG.minutosRotacion || 30) * 60000 };
}
function siguienteGrupo(g) {
  const h = CONFIG.horario || [];
  const i = h.findIndex((x) => x.grupo === g);
  return i >= 0 && i < h.length - 1 ? h[i + 1].grupo : g;
}

// ---------------- Servidor HTTP ----------------
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const RUTAS = { '/': 'jugador.html', '/pantalla': 'pantalla.html', '/control': 'control.html' };

function leerCuerpo(req) {
  return new Promise((ok) => {
    let d = '', pasado = false;
    req.on('data', (c) => { d += c; if (d.length > 60000) { pasado = true; d = ''; } });
    req.on('error', () => ok({}));
    req.on('end', () => {
      let o = {};
      if (!pasado) { try { o = JSON.parse(d || '{}'); } catch (e) { o = {}; } }
      ok(o && typeof o === 'object' && !Array.isArray(o) ? o : {}); // siempre un objeto
    });
  });
}
function json(res, code, obj) { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); }

// PIN: tras 5 intentos fallidos desde un mismo dispositivo, se bloquea 1 minuto
const fallosPin = new Map();
function pinCorrecto(req, pin) {
  const ip = req.socket.remoteAddress || '?', f = fallosPin.get(ip) || { n: 0, hasta: 0 };
  if (f.hasta > Date.now()) return 'bloqueado';
  if (String(pin) === String(CONFIG.pinHugo)) { fallosPin.delete(ip); return 'ok'; }
  f.n++;
  if (f.n >= 5) { f.n = 0; f.hasta = Date.now() + 60000; }
  fallosPin.set(ip, f);
  return 'mal';
}
function rechazoPin(res, estado) {
  return estado === 'bloqueado' ? json(res, 429, { error: 'Demasiados intentos. Espera 1 minuto.' }) : json(res, 403, { error: 'PIN incorrecto' });
}

async function atender(req, res) {
  const u = new URL(req.url, 'http://x');
  const ruta = u.pathname;

  if (ruta === '/eventos') {
    const rol = ['jugador', 'pantalla', 'control'].includes(u.searchParams.get('rol')) ? u.searchParams.get('rol') : 'jugador';
    if (rol !== 'jugador') { const est = pinCorrecto(req, u.searchParams.get('pin')); if (est !== 'ok') return rechazoPin(res, est); }
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.write('retry: 2000\n\n');
    const c = { res, rol, token: u.searchParams.get('token') || '' };
    clientes.add(c);
    const datos = rol === 'jugador' ? vistaJugador(c.token) : vistaPantalla(rol === 'control');
    res.write('data: ' + JSON.stringify(datos) + '\n\n');
    req.on('close', () => clientes.delete(c));
    return;
  }

  if (ruta.startsWith('/api/') && req.method === 'POST') {
    const b = await leerCuerpo(req);
    const accion = ruta.slice(5);
    if (accion.startsWith('hugo/')) {
      const est = pinCorrecto(req, b.pin);
      if (est !== 'ok') return rechazoPin(res, est);
      const nombre = accion.slice(5);
      if (!Object.prototype.hasOwnProperty.call(ACCIONES_HUGO, nombre)) return json(res, 404, { error: 'No existe' });
      ACCIONES_HUGO[nombre](b); emitir();
      return json(res, 200, { ok: true });
    }
    if (!Object.prototype.hasOwnProperty.call(ACCIONES, accion)) return json(res, 404, { error: 'No existe' });
    let e = null;
    if (accion !== 'unirse') { e = equipoDe(b); if (!e) return json(res, 401, { error: 'Tu sesión terminó. Entra de nuevo.' }); }
    const r = ACCIONES[accion](b, e);
    emitir();
    return json(res, 200, r || { ok: true });
  }

  // archivos estáticos
  const archivo = RUTAS[ruta] || ruta.slice(1);
  const completo = path.normalize(path.join(PUBLIC, archivo));
  if (!completo.startsWith(PUBLIC + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(completo, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('No encontrado'); }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(completo)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}

// Pase lo que pase con una petición, el servidor no se cae a media ronda
const server = http.createServer((req, res) => {
  atender(req, res).catch((err) => {
    console.error('  [error]', req.method, req.url, '-', err && err.message);
    try { if (!res.headersSent) json(res, 500, { error: 'Algo falló. Intenta de nuevo.' }); else res.end(); } catch (e) {}
  });
});
process.on('uncaughtException', (err) => console.error('  [error inesperado]', err && err.message));
process.on('unhandledRejection', (err) => console.error('  [error inesperado]', err && err.message));
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') console.error('\n  ⚠️  El servidor ya está abierto en otra ventana (puerto ' + CONFIG.puerto + ').\n     Cierra la otra Terminal o usa esa misma.\n');
  else console.error('\n  ⚠️  No se pudo iniciar: ' + err.message + '\n');
  process.exit(1);
});

server.listen(CONFIG.puerto, '0.0.0.0', () => {
  const lista = urls();
  const base = lista[0] || 'http://localhost:' + CONFIG.puerto + '/';
  console.log('\n  ========== OPERACIÓN SERVIDOR ==========');
  console.log('  Pantalla (proyector): ' + base + 'pantalla?pin=' + CONFIG.pinHugo);
  console.log('  Control (tu celular): ' + base + 'control?pin=' + CONFIG.pinHugo);
  console.log('  Jugadores:            ' + base);
  if (lista.length > 1) console.log('  Otras direcciones:    ' + lista.slice(1).join('  '));
  if (!lista.length) console.log('  ⚠️  No estás conectado a ninguna red WiFi. Conéctate al hotspot y reinicia.');
  if (String(CONFIG.pinHugo) === '2026') console.log('  ⚠️  Estás usando el PIN de fábrica (2026). Cámbialo en config.json antes del taller.');
  console.log('  Para detener: Ctrl + C\n');
});
