// Filtro de palabras ofensivas + emoji según el nombre del equipo.
// Puedes agregar palabras en config.json ("palabrasCensuradas").

// Se bloquean aunque estén pegadas a otras letras (ej. "losputos", "p.u.t.a", "puuuta", "put4")
const RAICES = [
  'puta', 'puto', 'putit', 'hijuep', 'hijodep', 'hijaep', 'mierd', 'pendej', 'cerot', 'serot', 'culer', 'culit',
  'verga', 'vergaz', 'maric', 'chinga', 'chingu', 'pajer', 'pajiz', 'malparid', 'cabron', 'joder', 'jodid',
  'coño', 'zorra', 'imbecil', 'idiota', 'estupid', 'mongol', 'retrasad', 'subnormal', 'tarad', 'nazi', 'hitler',
  'porn', 'nalga', 'vagina', 'violad', 'violador', 'cocain', 'marihuan', 'narco', 'sicari', 'salvatruch',
  'prostitut', 'mamaguev', 'mamahuev', 'huevon', 'guevon', 'pelotud', 'boludo', 'gonorre', 'malnacid', 'bastard',
  'fuck', 'shit', 'bitch', 'nigga', 'nigger', 'pussy', 'asshole', 'slut', 'whore', 'faggot', 'pvta', 'pvto', 'mrd', 'cagad', 'cagon',
  'culo', 'pisado', 'pizado'
];
// Solo se bloquean como palabra completa (son parte de muchas palabras normales)
const EXACTAS = [
  'pene', 'penes', 'teta', 'tetas', 'pito', 'pitos', 'mara', 'maras', 'hdp', 'ptm', 'ctm', 'alv', 'vrg',
  'cock', 'dick', 'sexo', 'sex', 'ano', 'anos', 'pija', 'pijas', 'droga', 'drogas', 'cago', 'caca',
  'joto', 'jotos', 'cule', 'verg'
];
// Palabras normales que contienen una raíz bloqueada: se ignoran antes de revisar
// Solo se quita la raíz inocente, así "computaputa" sigue bloqueada
const INOCENTES = /(comput|disput|reput|diput|imput|amput|calcul|articul|vehicul|circul|muscul|ridicul|particul|pelicul|vincul|obstacul|espectacul|curricul|tentacul|oracul|cubicul|maticul|vernacul|macul|fascicul|folicul|minuscul|mayuscul|crepuscul|opuscul|ocul|envergadura|vergara|maricarmen|maricruz|maricela|serotonin|nigeria)/g;

function normalizar(s) {
  return String(s).toLowerCase()
    .replace(/ñ/g, '\u0001')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\u0001/g, 'ñ')
    .replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/7/g, 't')
    .replace(/@/g, 'a').replace(/\$/g, 's').replace(/!/g, 'i');
}
const colapsar = (s) => s.replace(/(.)\1+/g, '$1'); // "puuuta" -> "puta", "zorra" -> "zora"

function crearFiltro(extra) {
  const raices = RAICES.concat((extra || []).map((w) => normalizar(w))).map((r) => colapsar(normalizar(r)));
  const exactas = new Set(EXACTAS.map((w) => colapsar(normalizar(w))));
  return function esOfensivo(texto) {
    const n = normalizar(texto).replace(INOCENTES, ' ');
    const sueltas = n.split(/[^a-zñ]+/).filter(Boolean);
    // une letras sueltas: "p u t a", "p.u.t.a", "pu ta"
    const palabras = [];
    let corta = '';
    for (const p of sueltas) {
      if (p.length <= 2) { corta += p; continue; }
      if (corta) { palabras.push(corta); corta = ''; }
      palabras.push(p);
    }
    if (corta) palabras.push(corta);
    const todas = sueltas.concat(palabras).map(colapsar);
    if (todas.some((p) => exactas.has(p))) return true;
    return todas.some((p) => raices.some((r) => p.includes(r)));
  };
}

// ---------------- Emoji según el nombre ----------------
const EMOJIS = [
  ['tigre', '🐯'], ['leon', '🦁'], ['lobo', '🐺'], ['aguila', '🦅'], ['halcon', '🦅'], ['dragon', '🐉'], ['tiburon', '🦈'],
  ['zorro', '🦊'], ['oso', '🐻'], ['panda', '🐼'], ['gato', '🐱'], ['gatit', '🐱'], ['michi', '🐱'], ['perro', '🐶'], ['chucho', '🐶'],
  ['lobit', '🐺'], ['buho', '🦉'], ['pulpo', '🐙'], ['escorpion', '🦂'], ['alacran', '🦂'], ['serpiente', '🐍'], ['cobra', '🐍'],
  ['vibora', '🐍'], ['piton', '🐍'], ['python', '🐍'], ['arana', '🕷️'], ['spider', '🕷️'], ['mono', '🐵'], ['gorila', '🦍'], ['toro', '🐂'],
  ['caballo', '🐴'], ['unicornio', '🦄'], ['delfin', '🐬'], ['ballena', '🐳'], ['pinguino', '🐧'], ['pollo', '🐥'], ['gallo', '🐓'],
  ['pato', '🦆'], ['conejo', '🐰'], ['raton', '🐭'], ['abeja', '🐝'], ['mariposa', '🦋'], ['tortuga', '🐢'], ['cocodrilo', '🐊'],
  ['dinosaurio', '🦖'], ['dino', '🦖'], ['rex', '🦖'], ['murcielago', '🦇'], ['bat', '🦇'], ['quetzal', '🦜'], ['loro', '🦜'], ['jaguar', '🐆'],
  ['pantera', '🐆'], ['puma', '🐆'], ['fenix', '🦅'], ['cuervo', '🐦'], ['batman', '🦇'], ['monstr', '👹'], ['rana', '🐸'], ['sapo', '🐸'], ['cerdo', '🐷'], ['vaca', '🐮'],
  ['hacker', '🧑‍💻'], ['hack', '🧑‍💻'], ['cyber', '🤖'], ['ciber', '🤖'], ['robot', '🤖'], ['bot', '🤖'], ['android', '🤖'], ['ia', '🧠'],
  ['cerebro', '🧠'], ['genio', '🧠'], ['mente', '🧠'], ['code', '💻'], ['codigo', '💻'], ['program', '💻'], ['compu', '💻'], ['pc', '💻'],
  ['bit', '💾'], ['byte', '💾'], ['pixel', '👾'], ['gamer', '🎮'], ['game', '🎮'], ['jugador', '🎮'], ['player', '🎮'], ['alien', '👽'],
  ['marcian', '👽'], ['ovni', '🛸'], ['fantasma', '👻'], ['ghost', '👻'], ['zombi', '🧟'], ['vampir', '🧛'], ['mago', '🧙'], ['bruj', '🧙'],
  ['ninja', '🥷'], ['pirata', '🏴‍☠️'], ['vikingo', '🪓'], ['guerrer', '⚔️'], ['espada', '⚔️'], ['caballer', '🛡️'], ['escudo', '🛡️'],
  ['rey', '👑'], ['reina', '👑'], ['king', '👑'], ['queen', '👑'], ['princes', '👸'], ['jefe', '😎'], ['boss', '😎'], ['crack', '😎'],
  ['fuego', '🔥'], ['fire', '🔥'], ['llama', '🔥'], ['rayo', '⚡'], ['trueno', '⚡'], ['flash', '⚡'], ['relampago', '⚡'], ['veloz', '⚡'],
  ['rapid', '⚡'], ['hielo', '🧊'], ['ice', '🧊'], ['nieve', '❄️'], ['tormenta', '🌩️'], ['huracan', '🌀'], ['tornado', '🌪️'], ['volcan', '🌋'],
  ['estrella', '⭐'], ['star', '⭐'], ['luna', '🌙'], ['sol', '☀️'], ['galax', '🌌'], ['cosmo', '🌌'], ['espacio', '🚀'], ['cohete', '🚀'],
  ['rocket', '🚀'], ['astro', '🧑‍🚀'], ['planeta', '🪐'], ['mundo', '🌎'], ['tierra', '🌎'], ['mar', '🌊'], ['ola', '🌊'],
  ['rojo', '🔴'], ['roja', '🔴'], ['azul', '🔵'], ['verde', '🟢'], ['amarill', '🟡'], ['morad', '🟣'], ['naranja', '🟠'], ['negro', '⚫'],
  ['negra', '⚫'], ['blanc', '⚪'], ['rosa', '🌸'], ['flor', '🌸'], ['diamante', '💎'], ['oro', '🥇'], ['campeon', '🏆'], ['champion', '🏆'],
  ['ganador', '🏆'], ['invencible', '💪'], ['fuerte', '💪'], ['power', '💪'], ['poder', '💪'], ['titan', '🗿'], ['gigante', '🗿'],
  ['bomba', '💣'], ['dinamita', '🧨'], ['virus', '🦠'], ['bug', '🐛'], ['llave', '🔑'], ['candado', '🔒'], ['secreto', '🤫'],
  ['detective', '🕵️'], ['espia', '🕵️'], ['agente', '🕵️'], ['anonim', '🎭'], ['anonym', '🎭'], ['mascara', '🎭'], ['sombra', '🌑'],
  ['futbol', '⚽'], ['gol', '⚽'], ['crema', '⚪'], ['municipal', '🔴'], ['basket', '🏀'], ['musica', '🎵'], ['rock', '🎸'], ['pizza', '🍕'],
  ['taco', '🌮'], ['pollo', '🍗'], ['cafe', '☕'], ['dulce', '🍬'], ['chapin', '🇬🇹'], ['guate', '🇬🇹'], ['secretari', '⌨️'], ['conta', '🧮'],
  ['perito', '🧮'], ['angel', '😇'], ['diabl', '😈'], ['demon', '😈'], ['loco', '🤪'], ['loca', '🤪'], ['crazy', '🤪'], ['feliz', '😄'],
  ['amig', '🤝'], ['team', '🤝'], ['equipo', '🤝'], ['chic', '✨'], ['super', '🦸'], ['hero', '🦸'], ['aveng', '🦸'], ['uno', '1️⃣'], ['dos', '2️⃣'], ['tres', '3️⃣']
];
const RESERVA = ['🦊', '🦈', '🐯', '🐉', '🦉', '🦂', '🐙', '🦩', '🐺', '🦅', '🐼', '🐬', '🦁', '🐸', '🦖', '🚀', '⚡', '🔥', '👾', '🛸'];

const GENERICAS = ['equipo', 'team', 'amig', 'chic', 'super', 'uno', 'dos', 'tres'];
function emojiPara(nombre, usados) {
  const n = normalizar(nombre).replace(/ñ/g, 'n');
  const palabras = n.split(/[^a-z]+/).filter(Boolean);
  const pegado = palabras.join('');
  let mejor = null;
  for (const [clave, emoji] of EMOJIS) {
    let peso = 0;
    if (clave.length <= 3) { // claves cortas: solo palabra completa (o plural)
      if (palabras.some((p) => p === clave || p === clave + 's' || p === clave + 'es')) peso = clave.length + 1;
    } else if (palabras.some((p) => p.startsWith(clave))) peso = clave.length + 0.5;
    else if (pegado.includes(clave)) peso = clave.length;
    if (!peso) continue;
    if (GENERICAS.includes(clave)) peso = 0.1;
    if (!mejor || peso > mejor.peso) mejor = { emoji, peso };
  }
  if (mejor) return mejor.emoji;
  const libres = RESERVA.filter((e) => !(usados || []).includes(e));
  const lista = libres.length ? libres : RESERVA;
  let h = 0; for (const ch of n) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return lista[h % lista.length];
}

module.exports = { crearFiltro, emojiPara };
