import { db, auth } from "../solda-login/firebase.js";

import {
  ref,
  set,
  get,
  remove,
  push,
  onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* ==========================
AGUARDAR USUÁRIO LOGADO
========================== */

function esperarUsuarioLogado() {
  return new Promise((resolve, reject) => {
    const parar = onAuthStateChanged(auth, (user) => {
      parar();

      if (user) {
        resolve(user);
      } else {
        reject("Usuário não está logado.");
      }
    });
  });
}

/* ==========================
SALVAR PROGRAMA
========================== */

window.salvarProgramaFirebase = async function(nome, programa) {
  const usuario = await esperarUsuarioLogado();

  const nomeSeguro = nome
    .trim()
    .replace(/[.#$/[\]]/g, "-");

  await set(
    ref(db, `usuarios/${usuario.uid}/programas/${nomeSeguro}`),
    {
      ...programa,
      nome: nome,
      chave: nomeSeguro,
      uidUsuario: usuario.uid,
      emailUsuario: usuario.email,
      data: new Date().toLocaleString("pt-BR")
    }
  );

  return nomeSeguro;
};

/* ==========================
CARREGAR UM PROGRAMA
========================== */

window.carregarProgramaFirebase = async function(nome) {
  const usuario = await esperarUsuarioLogado();

  const snapshot = await get(
    ref(db, `usuarios/${usuario.uid}/programas/${nome}`)
  );

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.val();
};

/* ==========================
LISTAR PROGRAMAS DO USUÁRIO
========================== */

window.listarProgramasFirebase = async function() {
  const usuario = await esperarUsuarioLogado();

  const snapshot = await get(
    ref(db, `usuarios/${usuario.uid}/programas`)
  );

  if (!snapshot.exists()) {
    return {};
  }

  return snapshot.val();
};

/* ==========================
EXCLUIR PROGRAMA
========================== */

window.excluirProgramaFirebase = async function(nome) {
  const usuario = await esperarUsuarioLogado();

  await remove(
    ref(db, `usuarios/${usuario.uid}/programas/${nome}`)
  );
};
/* ==========================
SALVAR PRODUÇÃO DO DIA
========================== */

function obterDataLocalISO() {

  const agora =
    new Date();

  return [
    agora.getFullYear(),

    String(
      agora.getMonth() + 1
    ).padStart(2, "0"),

    String(
      agora.getDate()
    ).padStart(2, "0")
  ].join("-");
}

window.salvarProducaoDiaFirebase = async function(filaProducao, tempoTotal) {
  const usuario = await esperarUsuarioLogado();


  const hoje =
  obterDataLocalISO();

  let totalPecas = 0;
  let programas = {};

  filaProducao.forEach((item) => {
    totalPecas += Number(item.quantidade);

    programas[item.programa] = {
      quantidade: Number(item.quantidade)
    };
  });

  const caminho =
    `usuarios/${usuario.uid}/producao/${hoje}`;

  const snapshot = await get(ref(db, caminho));

  const producaoAnterior = snapshot.exists()
    ? snapshot.val()
    : {
        totalPecas: 0,
        totalProgramas: 0,
        programas: {}
      };

  Object.entries(programas).forEach(([nome, dados]) => {
    const quantidadeAnterior =
      producaoAnterior.programas?.[nome]?.quantidade || 0;

    programas[nome].quantidade =
      quantidadeAnterior + dados.quantidade;
  });

  await set(ref(db, caminho), {
    totalPecas: producaoAnterior.totalPecas + totalPecas,
    totalProgramas:
      Object.keys({
        ...producaoAnterior.programas,
        ...programas
      }).length,
    programas: {
      ...producaoAnterior.programas,
      ...programas
    },
    tempoTotal: tempoTotal,
    ultimaAtualizacao: new Date().toLocaleString("pt-BR"),
    uidUsuario: usuario.uid,
    emailUsuario: usuario.email
  });
};
window.buscarProducaoDiaFirebase = async function() {
  const usuario = await esperarUsuarioLogado();

const hoje =
  obterDataLocalISO();

  const snapshot = await get(
    ref(db, `usuarios/${usuario.uid}/producao/${hoje}`)
  );

  if (!snapshot.exists()) {
    return {
      totalPecas: 0,
      totalProgramas: 0,
      programas: {}
    };
  }

  return snapshot.val();
};


window.buscarHistoricoDiarioFirebase =
async function() {

  const usuario =
    await esperarUsuarioLogado();


  const snapshot =
    await get(
      ref(
        db,
        `usuarios/${usuario.uid}/producao`
      )
    );


  if (!snapshot.exists()) {
    return [];
  }


  const dados =
    snapshot.val();


  const historico = [];


  Object.entries(
    dados
  ).forEach(
    ([dataISO, dia]) => {

      const programas =
        dia.programas || {};


      Object.entries(
        programas
      ).forEach(
        ([programa, info]) => {

          const partes =
            dataISO.split("-");


          if (
            partes.length !== 3
          ) {
            return;
          }


          const ano =
            Number(partes[0]);

          const mes =
            Number(partes[1]);

          const numeroDia =
            Number(partes[2]);


          historico.push({

            programa:
              programa,

            quantidade:
              Number(
                info.quantidade
              ) || 0,

            data:
              `${String(
                numeroDia
              ).padStart(2, "0")}/${String(
                mes
              ).padStart(2, "0")}/${ano}`,

            hora:
              "--",

            timestamp:
              new Date(
                ano,
                mes - 1,
                numeroDia,
                12,
                0,
                0
              ).getTime(),

            tempo:
              dia.tempoTotal ||
              "00:00",

            eficiencia:
              98,

            status:
              "Concluído",

            origem:
              "producao-diaria"
          });
        }
      );
    }
  );


  return historico;
};
/* ==========================
SALVAR HISTÓRICO DE PRODUÇÃO
========================== */

window.salvarHistoricoProducaoFirebase = async function(dadosExecucao) {
  const usuario = await esperarUsuarioLogado();

  const historicoRef = ref(
    db,
    `usuarios/${usuario.uid}/historicoProducao`
  );

  const novoRegistro = push(historicoRef);

  await set(novoRegistro, {
    ...dadosExecucao,

    uidUsuario: usuario.uid,
    emailUsuario: usuario.email,

    timestamp: Date.now()
  });
};


/* ==========================
BUSCAR HISTÓRICO DE PRODUÇÃO
========================== */

window.buscarHistoricoProducaoFirebase = async function() {
  const usuario = await esperarUsuarioLogado();

  const snapshot = await get(
    ref(
      db,
      `usuarios/${usuario.uid}/historicoProducao`
    )
  );

  if (!snapshot.exists()) {
    return [];
  }

  const dados = snapshot.val();

  return Object.values(dados).sort(
    (a, b) => (a.timestamp || 0) - (b.timestamp || 0)
  );
};

/* ==========================
PRODUÇÃO ATUAL
========================== */

window.salvarProducaoAtualFirebase = async function(dados) {
  const usuario = await esperarUsuarioLogado();

  await set(
    ref(
      db,
      `usuarios/${usuario.uid}/producaoAtual`
    ),
    {
      ...dados,

      uidUsuario: usuario.uid,
      emailUsuario: usuario.email,

      ultimaAtualizacao: Date.now()
    }
  );
};


/* ==========================
BUSCAR PRODUÇÃO ATUAL
========================== */

window.buscarProducaoAtualFirebase = async function() {
  const usuario = await esperarUsuarioLogado();

  const snapshot = await get(
    ref(
      db,
      `usuarios/${usuario.uid}/producaoAtual`
    )
  );

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.val();
};


/* ==========================
REMOVER PRODUÇÃO ATUAL
========================== */

window.removerProducaoAtualFirebase = async function() {
  const usuario = await esperarUsuarioLogado();

  await remove(
    ref(
      db,
      `usuarios/${usuario.uid}/producaoAtual`
    )
  );
};

window.cancelarProducaoAtualFirebase =
async function() {

  const usuario =
    await esperarUsuarioLogado();


  const snapshot =
    await get(
      ref(
        db,
        `usuarios/${usuario.uid}/producaoAtual`
      )
    );


  if (!snapshot.exists()) {

    throw new Error(
      "Nenhuma produção pendente encontrada."
    );
  }


  const producao =
    snapshot.val();


if (
  producao.status !== "PAUSADO" &&
  producao.status !== "AGUARDANDO_PECA"
) {
    throw new Error(
      "A produção precisa estar pausada para ser cancelada."
    );
  }


  const agora =
    new Date();


  const fila =
    Array.isArray(
      producao.fila
    )
      ? producao.fila
      : [];


  const indiceAtual =
    Number(
      producao.indiceFila
    ) || 0;


  /*
  =============================
  PROGRAMAS ANTERIORES DA FILA
  =============================

  Se A terminou e o usuário
  cancelou durante B, A não pode
  desaparecer do histórico.
  */

  for (
    let i = 0;
    i < indiceAtual;
    i++
  ) {

    const item =
      fila[i];


    if (!item) {
      continue;
    }


    await window
      .salvarHistoricoProducaoFirebase({

        data:
          agora.toLocaleDateString(
            "pt-BR"
          ),

        hora:
          agora.toLocaleTimeString(
            "pt-BR"
          ),

        programa:
          item.nome ||
          item.programa,

        chavePrograma:
          item.programa,

        quantidade:
          Number(
            item.quantidade
          ) || 0,

        quantidadePlanejada:
          Number(
            item.quantidade
          ) || 0,

        quantidadeConcluida:
          Number(
            item.quantidade
          ) || 0,

        percentual:
          100,

        status:
          "Concluído",

        origem:
          "cancelamento-fila"
      });
  }


  /*
  =============================
  PROGRAMA ATUAL
  =============================
  */

  const quantidadeTotal =
    Number(
      producao.quantidadeTotal
    ) || 0;


  const quantidadeConcluida =
    Number(
      producao.quantidadeConcluida
    ) || 0;


  const percentual =
    quantidadeTotal > 0
      ? Math.round(
          (
            quantidadeConcluida /
            quantidadeTotal
          ) * 100
        )
      : 0;


  await window
    .salvarHistoricoProducaoFirebase({

      data:
        agora.toLocaleDateString(
          "pt-BR"
        ),

      hora:
        agora.toLocaleTimeString(
          "pt-BR"
        ),

      programa:
        producao.programa ||
        "Programa",

      chavePrograma:
        producao.programa ||
        "Programa",

      quantidade:
        quantidadeConcluida,

      quantidadePlanejada:
        quantidadeTotal,

      quantidadeConcluida:
        quantidadeConcluida,

      percentual:
        percentual,

      status:
        "Cancelado",

      indiceFila:
        indiceAtual,

      pontoAtual:
        Number(
          producao.pontoAtual
        ) || 0,

      origem:
        "cancelamento"
    });


  /*
  Só remove depois do histórico
  ter sido salvo.
  */

  await remove(
    ref(
      db,
      `usuarios/${usuario.uid}/producaoAtual`
    )
  );


  return {
    programa:
      producao.programa,

    quantidadeTotal,

    quantidadeConcluida,

    percentual
  };
};
/* ==========================
OBSERVAR PRODUÇÃO ATUAL
EM TEMPO REAL
========================== */

window.observarProducaoAtualFirebase =
async function(callback) {

  const usuario =
    await esperarUsuarioLogado();

  const producaoRef =
    ref(
      db,
      `usuarios/${usuario.uid}/producaoAtual`
    );

  const cancelarObservacao =
    onValue(
      producaoRef,
      (snapshot) => {

        if (
          snapshot.exists()
        ) {

          callback(
            snapshot.val()
          );

        } else {

          callback(null);
        }
      }
    );

  return cancelarObservacao;
};

