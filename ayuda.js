"use strict";

/* =========================================================
   MENSAJERÍA EXPRESS
   AYUDA / SOPORTE TÉCNICO - BACK OFFICE

   FUNCIONAMIENTO:
   - Usa exclusivamente la sesión del BACK OFFICE.
   - Storage: mensajeria-backoffice-auth
   - Busca el Back Office en back_offices.
   - NO utiliza perfiles.
   - NO utiliza la sesión principal del cliente.
   - NO muestra a Carlos de Paz ni a otro cliente.
   - El ticket queda registrado con los datos del
     Back Office que está logueado.
   - Permite adjuntar imágenes, PDF y otros archivos.
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
    "https://kayzwwgmebtsaiovkeos.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_yj-QjGhy6RQNUzoxg3HQeg_hkZHuSyL";


/* =========================================================
   CLIENTE SUPABASE
   SESIÓN EXCLUSIVA DEL BACK OFFICE
========================================================= */

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
        auth: {
            storageKey: "mensajeria-backoffice-auth",
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
);


/* =========================================================
   VARIABLES
========================================================= */

let usuarioSesion = null;
let backOfficeActual = null;


/* =========================================================
   INICIO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log("========================================");
        console.log("MENSAJERÍA EXPRESS - SOPORTE");
        console.log("INICIANDO PANEL DE SOPORTE");
        console.log("========================================");

        const formularioAyuda =
            document.getElementById(
                "formularioAyuda"
            );

        if (!formularioAyuda) {

            console.error(
                "No se encontró #formularioAyuda"
            );

            return;
        }


        /* ================================================
           CARGAR BACK OFFICE
        ================================================ */

        const cargado =
            await cargarBackOffice();


        if (!cargado) {

            console.error(
                "No se pudo cargar el Back Office."
            );

            return;
        }


        /* ================================================
           CONFIGURAR FORMULARIO
        ================================================ */

        configurarEventos();

    }
);


/* =========================================================
   CARGAR BACK OFFICE LOGUEADO
========================================================= */

async function cargarBackOffice() {

    try {

        /* =================================================
           OBTENER SESIÓN
        ================================================= */

        const {
            data: {
                session
            },
            error: errorSesion
        } =
            await supabaseClient.auth.getSession();


        if (errorSesion) {

            console.error(
                "ERROR OBTENIENDO SESIÓN DEL BACK OFFICE:",
                errorSesion
            );

            alert(
                "No se pudo comprobar la sesión del Back Office."
            );

            return false;
        }


        /* =================================================
           VERIFICAR SESIÓN
        ================================================= */

        if (
            !session ||
            !session.user
        ) {

            console.warn(
                "NO HAY BACK OFFICE LOGUEADO."
            );

            alert(
                "Debes iniciar sesión como Back Office."
            );

            window.location.href =
                "iniciarsesion.html";

            return false;
        }


        /* =================================================
           USUARIO AUTH
        ================================================= */

        usuarioSesion =
            session.user;


        console.log("========================================");
        console.log("BACK OFFICE LOGUEADO");
        console.log("UUID:", usuarioSesion.id);
        console.log("EMAIL:", usuarioSesion.email);
        console.log(
            "STORAGE:",
            "mensajeria-backoffice-auth"
        );
        console.log("========================================");


        /* =================================================
           BUSCAR BACK OFFICE REAL

           IMPORTANTE:
           NO SE CONSULTA perfiles.

           Se busca directamente:
           back_offices.usuario_id
        ================================================= */

        const {
            data: backOffice,
            error: errorBackOffice
        } =
            await supabaseClient
                .from("back_offices")
                .select(
                    "id, usuario_id, nombre, telefono, activo"
                )
                .eq(
                    "usuario_id",
                    usuarioSesion.id
                )
                .maybeSingle();


        if (errorBackOffice) {

            console.error(
                "ERROR BUSCANDO BACK OFFICE:",
                errorBackOffice
            );

            alert(
                "No se pudieron cargar los datos del Back Office."
            );

            return false;
        }


        /* =================================================
           NO EXISTE
        ================================================= */

        if (!backOffice) {

            console.error(
                "NO EXISTE BACK OFFICE PARA:",
                usuarioSesion.id
            );

            alert(
                "El usuario actual no está registrado como Back Office."
            );

            return false;
        }


        /* =================================================
           VERIFICAR ACTIVO
        ================================================= */

        if (
            backOffice.activo === false
        ) {

            alert(
                "Este Back Office se encuentra desactivado."
            );

            return false;
        }


        /* =================================================
           GUARDAR
        ================================================= */

        backOfficeActual =
            backOffice;


        console.log("========================================");
        console.log("DATOS DEL BACK OFFICE");
        console.log("ID:", backOfficeActual.id);
        console.log(
            "USUARIO_ID:",
            backOfficeActual.usuario_id
        );
        console.log(
            "NOMBRE:",
            backOfficeActual.nombre
        );
        console.log(
            "TELÉFONO:",
            backOfficeActual.telefono
        );
        console.log(
            "CORREO:",
            usuarioSesion.email
        );
        console.log("========================================");


        /* =================================================
           MOSTRAR DATOS
        ================================================= */

        mostrarDatosBackOffice();


        return true;


    } catch (error) {

        console.error(
            "ERROR CARGANDO BACK OFFICE:",
            error
        );

        alert(
            "Ocurrió un error cargando los datos del Back Office."
        );

        return false;
    }
}


/* =========================================================
   MOSTRAR DATOS DEL BACK OFFICE
========================================================= */

function mostrarDatosBackOffice() {

    const usuarioActual =
        document.getElementById(
            "usuarioActual"
        );


    if (!usuarioActual) {
        return;
    }


    const nombre =
        String(
            backOfficeActual?.nombre || ""
        ).trim();


    if (nombre) {

        usuarioActual.textContent =
            nombre;

    } else {

        usuarioActual.textContent =
            usuarioSesion?.email ||
            "Back Office";
    }


    /* =====================================================
       BLOQUE INFORMACIÓN
    ===================================================== */

    const usuarioInfo =
        usuarioActual.closest(
            ".usuario-info"
        );


    if (usuarioInfo) {

        const span =
            usuarioInfo.querySelector(
                "span"
            );

        if (span) {

            span.textContent =
                "Back Office conectado";
        }
    }


    /* =====================================================
       ESTADO
    ===================================================== */

    const usuarioEstado =
        document.querySelector(
            ".usuario-estado"
        );


    if (usuarioEstado) {

        usuarioEstado.innerHTML =
            '<i class="ri-checkbox-circle-fill"></i> Back Office conectado';
    }
}


/* =========================================================
   OBTENER NOMBRE
========================================================= */

function obtenerNombreBackOffice() {

    if (
        backOfficeActual &&
        backOfficeActual.nombre
    ) {

        return String(
            backOfficeActual.nombre
        ).trim();
    }


    return (
        usuarioSesion?.email ||
        "Back Office"
    );
}


/* =========================================================
   OBTENER TELÉFONO
========================================================= */

function obtenerTelefonoBackOffice() {

    if (
        backOfficeActual &&
        backOfficeActual.telefono
    ) {

        return String(
            backOfficeActual.telefono
        ).trim();
    }


    return null;
}


/* =========================================================
   OBTENER CORREO
========================================================= */

function obtenerCorreoBackOffice() {

    return (
        usuarioSesion?.email ||
        null
    );
}


/* =========================================================
   CONFIGURAR EVENTOS
========================================================= */

function configurarEventos() {

    const descripcion =
        document.getElementById(
            "descripcion"
        );

    const contadorDescripcion =
        document.getElementById(
            "contadorDescripcion"
        );

    const archivo =
        document.getElementById(
            "archivo"
        );

    const nombreArchivo =
        document.getElementById(
            "nombreArchivo"
        );

    const btnCancelar =
        document.getElementById(
            "btnCancelar"
        );

    const cerrarMensaje =
        document.getElementById(
            "cerrarMensaje"
        );

    const formularioAyuda =
        document.getElementById(
            "formularioAyuda"
        );


    /* =====================================================
       CONTADOR DESCRIPCIÓN
    ===================================================== */

    if (
        descripcion &&
        contadorDescripcion
    ) {

        contadorDescripcion.textContent =
            `${descripcion.value.length} / 2000`;


        descripcion.addEventListener(
            "input",
            () => {

                contadorDescripcion.textContent =
                    `${descripcion.value.length} / 2000`;
            }
        );
    }


    /* =====================================================
       ARCHIVO
    ===================================================== */

    if (
        archivo &&
        nombreArchivo
    ) {

        archivo.addEventListener(
            "change",
            manejarArchivo
        );
    }


    /* =====================================================
       CANCELAR
    ===================================================== */

    if (btnCancelar) {

        btnCancelar.addEventListener(
            "click",
            () => {

                formularioAyuda.reset();


                if (contadorDescripcion) {

                    contadorDescripcion.textContent =
                        "0 / 2000";
                }


                if (nombreArchivo) {

                    nombreArchivo.textContent =
                        "No se ha seleccionado ningún archivo.";
                }
            }
        );
    }


    /* =====================================================
       CERRAR MENSAJE
    ===================================================== */

    if (cerrarMensaje) {

        cerrarMensaje.addEventListener(
            "click",
            () => {

                const mensajeExito =
                    document.getElementById(
                        "mensajeExito"
                    );

                if (mensajeExito) {

                    mensajeExito.style.display =
                        "none";
                }
            }
        );
    }


    /* =====================================================
       FORMULARIO
    ===================================================== */

    if (formularioAyuda) {

        formularioAyuda.addEventListener(
            "submit",
            enviarTicket
        );
    }
}


/* =========================================================
   MANEJAR ARCHIVO
========================================================= */

function manejarArchivo(event) {

    const archivo =
        event.target;

    const nombreArchivo =
        document.getElementById(
            "nombreArchivo"
        );


    if (
        !archivo ||
        !archivo.files ||
        archivo.files.length === 0
    ) {

        if (nombreArchivo) {

            nombreArchivo.textContent =
                "No se ha seleccionado ningún archivo.";
        }

        return;
    }


    const archivoSeleccionado =
        archivo.files[0];


    /* =====================================================
       LÍMITE 10 MB
    ===================================================== */

    const maximo =
        10 * 1024 * 1024;


    if (
        archivoSeleccionado.size >
        maximo
    ) {

        alert(
            "El archivo no puede superar los 10 MB."
        );

        archivo.value = "";


        if (nombreArchivo) {

            nombreArchivo.textContent =
                "No se ha seleccionado ningún archivo.";
        }

        return;
    }


    /* =====================================================
       MOSTRAR NOMBRE
    ===================================================== */

    if (nombreArchivo) {

        nombreArchivo.textContent =
            `${archivoSeleccionado.name} (${formatearTamano(
                archivoSeleccionado.size
            )})`;
    }


    console.log("========================================");
    console.log("ARCHIVO SELECCIONADO");
    console.log(
        "Nombre:",
        archivoSeleccionado.name
    );
    console.log(
        "Tipo:",
        archivoSeleccionado.type
    );
    console.log(
        "Tamaño:",
        formatearTamano(
            archivoSeleccionado.size
        )
    );
    console.log("========================================");
}


/* =========================================================
   FORMATEAR TAMAÑO
========================================================= */

function formatearTamano(bytes) {

    if (!bytes) {
        return "0 Bytes";
    }


    const unidades = [
        "Bytes",
        "KB",
        "MB",
        "GB"
    ];


    const indice =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );


    return (
        parseFloat(
            (
                bytes /
                Math.pow(
                    1024,
                    indice
                )
            ).toFixed(2)
        ) +
        " " +
        unidades[indice]
    );
}


/* =========================================================
   GENERAR NOMBRE SEGURO
========================================================= */

function generarNombreArchivo(
    archivo
) {

    const extension =
        archivo.name
            .split(".")
            .pop()
            .toLowerCase();


    const nombreBase =
        archivo.name
            .substring(
                0,
                archivo.name.lastIndexOf(".")
            )
            .replace(
                /[^a-zA-Z0-9_-]/g,
                "_"
            )
            .substring(
                0,
                50
            );


    const tiempo =
        Date.now();


    const aleatorio =
        Math.random()
            .toString(36)
            .substring(
                2,
                10
            );


    return (
        `${usuarioSesion.id}/` +
        `${tiempo}_${aleatorio}_` +
        `${nombreBase || "archivo"}.` +
        extension
    );
}


/* =========================================================
   SUBIR ARCHIVO
========================================================= */

async function subirArchivo(
    archivoSeleccionado
) {

    if (
        !archivoSeleccionado
    ) {

        return null;
    }


    /* =====================================================
       LÍMITE
    ===================================================== */

    const maximo =
        10 * 1024 * 1024;


    if (
        archivoSeleccionado.size >
        maximo
    ) {

        throw new Error(
            "El archivo no puede superar los 10 MB."
        );
    }


    /* =====================================================
       GENERAR RUTA
    ===================================================== */

    const nombreArchivoStorage =
        generarNombreArchivo(
            archivoSeleccionado
        );


    console.log("========================================");
    console.log("INICIANDO SUBIDA DE ARCHIVO");
    console.log("========================================");
    console.log(
        "Bucket:",
        "tickets"
    );
    console.log(
        "Nombre:",
        archivoSeleccionado.name
    );
    console.log(
        "Tipo:",
        archivoSeleccionado.type
    );
    console.log(
        "Tamaño:",
        formatearTamano(
            archivoSeleccionado.size
        )
    );
    console.log(
        "Ruta:",
        nombreArchivoStorage
    );
    console.log(
        "Usuario:",
        usuarioSesion.id
    );
    console.log("========================================");


    /* =====================================================
       SUBIR DIRECTAMENTE

       IMPORTANTE:
       NO usamos getBucket().
       Se intenta directamente el upload.
    ===================================================== */

    const {
        data: uploadData,
        error: errorArchivo
    } =
        await supabaseClient
            .storage
            .from("tickets")
            .upload(
                nombreArchivoStorage,
                archivoSeleccionado,
                {
                    cacheControl: "3600",
                    upsert: false,
                    contentType:
                        archivoSeleccionado.type ||
                        "application/octet-stream"
                }
            );


    /* =====================================================
       ERROR
    ===================================================== */

    if (errorArchivo) {

        console.error("========================================");
        console.error("ERROR SUBIENDO ARCHIVO");
        console.error(
            "Mensaje:",
            errorArchivo?.message
        );
        console.error(
            "Nombre:",
            errorArchivo?.name
        );
        console.error(
            "Status:",
            errorArchivo?.status
        );
        console.error(
            "StatusCode:",
            errorArchivo?.statusCode
        );
        console.error(
            "Error completo:",
            errorArchivo
        );
        console.error("========================================");


        throw new Error(
            "No se pudo subir el archivo: " +
            (
                errorArchivo?.message ||
                "Error desconocido de Storage"
            )
        );
    }


    console.log(
        "ARCHIVO SUBIDO CORRECTAMENTE:",
        uploadData
    );


    /* =====================================================
       OBTENER URL PÚBLICA
    ===================================================== */

    const {
        data: urlData
    } =
        supabaseClient
            .storage
            .from("tickets")
            .getPublicUrl(
                nombreArchivoStorage
            );


    const archivoUrl =
        urlData?.publicUrl ||
        null;


    console.log(
        "URL DEL ARCHIVO:",
        archivoUrl
    );


    if (!archivoUrl) {

        throw new Error(
            "El archivo se subió, pero no se pudo obtener su URL."
        );
    }


    return archivoUrl;
}


/* =========================================================
   ENVIAR TICKET
========================================================= */

async function enviarTicket(event) {

    event.preventDefault();


    /* =====================================================
       VERIFICAR BACK OFFICE
    ===================================================== */

    if (
        !usuarioSesion ||
        !backOfficeActual
    ) {

        alert(
            "No se encontraron los datos del Back Office."
        );

        return;
    }


    const formularioAyuda =
        document.getElementById(
            "formularioAyuda"
        );

    const btnEnviar =
        document.getElementById(
            "btnEnviar"
        );


    /* =====================================================
       CAMPOS
    ===================================================== */

    const categoria =
        document.getElementById(
            "categoria"
        )?.value.trim();


    const prioridad =
        document.getElementById(
            "prioridad"
        )?.value.trim();


    const asunto =
        document.getElementById(
            "asunto"
        )?.value.trim();


    const descripcion =
        document.getElementById(
            "descripcion"
        )?.value.trim();


    const archivo =
        document.getElementById(
            "archivo"
        );


    /* =====================================================
       VALIDACIONES
    ===================================================== */

    if (!categoria) {

        alert(
            "Selecciona una categoría."
        );

        return;
    }


    if (!prioridad) {

        alert(
            "Selecciona una prioridad."
        );

        return;
    }


    if (!asunto) {

        alert(
            "Escribe el asunto."
        );

        return;
    }


    if (!descripcion) {

        alert(
            "Escribe una descripción."
        );

        return;
    }


    if (descripcion.length < 10) {

        alert(
            "La descripción debe tener al menos 10 caracteres."
        );

        return;
    }


    if (descripcion.length > 2000) {

        alert(
            "La descripción no puede superar los 2000 caracteres."
        );

        return;
    }


    /* =====================================================
       DESACTIVAR BOTÓN
    ===================================================== */

    if (btnEnviar) {

        btnEnviar.disabled =
            true;

        btnEnviar.innerHTML =
            '<i class="ri-loader-4-line ri-spin"></i> Enviando...';
    }


    try {

        /* =================================================
           ARCHIVO
        ================================================= */

        let archivoUrl =
            null;


        if (
            archivo &&
            archivo.files &&
            archivo.files.length > 0
        ) {

            const archivoSeleccionado =
                archivo.files[0];


            archivoUrl =
                await subirArchivo(
                    archivoSeleccionado
                );
        }


        /* =================================================
           DATOS BACK OFFICE
        ================================================= */

        const nombreBackOffice =
            obtenerNombreBackOffice();


        const correoBackOffice =
            obtenerCorreoBackOffice();


        const telefonoBackOffice =
            obtenerTelefonoBackOffice();


        console.log("========================================");
        console.log("CREANDO TICKET DEL BACK OFFICE");
        console.log("========================================");

        console.log(
            "BACK OFFICE ID:",
            backOfficeActual.id
        );

        console.log(
            "USUARIO_ID:",
            usuarioSesion.id
        );

        console.log(
            "NOMBRE:",
            nombreBackOffice
        );

        console.log(
            "CORREO:",
            correoBackOffice
        );

        console.log(
            "TELÉFONO:",
            telefonoBackOffice
        );

        console.log(
            "CATEGORÍA:",
            categoria
        );

        console.log(
            "PRIORIDAD:",
            prioridad
        );

        console.log(
            "ASUNTO:",
            asunto
        );

        console.log(
            "ARCHIVO:",
            archivoUrl
        );

        console.log(
            "DESTINO: SOPORTE TÉCNICO"
        );

        console.log("========================================");


        /* =================================================
           DATOS DEL TICKET
        ================================================= */

        const datosTicket = {

            usuario_id:
                usuarioSesion.id,

            nombre_usuario:
                nombreBackOffice,

            correo_usuario:
                correoBackOffice,

            telefono_usuario:
                telefonoBackOffice,

            categoria:
                categoria,

            prioridad:
                prioridad,

            asunto:
                asunto,

            descripcion:
                descripcion,

            archivo_url:
                archivoUrl,

            estado:
                "Pendiente"
        };


        console.log(
            "DATOS QUE SE GUARDARÁN:",
            datosTicket
        );


        /* =================================================
           INSERTAR TICKET
        ================================================= */

        const {
            data: ticket,
            error: errorTicket
        } =
            await supabaseClient
                .from("tickets_soporte")
                .insert(
                    datosTicket
                )
                .select()
                .single();


        if (errorTicket) {

            console.error("========================================");
            console.error("ERROR GUARDANDO TICKET");
            console.error(
                "Mensaje:",
                errorTicket?.message
            );
            console.error(
                "Código:",
                errorTicket?.code
            );
            console.error(
                "Detalles:",
                errorTicket?.details
            );
            console.error(
                "Hint:",
                errorTicket?.hint
            );
            console.error(
                "Error completo:",
                errorTicket
            );
            console.error("========================================");


            throw new Error(
                errorTicket?.message ||
                "No se pudo guardar el ticket."
            );
        }


        /* =================================================
           CONFIRMACIÓN
        ================================================= */

        console.log("========================================");
        console.log("TICKET CREADO CORRECTAMENTE");

        console.log(
            "TICKET:",
            ticket.id
        );

        console.log(
            "BACK OFFICE:",
            ticket.nombre_usuario
        );

        console.log(
            "CORREO:",
            ticket.correo_usuario
        );

        console.log(
            "TELÉFONO:",
            ticket.telefono_usuario
        );

        console.log(
            "ESTADO:",
            ticket.estado
        );

        console.log(
            "ARCHIVO:",
            ticket.archivo_url
        );

        console.log("========================================");


        /* =================================================
           MOSTRAR ÉXITO
        ================================================= */

        mostrarResultadoExito(
            ticket,
            nombreBackOffice
        );


        /* =================================================
           LIMPIAR FORMULARIO
        ================================================= */

        formularioAyuda.reset();


        const contadorDescripcion =
            document.getElementById(
                "contadorDescripcion"
            );


        const nombreArchivo =
            document.getElementById(
                "nombreArchivo"
            );


        if (contadorDescripcion) {

            contadorDescripcion.textContent =
                "0 / 2000";
        }


        if (nombreArchivo) {

            nombreArchivo.textContent =
                "No se ha seleccionado ningún archivo.";
        }


    } catch (error) {

        console.error("========================================");
        console.error("ERROR COMPLETO EN SOPORTE:");
        console.error(
            "Mensaje:",
            error?.message
        );
        console.error(
            "Nombre:",
            error?.name
        );
        console.error(
            "Status:",
            error?.status
        );
        console.error(
            "Error:",
            error
        );
        console.error("========================================");


        alert(
            "No se pudo enviar la solicitud.\n\n" +
            (
                error?.message ||
                "Revisa la consola del navegador."
            )
        );


    } finally {

        if (btnEnviar) {

            btnEnviar.disabled =
                false;

            btnEnviar.innerHTML =
                '<i class="ri-send-plane-fill"></i> Crear ticket';
        }
    }
}


/* =========================================================
   MOSTRAR RESULTADO
========================================================= */

function mostrarResultadoExito(
    ticket,
    nombreBackOffice
) {

    const mensajeExito =
        document.getElementById(
            "mensajeExito"
        );


    const tituloResultado =
        document.getElementById(
            "tituloResultado"
        );


    const textoExito =
        document.getElementById(
            "textoExito"
        );


    const iconoResultado =
        document.getElementById(
            "iconoResultado"
        );


    /* =====================================================
       TÍTULO
    ===================================================== */

    if (tituloResultado) {

        tituloResultado.textContent =
            "Solicitud enviada correctamente";
    }


    /* =====================================================
       ICONO
    ===================================================== */

    if (iconoResultado) {

        iconoResultado.className =
            "ri-checkbox-circle-line";
    }


    /* =====================================================
       TEXTO
    ===================================================== */

    if (textoExito) {

        textoExito.textContent =
            `Solicitud enviada por ${nombreBackOffice}.\n\n` +
            `Número de ticket: #${ticket.id}\n\n` +
            `Tu solicitud quedó pendiente para Soporte Técnico.`;
    }


    /* =====================================================
       MOSTRAR
    ===================================================== */

    if (mensajeExito) {

        mensajeExito.style.display =
            "flex";
    }
}