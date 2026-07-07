const lista = document.getElementById("lista");

/* ================================
RELÓGIO
================================ */

function atualizarRelogio() {

    const agora = new Date();

    document.getElementById(
        "relogio"
    ).innerText =
        agora.toLocaleTimeString("pt-BR");
}

setInterval(
    atualizarRelogio,
    1000
);

atualizarRelogio();

/* ================================
CARREGAR PROGRAMAS
================================ */
async function carregarProgramas() {

    if (!lista) return;

    lista.innerHTML = "";

    let totalPontos = 0;
    let quantidadeProgramas = 0;

    const programas =
    await listarProgramasFirebase();

    Object.entries(programas).forEach(
      ([chave, programa]) => {

        quantidadeProgramas++;

        totalPontos +=
        programa.pontos.length;

        const card =
        document.createElement("div");

        card.className =
        "programa";

        card.innerHTML = `

        <div class="nome">
            ${programa.nome}
        </div>

        <div class="status">
            ● PRONTO PARA EXECUÇÃO
        </div>

        <div class="data">
            ${programa.data}
        </div>

        <div class="pontos">
            ${programa.pontos.length}
            pontos salvos
        </div>

        <div class="acoes">

            <button
                onclick="abrirPrograma('${chave}')">

                CARREGAR PROGRAMA

            </button>

        </div>
        `;

        lista.appendChild(card);

      }
    );

    document.getElementById(
      "contadorProgramas"
    ).innerText =
      quantidadeProgramas;

    document.getElementById(
      "totalPontos"
    ).innerText =
      totalPontos;
}

/* ================================
ABRIR PROGRAMA
================================ */

function abrirPrograma(nome) {

    localStorage.setItem(
        "programaAtual",
        nome
    );

    window.location.href =
        "../new-program/novoprograma.html";
}
async function excluirPrograma(nome) {

    const confirmar = confirm(
        `ATENÇÃO!\n\nVocê está prestes a excluir o programa "${nome}".\n\nEssa ação não pode ser desfeita.\n\nDeseja continuar?`
    );

    if (!confirmar) return;

    await excluirProgramaFirebase(nome);

    carregarProgramas();
}

// voltar
document
.getElementById("btnVoltar")
.addEventListener(
    "click",
    () => {

        window.location.href =
        "../solda-system/index.html"; // ajuste o caminho

    }
);
/* ================================
INICIAR
================================ */

window.addEventListener(
    "DOMContentLoaded",
    carregarProgramas
);
window.abrirPrograma = abrirPrograma;
window.excluirPrograma = excluirPrograma;