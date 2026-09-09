// ======================================================
// FIREBASE
// ======================================================

import { auth, db } from "../solda-login/firebase.js";
import {
  getDatabase,
  ref,
  get,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// ======================================================
// VERIFICA LOGIN
// ======================================================
let producaoPendenteAtual =
  null;

function mostrarModalProducaoPausada(
  producao
) {

  producaoPendenteAtual =
  producao;

  const overlay =
    document.getElementById(
      "overlayProducaoPausada"
    );


  if (!overlay) {
    return;
  }
window.producaoPendenteBloqueada =
  true;

  const total =
    Number(
      producao.quantidadeTotal
    ) || 0;


  const concluidas =
    Number(
      producao.quantidadeConcluida
    ) || 0;


  const percentual =
    total > 0
      ? Math.round(
          (
            concluidas /
            total
          ) * 100
        )
      : 0;


  const nomePrograma =
    document.getElementById(
      "modalNomePrograma"
    );


  if (nomePrograma) {

    nomePrograma.innerText =
      producao.programa ||
      "--";
  }


  const quantidade =
    document.getElementById(
      "modalQuantidadeProducao"
    );


  if (quantidade) {

    quantidade.innerText =
      `${concluidas} / ${total} peças concluídas`;
  }


  const percentualEl =
    document.getElementById(
      "modalPercentualProducao"
    );


  if (percentualEl) {

    percentualEl.innerText =
      `${percentual}%`;
  }


  const barra =
    document.getElementById(
      "modalBarraProgresso"
    );


  if (barra) {

    barra.style.width =
      `${percentual}%`;
  }


  const status =
    document.getElementById(
      "modalStatusProducao"
    );


  if (status) {

    status.innerText =
      "PAUSADA";
  }


  const ultimaAtualizacao =
    document.getElementById(
      "modalUltimaAtualizacao"
    );


  if (ultimaAtualizacao) {

    const timestamp =
      Number(
        producao.ultimaAtualizacao
      );


    if (
      Number.isFinite(timestamp)
    ) {

      ultimaAtualizacao.innerText =
        new Date(
          timestamp
        ).toLocaleString(
          "pt-BR"
        );

    } else {

      ultimaAtualizacao.innerText =
        "--";
    }
  }


  overlay.classList.add(
    "ativo"
  );


  overlay.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.classList.add(
    "modal-aberto"
  );
}

document
  .getElementById(
    "btnContinuarProducaoModal"
  )
  ?.addEventListener(
    "click",
    () => {

      /*
      IMPORTANTE:
      isso apenas abre a máquina.

      Não muda o Firebase para
      EXECUTANDO.
      */

      window.location.href =
        "../new-program/novoprograma.html";
    }
  );

  document
  .getElementById(
    "btnCancelarProducaoModal"
  )
  ?.addEventListener(
    "click",
    async () => {

      if (
        !producaoPendenteAtual
      ) {
        return;
      }


      const confirmou =
        confirm(
          `Deseja realmente cancelar esta produção?\n\n` +
          `Programa: ${
            producaoPendenteAtual.programa || "--"
          }\n` +
          `Concluídas: ${
            producaoPendenteAtual.quantidadeConcluida || 0
          } / ${
            producaoPendenteAtual.quantidadeTotal || 0
          }\n\n` +
          `O que já foi produzido será salvo no histórico.`
        );


      if (!confirmou) {
        return;
      }


      try {

        if (
          !window
            .cancelarProducaoAtualFirebase
        ) {

          throw new Error(
            "Função de cancelamento não carregada."
          );
        }


        await window
          .cancelarProducaoAtualFirebase();


        localStorage.removeItem(
          "filaProducao"
        );

        localStorage.removeItem(
          "historicoJaSalvo"
        );


        producaoPendenteAtual =
          null;


        const overlay =
          document.getElementById(
            "overlayProducaoPausada"
          );


        overlay?.classList.remove(
          "ativo"
        );


        document.body.classList.remove(
          "modal-aberto"
        );


        window.producaoPendenteBloqueada =
          false;


        alert(
          "Produção cancelada com sucesso."
        );


      } catch (erro) {

        console.error(
          "Erro ao cancelar produção:",
          erro
        );


        alert(
          erro.message ||
          "Não foi possível cancelar a produção."
        );
      }
    }
  );

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "../solda-login/login.html";
    return;
  }

  const uid = user.uid;

  try {
    const snapshot = await get(ref(db, "usuarios/" + uid));

    if (snapshot.exists()) {
      const dados = snapshot.val();

      document.getElementById("nomeUsuario").innerText =
        dados.nome || "Usuário";

        document.getElementById("tipoUsuario").innerText =
  dados.tipoUsuario === "admin"
    ? "Administrador"
    : "Operador";
    }

/*
=====================================
VERIFICAR PRODUÇÃO PENDENTE
=====================================
*/

const empresaId =
  sessionStorage.getItem(
    "empresaId"
  );

if (!empresaId) {
  throw new Error(
    "empresaId não encontrado na sessão."
  );
}


/*
Primeiro busca na nova
estrutura multiempresa.
*/
let snapshotProducao =
  await get(
    ref(
      db,
      `empresas/${empresaId}/producaoAtual/${uid}`
    )
  );


/*
Compatibilidade temporária
com produções antigas.
*/
if (!snapshotProducao.exists()) {

  snapshotProducao =
    await get(
      ref(
        db,
        `usuarios/${uid}/producaoAtual`
      )
    );
}


if (
  snapshotProducao.exists()
) {

  const producaoAtual =
    snapshotProducao.val();


 const existePendente =
  producaoAtual &&
  (
    producaoAtual.status ===
      "PAUSADO"
    ||
    producaoAtual.status ===
      "EXECUTANDO"
    ||
    producaoAtual.status ===
      "AGUARDANDO_PECA"
    ||
    producaoAtual.status ===
      "AGUARDANDO_INICIO"
  );


  if (existePendente) {

    mostrarModalProducaoPausada(
      producaoAtual
    );
  }
}

  } catch (erro) {
    console.error("Erro ao buscar dados:", erro);
  }
});
