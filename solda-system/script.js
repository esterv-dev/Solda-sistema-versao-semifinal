// ELEMENTOS
const btnMenu = document.getElementById("btnMenu");

const ladoDireito = document.getElementById("statusMaquina");

const layout = document.querySelector(".layout");

btnMenu.addEventListener("click", () => {

  ladoDireito.classList.toggle("status-fechado");

  layout.classList.toggle("layout-expandido");

});

// ======================================================
// DATA E HORA
// ======================================================

function atualizarDataHora() {

  const agora = new Date();

  const data = agora.toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  const hora = agora.toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  const dataEl = document.getElementById("dataAtual");
  const horaEl = document.getElementById("horaAtual");

  if (dataEl) dataEl.innerText = data;
  if (horaEl) horaEl.innerText = hora;

}
function novoPrograma() {

  if (
    window.producaoPendenteBloqueada
  ) {

    alert(
      "Existe uma produção pendente. Continue ou cancele essa produção antes de criar um novo programa."
    );

    return;
  }


  localStorage.removeItem(
    "programaAtual"
  );

  localStorage.removeItem(
    "modoPrograma"
  );


  /*
  Não apagamos filaProducao aqui.
  A fila deve ser removida apenas
  por conclusão ou cancelamento.
  */


  window.location.href =
    "../new-program/novoprograma.html";
}



// =====================================
// MENU ADMINISTRADOR
// =====================================

const tipoUsuarioLogado =
  sessionStorage.getItem("tipoUsuario");

const menuOperadores =
  document.getElementById("menuOperadores");

if (
  tipoUsuarioLogado === "admin" &&
  menuOperadores
) {
  menuOperadores.style.display = "block";
}
/* =====================================
BOOT SOLDATECH
===================================== */

/* =====================================
BOOT SOLDATECH
===================================== */

window.addEventListener("load", () => {

    if(sessionStorage.getItem("bootExecutado")){

        const boot =
            document.getElementById("bootScreen");

        if(boot){
            boot.remove();
        }

        return;
    }

    sessionStorage.setItem(
        "bootExecutado",
        "true"
    );

    const boot =
        document.getElementById("bootScreen");

    const texto =
        document.getElementById("bootText");

    const barra =
        document.getElementById("bootBar");

    const etapas = [

        "INITIALIZING SOLDATECH AI...",
        "CONNECTING INDUSTRIAL DATABASE...",
        "VERIFYING SAFETY MODULES...",
        "ESTABLISHING ROBOT CONNECTION...",
        "LOADING WELDING PROGRAMS...",
        "CHECKING INDUSTRY 4.0 NETWORK...",
        "SYNCHRONIZING MACHINE DATA...",
        "STARTING CONTROL CENTER...",
        "SYSTEM READY"

    ];

    let etapa = 0;

    function atualizarBoot(){

        texto.innerText =
            etapas[etapa];

        barra.style.width =
            ((etapa + 1) / etapas.length) * 100 + "%";

        etapa++;

        if(etapa >= etapas.length){

            setTimeout(() => {

                boot.classList.add("sumir");

            }, 1000);

            return;
        }

        setTimeout(
            atualizarBoot,
            200
        );
    }

    atualizarBoot();

});

// roda imediatamente
atualizarDataHora();

// atualiza continuamente
setInterval(atualizarDataHora, 1000);