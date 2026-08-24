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

function mostrarModalProducaoPausada(
  producao
) {

  const overlay =
    document.getElementById(
      "overlayProducaoPausada"
    );


  if (!overlay) {
    return;
  }


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
        dados.cargo || "Operador";
    }

/*
=====================================
VERIFICAR PRODUÇÃO PENDENTE
=====================================
*/

const snapshotProducao =
  await get(
    ref(
      db,
      `usuarios/${uid}/producaoAtual`
    )
  );


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
