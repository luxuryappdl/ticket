"use strict";

const SUPABASE_URL =
    "https://kayzwwgmebtsaiovkeos.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_yj-QjGhy6RQNUzoxg3HQeg_hkZHuSyL";

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

let usuarioSesion = null;
let backOfficeActual = null;
let tickets = [];
let canalTickets = null;

document.addEventListener("DOMContentLoaded", async () => {

    console.log("========================================");
    console.log("MENSAJERÍA EXPRESS");
    console.log("HISTORIAL DE TICKETS");
    console.log("========================================");

    const cargado = await cargarBackOffice();

    if (!cargado) {
        return;
    }

    configurarEventos();

    await cargarTickets();

    iniciarRealtime();
});

async function cargarBackOffice() {

    try {

        const {
            data: { session },
            error
        } = await supabaseClient.auth.getSession();

        if (error) {

            console.error(
                "ERROR OBTENIENDO SESIÓN:",
                error
            );

            alert(
                "No se pudo comprobar la sesión del Back Office."
            );

            return false;
        }

        if (!session || !session.user) {

            alert(
                "Debes iniciar sesión como Back Office."
            );

            window.location.href =
                "iniciarsesion.html";

            return false;
        }

        usuarioSesion = session.user;

        const {
            data: backOffice,
            error: errorBackOffice
        } = await supabaseClient
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

        if (!backOffice) {

            alert(
                "El usuario actual no está registrado como Back Office."
            );

            return false;
        }

        if (backOffice.activo === false) {

            alert(
                "Este Back Office se encuentra desactivado."
            );

            return false;
        }

        backOfficeActual = backOffice;

        mostrarUsuario();

        return true;

    } catch (error) {

        console.error(
            "ERROR CARGANDO BACK OFFICE:",
            error
        );

        alert(
            "Ocurrió un error cargando el Back Office."
        );

        return false;
    }
}

function mostrarUsuario() {

    const usuarioActual =
        document.getElementById(
            "usuarioActual"
        );

    if (!usuarioActual) {
        return;
    }

    usuarioActual.textContent =
        String(
            backOfficeActual?.nombre ||
            usuarioSesion?.email ||
            "Back Office"
        ).trim();
}

function configurarEventos() {

    const buscar =
        document.getElementById(
            "buscarTicket"
        );

    const filtro =
        document.getElementById(
            "filtroEstado"
        );

    const cerrarModal =
        document.getElementById(
            "cerrarModal"
        );

    const btnCerrarModal =
        document.getElementById(
            "btnCerrarModal"
        );

    if (buscar) {

        buscar.addEventListener(
            "input",
            aplicarFiltros
        );
    }

    if (filtro) {

        filtro.addEventListener(
            "change",
            aplicarFiltros
        );
    }

    if (cerrarModal) {

        cerrarModal.addEventListener(
            "click",
            cerrarDetalle
        );
    }

    if (btnCerrarModal) {

        btnCerrarModal.addEventListener(
            "click",
            cerrarDetalle
        );
    }

    const modal =
        document.getElementById(
            "modalTicket"
        );

    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (event.target === modal) {

                    cerrarDetalle();
                }
            }
        );
    }

    document.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {

                cerrarDetalle();
            }
        }
    );
}

async function cargarTickets() {

    const cargando =
        document.getElementById(
            "cargando"
        );

    const lista =
        document.getElementById(
            "listaTickets"
        );

    const sinTickets =
        document.getElementById(
            "sinTickets"
        );

    if (cargando) {

        cargando.style.display =
            "flex";
    }

    if (lista) {

        lista.innerHTML = "";
    }

    if (sinTickets) {

        sinTickets.style.display =
            "none";
    }

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("tickets_soporte")
            .select(
                [
                    "id",
                    "usuario_id",
                    "nombre_usuario",
                    "correo_usuario",
                    "telefono_usuario",
                    "categoria",
                    "prioridad",
                    "asunto",
                    "descripcion",
                    "archivo_url",
                    "estado",
                    "respuesta",
                    "creado_en",
                    "actualizado_en"
                ].join(",")
            )
            .eq(
                "usuario_id",
                usuarioSesion.id
            )
            .order(
                "creado_en",
                {
                    ascending: false
                }
            );

        if (error) {

            console.error(
                "ERROR CARGANDO TICKETS:",
                error
            );

            throw error;
        }

        tickets = data || [];

        actualizarResumen();

        aplicarFiltros();

    } catch (error) {

        console.error(
            "ERROR HISTORIAL:",
            error
        );

        if (lista) {

            lista.innerHTML = `
                <div class="sin-tickets">
                    <div class="sin-tickets-icono">
                        <i class="ri-error-warning-line"></i>
                    </div>

                    <h3>
                        No se pudo cargar el historial
                    </h3>

                    <p>
                        ${escapeHtml(
                error?.message ||
                "Ocurrió un error consultando los tickets."
            )}
                    </p>
                </div>
            `;
        }

    } finally {

        if (cargando) {

            cargando.style.display =
                "none";
        }
    }
}

function actualizarResumen() {

    const total =
        tickets.length;

    const pendientes =
        tickets.filter(
            ticket =>
                normalizarEstado(
                    ticket.estado
                ) === "pendiente"
        ).length;

    const revision =
        tickets.filter(
            ticket =>
                normalizarEstado(
                    ticket.estado
                ) === "en revisión"
        ).length;

    const resueltos =
        tickets.filter(
            ticket =>
                normalizarEstado(
                    ticket.estado
                ) === "resuelto"
        ).length;

    const totalElement =
        document.getElementById(
            "totalTickets"
        );

    const pendientesElement =
        document.getElementById(
            "ticketsPendientes"
        );

    const revisionElement =
        document.getElementById(
            "ticketsRevision"
        );

    const resueltosElement =
        document.getElementById(
            "ticketsResueltos"
        );

    if (totalElement) {

        totalElement.textContent =
            total;
    }

    if (pendientesElement) {

        pendientesElement.textContent =
            pendientes;
    }

    if (revisionElement) {

        revisionElement.textContent =
            revision;
    }

    if (resueltosElement) {

        resueltosElement.textContent =
            resueltos;
    }
}

function aplicarFiltros() {

    const buscar =
        document.getElementById(
            "buscarTicket"
        )?.value
            ?.trim()
            .toLowerCase() ||
        "";

    const filtroEstado =
        document.getElementById(
            "filtroEstado"
        )?.value ||
        "Todos";

    const ticketsFiltrados =
        tickets.filter(
            ticket => {

                const texto =
                    [
                        ticket.id,
                        ticket.asunto,
                        ticket.categoria,
                        ticket.descripcion,
                        ticket.prioridad
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();

                const coincideBusqueda =
                    !buscar ||
                    texto.includes(buscar);

                const coincideEstado =
                    filtroEstado === "Todos" ||
                    normalizarEstado(
                        ticket.estado
                    ) ===
                    normalizarEstado(
                        filtroEstado
                    );

                return (
                    coincideBusqueda &&
                    coincideEstado
                );
            }
        );

    renderizarTickets(
        ticketsFiltrados
    );
}

function renderizarTickets(listaTickets) {

    const lista =
        document.getElementById(
            "listaTickets"
        );

    const sinResultados =
        document.getElementById(
            "sinResultados"
        );

    const sinTickets =
        document.getElementById(
            "sinTickets"
        );

    if (!lista) {
        return;
    }

    lista.innerHTML = "";

    if (tickets.length === 0) {

        lista.style.display =
            "none";

        if (sinTickets) {

            sinTickets.style.display =
                "block";
        }

        if (sinResultados) {

            sinResultados.style.display =
                "none";
        }

        return;
    }

    if (listaTickets.length === 0) {

        lista.style.display =
            "none";

        if (sinTickets) {

            sinTickets.style.display =
                "none";
        }

        if (sinResultados) {

            sinResultados.style.display =
                "block";
        }

        return;
    }

    lista.style.display =
        "flex";

    if (sinTickets) {

        sinTickets.style.display =
            "none";
    }

    if (sinResultados) {

        sinResultados.style.display =
            "none";
    }

    listaTickets.forEach(ticket => {

        lista.appendChild(
            crearTicketCard(ticket)
        );
    });
}

function crearTicketCard(ticket) {

    const card =
        document.createElement(
            "article"
        );

    card.className =
        "ticket-card";

    const estado =
        obtenerEstadoVisual(
            ticket.estado
        );

    const fecha =
        formatearFecha(
            ticket.creado_en
        );

    const descripcion =
        ticket.descripcion ||
        "Sin descripción";

    const descripcionCorta =
        descripcion.length > 180
            ? descripcion.substring(
                0,
                180
            ) + "..."
            : descripcion;

    card.innerHTML = `
        <div class="ticket-superior">

            <div class="ticket-identificacion">

                <span class="ticket-numero">
                    Ticket #${escapeHtml(
        String(ticket.id)
    )}
                </span>

                <h3 class="ticket-asunto">
                    ${escapeHtml(
        ticket.asunto ||
        "Sin asunto"
    )}
                </h3>

            </div>

            <span class="ticket-estado ${estado.clase}">

                <i class="${estado.icono}"></i>

                ${escapeHtml(
        estado.texto
    )}

            </span>

        </div>

        <p class="ticket-descripcion">
            ${escapeHtml(
        descripcionCorta
    )}
        </p>

        <div class="ticket-informacion">

            <span class="ticket-dato">

                <i class="ri-folder-settings-line"></i>

                ${escapeHtml(
        ticket.categoria ||
        "Sin categoría"
    )}

            </span>

            <span class="ticket-dato prioridad">

                <i class="ri-alarm-warning-line"></i>

                ${escapeHtml(
        ticket.prioridad ||
        "Normal"
    )}

            </span>

            ${ticket.respuesta
            ? `
                        <span class="ticket-dato">

                            <i class="ri-message-3-line"></i>

                            Tiene respuesta

                        </span>
                    `
            : ""
        }

        </div>

        <div class="ticket-pie">

            <span class="ticket-fecha">

                <i class="ri-calendar-line"></i>

                ${escapeHtml(
            fecha
        )}

            </span>

            <button
                type="button"
                class="btn-ver-ticket"
                data-ticket-id="${escapeHtml(
            String(ticket.id)
        )}">

                <i class="ri-eye-line"></i>

                Ver detalles

            </button>

        </div>
    `;

    const boton =
        card.querySelector(
            ".btn-ver-ticket"
        );

    if (boton) {

        boton.addEventListener(
            "click",
            () => {

                abrirDetalle(ticket);
            }
        );
    }

    return card;
}

function abrirDetalle(ticket) {

    const modal =
        document.getElementById(
            "modalTicket"
        );

    if (!modal) {
        return;
    }

    const estado =
        obtenerEstadoVisual(
            ticket.estado
        );

    const modalNumero =
        document.getElementById(
            "modalNumero"
        );

    const modalAsunto =
        document.getElementById(
            "modalAsunto"
        );

    const modalEstado =
        document.getElementById(
            "modalEstado"
        );

    const modalCategoria =
        document.getElementById(
            "modalCategoria"
        );

    const modalPrioridad =
        document.getElementById(
            "modalPrioridad"
        );

    const modalFecha =
        document.getElementById(
            "modalFecha"
        );

    const modalActualizado =
        document.getElementById(
            "modalActualizado"
        );

    const modalDescripcion =
        document.getElementById(
            "modalDescripcion"
        );

    const modalRespuesta =
        document.getElementById(
            "modalRespuesta"
        );

    const modalArchivo =
        document.getElementById(
            "modalArchivo"
        );

    const modalArchivoLink =
        document.getElementById(
            "modalArchivoLink"
        );

    if (modalNumero) {

        modalNumero.textContent =
            `Ticket #${ticket.id}`;
    }

    if (modalAsunto) {

        modalAsunto.textContent =
            ticket.asunto ||
            "Sin asunto";
    }

    if (modalEstado) {

        modalEstado.textContent =
            estado.texto;

        modalEstado.className =
            "modal-estado " +
            estado.clase;
    }

    if (modalCategoria) {

        modalCategoria.textContent =
            ticket.categoria ||
            "Sin categoría";
    }

    if (modalPrioridad) {

        modalPrioridad.textContent =
            ticket.prioridad ||
            "Normal";
    }

    if (modalFecha) {

        modalFecha.textContent =
            formatearFecha(
                ticket.creado_en
            );
    }

    if (modalActualizado) {

        modalActualizado.textContent =
            formatearFecha(
                ticket.actualizado_en
            );
    }

    if (modalDescripcion) {

        modalDescripcion.textContent =
            ticket.descripcion ||
            "Sin descripción.";
    }

    if (modalRespuesta) {

        modalRespuesta.textContent =
            ticket.respuesta ||
            "Aún no hay respuesta de soporte.";
    }

    if (
        modalArchivo &&
        modalArchivoLink
    ) {

        if (ticket.archivo_url) {

            modalArchivo.style.display =
                "block";

            modalArchivoLink.href =
                ticket.archivo_url;

        } else {

            modalArchivo.style.display =
                "none";

            modalArchivoLink.href =
                "#";
        }
    }

    modal.classList.add(
        "mostrar"
    );

    document.body.style.overflow =
        "hidden";
}

function cerrarDetalle() {

    const modal =
        document.getElementById(
            "modalTicket"
        );

    if (!modal) {
        return;
    }

    modal.classList.remove(
        "mostrar"
    );

    document.body.style.overflow =
        "";
}

function obtenerEstadoVisual(estado) {

    const estadoNormalizado =
        normalizarEstado(estado);

    if (
        estadoNormalizado ===
        "en revisión"
    ) {

        return {

            texto: "En revisión",

            clase: "revision",

            icono:
                "ri-loader-4-line"
        };
    }

    if (
        estadoNormalizado ===
        "resuelto"
    ) {

        return {

            texto: "Resuelto",

            clase: "resuelto",

            icono:
                "ri-checkbox-circle-line"
        };
    }

    if (
        estadoNormalizado ===
        "cerrado"
    ) {

        return {

            texto: "Cerrado",

            clase: "cerrado",

            icono:
                "ri-lock-line"
        };
    }

    return {

        texto: "Pendiente",

        clase: "pendiente",

        icono:
            "ri-time-line"
    };
}

function normalizarEstado(estado) {

    return String(
        estado ||
        "Pendiente"
    )
        .trim()
        .toLowerCase()
        .replace(
            /\s+/g,
            " "
        );
}

function formatearFecha(fecha) {

    if (!fecha) {

        return "Sin fecha";
    }

    const fechaObj =
        new Date(fecha);

    if (
        Number.isNaN(
            fechaObj.getTime()
        )
    ) {

        return "Sin fecha";
    }

    return new Intl.DateTimeFormat(
        "es-GT",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    ).format(fechaObj);
}

function escapeHtml(texto) {

    return String(
        texto ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}

function iniciarRealtime() {

    if (!usuarioSesion) {
        return;
    }

    if (canalTickets) {

        supabaseClient.removeChannel(
            canalTickets
        );
    }

    canalTickets =
        supabaseClient
            .channel(
                "historial-tickets-" +
                usuarioSesion.id
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "tickets_soporte",
                    filter:
                        `usuario_id=eq.${usuarioSesion.id}`
                },
                async () => {

                    console.log(
                        "CAMBIO DETECTADO EN TICKET"
                    );

                    await cargarTickets();
                }
            )
            .subscribe(
                status => {

                    console.log(
                        "REALTIME:",
                        status
                    );
                }
            );
}