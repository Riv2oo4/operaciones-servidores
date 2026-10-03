// Medidor de fuerza de contraseñas (se usa en el celular y en el servidor)
(function (root) {
  var COMUNES = [
    '123456', '12345678', '123456789', '1234567890', '12345', '1234', '111111', '000000', '654321', '123123',
    'password', 'contraseña', 'contrasena', 'qwerty', 'qwerty123', 'abc123', 'admin', 'iloveyou', 'teamo',
    'teamo123', 'amor', 'hola', 'hola123', 'guatemala', 'chapin', 'futbol', 'barcelona', 'realmadrid',
    'messi', 'cristiano', 'municipal', 'comunicaciones', 'cremas', 'rojos', 'princesa', 'dragon', 'monkey',
    'superman', 'batman', 'pokemon', 'minecraft', 'freefire', 'fortnite', 'roblox', 'tiktok', 'familia',
    'diosesamor', 'jesus', 'dios', 'mama', 'papa', 'mamá', 'papá', 'secreto', 'clave', 'colegio', 'escuela',
    'perro', 'gato', 'firulais', 'manchas', 'bobby', 'luna', 'sol', 'estrella', 'maria', 'jose', 'juan',
    'carlos', 'luis', 'ana', 'sofia', 'diego', 'rosa', 'hugo', 'daniel', 'david', 'andrea', 'fernanda',
    'miperro!comepizza#loselunes', 'hacker', 'servidor', 'internet', 'whatsapp', 'facebook', 'instagram', 'gmail', 'sanmartin', 'pepian'
  ];

  function normalizar(s) {
    return s.toLowerCase()
      .replace(/4/g, 'a').replace(/3/g, 'e').replace(/1/g, 'i').replace(/0/g, 'o')
      .replace(/5/g, 's').replace(/@/g, 'a').replace(/\$/g, 's').replace(/7/g, 't')
      .normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function tiempoHumano(seg) {
    if (seg < 1) return 'al instante';
    if (seg < 60) return Math.round(seg) + ' segundos';
    if (seg < 3600) return Math.round(seg / 60) + ' minutos';
    if (seg < 86400) return Math.round(seg / 3600) + ' horas';
    if (seg < 31536000) return Math.round(seg / 86400) + ' días';
    var a = seg / 31536000;
    if (a < 1000) return Math.round(a) + ' años';
    if (a < 1e6) return Math.round(a / 1000) + ' mil años';
    if (a < 1e9) return Math.round(a / 1e6) + ' millones de años';
    return 'más que la edad del universo';
  }

  // palabrasExtra: datos personales (nombre del equipo, etc.)
  function evaluar(pw, palabrasExtra) {
    pw = pw || '';
    var consejos = [];
    var lista = COMUNES.concat((palabrasExtra || []).map(normalizar));
    var n = normalizar(pw);
    var nucleo = normalizar(pw.replace(/^[^a-zA-ZñÑ]+|[^a-zA-ZñÑ]+$/g, ''));
    var letras = nucleo.replace(/[^a-zñ]/g, '');
    var GUESSES_POR_SEG = 1e10; // una computadora potente de hacker
    var intentos;

    if (pw.length === 0) {
      return { segundos: 0, tiempo: 'al instante', nivel: 0, puntos: 0, consejos: ['Escribe una contraseña'] };
    }

    var esComun = lista.indexOf(n) >= 0 || lista.indexOf(pw.toLowerCase()) >= 0;
    var palabraConocida = null;
    for (var i = 0; i < lista.length; i++) {
      var w = normalizar(lista[i]);
      if (w.length >= 3 && nucleo.indexOf(w) >= 0) { palabraConocida = lista[i]; break; }
    }

    var pool = 0;
    if (/[a-z]/.test(pw)) pool += 26;
    if (/[A-Z]/.test(pw)) pool += 26;
    if (/[0-9]/.test(pw)) pool += 10;
    if (/[^a-zA-Z0-9]/.test(pw)) pool += 33;
    intentos = Math.pow(pool || 1, pw.length) / 2;

    if (esComun) {
      intentos = 10;
      consejos.push('Es una de las contraseñas más usadas del mundo');
    } else if (palabraConocida && letras.length - normalizar(palabraConocida).length <= 2) {
      // palabra conocida + unos números/símbolos: ataque de diccionario
      // los hackers prueban palabras + números/símbolos al final o al inicio
      intentos = 1e5 * 4;
      var resto = pw.length - palabraConocida.length, extra = pw.replace(/[a-zA-ZñÑ]/g, '');
      for (var r = 0; r < Math.max(0, resto); r++) {
        var ch = extra.charAt(r);
        intentos *= /[0-9]/.test(ch) ? 10 : ch ? 33 : 26;
      }
      consejos.push('Contiene una palabra fácil de adivinar ("' + palabraConocida + '")');
    }
    if (/^(19|20)\d\d$/.test(pw.replace(/^\D+/, '')) || /(19|20)\d\d/.test(pw)) consejos.push('Los años (como tu nacimiento) son lo primero que prueba un hacker');
    if (pw.length < 8) consejos.push('Muy corta: usa al menos 12 caracteres');
    else if (pw.length < 12) consejos.push('Hazla más larga: una frase es mejor');
    if (!/[^a-zA-Z0-9]/.test(pw)) consejos.push('Agrega símbolos como ! ? # *');
    if (!/[A-Z]/.test(pw) || !/[a-z]/.test(pw)) consejos.push('Mezcla mayúsculas y minúsculas');
    if (!/[0-9]/.test(pw)) consejos.push('Agrega algún número');

    var seg = intentos / GUESSES_POR_SEG;
    var nivel = seg < 60 ? 0 : seg < 86400 ? 1 : seg < 31536000 ? 2 : seg < 31536000 * 1000 ? 3 : 4;
    var puntos = [0, 10, 20, 30, 40][nivel];
    if (consejos.length === 0) consejos.push('¡Excelente contraseña!');
    return { segundos: seg, tiempo: tiempoHumano(seg), nivel: nivel, puntos: puntos, consejos: consejos };
  }

  var api = { evaluar: evaluar, tiempoHumano: tiempoHumano };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Fuerza = api;
})(this);
