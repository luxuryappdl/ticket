/* =========================================================
   MENSAJERÍA EXPRESS
   REGISTRO DE USUARIOS
   SUPABASE AUTH + PERFILES
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
   SESIÓN PRINCIPAL DEL CLIENTE
========================================================= */

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY,
        {
            auth: {
                storageKey: "mensajeria-main-auth",
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        }
    );


/* =========================================================
   ELEMENTOS
========================================================= */

const formRegistro =
    document.getElementById(
        "formRegistro"
    );

const botonRegistro =
    document.getElementById(
        "botonRegistro"
    );

const mensajeRegistro =
    document.getElementById(
        "mensajeRegistro"
    );


/* =========================================================
   MOSTRAR MENSAJE
========================================================= */

function mostrarMensaje(
    texto,
    tipo = "error"
) {

    if (!mensajeRegistro) {
        return;
    }

    mensajeRegistro.textContent =
        texto;

    mensajeRegistro.className =
        "mensaje " + tipo;
}


/* =========================================================
   REGISTRO
========================================================= */

if (formRegistro) {

    formRegistro.addEventListener(
        "submit",
        async function (e) {

            e.preventDefault();


            console.log(
                "========================================"
            );

            console.log(
                "INICIANDO REGISTRO..."
            );

            console.log(
                "========================================"
            );


            /* ---------------------------------------------
               DATOS DEL FORMULARIO
            --------------------------------------------- */

            const nombre =
                document
                    .getElementById("nombre")
                    ?.value
                    .trim() || "";


            const apellido =
                document
                    .getElementById("apellido")
                    ?.value
                    .trim() || "";


            const correo =
                document
                    .getElementById("correo")
                    ?.value
                    .trim() || "";


            const telefono =
                document
                    .getElementById("telefono")
                    ?.value
                    .trim() || "";


            const password =
                document
                    .getElementById("password")
                    ?.value || "";


            const confirmarPassword =
                document
                    .getElementById("confirmarPassword")
                    ?.value || "";


            /* ---------------------------------------------
               VALIDACIONES
            --------------------------------------------- */

            if (
                !nombre ||
                !apellido ||
                !correo ||
                !telefono ||
                !password ||
                !confirmarPassword
            ) {

                mostrarMensaje(
                    "Completa todos los campos."
                );

                return;
            }


            /* ---------------------------------------------
               TELÉFONO
            --------------------------------------------- */

            const telefonoLimpio =
                telefono.replace(
                    /\D/g,
                    ""
                );


            if (
                telefonoLimpio.length !== 8
            ) {

                mostrarMensaje(
                    "El teléfono debe tener 8 dígitos."
                );

                return;
            }


            const telefonoFinal =
                "+502" +
                telefonoLimpio;


            /* ---------------------------------------------
               CONTRASEÑA
            --------------------------------------------- */

            if (
                password.length < 6
            ) {

                mostrarMensaje(
                    "La contraseña debe tener al menos 6 caracteres."
                );

                return;
            }


            if (
                password !==
                confirmarPassword
            ) {

                mostrarMensaje(
                    "Las contraseñas no coinciden."
                );

                return;
            }


            /* ---------------------------------------------
               BOTÓN
            --------------------------------------------- */

            if (botonRegistro) {

                botonRegistro.disabled =
                    true;

                botonRegistro.innerHTML = `
                    <i class="ri-loader-4-line"></i>
                    Creando cuenta...
                `;
            }


            mostrarMensaje(
                "",
                "error"
            );


            try {

                /* =================================================
                   CREAR USUARIO EN SUPABASE AUTH
                ================================================= */

                console.log(
                    "CREANDO USUARIO EN AUTH..."
                );


                const {
                    data,
                    error
                } =
                    await supabaseClient.auth.signUp({

                        email:
                            correo,

                        password:
                            password,

                        options: {

                            data: {

                                nombre:
                                    nombre,

                                apellido:
                                    apellido,

                                telefono:
                                    telefonoFinal

                            }

                        }

                    });


                /* =================================================
                   ERROR AUTH
                ================================================= */

                if (error) {

                    console.error(
                        "ERROR SUPABASE AUTH:",
                        error
                    );


                    let mensaje =
                        "No se pudo crear la cuenta.";


                    const textoError =
                        (
                            error.message ||
                            ""
                        ).toLowerCase();


                    if (
                        textoError.includes(
                            "user already registered"
                        ) ||
                        textoError.includes(
                            "already been registered"
                        )
                    ) {

                        mensaje =
                            "Este correo ya está registrado.";

                    }

                    else if (
                        textoError.includes(
                            "password"
                        )
                    ) {

                        mensaje =
                            "La contraseña no cumple los requisitos.";

                    }

                    else if (
                        textoError.includes(
                            "email"
                        )
                    ) {

                        mensaje =
                            "El correo electrónico no es válido.";

                    }

                    else if (
                        textoError.includes(
                            "rate limit"
                        )
                    ) {

                        mensaje =
                            "Demasiados intentos. Espera unos minutos y vuelve a intentarlo.";

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


                    if (botonRegistro) {

                        botonRegistro.disabled =
                            false;

                        botonRegistro.innerHTML = `
                            <i class="ri-user-add-line"></i>
                            Crear cuenta
                        `;

                    }


                    return;
                }


                /* =================================================
                   USUARIO CREADO
                ================================================= */

                const usuario =
                    data?.user || null;


                const session =
                    data?.session || null;


                if (!usuario) {

                    console.error(
                        "SUPABASE NO DEVOLVIÓ USUARIO:",
                        data
                    );


                    mostrarMensaje(
                        "No se pudo crear el usuario."
                    );


                    if (botonRegistro) {

                        botonRegistro.disabled =
                            false;

                        botonRegistro.innerHTML = `
                            <i class="ri-user-add-line"></i>
                            Crear cuenta
                        `;

                    }


                    return;
                }


                console.log(
                    "USUARIO CREADO:",
                    usuario.id
                );


                /* =================================================
                   GUARDAR PERFIL
                   
                   IMPORTANTE:
                   NO usamos "rol" porque la tabla perfiles
                   no tiene esa columna.
                ================================================= */

                console.log(
                    "GUARDANDO PERFIL..."
                );


                const perfil = {

                    id:
                        usuario.id,

                    nombre:
                        nombre,

                    apellido:
                        apellido,

                    telefono:
                        telefonoFinal,

                    puntos:
                        0

                };


                console.log(
                    "DATOS PERFIL:",
                    perfil
                );


                const resultadoPerfil =
                    await supabaseClient
                        .from("perfiles")
                        .upsert(
                            perfil,
                            {
                                onConflict:
                                    "id"
                            }
                        )
                        .select()
                        .single();


                /* =================================================
                   ERROR GUARDANDO PERFIL
                ================================================= */

                if (
                    resultadoPerfil.error
                ) {

                    console.error(
                        "ERROR GUARDANDO PERFIL:",
                        resultadoPerfil.error
                    );


                    mostrarMensaje(
                        "La cuenta fue creada, pero no se pudo guardar el perfil."
                    );


                    if (botonRegistro) {

                        botonRegistro.disabled =
                            false;

                        botonRegistro.innerHTML = `
                            <i class="ri-user-add-line"></i>
                            Crear cuenta
                        `;

                    }


                    return;
                }


                console.log(
                    "PERFIL GUARDADO:",
                    resultadoPerfil.data
                );


                /* =================================================
                   GUARDAR REFERENCIA LOCAL
                ================================================= */

                try {

                    localStorage.setItem(
                        "usuarioLogueado",
                        JSON.stringify({

                            id:
                                usuario.id,

                            email:
                                usuario.email,

                            nombre:
                                nombre,

                            apellido:
                                apellido,

                            telefono:
                                telefonoFinal

                        })
                    );

                } catch (error) {

                    console.warn(
                        "NO SE PUDO GUARDAR usuarioLogueado:",
                        error
                    );

                }


                /* =================================================
                   REGISTRO COMPLETADO
                ================================================= */

                if (session) {

                    mostrarMensaje(
                        "Cuenta creada correctamente.",
                        "exito"
                    );


                    if (botonRegistro) {

                        botonRegistro.innerHTML = `
                            <i class="ri-checkbox-circle-line"></i>
                            Cuenta creada
                        `;

                    }


                    console.log(
                        "SESIÓN DEL CLIENTE GUARDADA EN:",
                        "mensajeria-main-auth"
                    );


                    setTimeout(
                        function () {

                            window.location.href =
                                "index.html";

                        },
                        800
                    );

                }

                else {

                    mostrarMensaje(
                        "Cuenta creada. Revisa tu correo electrónico para confirmar tu cuenta.",
                        "exito"
                    );


                    if (botonRegistro) {

                        botonRegistro.disabled =
                            false;

                        botonRegistro.innerHTML = `
                            <i class="ri-checkbox-circle-line"></i>
                            Cuenta creada
                        `;

                    }


                    console.log(
                        "USUARIO CREADO PERO SIN SESIÓN."
                    );

                }


            } catch (error) {

                console.error(
                    "ERROR INESPERADO:",
                    error
                );


                mostrarMensaje(
                    error?.message ||
                    "Ocurrió un error inesperado."
                );


                if (botonRegistro) {

                    botonRegistro.disabled =
                        false;

                    botonRegistro.innerHTML = `
                        <i class="ri-user-add-line"></i>
                        Crear cuenta
                    `;

                }

            }

        }
    );

}