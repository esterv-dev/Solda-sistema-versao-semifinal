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

window.salvarProducaoDiaFirebase = async function(filaProducao, tempoTotal) {
  const usuario = await esperarUsuarioLogado();

  const hoje = new Date().toISOString().slice(0, 10);

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

  const hoje = new Date().toISOString().slice(0, 10);

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

