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
  if (!lista) {
    return;
  }

  lista.innerHTML =
    "<p>Carregando programas...</p>";

  try {
    const programas =
      await listarProgramasFirebase();

    const programasEncontrados =
      Object.entries(programas);

    lista.innerHTML = "";

    let totalPontos = 0;

    if (
      programasEncontrados.length === 0
    ) {
      const mensagem =
        document.createElement("p");

      mensagem.innerText =
        "Nenhum programa salvo.";

      lista.appendChild(mensagem);
    }

    programasEncontrados.forEach(
      ([chave, programa]) => {
        const pontosPrograma =
          Array.isArray(programa.pontos)
            ? programa.pontos
            : Object.values(
                programa.pontos || {}
              );

        totalPontos +=
          pontosPrograma.length;

        const card =
          document.createElement("div");

        card.className =
          "programa";

        const nome =
          document.createElement("div");

        nome.className =
          "nome";

        nome.innerText =
          programa.nome ||
          chave;

        const status =
          document.createElement("div");

        status.className =
          "status";

        status.innerText =
          "● PRONTO PARA EXECUÇÃO";

        const data =
          document.createElement("div");

        data.className =
          "data";

        data.innerText =
          programa.dataExibicao ||
          programa.data ||
          "Data não registrada";

        const quantidadePontos =
          document.createElement("div");

        quantidadePontos.className =
          "pontos";

        quantidadePontos.innerText =
          `${pontosPrograma.length} pontos salvos`;

        const acoes =
          document.createElement("div");

        acoes.className =
          "acoes";

        const botaoCarregar =
          document.createElement("button");

        botaoCarregar.type =
          "button";

        botaoCarregar.innerText =
          "CARREGAR PROGRAMA";

        botaoCarregar.addEventListener(
          "click",
          () => {
            abrirPrograma(chave);
          }
        );

        const botaoExcluir =
          document.createElement("button");

        botaoExcluir.type =
          "button";

        botaoExcluir.className =
          "btnExcluir";

        botaoExcluir.innerText =
          "×";

        botaoExcluir.title =
          "Excluir programa";

        botaoExcluir.setAttribute(
          "aria-label",
          `Excluir programa ${programa.nome || chave}`
        );

        botaoExcluir.addEventListener(
          "click",
          () => {
            excluirPrograma(
              chave,
              programa.nome || chave
            );
          }
        );

        acoes.appendChild(
          botaoCarregar
        );

        acoes.appendChild(
          botaoExcluir
        );

        card.appendChild(nome);
        card.appendChild(status);
        card.appendChild(data);
        card.appendChild(
          quantidadePontos
        );
        card.appendChild(acoes);

        lista.appendChild(card);
      }
    );

    const contadorProgramas =
      document.getElementById(
        "contadorProgramas"
      );

    const elementoTotalPontos =
      document.getElementById(
        "totalPontos"
      );

    if (contadorProgramas) {
      contadorProgramas.innerText =
        programasEncontrados.length;
    }

    if (elementoTotalPontos) {
      elementoTotalPontos.innerText =
        totalPontos;
    }
  } catch (erro) {
    console.error(
      "Erro ao listar programas:",
      erro
    );

    lista.innerHTML = "";

    const mensagem =
      document.createElement("p");

    mensagem.innerText =
      "Não foi possível carregar os programas.";

    lista.appendChild(mensagem);
  }
}
/* ================================
ABRIR PROGRAMA
================================ */

function abrirPrograma(
  chavePrograma
) {
  localStorage.setItem(
    "programaAtual",
    chavePrograma
  );

  localStorage.setItem(
    "modoPrograma",
    "executar"
  );

  // Evita que uma fila antiga interfira.
  localStorage.removeItem(
    "filaProducao"
  );

  window.location.href =
    "../new-program/novoprograma.html";
}

async function excluirPrograma(
  chavePrograma,
  nomePrograma
) {
  const confirmar =
    confirm(
      `ATENÇÃO!\n\nVocê está prestes a excluir o programa "${nomePrograma}".\n\nEssa ação não pode ser desfeita.\n\nDeseja continuar?`
    );

  if (!confirmar) {
    return;
  }

  try {
    await excluirProgramaFirebase(
      chavePrograma
    );

    if (
      localStorage.getItem(
        "programaAtual"
      ) === chavePrograma
    ) {
      localStorage.removeItem(
        "programaAtual"
      );

      localStorage.removeItem(
        "modoPrograma"
      );
    }

    await carregarProgramas();

    alert(
      `Programa "${nomePrograma}" excluído com sucesso.`
    );
  } catch (erro) {
    console.error(
      "Erro ao excluir programa:",
      erro
    );

    alert(
      "Não foi possível excluir o programa."
    );
  }
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