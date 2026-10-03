// Contenido de los juegos. Puedes editar textos aquí.
//
// Hay un PERSONAJE distinto para cada grupo (7 en total). Cada uno tiene su propio perfil,
// sus propios datos escondidos y una contraseña armada con una "receta" distinta
// (por ejemplo: mascota + año, o ciudad + cumpleaños). Así, si un grupo le cuenta
// la respuesta al siguiente, no le sirve.

// ---------- Tipos de dato personal ----------
// frase: cómo aparece en las pistas automáticas de la contraseña
const PISTAS = {
  equipo:     { nombre: 'Equipo favorito',       icono: '⚽', frase: 'su equipo favorito', leccion: 'Tu equipo favorito es de lo primero que un hacker prueba como contraseña.' },
  cumple:     { nombre: 'Cumpleaños',            icono: '🎂', frase: 'su cumpleaños en números (día y mes, 4 dígitos)', leccion: 'Muchas contraseñas y preguntas de seguridad usan la fecha de cumpleaños.' },
  mascota:    { nombre: 'Nombre de la mascota',  icono: '🐾', frase: 'el nombre de su mascota', leccion: '"¿Cómo se llama tu primera mascota?" es una pregunta de seguridad clásica.' },
  colegio:    { nombre: 'Colegio',               icono: '🏫', frase: 'el nombre de su colegio', leccion: 'Con tu colegio alguien sabe dónde encontrarte de lunes a viernes.' },
  mama:       { nombre: 'Nombre de la mamá',     icono: '👩', frase: 'el nombre de su mamá', leccion: 'Los bancos preguntan el nombre de tu mamá para recuperar cuentas.' },
  hermano:    { nombre: 'Nombre de un hermano',  icono: '🧒', frase: 'el nombre de su hermano o hermana', leccion: 'Los nombres de tu familia son de lo primero que se prueba como contraseña.' },
  telefono:   { nombre: 'Número de teléfono',    icono: '📱', frase: 'los últimos 4 números de su teléfono', leccion: 'Con tu número te pueden llamar fingiendo ser tu banco o mandarte estafas.' },
  nacimiento: { nombre: 'Año de nacimiento',     icono: '📅', frase: 'el año en que nació', leccion: 'Nombre + año de nacimiento es la contraseña más común en Latinoamérica.' },
  direccion:  { nombre: 'Dirección de la casa',  icono: '🏠', frase: 'su dirección', leccion: 'Nunca publiques dónde vives: es un riesgo de seguridad física, no solo digital.' },
  ciudad:     { nombre: 'Ciudad donde nació',    icono: '📍', frase: 'la ciudad donde nació', leccion: '"¿En qué ciudad naciste?" es otra pregunta de seguridad muy usada.' },
  banda:      { nombre: 'Banda favorita',        icono: '🎤', frase: 'su banda favorita', leccion: 'Tus gustos (música, series, juegos) son contraseñas muy fáciles de adivinar.' }
};

// ---------- Personajes ----------
// {{tipo|texto}} marca un dato sensible que los equipos deben encontrar (8 por personaje).
// receta: los 2 datos que forman la contraseña, en orden.
// leet: en modo avanzado cambia esa letra por un número (y la primera letra va en mayúscula).
// boveda: contraseña de la "Bóveda del profe" en el duelo (solo se usa si hay un único equipo).
const CASOS = [
  {
    usuario: '@diego.gt09', nombre: 'Diego Morales', genero: 'm', avatar: '🧑🏽', seguidores: '1,284',
    bio: 'Diego 🇬🇹 | Fan de {{equipo|Municipal}} ⚽ | 🎂 {{cumple|14 de marzo}}',
    posts: [
      { foto: '🐶🎉', texto: '¡Feliz cumple a mi perrito {{mascota|Firulais}}! Ya tiene 5 años #MiMejorAmigo', likes: 87 },
      { foto: '🏫📚', texto: 'Primer día en el {{colegio|Colegio San Martín}} ¡a darle con todo!', likes: 54 },
      { foto: '🍲😋', texto: 'Mi mamá {{mama|Rosa}} cocinó pepián, la mejor cocinera del mundo', likes: 112 },
      { foto: '🎁📱', texto: 'Página: SORTEO de un celular nuevo, comenta tu número para participar',
        comentario: { autor: 'diego.gt09', texto: '¡Yo quiero! {{telefono|5555-1234}} 🙏🙏' }, likes: 3 },
      { foto: '😎📸', texto: 'Nací en {{nacimiento|2009}} y sigo igual de guapo #Throwback', likes: 201 },
      { foto: '🏠🌙', texto: 'Por fin en casita, {{direccion|3a calle 4-56 zona 7}} 😴', likes: 45 }
    ],
    receta: ['mascota', 'nacimiento'], leet: ['i', '1'], boveda: 'gato12'
  },
  {
    usuario: '@vale.gmz', nombre: 'Valeria Gómez', genero: 'f', avatar: '👩🏻', seguidores: '2,031',
    bio: 'Vale ✨ | Orgullosa de ser de {{ciudad|Cobán}} 🌿 | Fan #1 de {{banda|Los Cometas}} 🎤',
    posts: [
      { foto: '🎂🎈', texto: 'Hoy {{cumple|22 de agosto}} es mi día favorito del año ¡a celebrar! #Cumpleañera', likes: 164 },
      { foto: '🐱💤', texto: 'Mi gatita {{mascota|Canela}} durmiendo en mi cama otra vez', likes: 98 },
      { foto: '🎓📖', texto: 'Con mis amigas del {{colegio|Liceo Las Flores}} en la feria científica', likes: 73 },
      { foto: '👩‍👧💐', texto: 'Feliz día a la mejor mamá del mundo, te amo {{mama|Lucía}}', likes: 220 },
      { foto: '🛍️👗', texto: 'Tienda: ¿Quién quiere 50% de descuento? Déjanos tu WhatsApp',
        comentario: { autor: 'vale.gmz', texto: 'Yo yo yo 🙋‍♀️ {{telefono|5555-8842}}' }, likes: 9 },
      { foto: '👶📷', texto: 'Foto de cuando nací en {{nacimiento|2008}}, era una bolita #TBT', likes: 131 }
    ],
    receta: ['ciudad', 'cumple'], leet: ['o', '0'], boveda: 'luna77'
  },
  {
    usuario: '@andres.lpz10', nombre: 'Andrés López', genero: 'm', avatar: '👦🏽', seguidores: '876',
    bio: 'Andrés | Superchivo de corazón, aguante {{equipo|Xelajú}} 🔴🔵 | Gamer 🎮',
    posts: [
      { foto: '🐕🦴', texto: 'Paseando con {{mascota|Rocky}} por el parque, ya aprendió a dar la pata', likes: 66 },
      { foto: '📲🎮', texto: 'Vendo mi consola casi nueva, escríbanme al {{telefono|5555-3071}} solo interesados', likes: 12 },
      { foto: '👫🍕', texto: 'Pizza con mi hermana {{hermano|Paola}} porque pasó todas sus clases', likes: 58 },
      { foto: '🏫⚽', texto: 'Campeones del torneo del {{colegio|Instituto El Roble}} ¡vamos!', likes: 143 },
      { foto: '🎉🎂', texto: 'Mañana {{cumple|5 de mayo}} cumplo años, acepto regalos', likes: 77 },
      { foto: '🏡📍', texto: 'Fiesta en mi casa el sábado: {{direccion|8a avenida 12-30 zona 1}}, lleguen todos', likes: 39 },
      { foto: '🎮🕹️', texto: 'Mi usuario nuevo en todos los juegos es andres{{nacimiento|2010}}, agréguenme', likes: 25 }
    ],
    receta: ['equipo', 'telefono'], leet: ['a', '4'], boveda: 'sol345'
  },
  {
    usuario: '@fer.reyes', nombre: 'Fernanda Reyes', genero: 'f', avatar: '👧🏽', seguidores: '3,410',
    bio: 'Fer 🎧 | Nací en {{nacimiento|2007}} | Si no estoy estudiando estoy escuchando a {{banda|Estrella Fugaz}}',
    posts: [
      { foto: '🎤🎶', texto: 'Ya tengo mi entrada para el concierto, nos vemos ahí #Fan', likes: 310 },
      { foto: '🐰🥕', texto: 'Les presento a {{mascota|Pompón}}, el conejo más consentido de Guatemala', likes: 205 },
      { foto: '👩‍🍳🫔', texto: 'Los tamales de mi mamá {{mama|Elena}} no tienen comparación', likes: 88 },
      { foto: '🏠🎄', texto: 'Ya pusimos el arbolito en la casa, {{direccion|5a calle 9-21 zona 10}}', likes: 92 },
      { foto: '🎓✏️', texto: 'Último año en el {{colegio|Colegio Santa Clara}}, qué rápido pasa el tiempo', likes: 150 },
      { foto: '🎁🎈', texto: 'Cuenta regresiva: falta 1 semana para el {{cumple|19 de septiembre}} 🥳', likes: 117 },
      { foto: '📱💬', texto: 'Cambié de número, ahora es {{telefono|5555-6417}}, guárdenlo', likes: 20 }
    ],
    receta: ['banda', 'nacimiento'], leet: ['e', '3'], boveda: 'nube58'
  },
  {
    usuario: '@mateo.px', nombre: 'Mateo Pérez', genero: 'm', avatar: '🧒🏻', seguidores: '1,502',
    bio: 'Mateo 🏀 | {{colegio|Colegio Monte Verde}} | Hincha de {{equipo|Antigua}} 💚',
    posts: [
      { foto: '👦🏀', texto: 'Mi hermano {{hermano|Lucas}} por fin me ganó un partido, solo uno', likes: 71 },
      { foto: '🎂🍰', texto: 'Gracias a todos por las felicitaciones de hoy {{cumple|3 de diciembre}}', likes: 188 },
      { foto: '🐢🌿', texto: 'Mi tortuga {{mascota|Manchas}} ya tiene casa nueva', likes: 64 },
      { foto: '📍🌋', texto: 'Visitando {{ciudad|Escuintla}}, la ciudad donde nací, qué calor', likes: 83 },
      { foto: '🏆📱', texto: 'Liga: Inscripciones abiertas al torneo, comenta tu número',
        comentario: { autor: 'mateo.px', texto: 'Me apunto con mi equipo: {{telefono|5555-2096}}' }, likes: 15 },
      { foto: '📅🎒', texto: 'Los que nacimos en {{nacimiento|2009}} ya casi salimos de básicos', likes: 99 }
    ],
    receta: ['hermano', 'cumple'], leet: ['a', '4'], boveda: 'rio901'
  },
  {
    usuario: '@dani.cast', nombre: 'Daniela Castillo', genero: 'f', avatar: '👩🏽', seguidores: '2,765',
    bio: 'Dani 📚 | Futura secretaria bilingüe | De {{ciudad|Jutiapa}} para el mundo 🌎',
    posts: [
      { foto: '🦜🌻', texto: 'Mi lorita {{mascota|Pelusa}} ya dice "hola" y "tengo hambre"', likes: 176 },
      { foto: '📞💼', texto: 'Busco trabajo de medio tiempo, me pueden llamar al {{telefono|5555-7790}}', likes: 31 },
      { foto: '👩‍👧☕', texto: 'Cafecito con mi mamá {{mama|Carmen}}, mi mejor amiga', likes: 140 },
      { foto: '🎉🎂', texto: 'Mis 16 fueron los mejores, gracias por venir el {{cumple|27 de junio}}', likes: 233 },
      { foto: '🏫⌨️', texto: 'Clase de mecanografía en el {{colegio|Instituto Nueva Era}}, ya escribo sin ver', likes: 61 },
      { foto: '🏠🔑', texto: 'Nos mudamos, casa nueva en {{direccion|2a avenida 7-15 zona 3}}', likes: 104 },
      { foto: '⭐📆', texto: 'Generación {{nacimiento|2008}} presente, la mejor de todas', likes: 87 }
    ],
    receta: ['mama', 'cumple'], leet: ['e', '3'], boveda: 'flor26'
  },
  {
    usuario: '@javi.mdz', nombre: 'Javier Méndez', genero: 'm', avatar: '🧑🏻', seguidores: '942',
    bio: 'Javi 💻 | Perito en compu | Crema hasta la muerte, {{equipo|Comunicaciones}} ⚪',
    posts: [
      { foto: '👩💐', texto: 'Feliz cumpleaños a mi mamá {{mama|Gloria}}, la jefa de la casa', likes: 121 },
      { foto: '🐈‍⬛🌙', texto: 'Adopté a {{mascota|Sombra}}, un gato negro que llegó solo a la casa', likes: 149 },
      { foto: '💻🏫', texto: 'Laboratorio nuevo en el {{colegio|Colegio Los Pinos}}, por fin', likes: 67 },
      { foto: '🚗📝', texto: 'Ya tengo edad para la licencia, nací en {{nacimiento|2008}} por si dudan', likes: 58 },
      { foto: '🎂🎮', texto: 'Mi regalo del {{cumple|11 de febrero}}: teclado mecánico nuevo', likes: 94 },
      { foto: '📦🏠', texto: 'Tienda: Envío gratis, ¿a qué dirección lo mandamos?',
        comentario: { autor: 'javi.mdz', texto: 'A la {{direccion|6a calle 3-48 zona 5}} porfa' }, likes: 6 },
      { foto: '📱🔧', texto: 'Reparo celulares y compus, escríbanme al {{telefono|5555-4583}}', likes: 28 }
    ],
    receta: ['mama', 'nacimiento'], leet: ['o', '0'], boveda: 'pan473'
  }
];

module.exports = { PISTAS, CASOS };
