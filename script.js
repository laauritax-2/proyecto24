// Nombre usado para guardar las historias en el navegador
const CLAVE_HISTORIAS = "misHistorias24Horas";

// Seleccionamos los elementos del HTML
const listaHistorias = document.getElementById("lista-historias");
const selectorImagen = document.getElementById("selector-imagen");
const bienvenida = document.getElementById("bienvenida");
const mensaje = document.getElementById("mensaje");
const visor = document.getElementById("visor");
const imagenHistoria = document.getElementById("imagen-historia");
const barrasProgreso = document.getElementById("barras-progreso");

// Variables para controlar la historia abierta
let historias = [];
let indiceActual = 0;
let temporizador = null;
let inicioDeslizar = 0;

// Muestra mensajes en la página
function mostrarMensaje(texto, esError = false) {
  mensaje.textContent = texto; // Cambia el texto del mensaje
  mensaje.classList.toggle("error", esError); // Activa el estilo de error
}

// Carga las historias guardadas y elimina las que ya vencieron
function cargarHistorias() {
  try {
    const guardadas = JSON.parse(localStorage.getItem(CLAVE_HISTORIAS)) || [];
    const ahora = Date.now();

    // Conserva las historias publicadas hace menos de 24 horas
    historias = guardadas.filter(historia => ahora - historia.fecha < 24 * 60 * 60 * 1000);
    guardarHistorias(); // Actualiza el almacenamiento sin las historias vencidas
  } catch (error) {
    historias = []; // Inicia vacío si los datos no se pueden leer
    mostrarMensaje("No se pudieron leer las historias guardadas.", true);
  }
}

// Guarda la lista de historias en localStorage
function guardarHistorias() {
  try {
    localStorage.setItem(CLAVE_HISTORIAS, JSON.stringify(historias));
  } catch (error) {
    mostrarMensaje("No hay espacio suficiente para guardar la imagen. Prueba con otra más pequeña.", true);
    throw error; // Permite que la función que sube la imagen controle el error
  }
}

// Abre el selector de imágenes
function abrirSelector() {
  selectorImagen.click(); // Simula el clic en el campo de archivo
}

// Redimensiona la imagen y la convierte a Base64
function convertirImagen(archivo) {
  return new Promise((resolver, rechazar) => {
    const lector = new FileReader(); // Lee el archivo elegido

    lector.onload = function(evento) {
      const imagen = new Image(); // Carga la imagen para conocer su tamaño

      imagen.onload = function() {
        const limiteAncho = 1080; // Ancho máximo solicitado
        const limiteAlto = 1920; // Alto máximo solicitado
        const escala = Math.min(1, limiteAncho / imagen.width, limiteAlto / imagen.height);
        const ancho = Math.round(imagen.width * escala); // Calcula el ancho final
        const alto = Math.round(imagen.height * escala); // Calcula el alto final

        const lienzo = document.createElement("canvas"); // Crea un espacio para redimensionar
        lienzo.width = ancho; // Define el ancho del lienzo
        lienzo.height = alto; // Define el alto del lienzo
        const contexto = lienzo.getContext("2d"); // Obtiene el contexto para dibujar
        contexto.drawImage(imagen, 0, 0, ancho, alto); // Dibuja la imagen con el tamaño nuevo

        const base64 = lienzo.toDataURL("image/jpeg", 0.85); // Convierte a Base64
        resolver(base64); // Devuelve la imagen convertida
      };

      imagen.onerror = () => rechazar(new Error("No se pudo procesar la imagen."));
      imagen.src = evento.target.result; // Carga los datos leídos
    };

    lector.onerror = () => rechazar(new Error("No se pudo leer el archivo."));
    lector.readAsDataURL(archivo); // Lee el archivo como una dirección Base64
  });
}

// Agrega la imagen seleccionada como una historia nueva
async function agregarHistoria(archivo) {
  if (!archivo) return; // Termina si no se eligió un archivo

  if (!archivo.type.startsWith("image/")) {
    mostrarMensaje("Selecciona un archivo de imagen.", true);
    return;
  }

  try {
    mostrarMensaje("Preparando tu historia...");
    const imagenBase64 = await convertirImagen(archivo); // Redimensiona y convierte la foto

    const nuevaHistoria = {
      id: Date.now(), // Identificador de la historia
      imagen: imagenBase64, // Imagen en formato Base64
      fecha: Date.now() // Fecha y hora de publicación
    };

    historias.push(nuevaHistoria); // Añade la historia a la lista
    guardarHistorias(); // Guarda la lista en el navegador
    mostrarHistorias(); // Actualiza los círculos de historias
    mostrarMensaje("¡Tu historia se publicó correctamente!");
  } catch (error) {
    mostrarMensaje(error.message || "No se pudo guardar la historia.", true);
  } finally {
    selectorImagen.value = ""; // Permite elegir otra vez la misma foto
  }
}

// Dibuja el botón + y las historias publicadas
function mostrarHistorias() {
  listaHistorias.innerHTML = ""; // Limpia el contenido anterior

  const botonAgregar = document.createElement("button"); // Crea el botón de agregar
  botonAgregar.type = "button"; // Define su tipo
  botonAgregar.className = "elemento-historia boton-agregar";
  botonAgregar.innerHTML = '<span class="circulo-historia">+</span><span class="nombre-historia">Tu historia</span>';
  botonAgregar.addEventListener("click", abrirSelector); // Abre el selector al pulsar
  listaHistorias.appendChild(botonAgregar); // Lo coloca al principio

  historias.forEach((historia, indice) => {
    const boton = document.createElement("button"); // Crea el botón de cada historia
    boton.type = "button"; // Define su tipo
    boton.className = "elemento-historia";
    boton.innerHTML = `<span class="circulo-historia"><img src="${historia.imagen}" alt="Vista previa"></span><span class="nombre-historia">Mi historia</span>`;
    boton.addEventListener("click", () => abrirHistoria(indice)); // Abre la historia elegida
    listaHistorias.appendChild(boton); // Agrega el círculo a la fila
  });

  bienvenida.classList.toggle("oculto", historias.length > 0); // Oculta el mensaje si hay historias
}

// Abre el visor en la historia seleccionada
function abrirHistoria(indice) {
  indiceActual = indice; // Guarda el índice seleccionado
  visor.classList.remove("oculto"); // Muestra el visor
  document.body.style.overflow = "hidden"; // Evita desplazar el fondo
  mostrarHistoriaActual(); // Carga la historia
}

// Muestra la historia actual y crea sus barras de progreso
function mostrarHistoriaActual() {
  clearTimeout(temporizador); // Detiene el temporizador anterior

  if (indiceActual >= historias.length) {
    cerrarVisor(); // Cierra cuando ya no quedan historias
    return;
  }

  imagenHistoria.src = historias[indiceActual].imagen; // Muestra la foto seleccionada
  document.getElementById("tiempo-historia").textContent = calcularTiempo(historias[indiceActual].fecha);
  barrasProgreso.innerHTML = ""; // Limpia las barras anteriores

  historias.forEach((historia, indice) => {
    const barra = document.createElement("div"); // Crea el fondo de una barra
    barra.className = "barra";
    const progreso = document.createElement("div"); // Crea el avance de la barra
    progreso.className = "progreso";

    if (indice < indiceActual) progreso.classList.add("completa"); // Completa las anteriores
    if (indice === indiceActual) progreso.classList.add("activa"); // Anima la actual durante 3 segundos

    barra.appendChild(progreso); // Coloca el progreso dentro de su barra
    barrasProgreso.appendChild(barra); // Agrega la barra al visor
  });

  temporizador = setTimeout(siguienteHistoria, 3000); // Pasa a la siguiente tras 3 segundos
}

// Calcula cuánto tiempo hace que se publicó la historia
function calcularTiempo(fecha) {
  const minutos = Math.floor((Date.now() - fecha) / 60000); // Convierte a minutos
  if (minutos < 1) return "Ahora"; // Menos de un minuto
  if (minutos < 60) return `Hace ${minutos} min`; // Menos de una hora
  return `Hace ${Math.floor(minutos / 60)} h`; // Muestra las horas
}

// Avanza a la siguiente historia
function siguienteHistoria() {
  indiceActual++; // Aumenta el índice
  mostrarHistoriaActual(); // Muestra la historia siguiente
}

// Regresa a la historia anterior
function historiaAnterior() {
  if (indiceActual > 0) indiceActual--; // Retrocede si no es la primera
  mostrarHistoriaActual(); // Muestra la historia correspondiente
}

// Cierra el visor y detiene el temporizador
function cerrarVisor() {
  clearTimeout(temporizador); // Detiene el cambio automático
  visor.classList.add("oculto"); // Oculta el visor
  imagenHistoria.src = ""; // Limpia la imagen
  document.body.style.overflow = ""; // Permite desplazar la página
}

// Configura los botones del visor
document.getElementById("anterior").addEventListener("click", historiaAnterior);
document.getElementById("siguiente").addEventListener("click", siguienteHistoria);
document.getElementById("cerrar-visor").addEventListener("click", cerrarVisor);

// Detecta cuando el usuario selecciona una fotografía
selectorImagen.addEventListener("change", function() {
  agregarHistoria(selectorImagen.files[0]); // Procesa el archivo elegido
});

// Guarda dónde empieza el gesto de deslizar
document.getElementById("visor-contenido").addEventListener("touchstart", function(evento) {
  inicioDeslizar = evento.changedTouches[0].clientX; // Posición inicial del dedo
}, { passive: true });

// Cambia de historia según la dirección del deslizamiento
document.getElementById("visor-contenido").addEventListener("touchend", function(evento) {
  const finalDeslizar = evento.changedTouches[0].clientX; // Posición final
  const diferencia = finalDeslizar - inicioDeslizar; // Calcula el movimiento

  if (Math.abs(diferencia) > 50) {
    if (diferencia < 0) siguienteHistoria(); // Deslizar a la izquierda avanza
    else historiaAnterior(); // Deslizar a la derecha retrocede
  }
}, { passive: true });

// Permite cerrar el visor con la tecla Escape
document.addEventListener("keydown", function(evento) {
  if (evento.key === "Escape" && !visor.classList.contains("oculto")) cerrarVisor();
});

// Revisa y dibuja las historias que todavía están vigentes
function revisarHistorias() {
  cargarHistorias(); // Elimina historias que cumplieron 24 horas
  mostrarHistorias(); // Actualiza la lista
}

// Inicia la aplicación y revisa las historias cada minuto
revisarHistorias();
setInterval(revisarHistorias, 60000);
