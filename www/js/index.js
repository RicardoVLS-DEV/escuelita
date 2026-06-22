/**
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at
        http://www.apache.org/licenses/LICENSE-2.0
    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/

// Escuchar el evento nativo de Cordova
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);

    // 1. ESCUCHAR LAS NOTIFICACIONES ENTRANTES
    FirebasePlugin.onMessageReceived(function (message) {
        console.log("Mensaje recibido en la app:", message);

        let idNoticia = message.id_noticia || (message.data ? message.data.id_noticia : null);
        let titulo = message.titulo || (message.data ? message.data.titulo : null) || message.title;
        let resumen = message.resumen || (message.data ? message.data.resumen : null) || message.body || "";

        if (!idNoticia) {
            console.log("La notificación no contenía un id_noticia válido.");
            return;
        }

        if (message.tap === "background") {
            console.log("El usuario tocó la notificación en segundo plano. Redirigiendo...");
            abrirNoticia(idNoticia);
        }
        else {
            console.log("Notificación recibida con la app abierta. Mostrando aviso no bloqueante.");
            mostrarToastNoticia(titulo, resumen, idNoticia);
        }
    }, function (error) {
        console.error("Error al recibir mensaje: ", error);
    });

    FirebasePlugin.getToken(
        function (token) {
            console.log("TOKEN ASIGNADO:", token);
            localStorage.setItem("helloFBToken", token);
        },
        function (error) {
            console.error("ERROR AL OBTENER TOKEN:", error);
        }
    );

    // 3. SUSCRIBIR AL TEMA DE NOTICIAS
    FirebasePlugin.subscribe("noticias", function () {
        console.log("Suscrito con éxito al tema: noticias");
    }, function (error) {
        console.error("Error al suscribirse al tema: ", error);
    });
}

/**
 * Navega a la vista de detalle de una noticia.
 * Centralizado en una sola función para evitar duplicar la lógica
 * y para poder validar el id antes de navegar.
 */
function abrirNoticia(idNoticia) {
    if (!idNoticia) {
        console.warn("abrirNoticia() llamado sin id_noticia válido, no se navega.");
        return;
    }
    window.location.href = "views/detalle_noticia.html?id=" + encodeURIComponent(idNoticia);
}


function mostrarToastNoticia(titulo, resumen, idNoticia) {
    let $container = $("#toast-noticias-container");
    if ($container.length === 0) {
        $container = $('<div id="toast-noticias-container" style="position: fixed; top: 20px; right: 20px; z-index: 9999;"></div>');
        $("body").append($container);
    }

    const toastHtml = `
        <div class="toast align-items-center text-bg-light border-0 mb-2" role="alert" style="min-width: 280px; cursor: pointer;">
            <div class="d-flex">
                <div class="toast-body">
                    <strong>${escapeHtml("Nueva noticia!:" + titulo || "Nueva noticia")}</strong><br>
                    <small>${escapeHtml("Sobre la noticia: " + resumen || "")}</small>
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button>
            </div>
        </div>
    `;

    const $toast = $(toastHtml).appendTo($container);
    const toastEl = new bootstrap.Toast($toast[0], { delay: 6000 });
    toastEl.show();

    $toast.on("click", function (e) {
        if (!$(e.target).hasClass("btn-close")) {
            abrirNoticia(idNoticia);
        }
    });

    $toast.on("hidden.bs.toast", function () {
        $toast.remove();
    });
}


function escapeHtml(text) {
    return $("<div>").text(text || "").html();
}
