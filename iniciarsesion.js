/* =========================================================
   MENSAJERÍA EXPRESS
   INICIO DE SESIÓN
   SUPABASE AUTH
   SESIÓN EXCLUSIVA PARA VENTAS / BACK OFFICE
========================================================= */

const SUPABASE_URL =
    "https://kayzwwgmebtsaiovkeos.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_yj-QjGhy6RQNUzoxg3HQeg_hkZHuSyL";


/* =========================================================
   SUPABASE
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
   ELEMENTOS
========================================================= */

const formLogin =
    document.getElementById("formLogin");

const botonLogin =
    document.getElementById("botonLogin");

const mensajeLogin =
    document.getElementById("mensajeLogin");


/* =========================================================
   MOSTRAR MENSAJE
========================================================= */

function mostrarMensaje(
    texto,
    tipo = "error"
) {

    if (!mensajeLogin) return;

    mensajeLogin.textContent =
        texto;

    mensajeLogin.className =
        "mensaje " + tipo;
}


/* =========================================================
   INICIAR SESIÓN
========================================================= */

if (formLogin) {

    formLogin.addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();


            /* =================================================
               DATOS
            ================================================= */

            const correo =
                document
                    .getElementById("correo")
                    .value
                    .trim();

            const password =
                document
                    .getElementById("password")
                    .value;


            /* =================================================
               VALIDACIÓN
            ================================================= */

            if (!correo || !password) {

                mostrarMensaje(
                    "Completa todos los campos."
                );

                return;
            }


            /* =================================================
               BOTÓN
            ================================================= */

            if (botonLogin) {

                botonLogin.disabled =
                    true;

                botonLogin.innerHTML = `
                    <i class="ri-loader-4-line"></i>
                    Iniciando sesión...
                `;
            }


            mostrarMensaje(
                "",
                "error"
            );


            try {

                console.log(
                    "======================================"
                );

                console.log(
                    "INICIANDO SESIÓN BACK OFFICE"
                );

                console.log(
                    "CORREO:",
                    correo
                );

                console.log(
                    "STORAGE:",
                    "mensajeria-backoffice-auth"
                );


                /* =================================================
                   LOGIN SUPABASE
                ================================================= */

                const {
                    data,
                    error
                } =
                    await supabaseClient.auth
                        .signInWithPassword({

                            email:
                                correo,

                            password:
                                password

                        });


                /* =================================================
                   ERROR DE LOGIN
                ================================================= */

                if (error) {

                    console.error(
                        "ERROR INICIANDO SESIÓN:",
                        error
                    );

                    console.error(
                        "MESSAGE:",
                        error.message
                    );

                    console.error(
                        "STATUS:",
                        error.status
                    );

                    console.error(
                        "CODE:",
                        error.code
                    );


                    let mensaje =
                        "No se pudo iniciar sesión.";


                    const textoError =
                        (
                            error.message ||
                            ""
                        ).toLowerCase();


                    if (
                        textoError.includes(
                            "invalid login credentials"
                        )
                    ) {

                        mensaje =
                            "Correo o contraseña incorrectos.";

                    }

                    else if (
                        textoError.includes(
                            "email not confirmed"
                        )
                    ) {

                        mensaje =
                            "Debes confirmar tu correo electrónico antes de iniciar sesión.";

                    }

                    else if (
                        error.message
                    ) {

                        mensaje =
                            error.message;
                    }


                    mostrarMensaje(
                        mensaje
                    );


                    if (botonLogin) {

                        botonLogin.disabled =
                            false;

                        botonLogin.innerHTML = `
                            <i class="ri-login-box-line"></i>
                            Iniciar sesión
                        `;
                    }


                    return;
                }


                /* =================================================
                   OBTENER USUARIO Y SESIÓN
                ================================================= */

                const usuario =
                    data?.user ||
                    null;

                const session =
                    data?.session ||
                    null;


                console.log(
                    "USUARIO:",
                    usuario
                );

                console.log(
                    "SESIÓN:",
                    session
                );


                /* =================================================
                   VERIFICAR SESIÓN
                ================================================= */

                if (
                    !usuario ||
                    !session
                ) {

                    mostrarMensaje(
                        "No se pudo crear la sesión."
                    );


                    if (botonLogin) {

                        botonLogin.disabled =
                            false;

                        botonLogin.innerHTML = `
                            <i class="ri-login-box-line"></i>
                            Iniciar sesión
                        `;
                    }


                    return;
                }


                /* =================================================
                   COMPROBAR SESIÓN GUARDADA
                ================================================= */

                const {
                    data: datosSesion,
                    error: errorSesion
                } =
                    await supabaseClient.auth
                        .getSession();


                if (errorSesion) {

                    console.error(
                        "ERROR COMPROBANDO SESIÓN:",
                        errorSesion
                    );

                }


                const sesionGuardada =
                    datosSesion?.session ||
                    null;


                const usuarioGuardado =
                    sesionGuardada?.user ||
                    null;


                console.log(
                    "SESIÓN GUARDADA:",
                    sesionGuardada
                );

                console.log(
                    "USUARIO GUARDADO:",
                    usuarioGuardado
                );


                /* =================================================
                   VERIFICAR QUE REALMENTE QUEDÓ AUTENTICADO
                ================================================= */

                if (!usuarioGuardado) {

                    mostrarMensaje(
                        "La sesión del Back Office no pudo guardarse."
                    );


                    if (botonLogin) {

                        botonLogin.disabled =
                            false;

                        botonLogin.innerHTML = `
                            <i class="ri-login-box-line"></i>
                            Iniciar sesión
                        `;
                    }


                    return;
                }


                /* =================================================
                   LOGIN CORRECTO
                ================================================= */

                mostrarMensaje(
                    "Sesión iniciada correctamente.",
                    "exito"
                );


                if (botonLogin) {

                    botonLogin.innerHTML = `
                        <i class="ri-checkbox-circle-line"></i>
                        Sesión iniciada
                    `;
                }


                console.log(
                    "======================================"
                );

                console.log(
                    "BACK OFFICE AUTENTICADO"
                );

                console.log(
                    "USUARIO ID:",
                    usuarioGuardado.id
                );

                console.log(
                    "EMAIL:",
                    usuarioGuardado.email
                );

                console.log(
                    "STORAGE KEY:",
                    "mensajeria-backoffice-auth"
                );

                console.log(
                    "DESTINO:",
                    "index.html"
                );

                console.log(
                    "======================================"
                );


                /* =================================================
                   GUARDAR REFERENCIA LOCAL
                   
                   ESTO NO AUTENTICA.
                   SOLO SIRVE COMO REFERENCIA LOCAL.
                ================================================= */

                try {

                    localStorage.setItem(
                        "usuarioBackOffice",
                        JSON.stringify({

                            id:
                                usuarioGuardado.id,

                            email:
                                usuarioGuardado.email

                        })
                    );

                } catch (errorLocal) {

                    console.warn(
                        "No se pudo guardar referencia local:",
                        errorLocal
                    );

                }


                /* =================================================
                   REDIRIGIR AL INDEX DEL BACK OFFICE
                ================================================= */

                setTimeout(
                    () => {

                        window.location.href =
                            "index.html";

                    },
                    500
                );

            }


            /* =================================================
               ERROR INESPERADO
            ================================================= */

            catch (error) {

                console.error(
                    "ERROR INESPERADO:",
                    error
                );

                console.error(
                    "MESSAGE:",
                    error?.message
                );


                mostrarMensaje(
                    error?.message ||
                    "Ocurrió un error inesperado."
                );


                if (botonLogin) {

                    botonLogin.disabled =
                        false;

                    botonLogin.innerHTML = `
                        <i class="ri-login-box-line"></i>
                        Iniciar sesión
                    `;
                }

            }

        }
    );

}