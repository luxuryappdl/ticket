/* =========================================================
   MENSAJERÍA EXPRESS
   BACK OFFICE
   USUARIO LOGUEADO + PEDIDOS ASIGNADOS
   SUPABASE AUTH
   TRACKING MANUAL
   NO ENTREGADO + REENVÍO ILIMITADO
========================================================= */


/* =========================================================
   CONFIGURACIÓN SUPABASE
========================================================= */

const SUPABASE_URL =
    "https://kayzwwgmebtsaiovkeos.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_yj-QjGhy6RQNUzoxg3HQeg_hkZHuSyL";


/* =========================================================
   SUPABASE
   SESIÓN EXCLUSIVA DEL BACK OFFICE
========================================================= */

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY,
        {
            auth: {
                storageKey: "mensajeria-backoffice-auth",
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: false
            }
        }
    );


/* =========================================================
   VARIABLES
========================================================= */

let usuarioBackOfficeActual = null;
let comprobandoSesionBackOffice = false;
let cargandoPedidosBackOffice = false;


/* =========================================================
   ELEMENTOS DEL HTML
========================================================= */

let usuarioActual = null;
let botonesInvitado = null;
let cerrarSesion = null;
let botonActualizar = null;


/* =========================================================
   INICIALIZAR ELEMENTOS
========================================================= */

function inicializarElementos() {

    usuarioActual =
        document.getElementById(
            "usuarioActual"
        );

    botonesInvitado =
        document.getElementById(
            "botonesInvitado"
        );

    cerrarSesion =
        document.getElementById(
            "cerrarSesion"
        );

    botonActualizar =
        document.getElementById(
            "actualizarPedidos"
        );

}


/* =========================================================
   MOSTRAR USUARIO
========================================================= */

async function mostrarUsuario(usuario) {

    if (!usuarioActual) {

        inicializarElementos();

    }


    /* =====================================================
       SI HAY USUARIO
    ===================================================== */

    if (usuario) {

        usuarioBackOfficeActual =
            usuario;


        let nombreUsuario =
            usuario.email ||
            "Usuario";


        /* =================================================
           BUSCAR NOMBRE DEL BACK OFFICE
        ================================================= */

        try {

            const {
                data: backOffice,
                error: errorBackOffice
            } =
                await supabaseClient
                    .from("back_offices")
                    .select("nombre")
                    .eq(
                        "usuario_id",
                        usuario.id
                    )
                    .maybeSingle();


            if (errorBackOffice) {

                console.warn(
                    "NO SE PUDO LEER BACK OFFICE:",
                    errorBackOffice
                );

            }


            if (
                backOffice &&
                backOffice.nombre
            ) {

                nombreUsuario =
                    backOffice.nombre;

            }

        }

        catch (error) {

            console.warn(
                "ERROR BUSCANDO BACK OFFICE:",
                error
            );

        }


        /* =================================================
           MOSTRAR USUARIO
        ================================================= */

        if (usuarioActual) {

            usuarioActual.innerHTML = `
                <i class="ri-user-line"></i>
                <span>${escapeHtml(nombreUsuario)}</span>
            `;

        }


        /* =================================================
           OCULTAR LOGIN / REGISTRO
        ================================================= */

        if (botonesInvitado) {

            botonesInvitado.style.display =
                "none";

        }


        /* =================================================
           MOSTRAR CERRAR SESIÓN
        ================================================= */

        if (cerrarSesion) {

            cerrarSesion.style.display =
                "flex";

            cerrarSesion.disabled =
                false;

            cerrarSesion.innerHTML = `
                <i class="ri-logout-box-line"></i>
                Cerrar sesión
            `;

        }


        console.log(
            "======================================"
        );

        console.log(
            "BACK OFFICE LOGUEADO"
        );

        console.log(
            "NOMBRE:",
            nombreUsuario
        );

        console.log(
            "EMAIL:",
            usuario.email
        );

        console.log(
            "UUID:",
            usuario.id
        );

        console.log(
            "STORAGE KEY:",
            "mensajeria-backoffice-auth"
        );

        console.log(
            "======================================"
        );


        await cargarPedidosBackOffice(
            usuario
        );

        return;

    }


    /* =====================================================
       NO HAY USUARIO
    ===================================================== */

    usuarioBackOfficeActual =
        null;


    if (usuarioActual) {

        usuarioActual.innerHTML = `
            <i class="ri-user-line"></i>
            <span>Invitado</span>
        `;

    }


    if (botonesInvitado) {

        botonesInvitado.style.display =
            "flex";

    }


    if (cerrarSesion) {

        cerrarSesion.style.display =
            "none";

    }


    limpiarPedidosBackOffice();

}


/* =========================================================
   COMPROBAR SESIÓN
========================================================= */

async function comprobarSesion() {

    if (comprobandoSesionBackOffice) {

        return;

    }


    comprobandoSesionBackOffice =
        true;


    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();


        if (error) {

            console.error(
                "ERROR OBTENIENDO SESIÓN:",
                error
            );

            await mostrarUsuario(null);

            return;

        }


        let usuario =
            data?.session?.user ||
            null;


        /* =================================================
           FALLBACK GET USER
        ================================================= */

        if (!usuario) {

            try {

                const {
                    data: datosUsuario
                } =
                    await supabaseClient.auth.getUser();


                usuario =
                    datosUsuario?.user ||
                    null;

            }

            catch (errorUser) {

                console.warn(
                    "ERROR CON getUser():",
                    errorUser
                );

            }

        }


        await mostrarUsuario(
            usuario
        );

    }

    catch (error) {

        console.error(
            "ERROR COMPROBANDO SESIÓN:",
            error
        );

        await mostrarUsuario(null);

    }

    finally {

        comprobandoSesionBackOffice =
            false;

    }

}


/* =========================================================
   CAMBIOS DE AUTENTICACIÓN
========================================================= */

supabaseClient.auth.onAuthStateChange(
    (
        evento,
        session
    ) => {

        console.log(
            "CAMBIO AUTH BACK OFFICE:",
            evento
        );


        const usuario =
            session?.user ||
            null;


        setTimeout(
            () => {

                mostrarUsuario(
                    usuario
                );

            },
            0
        );

    }
);


/* =========================================================
   CARGAR PEDIDOS
========================================================= */

async function cargarPedidosBackOffice(usuario) {

    if (
        !usuario ||
        !usuario.id
    ) {

        limpiarPedidosBackOffice();

        return;

    }


    if (cargandoPedidosBackOffice) {

        return;

    }


    const contenedor =
        document.getElementById(
            "contenedorPedidos"
        );


    if (!contenedor) {

        return;

    }


    cargandoPedidosBackOffice =
        true;


    contenedor.innerHTML = `

        <div class="mensaje-pedidos">

            <i class="ri-loader-4-line"></i>

            <p>
                Cargando pedidos...
            </p>

        </div>

    `;


    try {

        const {
            data: pedidos,
            error
        } =
            await supabaseClient
                .from("pedidosexpress")
                .select("*")
                .eq(
                    "backoffice_id",
                    usuario.id
                )
                .order(
                    "fecha_creacion",
                    {
                        ascending: false
                    }
                );


        if (error) {

            console.error(
                "ERROR CARGANDO PEDIDOS:",
                error
            );


            contenedor.innerHTML = `

                <div class="mensaje-pedidos">

                    <i class="ri-error-warning-line"></i>

                    <p>
                        No se pudieron cargar los pedidos.
                    </p>

                    <small>
                        ${escapeHtml(
                error.message || ""
            )}
                    </small>

                </div>

            `;

            return;

        }


        const listaPedidos =
            Array.isArray(pedidos)
                ? pedidos
                : [];


        window.pedidosBackOffice =
            listaPedidos;


        actualizarEstadisticas(
            listaPedidos
        );


        mostrarPedidos(
            listaPedidos
        );

    }

    catch (error) {

        console.error(
            "ERROR CARGANDO PEDIDOS:",
            error
        );


        contenedor.innerHTML = `

            <div class="mensaje-pedidos">

                <i class="ri-error-warning-line"></i>

                <p>
                    Ocurrió un error al cargar los pedidos.
                </p>

            </div>

        `;

    }

    finally {

        cargandoPedidosBackOffice =
            false;

    }

}


/* =========================================================
   OBTENER DIRECCIÓN ESPECÍFICA
========================================================= */

function obtenerDireccionEspecifica(pedido) {

    if (!pedido) {

        return "No indicada";

    }


    if (
        pedido.direccion_especifica &&
        String(
            pedido.direccion_especifica
        ).trim()
    ) {

        return String(
            pedido.direccion_especifica
        ).trim();

    }


    const marcador =
        "Dirección específica:";


    const origen =
        String(
            pedido.origen_direccion || ""
        );


    const posicionOrigen =
        origen.indexOf(
            marcador
        );


    if (
        posicionOrigen !== -1
    ) {

        const direccion =
            origen
                .substring(
                    posicionOrigen +
                    marcador.length
                )
                .trim();


        if (direccion) {

            return direccion;

        }

    }


    const destino =
        String(
            pedido.destino_direccion || ""
        );


    const posicionDestino =
        destino.indexOf(
            marcador
        );


    if (
        posicionDestino !== -1
    ) {

        const direccion =
            destino
                .substring(
                    posicionDestino +
                    marcador.length
                )
                .trim();


        if (direccion) {

            return direccion;

        }

    }


    return "No indicada";

}


/* =========================================================
   MOSTRAR PEDIDOS
========================================================= */

function mostrarPedidos(pedidos) {

    const contenedor =
        document.getElementById(
            "contenedorPedidos"
        );


    if (!contenedor) {

        return;

    }


    if (
        !pedidos ||
        pedidos.length === 0
    ) {

        contenedor.innerHTML = `

            <div class="mensaje-pedidos">

                <i class="ri-inbox-line"></i>

                <p>
                    No tienes pedidos asignados.
                </p>

                <small>
                    Las nuevas cotizaciones asignadas a este Back Office aparecerán aquí.
                </small>

            </div>

        `;

        return;

    }


    contenedor.innerHTML =
        pedidos
            .map(
                function (pedido) {

                    return crearTarjetaPedido(
                        pedido
                    );

                }
            )
            .join("");


    /* =====================================================
       VER PEDIDO
    ===================================================== */

    contenedor
        .querySelectorAll(
            "[data-pedido-id]"
        )
        .forEach(
            function (boton) {

                boton.addEventListener(
                    "click",
                    function () {

                        abrirModalPedido(
                            boton.dataset.pedidoId
                        );

                    }
                );

            }
        );


    /* =====================================================
       CONFIRMAR PAGO
    ===================================================== */

    contenedor
        .querySelectorAll(
            "[data-confirmar-pago]"
        )
        .forEach(
            function (boton) {

                boton.addEventListener(
                    "click",
                    async function (evento) {

                        evento.stopPropagation();

                        await confirmarPagoPedido(
                            boton.dataset.confirmarPago
                        );

                    }
                );

            }
        );


    /* =====================================================
       GENERAR CÓDIGO
    ===================================================== */

    contenedor
        .querySelectorAll(
            "[data-generar-codigo]"
        )
        .forEach(
            function (boton) {

                boton.addEventListener(
                    "click",
                    async function (evento) {

                        evento.stopPropagation();

                        await generarCodigoLiberacion(
                            boton.dataset.generarCodigo
                        );

                    }
                );

            }
        );

}


/* =========================================================
   CREAR TARJETA
========================================================= */

function crearTarjetaPedido(pedido) {

    const estado =
        pedido.estado_envio ||
        "pendiente";


    const cliente =
        pedido.nombre_cliente ||
        "Cliente";


    const origen =
        pedido.origen_direccion ||
        "Origen no disponible";


    const destino =
        pedido.destino_direccion ||
        "Destino no disponible";


    const direccionEspecifica =
        obtenerDireccionEspecifica(
            pedido
        );


    const tarifa =
        Number(
            pedido.tarifa || 0
        );


    const fecha =
        formatearFecha(
            pedido.fecha_creacion
        );


    const pagoConfirmado =
        String(
            pedido.estado_pago || ""
        ).toLowerCase() ===
        "pagado";


    const codigoGenerado =
        pedido.codigo_liberacion ||
        "";


    const numeroGuia =
        pedido.numero_guia_meg ||
        "";


    const metodoPago =
        pedido.metodo_pago ||
        "No registrado";


    return `

        <div class="pedido-card">

            <div class="pedido-card-header">

                <div>

                    <h3>
                        ${escapeHtml(cliente)}
                    </h3>

                    <span class="pedido-fecha">
                        ${escapeHtml(fecha)}
                    </span>

                </div>

                <span class="pedido-estado ${obtenerClaseEstado(estado)}">

                    ${escapeHtml(
        formatearEstado(estado)
    )}

                </span>

            </div>


            <div class="pedido-card-body">

                <div class="pedido-dato">

                    <i class="ri-map-pin-line"></i>

                    <div>

                        <strong>
                            Origen
                        </strong>

                        <p>
                            ${escapeHtml(origen)}
                        </p>

                    </div>

                </div>


                <div class="pedido-dato">

                    <i class="ri-flag-line"></i>

                    <div>

                        <strong>
                            Destino
                        </strong>

                        <p>
                            ${escapeHtml(destino)}
                        </p>

                    </div>

                </div>


                <div class="pedido-dato">

                    <i class="ri-home-4-line"></i>

                    <div>

                        <strong>
                            Dirección específica
                        </strong>

                        <p>
                            ${escapeHtml(
        direccionEspecifica
    )}
                        </p>

                    </div>

                </div>


                <div class="pedido-resumen">

                    <div>

                        <span>
                            Peso
                        </span>

                        <strong>
                            ${escapeHtml(
        String(
            pedido.peso || 0
        )
    )} kg
                        </strong>

                    </div>


                    <div>

                        <span>
                            Distancia
                        </span>

                        <strong>
                            ${Number(
        pedido.distancia_km || 0
    ).toFixed(1)} km
                        </strong>

                    </div>


                    <div>

                        <span>
                            Tarifa
                        </span>

                        <strong>
                            Q${tarifa.toFixed(2)}
                        </strong>

                    </div>

                </div>


                <div class="estado-pago-card">

                    <span>
                        Estado del pago
                    </span>


                    ${pagoConfirmado

            ?

            `
                            <strong class="pago-confirmado">

                                <i class="ri-checkbox-circle-fill"></i>

                                Pago confirmado

                            </strong>
                        `

            :

            `
                            <strong class="pago-pendiente">

                                <i class="ri-time-line"></i>

                                Pago pendiente

                            </strong>
                        `
        }

                </div>


                ${pagoConfirmado

            ?

            `
                        <div class="estado-pago-card">

                            <span>
                                Método de pago
                            </span>

                            <strong>
                                ${escapeHtml(
                metodoPago
            )}
                            </strong>

                        </div>
                    `

            :

            ""
        }


                ${numeroGuia

            ?

            `
                        <div class="codigo-generado-card">

                            <span>
                                Número de guía MEG
                            </span>

                            <strong>
                                ${escapeHtml(
                numeroGuia
            )}
                            </strong>

                        </div>
                    `

            :

            ""
        }


                ${codigoGenerado

            ?

            `
                        <div class="codigo-generado-card">

                            <span>
                                Código de liberación
                            </span>

                            <strong>
                                ${escapeHtml(
                codigoGenerado
            )}
                            </strong>

                        </div>
                    `

            :

            ""
        }

            </div>


            <div class="pedido-card-footer">

                <button
                    type="button"
                    class="boton-ver-pedido"
                    data-pedido-id="${escapeHtml(
            String(pedido.id)
        )}"
                >

                    <i class="ri-eye-line"></i>

                    Ver pedido

                </button>


                <button
                    type="button"
                    class="boton-confirmar-pago"
                    data-confirmar-pago="${escapeHtml(
            String(pedido.id)
        )}"
                    ${pagoConfirmado
            ? "disabled"
            : ""
        }
                >

                    <i class="${pagoConfirmado
            ? "ri-checkbox-circle-fill"
            : "ri-money-dollar-circle-line"
        }"></i>

                    ${pagoConfirmado
            ? "Pago confirmado"
            : "Confirmar pago"
        }

                </button>


                <button
                    type="button"
                    class="boton-generar-codigo"
                    data-generar-codigo="${escapeHtml(
            String(pedido.id)
        )}"
                    ${!pagoConfirmado ||
            codigoGenerado
            ? "disabled"
            : ""
        }
                >

                    <i class="${codigoGenerado
            ? "ri-checkbox-circle-line"
            : "ri-key-2-line"
        }"></i>

                    ${codigoGenerado
            ? "Código generado"
            : "Generar código"
        }

                </button>

            </div>

        </div>

    `;

}


/* =========================================================
   MÉTODO DE PAGO
========================================================= */

function seleccionarMetodoPago() {

    const opcion =
        prompt(
            "MÉTODO DE PAGO\n\n" +

            "1 - Efectivo\n" +
            "2 - Transferencia bancaria\n" +
            "3 - Depósito bancario\n" +
            "4 - Tarjeta\n" +
            "5 - Otro\n\n" +

            "Escribe el número del método:"
        );


    if (opcion === null) {

        return null;

    }


    switch (opcion.trim()) {

        case "1":

            return "Efectivo";


        case "2":

            return "Transferencia bancaria";


        case "3":

            return "Depósito bancario";


        case "4":

            return "Tarjeta";


        case "5": {

            const otro =
                prompt(
                    "Escribe el método de pago:"
                );


            if (
                !otro ||
                !otro.trim()
            ) {

                alert(
                    "Debes indicar el método de pago."
                );

                return null;

            }


            return otro.trim();

        }


        default:

            alert(
                "Método de pago no válido."
            );

            return null;

    }

}


/* =========================================================
   GENERAR NÚMERO DE GUÍA MEG
========================================================= */

function generarNumeroGuiaMEG(id) {

    if (!id) {

        return "";

    }


    return `MEG31C${id}`;

}


/* =========================================================
   REGISTRAR EVENTO DE TRACKING
========================================================= */

async function registrarSeguimiento(
    pedido,
    estado,
    descripcion
) {

    if (
        !pedido ||
        !pedido.id
    ) {

        return false;

    }


    if (
        !usuarioBackOfficeActual ||
        !usuarioBackOfficeActual.id
    ) {

        console.warn(
            "NO HAY USUARIO BACK OFFICE PARA REGISTRAR TRACKING."
        );

        return false;

    }


    const numeroGuia =
        pedido.numero_guia_meg ||
        generarNumeroGuiaMEG(
            pedido.id
        );


    try {

        const {
            error
        } =
            await supabaseClient
                .from("seguimiento_pedidos")
                .insert({

                    pedido_id:
                        pedido.id,

                    numero_guia:
                        numeroGuia,

                    estado:
                        estado,

                    descripcion:
                        descripcion,

                    usuario_id:
                        usuarioBackOfficeActual.id

                });


        if (error) {

            console.error(
                "ERROR REGISTRANDO TRACKING:",
                error
            );

            return false;

        }


        console.log(
            "TRACKING REGISTRADO:",
            numeroGuia,
            estado
        );


        return true;

    }

    catch (error) {

        console.error(
            "ERROR REGISTRANDO SEGUIMIENTO:",
            error
        );

        return false;

    }

}


/* =========================================================
   CONFIRMAR PAGO
========================================================= */

async function confirmarPagoPedido(id) {

    const pedido =
        (window.pedidosBackOffice || [])
            .find(
                function (item) {

                    return String(
                        item.id
                    ) === String(id);

                }
            );


    if (!pedido) {

        alert(
            "No se encontró el pedido."
        );

        return;

    }


    if (
        String(
            pedido.estado_pago || ""
        ).toLowerCase() ===
        "pagado"
    ) {

        alert(
            "Este pedido ya tiene el pago confirmado."
        );

        return;

    }


    const metodoPago =
        seleccionarMetodoPago();


    if (!metodoPago) {

        return;

    }


    let numeroGuia =
        pedido.numero_guia_meg ||
        "";


    if (!numeroGuia) {

        numeroGuia =
            generarNumeroGuiaMEG(
                pedido.id
            );

    }


    const confirmar =
        confirm(
            "¿Confirmar el pago?\n\n" +

            "Método de pago:\n" +
            metodoPago +

            "\n\nNúmero de guía MEG:\n" +
            numeroGuia +

            "\n\n¿Deseas continuar?"
        );


    if (!confirmar) {

        return;

    }


    if (
        !usuarioBackOfficeActual ||
        !usuarioBackOfficeActual.id
    ) {

        alert(
            "La sesión del Back Office no está disponible."
        );

        return;

    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("pedidosexpress")
                .update({

                    estado_pago:
                        "pagado",

                    metodo_pago:
                        metodoPago,

                    numero_guia_meg:
                        numeroGuia,

                    fecha_pago:
                        new Date().toISOString()

                })
                .eq(
                    "id",
                    id
                )
                .eq(
                    "backoffice_id",
                    usuarioBackOfficeActual.id
                )
                .select("*");


        if (error) {

            console.error(
                "ERROR CONFIRMANDO PAGO:",
                error
            );


            alert(
                "No se pudo confirmar el pago.\n\n" +
                error.message
            );

            return;

        }


        if (
            !data ||
            data.length === 0
        ) {

            alert(
                "Supabase no modificó el pedido."
            );

            return;

        }


        const pedidoActualizado =
            data[0];


        await registrarSeguimiento(
            pedidoActualizado,
            "pago_confirmado",
            "Pago confirmado correctamente."
        );


        actualizarPedidoLocal(
            pedidoActualizado
        );


        alert(
            "PAGO CONFIRMADO CORRECTAMENTE\n\n" +

            "Método de pago:\n" +
            metodoPago +

            "\n\nNúmero de guía MEG:\n" +
            numeroGuia +

            "\n\nEl evento fue agregado al tracking."
        );

    }

    catch (error) {

        console.error(
            "ERROR CONFIRMANDO PAGO:",
            error
        );


        alert(
            "Ocurrió un error al confirmar el pago."
        );

    }

}


/* =========================================================
   GENERAR CÓDIGO DE LIBERACIÓN
========================================================= */

async function generarCodigoLiberacion(id) {

    const pedido =
        (window.pedidosBackOffice || [])
            .find(
                function (item) {

                    return String(
                        item.id
                    ) === String(id);

                }
            );


    if (!pedido) {

        alert(
            "No se encontró el pedido."
        );

        return;

    }


    const pagoConfirmado =
        String(
            pedido.estado_pago || ""
        ).toLowerCase() ===
        "pagado";


    if (!pagoConfirmado) {

        alert(
            "Primero debes confirmar el pago."
        );

        return;

    }


    if (pedido.codigo_liberacion) {

        alert(
            "Este pedido ya tiene un código de liberación."
        );

        return;

    }


    if (
        !confirm(
            "¿Generar el código de liberación para este pedido?"
        )
    ) {

        return;

    }


    if (
        !usuarioBackOfficeActual ||
        !usuarioBackOfficeActual.id
    ) {

        alert(
            "La sesión del Back Office no está disponible."
        );

        return;

    }


    try {

        const codigo =
            generarCodigoSeguro();


        const {
            data,
            error
        } =
            await supabaseClient
                .from("pedidosexpress")
                .update({

                    codigo_liberacion:
                        codigo,

                    estado_envio:
                        "liberado",

                    fecha_liberacion:
                        new Date().toISOString()

                })
                .eq(
                    "id",
                    id
                )
                .eq(
                    "backoffice_id",
                    usuarioBackOfficeActual.id
                )
                .select("*");


        if (error) {

            console.error(
                "ERROR GENERANDO CÓDIGO:",
                error
            );


            alert(
                "No se pudo generar el código.\n\n" +
                error.message
            );

            return;

        }


        if (
            !data ||
            data.length === 0
        ) {

            alert(
                "Supabase no modificó el pedido."
            );

            return;

        }


        const pedidoActualizado =
            data[0];


        await registrarSeguimiento(
            pedidoActualizado,
            "liberado",
            "Pedido liberado correctamente."
        );


        actualizarPedidoLocal(
            pedidoActualizado
        );


        alert(
            "Código generado correctamente:\n\n" +
            codigo +
            "\n\nEl evento de liberación fue agregado al tracking."
        );

    }

    catch (error) {

        console.error(
            "ERROR GENERANDO CÓDIGO:",
            error
        );


        alert(
            "Ocurrió un error al generar el código."
        );

    }

}


/* =========================================================
   GENERAR CÓDIGO SEGURO
========================================================= */

function generarCodigoSeguro() {

    const caracteres =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";


    let codigo = "";


    for (
        let i = 0;
        i < 8;
        i++
    ) {

        const indice =
            Math.floor(
                Math.random() *
                caracteres.length
            );


        codigo +=
            caracteres[indice];

    }


    return codigo;

}


/* =========================================================
   OBTENER HISTORIAL DE TRACKING
========================================================= */

async function obtenerSeguimiento(pedido) {

    if (
        !pedido ||
        !pedido.id
    ) {

        return [];

    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("seguimiento_pedidos")
                .select("*")
                .eq(
                    "pedido_id",
                    pedido.id
                )
                .order(
                    "fecha_creacion",
                    {
                        ascending: true
                    }
                );


        if (error) {

            console.error(
                "ERROR OBTENIENDO TRACKING:",
                error
            );

            return [];

        }


        return Array.isArray(data)
            ? data
            : [];

    }

    catch (error) {

        console.error(
            "ERROR OBTENIENDO SEGUIMIENTO:",
            error
        );

        return [];

    }

}


/* =========================================================
   CONTAR REINTENTOS
========================================================= */

function contarReintentos(seguimiento) {

    if (
        !Array.isArray(seguimiento)
    ) {

        return 0;

    }


    return seguimiento.filter(
        function (evento) {

            return String(
                evento.estado || ""
            ).toLowerCase() ===
                "reenviado";

        }
    ).length;

}


/* =========================================================
   OBTENER ÚLTIMO MOTIVO DE NO ENTREGADO
========================================================= */

function obtenerUltimoMotivoNoEntregado(
    seguimiento
) {

    if (
        !Array.isArray(seguimiento)
    ) {

        return "";

    }


    for (
        let i = seguimiento.length - 1;
        i >= 0;
        i--
    ) {

        const evento =
            seguimiento[i];


        if (
            String(
                evento.estado || ""
            ).toLowerCase() ===
            "no_entregado"
        ) {

            return evento.descripcion || "";

        }

    }


    return "";

}


/* =========================================================
   OBTENER ETIQUETA DE TRACKING
========================================================= */

function obtenerEtiquetaTracking(estado) {

    const valor =
        String(
            estado || ""
        ).toLowerCase();


    switch (valor) {

        case "pedido_creado":

            return "Pedido creado";


        case "pago_confirmado":

            return "Pago confirmado";


        case "liberado":

            return "Pedido liberado";


        case "en_ruta":

            return "En ruta";


        case "en_destino":

            return "En destino";


        case "entregado":

            return "Entregado";


        case "no_entregado":

            return "No entregado";


        case "reenviado":

            return "Pedido reenviado";


        case "cancelado":

            return "Cancelado";


        default:

            return formatearEstado(
                estado
            );

    }

}


/* =========================================================
   ICONO DE TRACKING
========================================================= */

function obtenerIconoTracking(estado) {

    const valor =
        String(
            estado || ""
        ).toLowerCase();


    switch (valor) {

        case "pedido_creado":

            return "ri-file-list-3-line";


        case "pago_confirmado":

            return "ri-checkbox-circle-line";


        case "liberado":

            return "ri-lock-unlock-line";


        case "en_ruta":

            return "ri-truck-line";


        case "en_destino":

            return "ri-map-pin-line";


        case "entregado":

            return "ri-checkbox-circle-fill";


        case "no_entregado":

            return "ri-close-circle-line";


        case "reenviado":

            return "ri-restart-line";


        case "cancelado":

            return "ri-close-circle-line";


        default:

            return "ri-time-line";

    }

}


/* =========================================================
   CREAR HTML DEL TRACKING
========================================================= */

function crearTrackingHTML(seguimiento) {

    if (
        !seguimiento ||
        seguimiento.length === 0
    ) {

        return `

            <div class="tracking-vacio">

                <i class="ri-road-map-line"></i>

                <p>
                    Todavía no hay movimientos registrados.
                </p>

            </div>

        `;

    }


    return `

        <div class="tracking-linea">

            ${seguimiento
            .map(
                function (
                    evento,
                    indice
                ) {

                    return `

                            <div class="tracking-evento">

                                <div class="tracking-icono">

                                    <i class="${obtenerIconoTracking(
                        evento.estado
                    )}"></i>

                                </div>


                                <div class="tracking-contenido">

                                    <strong>
                                        ${escapeHtml(
                        obtenerEtiquetaTracking(
                            evento.estado
                        )
                    )}
                                    </strong>


                                    <span>
                                        ${escapeHtml(
                        formatearFecha(
                            evento.fecha_creacion
                        )
                    )}
                                    </span>


                                    ${evento.descripcion

                            ?

                            `
                                            <p>
                                                ${escapeHtml(
                                evento.descripcion
                            )}
                                            </p>
                                        `

                            :

                            ""
                        }

                                </div>

                            </div>


                            ${indice <
                            seguimiento.length - 1

                            ?

                            `<div class="tracking-conector"></div>`

                            :

                            ""
                        }

                        `;

                }
            )
            .join("")
        }

        </div>

    `;

}


/* =========================================================
   SELECCIONAR MOTIVO DE NO ENTREGA
========================================================= */

function seleccionarMotivoNoEntrega() {

    const opcion =
        prompt(
            "MOTIVO DE NO ENTREGA\n\n" +

            "1 - Cliente no tiene dinero\n" +
            "2 - Cliente no se encontraba\n" +
            "3 - No fue posible contactar al cliente\n" +
            "4 - Dirección incorrecta\n" +
            "5 - Cliente rechazó el paquete\n" +
            "6 - Cliente solicitó no entregar\n" +
            "7 - Otro motivo\n\n" +

            "Escribe el número del motivo:"
        );


    if (opcion === null) {

        return null;

    }


    switch (opcion.trim()) {

        case "1":

            return "Cliente no tiene dinero.";


        case "2":

            return "Cliente no se encontraba.";


        case "3":

            return "No fue posible contactar al cliente.";


        case "4":

            return "Dirección incorrecta.";


        case "5":

            return "Cliente rechazó el paquete.";


        case "6":

            return "Cliente solicitó no entregar.";


        case "7": {

            const otro =
                prompt(
                    "Escribe el motivo de no entrega:"
                );


            if (
                !otro ||
                !otro.trim()
            ) {

                alert(
                    "Debes indicar el motivo."
                );

                return null;

            }


            return otro.trim();

        }


        default:

            alert(
                "Motivo no válido."
            );

            return null;

    }

}


/* =========================================================
   MARCAR COMO NO ENTREGADO
========================================================= */

async function marcarPedidoNoEntregado(id) {

    const pedido =
        (window.pedidosBackOffice || [])
            .find(
                function (item) {

                    return String(
                        item.id
                    ) === String(id);

                }
            );


    if (!pedido) {

        alert(
            "No se encontró el pedido."
        );

        return;

    }


    const estadoActual =
        String(
            pedido.estado_envio || ""
        ).toLowerCase();


    if (
        estadoActual !==
        "en_destino"
    ) {

        alert(
            "El pedido debe estar EN DESTINO para marcarlo como no entregado."
        );

        return;

    }


    const motivo =
        seleccionarMotivoNoEntrega();


    if (!motivo) {

        return;

    }


    const confirmar =
        confirm(
            "¿Marcar este pedido como NO ENTREGADO?\n\n" +

            "Motivo:\n" +
            motivo
        );


    if (!confirmar) {

        return;

    }


    await actualizarEstadoTracking(
        id,
        "no_entregado",
        `No entregado: ${motivo}`
    );

}


/* =========================================================
   REENVIAR PEDIDO
========================================================= */

async function reenviarPedido(id) {

    const pedido =
        (window.pedidosBackOffice || [])
            .find(
                function (item) {

                    return String(
                        item.id
                    ) === String(id);

                }
            );


    if (!pedido) {

        alert(
            "No se encontró el pedido."
        );

        return;

    }


    const estadoActual =
        String(
            pedido.estado_envio || ""
        ).toLowerCase();


    if (
        estadoActual !==
        "no_entregado"
    ) {

        alert(
            "El pedido solamente puede reenviarse después de marcarlo como NO ENTREGADO."
        );

        return;

    }


    if (!pedido.numero_guia_meg) {

        alert(
            "Este pedido no tiene número de guía."
        );

        return;

    }


    const seguimiento =
        await obtenerSeguimiento(
            pedido
        );


    const reintentos =
        contarReintentos(
            seguimiento
        );


    const confirmar =
        confirm(
            "¿REENVIAR ESTE PEDIDO?\n\n" +

            "Número de guía:\n" +
            pedido.numero_guia_meg +

            "\n\nIntentos anteriores: " +
            reintentos +

            "\n\nEl pedido volverá a EN RUTA.\n" +
            "La misma guía se conservará.\n\n" +

            "¿Deseas continuar?"
        );


    if (!confirmar) {

        return;

    }


    if (
        !usuarioBackOfficeActual ||
        !usuarioBackOfficeActual.id
    ) {

        alert(
            "La sesión del Back Office no está disponible."
        );

        return;

    }


    try {

        /* =================================================
           CAMBIAR ESTADO
        ================================================= */

        const {
            data,
            error
        } =
            await supabaseClient
                .from("pedidosexpress")
                .update({

                    estado_envio:
                        "en_ruta"

                })
                .eq(
                    "id",
                    id
                )
                .eq(
                    "backoffice_id",
                    usuarioBackOfficeActual.id
                )
                .select("*");


        if (error) {

            console.error(
                "ERROR REENVIANDO PEDIDO:",
                error
            );


            alert(
                "No se pudo reenviar el pedido.\n\n" +
                error.message
            );

            return;

        }


        if (
            !data ||
            data.length === 0
        ) {

            alert(
                "Supabase no modificó el pedido."
            );

            return;

        }


        const pedidoActualizado =
            data[0];


        const numeroIntento =
            reintentos + 1;


        /* =================================================
           REGISTRAR TRACKING
        ================================================= */

        const registrado =
            await registrarSeguimiento(
                pedidoActualizado,
                "reenviado",
                `Pedido reenviado. Intento de entrega #${numeroIntento}. El pedido vuelve a estar en ruta.`
            );


        if (!registrado) {

            alert(
                "El pedido fue reenviado, pero no se pudo registrar el evento de tracking."
            );

        }

        else {

            alert(
                "PEDIDO REENVIADO CORRECTAMENTE\n\n" +

                "Guía:\n" +
                pedidoActualizado.numero_guia_meg +

                "\n\nIntento de entrega:\n#" +
                numeroIntento +

                "\n\nEl pedido volvió a EN RUTA."
            );

        }


        actualizarPedidoLocal(
            pedidoActualizado
        );


        setTimeout(
            function () {

                abrirModalPedido(
                    pedidoActualizado.id
                );

            },
            100
        );

    }

    catch (error) {

        console.error(
            "ERROR REENVIANDO PEDIDO:",
            error
        );


        alert(
            "Ocurrió un error al reenviar el pedido."
        );

    }

}


/* =========================================================
   ACTUALIZAR ESTADO TRACKING
========================================================= */

async function actualizarEstadoTracking(
    id,
    nuevoEstado,
    descripcion
) {

    const pedido =
        (window.pedidosBackOffice || [])
            .find(
                function (item) {

                    return String(
                        item.id
                    ) === String(id);

                }
            );


    if (!pedido) {

        alert(
            "No se encontró el pedido."
        );

        return;

    }


    if (
        !usuarioBackOfficeActual ||
        !usuarioBackOfficeActual.id
    ) {

        alert(
            "La sesión del Back Office no está disponible."
        );

        return;

    }


    if (!pedido.numero_guia_meg) {

        alert(
            "Este pedido todavía no tiene número de guía."
        );

        return;

    }


    const estadoActual =
        String(
            pedido.estado_envio || ""
        ).toLowerCase();


    /* =====================================================
       VALIDAR SECUENCIA NORMAL
    ===================================================== */

    if (
        nuevoEstado === "en_ruta" &&
        estadoActual !== "liberado"
    ) {

        alert(
            "Primero debes liberar el pedido."
        );

        return;

    }


    if (
        nuevoEstado === "en_destino" &&
        estadoActual !== "en_ruta"
    ) {

        alert(
            "Primero debes marcar el pedido como EN RUTA."
        );

        return;

    }


    if (
        nuevoEstado === "entregado" &&
        estadoActual !== "en_destino"
    ) {

        alert(
            "Primero debes marcar el pedido como EN DESTINO."
        );

        return;

    }


    /* =====================================================
       NO ENTREGADO
    ===================================================== */

    if (
        nuevoEstado === "no_entregado" &&
        estadoActual !== "en_destino"
    ) {

        alert(
            "El pedido debe estar EN DESTINO para marcarlo como NO ENTREGADO."
        );

        return;

    }


    /* =====================================================
       CONFIRMACIÓN
    ===================================================== */

    if (
        !confirm(
            `¿Cambiar el estado a "${obtenerEtiquetaTracking(
                nuevoEstado
            )}"?`
        )
    ) {

        return;

    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("pedidosexpress")
                .update({

                    estado_envio:
                        nuevoEstado

                })
                .eq(
                    "id",
                    id
                )
                .eq(
                    "backoffice_id",
                    usuarioBackOfficeActual.id
                )
                .select("*");


        if (error) {

            console.error(
                "ERROR ACTUALIZANDO ESTADO:",
                error
            );


            alert(
                "No se pudo actualizar el estado.\n\n" +
                error.message
            );

            return;

        }


        if (
            !data ||
            data.length === 0
        ) {

            alert(
                "Supabase no modificó el pedido."
            );

            return;

        }


        const pedidoActualizado =
            data[0];


        const registrado =
            await registrarSeguimiento(
                pedidoActualizado,
                nuevoEstado,
                descripcion
            );


        if (!registrado) {

            alert(
                "El estado del pedido cambió, pero no se pudo registrar el evento de tracking."
            );

        }

        else {

            alert(
                `Pedido actualizado:\n\n${obtenerEtiquetaTracking(
                    nuevoEstado
                )}`
            );

        }


        actualizarPedidoLocal(
            pedidoActualizado
        );


        setTimeout(
            function () {

                abrirModalPedido(
                    pedidoActualizado.id
                );

            },
            100
        );

    }

    catch (error) {

        console.error(
            "ERROR ACTUALIZANDO TRACKING:",
            error
        );


        alert(
            "Ocurrió un error al actualizar el tracking."
        );

    }

}


/* =========================================================
   BOTONES DEL TRACKING
========================================================= */

function crearBotonesTracking(pedido) {

    const estado =
        String(
            pedido.estado_envio || ""
        ).toLowerCase();


    const tieneGuia =
        Boolean(
            pedido.numero_guia_meg
        );


    if (!tieneGuia) {

        return `

            <div class="tracking-aviso">

                <i class="ri-information-line"></i>

                Primero confirma el pago para generar
                el número de guía.

            </div>

        `;

    }


    let html = `

        <div class="tracking-botones">

            <h4>
                Actualizar estado
            </h4>

    `;


    /* =====================================================
       LIBERADO → EN RUTA
    ===================================================== */

    if (
        estado === "liberado"
    ) {

        html += `

            <button
                type="button"
                class="boton-tracking boton-en-ruta"
                data-tracking-estado="en_ruta"
                data-tracking-id="${escapeHtml(
            String(pedido.id)
        )}"
            >

                <i class="ri-truck-line"></i>

                En ruta

            </button>

        `;

    }


    /* =====================================================
       EN RUTA → EN DESTINO
    ===================================================== */

    if (
        estado === "en_ruta"
    ) {

        html += `

            <button
                type="button"
                class="boton-tracking boton-en-destino"
                data-tracking-estado="en_destino"
                data-tracking-id="${escapeHtml(
            String(pedido.id)
        )}"
            >

                <i class="ri-map-pin-line"></i>

                En destino

            </button>

        `;

    }


    /* =====================================================
       EN DESTINO → ENTREGADO
       EN DESTINO → NO ENTREGADO
    ===================================================== */

    if (
        estado === "en_destino"
    ) {

        html += `

            <button
                type="button"
                class="boton-tracking boton-entregado"
                data-tracking-estado="entregado"
                data-tracking-id="${escapeHtml(
            String(pedido.id)
        )}"
            >

                <i class="ri-checkbox-circle-line"></i>

                Marcar entregado

            </button>


            <button
                type="button"
                class="boton-tracking boton-no-entregado"
                data-no-entregado-id="${escapeHtml(
            String(pedido.id)
        )}"
            >

                <i class="ri-close-circle-line"></i>

                No entregado

            </button>

        `;

    }


    /* =====================================================
       NO ENTREGADO → REENVIAR
    ===================================================== */

    if (
        estado === "no_entregado"
    ) {

        html += `

            <div class="tracking-aviso">

                <i class="ri-error-warning-line"></i>

                El pedido no pudo ser entregado.

            </div>


            <button
                type="button"
                class="boton-tracking boton-reenviar"
                data-reenviar-id="${escapeHtml(
            String(pedido.id)
        )}"
            >

                <i class="ri-restart-line"></i>

                Reenviar pedido

            </button>

        `;

    }


    /* =====================================================
       ENTREGADO
    ===================================================== */

    if (
        estado === "entregado"
    ) {

        html += `

            <div class="tracking-completado">

                <i class="ri-checkbox-circle-fill"></i>

                Pedido entregado

            </div>

        `;

    }


    /* =====================================================
       PENDIENTE
    ===================================================== */

    if (
        estado === "pendiente"
    ) {

        html += `

            <div class="tracking-aviso">

                <i class="ri-time-line"></i>

                El pedido todavía está pendiente de pago.

            </div>

        `;

    }


    html += `

        </div>

    `;


    return html;

}


/* =========================================================
   ABRIR MODAL
========================================================= */

async function abrirModalPedido(id) {

    const pedido =
        (window.pedidosBackOffice || [])
            .find(
                function (item) {

                    return String(
                        item.id
                    ) === String(id);

                }
            );


    if (!pedido) {

        return;

    }


    const modal =
        document.getElementById(
            "modalPedido"
        );


    const contenido =
        document.getElementById(
            "contenidoModal"
        );


    if (
        !modal ||
        !contenido
    ) {

        return;

    }


    contenido.innerHTML = `

        <div class="detalle-pedido">

            <div style="
                text-align:center;
                padding:30px;
            ">

                <i
                    class="ri-loader-4-line"
                    style="font-size:32px;"
                ></i>

                <p>
                    Cargando información del pedido...
                </p>

            </div>

        </div>

    `;


    modal.style.display =
        "flex";


    modal.classList.add(
        "modal-abierto"
    );


    const seguimiento =
        await obtenerSeguimiento(
            pedido
        );


    const direccionEspecifica =
        obtenerDireccionEspecifica(
            pedido
        );


    const numeroGuia =
        pedido.numero_guia_meg ||
        "Pendiente de generación";


    const metodoPago =
        pedido.metodo_pago ||
        "No registrado";


    const reintentos =
        contarReintentos(
            seguimiento
        );


    const ultimoMotivo =
        obtenerUltimoMotivoNoEntregado(
            seguimiento
        );


    contenido.innerHTML = `

        <div class="detalle-pedido">

            <h2>
                Pedido Express
            </h2>


            <!-- =========================================
                 CLIENTE
            ========================================== -->

            <div class="detalle-seccion">

                <h3>

                    <i class="ri-user-line"></i>

                    Cliente

                </h3>


                <p>

                    <strong>
                        ${escapeHtml(
        pedido.nombre_cliente ||
        "Cliente"
    )}
                    </strong>

                </p>


                <p>
                    ${escapeHtml(
        pedido.correo ||
        "Sin correo"
    )}
                </p>


                <p>
                    ${escapeHtml(
        pedido.telefono ||
        "Sin teléfono"
    )}
                </p>

            </div>


            <!-- =========================================
                 ORIGEN
            ========================================== -->

            <div class="detalle-seccion">

                <h3>

                    <i class="ri-map-pin-line"></i>

                    Origen

                </h3>


                <p>

                    ${escapeHtml(
        pedido.origen_direccion ||
        "No disponible"
    )}

                </p>

            </div>


            <!-- =========================================
                 DESTINO
            ========================================== -->

            <div class="detalle-seccion">

                <h3>

                    <i class="ri-flag-line"></i>

                    Destino

                </h3>


                <p>

                    ${escapeHtml(
        pedido.destino_direccion ||
        "No disponible"
    )}

                </p>

            </div>


            <!-- =========================================
                 DIRECCIÓN ESPECÍFICA
            ========================================== -->

            <div class="detalle-seccion">

                <h3>

                    <i class="ri-home-4-line"></i>

                    Dirección específica

                </h3>


                <p>

                    ${escapeHtml(
        direccionEspecifica
    )}

                </p>

            </div>


            <!-- =========================================
                 PAQUETE
            ========================================== -->

            <div class="detalle-seccion">

                <h3>

                    <i class="ri-box-3-line"></i>

                    Paquete

                </h3>


                <p>

                    <strong>
                        Peso:
                    </strong>

                    ${escapeHtml(
        String(
            pedido.peso || 0
        )
    )} kg

                </p>


                <p>

                    <strong>
                        Tamaño:
                    </strong>

                    ${escapeHtml(
        pedido.tamano ||
        "No especificado"
    )}

                </p>


                <p>

                    <strong>
                        Descripción:
                    </strong>

                    ${escapeHtml(
        pedido.descripcion ||
        "Sin descripción"
    )}

                </p>

            </div>


            <!-- =========================================
                 RUTA
            ========================================== -->

            <div class="detalle-seccion">

                <h3>

                    <i class="ri-route-line"></i>

                    Ruta

                </h3>


                <p>

                    <strong>
                        Distancia:
                    </strong>

                    ${Number(
        pedido.distancia_km || 0
    ).toFixed(1)} km

                </p>


                <p>

                    <strong>
                        Duración estimada:
                    </strong>

                    ${formatearDuracion(
        pedido.duracion_minutos
    )}

                </p>

            </div>


            <!-- =========================================
                 TARIFA
            ========================================== -->

            <div class="detalle-seccion precio-detalle">

                <h3>

                    <i class="ri-money-dollar-circle-line"></i>

                    Tarifa

                </h3>


                <strong>

                    Q${Number(
        pedido.tarifa || 0
    ).toFixed(2)}

                </strong>

            </div>


            <!-- =========================================
                 MÉTODO DE PAGO
            ========================================== -->

            <div class="detalle-seccion">

                <h3>

                    <i class="ri-bank-card-line"></i>

                    Método de pago

                </h3>


                <p>

                    ${escapeHtml(
        metodoPago
    )}

                </p>

            </div>


            <!-- =========================================
                 GUÍA
            ========================================== -->

            <div class="detalle-seccion">

                <h3>

                    <i class="ri-barcode-line"></i>

                    Número de guía MEG

                </h3>


                <p>

                    <strong>

                        ${escapeHtml(
        numeroGuia
    )}

                    </strong>

                </p>

            </div>


            <!-- =========================================
                 ESTADO
            ========================================== -->

            <div class="detalle-seccion">

                <h3>
                    Estado
                </h3>


                <p>

                    Pago:

                    <strong>

                        ${escapeHtml(
        formatearEstado(
            pedido.estado_pago ||
            "pendiente"
        )
    )}

                    </strong>

                </p>


                <p>

                    Envío:

                    <strong>

                        ${escapeHtml(
        formatearEstado(
            pedido.estado_envio ||
            "pendiente"
        )
    )}

                    </strong>

                </p>


                ${pedido.codigo_liberacion

            ?

            `
                        <p>

                            Código de liberación:

                            <strong>

                                ${escapeHtml(
                pedido.codigo_liberacion
            )}

                            </strong>

                        </p>
                    `

            :

            ""
        }

            </div>


            <!-- =========================================
                 REINTENTOS
            ========================================== -->

            ${reintentos > 0

            ?

            `
                    <div class="detalle-seccion">

                        <h3>

                            <i class="ri-restart-line"></i>

                            Reintentos de entrega

                        </h3>


                        <p>

                            Este pedido ha sido reenviado:

                            <strong>
                                ${reintentos}
                                ${reintentos === 1
                ? " vez"
                : " veces"
            }
                            </strong>

                        </p>


                        ${ultimoMotivo

                ?

                `
                                <p>

                                    Último motivo:

                                    <strong>
                                        ${escapeHtml(
                    ultimoMotivo
                )}
                                    </strong>

                                </p>
                            `

                :

                ""
            }

                    </div>
                `

            :

            ""
        }


            <!-- =========================================
                 TRACKING
            ========================================== -->

            <div class="detalle-seccion tracking-seccion">

                <h3>

                    <i class="ri-route-line"></i>

                    Seguimiento del envío

                </h3>


                <div id="trackingContenido">

                    ${crearTrackingHTML(
            seguimiento
        )}

                </div>


                ${crearBotonesTracking(
            pedido
        )}

            </div>

        </div>

    `;


    /* =====================================================
       BOTONES TRACKING
    ===================================================== */

    const botonesTracking =
        contenido.querySelectorAll(
            "[data-tracking-estado]"
        );


    botonesTracking.forEach(
        function (boton) {

            boton.addEventListener(
                "click",
                async function () {

                    const estado =
                        boton.dataset.trackingEstado;


                    const pedidoId =
                        boton.dataset.trackingId;


                    let descripcion =
                        "";


                    switch (estado) {

                        case "en_ruta":

                            descripcion =
                                "El pedido salió y está en ruta hacia el destino.";

                            break;


                        case "en_destino":

                            descripcion =
                                "El pedido llegó al área de destino.";

                            break;


                        case "entregado":

                            descripcion =
                                "El pedido fue entregado al destinatario.";

                            break;

                    }


                    await actualizarEstadoTracking(
                        pedidoId,
                        estado,
                        descripcion
                    );

                }
            );

        }
    );


    /* =====================================================
       BOTÓN NO ENTREGADO
    ===================================================== */

    const botonesNoEntregado =
        contenido.querySelectorAll(
            "[data-no-entregado-id]"
        );


    botonesNoEntregado.forEach(
        function (boton) {

            boton.addEventListener(
                "click",
                async function () {

                    await marcarPedidoNoEntregado(
                        boton.dataset.noEntregadoId
                    );

                }
            );

        }
    );


    /* =====================================================
       BOTÓN REENVIAR
    ===================================================== */

    const botonesReenviar =
        contenido.querySelectorAll(
            "[data-reenviar-id]"
        );


    botonesReenviar.forEach(
        function (boton) {

            boton.addEventListener(
                "click",
                async function () {

                    await reenviarPedido(
                        boton.dataset.reenviarId
                    );

                }
            );

        }
    );

}


/* =========================================================
   ACTUALIZAR PEDIDO LOCAL
========================================================= */

function actualizarPedidoLocal(data) {

    if (!data) {

        return;

    }


    const indice =
        (window.pedidosBackOffice || [])
            .findIndex(
                function (item) {

                    return String(
                        item.id
                    ) === String(data.id);

                }
            );


    if (indice !== -1) {

        window.pedidosBackOffice[indice] =
            data;

    }


    mostrarPedidos(
        window.pedidosBackOffice || []
    );


    actualizarEstadisticas(
        window.pedidosBackOffice || []
    );

}


/* =========================================================
   ESTADÍSTICAS
========================================================= */

function actualizarEstadisticas(pedidos) {

    pedidos =
        Array.isArray(pedidos)
            ? pedidos
            : [];


    const totalPedidos =
        document.getElementById(
            "total-pedidos"
        );


    const pedidosPendientes =
        document.getElementById(
            "pedidosPendientes"
        );


    const pedidosPagados =
        document.getElementById(
            "pedidosPagados"
        );


    const ingresosTotales =
        document.getElementById(
            "ingresosTotales"
        );


    const total =
        pedidos.length;


    const pendientes =
        pedidos.filter(
            function (pedido) {

                return String(
                    pedido.estado_envio || ""
                ).toLowerCase() ===
                    "pendiente";

            }
        ).length;


    const pagados =
        pedidos.filter(
            function (pedido) {

                return String(
                    pedido.estado_pago || ""
                ).toLowerCase() ===
                    "pagado";

            }
        ).length;


    const ingresos =
        pedidos.reduce(
            function (
                suma,
                pedido
            ) {

                return (
                    suma +
                    Number(
                        pedido.tarifa || 0
                    )
                );

            },
            0
        );


    if (totalPedidos) {

        totalPedidos.textContent =
            total;

    }


    if (pedidosPendientes) {

        pedidosPendientes.textContent =
            pendientes;

    }


    if (pedidosPagados) {

        pedidosPagados.textContent =
            pagados;

    }


    if (ingresosTotales) {

        ingresosTotales.textContent =
            `Q${ingresos.toFixed(2)}`;

    }

}


/* =========================================================
   CERRAR MODAL
========================================================= */

function cerrarModalPedido() {

    const modal =
        document.getElementById(
            "modalPedido"
        );


    if (!modal) {

        return;

    }


    modal.classList.remove(
        "modal-abierto"
    );


    modal.style.display =
        "none";

}


/* =========================================================
   LIMPIAR PEDIDOS
========================================================= */

function limpiarPedidosBackOffice() {

    window.pedidosBackOffice =
        [];


    const contenedor =
        document.getElementById(
            "contenedorPedidos"
        );


    if (contenedor) {

        contenedor.innerHTML =
            "";

    }


    actualizarEstadisticas(
        []
    );

}


/* =========================================================
   FORMATEAR FECHA
========================================================= */

function formatearFecha(fecha) {

    if (!fecha) {

        return "Fecha no disponible";

    }


    try {

        return new Date(
            fecha
        ).toLocaleString(
            "es-GT",
            {
                dateStyle:
                    "short",

                timeStyle:
                    "short"
            }
        );

    }

    catch (error) {

        return String(
            fecha
        );

    }

}


/* =========================================================
   FORMATEAR DURACIÓN
========================================================= */

function formatearDuracion(minutos) {

    minutos =
        Number(
            minutos || 0
        );


    if (minutos <= 0) {

        return "No disponible";

    }


    const horas =
        Math.floor(
            minutos / 60
        );


    const minutosRestantes =
        Math.round(
            minutos % 60
        );


    if (horas > 0) {

        return `${horas} h ${minutosRestantes} min`;

    }


    return `${minutosRestantes} min`;

}


/* =========================================================
   FORMATEAR ESTADO
========================================================= */

function formatearEstado(estado) {

    const valor =
        String(
            estado || ""
        ).toLowerCase();


    switch (valor) {

        case "pendiente":

            return "Pendiente";


        case "pagado":

            return "Pagado";


        case "pago_confirmado":

            return "Pago confirmado";


        case "liberado":

            return "Liberado";


        case "en_camino":

            return "En camino";


        case "en_ruta":

            return "En ruta";


        case "en_destino":

            return "En destino";


        case "entregado":

            return "Entregado";


        case "no_entregado":

            return "No entregado";


        case "reenviado":

            return "Pedido reenviado";


        case "cancelado":

            return "Cancelado";


        default:

            return estado ||
                "Pendiente";

    }

}


/* =========================================================
   CLASE DEL ESTADO
========================================================= */

function obtenerClaseEstado(estado) {

    const valor =
        String(
            estado || ""
        )
            .toLowerCase()
            .replace(
                /\s+/g,
                "_"
            );


    return `estado-${valor}`;

}


/* =========================================================
   ESCAPAR HTML
========================================================= */

function escapeHtml(texto) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        texto == null
            ? ""
            : String(texto);


    return div.innerHTML;

}


/* =========================================================
   CERRAR SESIÓN
========================================================= */

async function ejecutarCerrarSesion() {

    if (!cerrarSesion) {

        return;

    }


    try {

        cerrarSesion.disabled =
            true;


        cerrarSesion.innerHTML = `
            <i class="ri-loader-4-line"></i>
            Cerrando...
        `;


        const {
            error
        } =
            await supabaseClient.auth.signOut({
                scope: "local"
            });


        if (error) {

            console.error(
                "ERROR CERRANDO SESIÓN:",
                error
            );


            alert(
                "No se pudo cerrar la sesión."
            );


            cerrarSesion.disabled =
                false;


            cerrarSesion.innerHTML = `
                <i class="ri-logout-box-line"></i>
                Cerrar sesión
            `;


            return;

        }


        usuarioBackOfficeActual =
            null;


        window.pedidosBackOffice =
            [];


        await mostrarUsuario(
            null
        );


        console.log(
            "SESIÓN BACK OFFICE CERRADA"
        );

    }

    catch (error) {

        console.error(
            "ERROR CERRANDO SESIÓN:",
            error
        );


        alert(
            "Ocurrió un error al cerrar sesión."
        );


        cerrarSesion.disabled =
            false;


        cerrarSesion.innerHTML = `
            <i class="ri-logout-box-line"></i>
            Cerrar sesión
        `;

    }

}


/* =========================================================
   ACTUALIZAR PEDIDOS
========================================================= */

async function actualizarPedidosManual() {

    if (!botonActualizar) {

        return;

    }


    try {

        botonActualizar.disabled =
            true;


        const textoOriginal =
            botonActualizar.innerHTML;


        botonActualizar.innerHTML = `
            <i class="ri-loader-4-line"></i>
            Actualizando...
        `;


        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();


        if (error) {

            console.error(
                "ERROR OBTENIENDO SESIÓN:",
                error
            );


            botonActualizar.innerHTML =
                textoOriginal;

            return;

        }


        const usuario =
            data?.session?.user ||
            null;


        if (usuario) {

            usuarioBackOfficeActual =
                usuario;


            await cargarPedidosBackOffice(
                usuario
            );

        }

        else {

            usuarioBackOfficeActual =
                null;


            await mostrarUsuario(
                null
            );

        }


        botonActualizar.innerHTML =
            textoOriginal;

    }

    catch (error) {

        console.error(
            "ERROR ACTUALIZANDO:",
            error
        );

    }

    finally {

        botonActualizar.disabled =
            false;

    }

}


/* =========================================================
   INICIALIZAR
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        inicializarElementos();


        /* =================================================
           CERRAR MODAL
        ================================================= */

        const botonCerrarModal =
            document.getElementById(
                "cerrarModal"
            );


        if (botonCerrarModal) {

            botonCerrarModal.addEventListener(
                "click",
                cerrarModalPedido
            );

        }


        /* =================================================
           CERRAR MODAL AFUERA
        ================================================= */

        const modal =
            document.getElementById(
                "modalPedido"
            );


        if (modal) {

            modal.addEventListener(
                "click",
                function (evento) {

                    if (
                        evento.target ===
                        modal
                    ) {

                        cerrarModalPedido();

                    }

                }
            );

        }


        /* =================================================
           CERRAR SESIÓN
        ================================================= */

        if (cerrarSesion) {

            cerrarSesion.addEventListener(
                "click",
                ejecutarCerrarSesion
            );

        }


        /* =================================================
           ACTUALIZAR
        ================================================= */

        if (botonActualizar) {

            botonActualizar.addEventListener(
                "click",
                actualizarPedidosManual
            );

        }


        /* =================================================
           COMPROBAR SESIÓN
        ================================================= */

        await comprobarSesion();

    }
);