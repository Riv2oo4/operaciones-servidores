# Operación Servidor · Guía de Hugo

Taller de 15 minutos con **6 misiones a elegir**, jugado de forma **individual**: cada alumno entra con su celular y un apodo. En 15 minutos caben 3 o 4: tú decides cuáles y en qué orden desde el Control.

| Misión | Min | Qué hacen | Qué aprenden |
|---|---|---|---|
| 🤖 IA con dibujos | 5 | Dibujan ☀️ y 🌙; cada IA se prueba con los dibujos de los demás | La IA aprende de datos |
| ✊ IA con fotos | 5 | Toman fotos de su mano (piedra, papel, tijera) y retan a su IA a reconocerlos | Visión por computadora y sesgo |
| 🕵️ Huellas digitales | 3 | Buscan datos personales en el perfil de un personaje (distinto para cada grupo) | Lo que publicas, un hacker lo usa |
| 🔑 Hackear la cuenta | 4 | Adivinan su contraseña con lo que encontraron y luego protegen su cuenta | Contraseñas seguras |
| ⚔️ Duelo de contraseñas | 4 | Cada quien crea la contraseña de su bóveda y otro jugador intenta descifrarla con pistas de colores | Largo y variedad de una contraseña |
| 📶 WiFi gratis | 3 | Se mandan secretos… y aparecen en el proyector | Espionaje en WiFi abiertas y cifrado |

"Hackear la cuenta" funciona mejor justo después de "Huellas digitales", porque usan lo que encontraron.

Los puntos de los 7 grupos se acumulan en un **ranking del día** que puedes mostrar en la charla final.

---

## 1. Antes del taller (una sola vez, en casa)

1. Instala **Node.js** (versión LTS) desde https://nodejs.org.
2. Abre `config.json` y cambia lo que necesites:
   - `wifi.nombre` y `wifi.clave`: el nombre y la clave **del hotspot** (ver punto 2).
   - `pinHugo`: el PIN para tu pantalla de control. Por defecto es `2026`.
   - `minutosPorFase`: cuánto dura cada misión.
3. Haz una prueba completa en casa con 2 celulares.

## 2. El WiFi (sin dar tu contraseña)

- La clave del hotspot **no es la de tu teléfono**: es otra, solo para la red. En iPhone: *Ajustes → Compartir Internet → Contraseña Wi-Fi*. Ponle algo temporal como `hacker2026` y cámbiala al terminar el día.
- Ni siquiera la tienen que ver: la pantalla del proyector muestra un **QR de WiFi**. Lo escanean con la cámara y se conectan solos.
- Cambia el **nombre** del hotspot a `OperacionServidor` (en iPhone es el nombre del teléfono: *Ajustes → General → Información → Nombre*).
- **Apaga los datos móviles** del teléfono si no quieres gastar saldo: el juego corre en tu laptop y no necesita internet.
- **Ojo con la cantidad de celulares.** Como ahora cada alumno entra con el suyo, un hotspot de teléfono no alcanza: aguanta unos 5 a 10. Para un grupo de 20 a 40 necesitas un **router** (uno de viaje TP-Link cuesta unos Q150 a Q250; no necesita internet, solo enchufarlo). Conecta tu laptop a ese router y pon su nombre y clave en `config.json`.
- Si no consigues router, que jueguen en parejas o tríos con un solo celular: el juego funciona igual.
- El servidor acepta hasta 60 jugadores (`maxJugadores` en `config.json`).
- **Android:** cuando el WiFi no tiene internet, el celular avisa "Sin conexión a internet". Que toquen **"Mantener conexión"**. Si no carga la página, que apaguen sus datos móviles.

## 3. El día del taller

1. Conecta tu laptop al hotspot.
2. Doble clic en **`iniciar.command`**, o en la Terminal: `cd` a esta carpeta y luego `node server.js`.
   - La primera vez, si macOS pregunta si permites conexiones entrantes a "node", di **Permitir**.
3. La Terminal muestra 3 direcciones:
   - **Pantalla** (`/pantalla?pin=2026`): ábrela en la laptop, conéctala al proyector y ponla en pantalla completa (Cmd+Ctrl+F). Haz clic en **🔊 Activar sonido**.
   - **Control** (`/control?pin=2026`): ábrela en **tu celular** (conectado al mismo hotspot). Desde ahí manejas todo.
   - **Jugadores**: la dirección que tiene el QR.
4. No cierres la Terminal mientras dure el taller.

## 4. Cómo correr cada ronda (desde el Control)

El Control tiene tres pestañas abajo. Casi todo el tiempo vas a estar en la primera.

**▶️ Ronda** te lleva de la mano:

1. Arriba ves el grupo que toca y **cuánto falta para que se vayan** (según el horario).
2. La tarjeta **Ahora** dice en qué vas, con el reloj de la misión y los pasos (Explicas → Juegan → Revelas → Siguiente).
3. Siempre hay **un botón grande** con lo que toca hacer: revelar, iniciar el ataque, activar el cifrado o guardar la ronda.
4. **Qué decir ahora** trae el guion de esa misión. En "Hackear la cuenta" también te muestra la respuesta.
5. Al revelar aparece la lista de **qué sigue**, con una misión marcada como *sugerida* (el plan por defecto es IA con dibujos → Huellas → Hackear → WiFi; cámbialo en `planSugerido` de `config.json`). Puedes elegir cualquier otra.
6. Al final eliges **Terminar: podio y ranking**, y luego **Guardar ronda**: suma los puntos al ranking de hoy y deja todo listo para el siguiente grupo.

**👥 Jugadores**: puntos de cada jugador, **+10 / −10**, **✕** para sacar a alguien, y el ranking de hoy.

**⚙️ Ajustes**: cambiar de grupo, de personaje o de dificultad, elegir otra dirección para el QR, reiniciar la ronda o borrar el ranking de hoy. Normalmente no hace falta tocar nada: el grupo y la dificultad se ponen solos.

Detalles de algunas misiones:

- **WiFi gratis:** espera ~1 min de mensajes, luego **Revelar al hacker**, y después **Activar cifrado**. Mientras tanto puedes tocar un mensaje para ocultarlo del proyector.
- **Duelo de contraseñas:** cuando todos tengan su bóveda cerrada, presiona **Iniciar ataque**. A quien no creó contraseña le toca `1234`. Cada jugador ataca al siguiente de la lista; si abre su bóveda, pasa al que sigue.
- **IA con fotos:** pide fondo liso (mesa o cuaderno) y que la mano llene la foto. Con 2 fotos de cada gesto se desbloquea el reto.
- Después de revelar, una misión ya no da puntos (así nadie copia la respuesta del proyector).

### Seguridad de tu Control

- **Cambia el PIN** (`pinHugo` en `config.json`). El de fábrica es `2026` y un alumno curioso lo adivina. La Terminal y la pestaña Ajustes te avisan mientras no lo cambies.
- El PIN **ya no se queda en la barra de direcciones**, para que no se vea en el proyector.
- Tras 5 PIN incorrectos desde un mismo celular, ese celular queda bloqueado 1 minuto.
- El ranking y los jugadores son **solo del día**: lo que pruebes en casa el día anterior no aparece en el taller.

### Nombres y palabras ofensivas

- El juego **rechaza** apodos, mensajes y contraseñas del duelo con groserías, aunque las disfracen (`p.u.t.a`, `put4`, `puuuta`). Les pide escribir otra cosa.
- Palabras normales como "computación" o "calculadora" sí pasan.
- Para bloquear más palabras, agrégalas en `palabrasCensuradas` dentro de `config.json`. La lista base está en `filtro.js`.
- Ningún filtro es perfecto: en WiFi gratis puedes tocar un mensaje en el Control para **ocultarlo del proyector**, y con **✕** sacas a un jugador.

### Apodos y emojis

- Cada alumno escribe un **apodo** (no su nombre completo, porque sale en el proyector). No se puede repetir un apodo dentro del mismo grupo.
- El emoji se elige solo según el apodo: "Dragón" 🐉, "Rayo" ⚡, "La Reina" 👑, "NinjaGT" 🥷. Si no tiene ninguna palabra conocida, le toca uno al azar. La lista está en `filtro.js`.
- Con muchos jugadores, el proyector muestra a los **12 primeros** del marcador; cada quien ve su lugar en su celular.

### Sobre las fotos (IA con fotos)

- El celular abre su **cámara normal** para cada foto (toman la foto y tocan "Usar foto"). Es así porque la cámara en vivo dentro de una página solo funciona con https, y un servidor local no lo tiene.
- Las fotos **no se guardan ni se envían**: el celular las convierte en números y solo eso llega a tu laptop. Nada aparece en el proyector.
- Esta misión solo la probé con imágenes de prueba, no con fotos reales de manos. **Pruébala en casa** antes de usarla: si reconoce mal, usa "IA con dibujos", que es más confiable.

### Un personaje distinto por grupo

Para que un grupo no le pase las respuestas al siguiente, cada grupo recibe **otro personaje**: otro perfil, otros datos escondidos y una contraseña armada con otra receta. Se asigna solo al elegir el grupo.

| Hora | Grupo | Personaje | Receta de la contraseña | Respuesta |
|---|---|---|---|---|
| 8:00 | E | Andrés López | equipo + últimos 4 del teléfono | `Xel4ju3071` |
| 8:30 | D | Fernanda Reyes | banda favorita + año de nacimiento | `Estr3llafugaz2007` |
| 9:00 | C | Javier Méndez | nombre de la mamá + año de nacimiento | `gloria2008` |
| 10:00 | B | Valeria Gómez | ciudad donde nació + cumpleaños (día y mes) | `coban2208` |
| 10:30 | A | Diego Morales | mascota + año de nacimiento | `firulais2009` |
| 11:30 | G | Daniela Castillo | nombre de la mamá + cumpleaños (día y mes) | `carmen2706` |
| 12:00 | F | Mateo Pérez | nombre del hermano + cumpleaños (día y mes) | `Luc4s0312` |

- En dificultad **Avanzado** (grupos D, E y F) la primera letra va en mayúscula y una letra se cambia por un número. En Básico y Práctico da igual mayúsculas o minúsculas.
- No necesitas memorizarlas: durante la misión, el Control te muestra la **respuesta** debajo del guion.
- Si alguien se traba, el juego le da pistas automáticas según los intentos.
- Puedes cambiar el personaje de un grupo en el Control (sección *Personaje de este grupo*) o en `config.json` (`personaje`, del 0 al 6).

Lo que **no** cambia entre grupos, porque no tiene una respuesta que se pueda pasar: los dibujos de ☀️ y 🌙, las fotos de piedra, papel o tijera, el duelo (las contraseñas las inventan ellos) y el WiFi gratis.

## 5. Si algo falla

| Problema | Solución |
|---|---|
| Los celulares no abren la página | Revisa que estén en el hotspot (no en el WiFi del colegio). En el Control, en *Conexión*, prueba otra dirección. |
| La pantalla dice "No se pudo conectar" | Revisa el PIN en la dirección (`?pin=...`). |
| Un celular se salió | Que vuelva a abrir la página en el mismo celular: entra solo, con sus puntos. Si le pide apodo otra vez, que escriba uno distinto (el anterior ya está ocupado). |
| Se cerró la Terminal | Vuelve a iniciar. El estado y el ranking se guardan en la carpeta `data/`. |
| Quieres empezar el día desde cero | En el Control: **🗑 Borrar ranking del día**. |

## 6. Personalizar

- Perfiles de los 7 personajes, sus datos escondidos y la receta de cada contraseña: `contenido.js`.
- Largo permitido de las contraseñas del duelo (4 a 8): `duelo` en `config.json`.
- Qué dibujan en la misión 1 (por defecto ☀️ Sol y 🌙 Luna): `clasesIA` en `config.json`. Usa dibujos que se vean muy diferentes.
- Horario y nombres de los grupos: `config.json`.
