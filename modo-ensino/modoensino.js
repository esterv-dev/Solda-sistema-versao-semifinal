import { auth, db } from "../solda-login/firebase.js";
import {
  get,
  onValue,
  ref,
  update,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const MODULOS_CHAVES = [
  "modulo01",
  "modulo02",
  "modulo03",
  "modulo04",
  "modulo05",
  "modulo06",
  "modulo07",
  "modulo08",
];

const MODULOS = {
  modulo01: {
    numero: "MÓDULO 01",
    titulo: "CONHECENDO O SOLDATOUCH",
    descricao: "Entenda o que é o sistema e onde encontrar cada função.",
    conteudo: `
      <p>Bem-vindo ao SoldaTouch.</p>
      <p>O SoldaTouch foi desenvolvido para facilitar a programação, execução e acompanhamento dos processos de soldagem.</p>
      <p>Pelo sistema, o operador pode acessar programas, preparar produções, acompanhar a execução e consultar informações do processo.</p>

      <h3>O QUE VOCÊ ENCONTRA NO SISTEMA</h3>
      <ol class="learning-list">
        <li><strong>1. Novo Programa</strong>Criação e preparação dos programas utilizados na produção.</li>
        <li><strong>2. Carregar Programa</strong>Acesso aos programas já salvos pela empresa.</li>
        <li><strong>3. Iniciar Produção</strong>Preparação da fila e definição das peças que serão produzidas.</li>
        <li><strong>4. Painel de Produção</strong>Acompanhamento da produção e consulta de indicadores.</li>
        <li><strong>5. Modo Ensino</strong>Área criada para ajudar novos usuários a aprenderem o sistema.</li>
      </ol>

      <p class="notice">Antes de iniciar uma produção real, conheça as etapas do processo e siga os procedimentos definidos para a máquina.</p>
    `,
  },
  modulo02: {
    numero: "MÓDULO 02",
    titulo: "CONHECENDO A MÁQUINA",
    descricao: "Conheça os principais elementos envolvidos no processo.",
    conteudo: `
      <p>Antes de utilizar o SoldaTouch, é importante entender que o aplicativo faz parte de um sistema que também envolve uma máquina física.</p>
      <p>A interface permite preparar e acompanhar o processo, enquanto a máquina executa os movimentos e operações definidos.</p>

      <ul class="learning-list">
        <li><strong>CABEÇOTE / INDUTOR</strong>É a região responsável pela operação de soldagem representada também no modelo 3D do SoldaTouch.</li>
        <li><strong>MESA GIRATÓRIA</strong>É utilizada durante o posicionamento e movimentação da peça conforme o processo configurado.</li>
        <li><strong>PEÇA</strong>É o componente que será posicionado pelo operador para execução do processo.</li>
        <li><strong>VISUALIZAÇÃO 3D</strong>Representa os movimentos e o estado do processo dentro do SoldaTouch.</li>
      </ul>

      <div class="notice notice--warning">
        <strong>IMPORTANTE</strong>
        <p>O SoldaTouch não substitui os dispositivos, procedimentos e proteções de segurança da máquina. Utilize o equipamento somente conforme as orientações e procedimentos definidos para a operação real.</p>
      </div>
    `,
  },
  modulo03: {
    numero: "MÓDULO 03",
    titulo: "CRIANDO UM PROGRAMA",
    descricao: "Entenda como um programa de produção é preparado.",
    conteudo: `
      <p>Um programa representa a sequência que será utilizada durante a execução de uma peça.</p>
      <p>Depois de criado e salvo, ele pode ser reutilizado em novas produções.</p>

      <h3>PASSO A PASSO</h3>
      <ol>
        <li>Acesse "Novo Programa".</li>
        <li>Informe os dados solicitados para identificar o programa.</li>
        <li>Defina os pontos necessários utilizando as ferramentas disponíveis na tela.</li>
        <li>Confira a sequência criada.</li>
        <li>Salve o programa.</li>
        <li>Depois de salvo, ele ficará disponível para os operadores da mesma empresa.</li>
      </ol>

      <p class="notice">Dê nomes claros aos programas para facilitar sua identificação durante a produção.</p>
    `,
  },
  modulo04: {
    numero: "MÓDULO 04",
    titulo: "PREPARANDO UMA PRODUÇÃO",
    descricao: "Aprenda a selecionar programas e preparar a fila.",
    conteudo: `
      <p>Antes da execução, é necessário preparar a produção.</p>

      <h3>PASSO A PASSO</h3>
      <ol>
        <li>Acesse a área de produção.</li>
        <li>Escolha um programa salvo.</li>
        <li>Informe a quantidade de peças/repetições desejada.</li>
        <li>Adicione o programa à fila.</li>
        <li>Confira a ordem da fila antes de iniciar.</li>
      </ol>

      <p>A fila define quais programas e quantidades serão executados durante aquela produção.</p>
      <p class="notice">Confira programa e quantidade antes de iniciar.</p>
    `,
  },
  modulo05: {
    numero: "MÓDULO 05",
    titulo: "POSICIONANDO A PEÇA",
    descricao: "Saiba o que fazer quando o sistema estiver aguardando uma nova peça.",
    conteudo: `
      <p>Durante a produção, o SoldaTouch pode apresentar o estado:</p>
      <p class="notice"><strong>AGUARDANDO PEÇA</strong></p>
      <p>Isso significa que o sistema está esperando a preparação da próxima peça antes de continuar.</p>

      <h3>PASSO A PASSO</h3>
      <ol>
        <li>Aguarde o sistema entrar em "AGUARDANDO PEÇA".</li>
        <li>Posicione a peça conforme o procedimento definido para a máquina.</li>
        <li>Verifique se a preparação necessária foi concluída.</li>
        <li>Somente então utilize a confirmação "PEÇA POSICIONADA".</li>
        <li>O sistema poderá seguir para a preparação do próximo ciclo.</li>
      </ol>

      <p class="notice"><strong>A próxima peça NÃO deve iniciar automaticamente após a conclusão da anterior.</strong><br />O SoldaTouch aguarda uma nova confirmação para cada peça.</p>
      <p class="notice notice--warning">A confirmação na interface não substitui os dispositivos e procedimentos físicos de segurança da máquina.</p>
    `,
  },
  modulo06: {
    numero: "MÓDULO 06",
    titulo: "PAUSAR E CONTINUAR",
    descricao: "Aprenda a interromper temporariamente uma produção.",
    conteudo: `
      <p>Use PAUSAR quando a produção precisar ser interrompida temporariamente e houver intenção de continuar depois.</p>
      <p>Ao pausar, o SoldaTouch solicita o motivo.</p>

      <h3>MOTIVOS EXISTENTES NO SISTEMA</h3>
      <ul>
        <li>Banheiro</li>
        <li>Almoço / Intervalo</li>
        <li>Manutenção</li>
        <li>Ajuste / Troca de peça</li>
        <li>Reunião da empresa</li>
        <li>Sem motivo</li>
      </ul>

      <p>Selecione o motivo correspondente à situação.</p>
      <p>A pausa fica registrada para que o histórico e os indicadores da produção possam representar o ocorrido.</p>

      <h3>PARA CONTINUAR</h3>
      <ol>
        <li>Solicite a retomada pela interface.</li>
        <li>Aguarde a preparação necessária.</li>
        <li>O sistema somente deve continuar quando o fluxo de retomada estiver concluído.</li>
      </ol>

      <p class="notice"><strong>PAUSAR não significa CANCELAR.</strong></p>
    `,
  },
  modulo07: {
    numero: "MÓDULO 07",
    titulo: "CANCELANDO UMA PRODUÇÃO",
    descricao: "Entenda quando uma produção é encerrada.",
    conteudo: `
      <p>Cancelar é diferente de pausar.</p>

      <div class="comparison-grid">
        <div><strong>PAUSAR:</strong>interrompe temporariamente a produção para permitir uma retomada.</div>
        <div><strong>CANCELAR:</strong>encerra a produção atual.</div>
      </div>

      <p>Quando uma produção é cancelada, as peças que já foram concluídas devem continuar registradas no histórico.</p>

      <h3>EXEMPLO</h3>
      <div class="example-grid">
        <div><strong>Planejado:</strong>5 peças</div>
        <div><strong>Concluído antes do cancelamento:</strong>2 peças</div>
        <div><strong>Resultado registrado:</strong>2 peças concluídas</div>
      </div>

      <p class="notice">Utilize o cancelamento somente quando a produção realmente não deverá continuar.</p>
    `,
  },
  modulo08: {
    numero: "MÓDULO 08",
    titulo: "PAINEL E HISTÓRICO",
    descricao: "Aprenda a acompanhar os resultados da produção.",
    conteudo: `
      <p>O Painel de Produção reúne informações para acompanhar o desempenho e consultar o histórico do processo.</p>

      <ul class="learning-list">
        <li><strong>PEÇAS PRODUZIDAS</strong>Quantidade de peças concluídas no período.</li>
        <li><strong>PRODUÇÕES</strong>Registros das execuções realizadas.</li>
        <li><strong>TEMPO PRODUTIVO</strong>Tempo registrado durante as produções.</li>
        <li><strong>EFICIÊNCIA</strong>Indicador utilizado pelo sistema para representar o desempenho registrado.</li>
        <li><strong>HISTÓRICO</strong>Permite consultar produções que já foram executadas.</li>
      </ul>

      <div data-admin-content></div>
      <p class="notice">Utilize os filtros de período para analisar diferentes intervalos.</p>
    `,
  },
};

const QUESTOES = [
  {
    pergunta: 'O que significa quando o SoldaTouch mostra "AGUARDANDO PEÇA"?',
    alternativas: {
      A: "A máquina apresentou um erro.",
      B: "O sistema está aguardando a preparação e confirmação da próxima peça.",
      C: "A produção foi cancelada.",
      D: "O programa foi excluído.",
    },
    correta: "B",
  },
  {
    pergunta: "Qual é a principal diferença entre PAUSAR e CANCELAR uma produção?",
    alternativas: {
      A: "Não existe diferença.",
      B: "Pausar exclui o programa e cancelar salva.",
      C: "Pausar interrompe temporariamente; cancelar encerra a produção atual.",
      D: "Cancelar apenas fecha o painel.",
    },
    correta: "C",
  },
  {
    pergunta: "Depois que uma peça é concluída, o que deve acontecer antes da próxima?",
    alternativas: {
      A: "A próxima começa automaticamente.",
      B: "O sistema aguarda uma nova peça e uma nova confirmação.",
      C: "O operador precisa criar outro usuário.",
      D: "O histórico deve ser apagado.",
    },
    correta: "B",
  },
  {
    pergunta: "O que acontece com as peças já concluídas quando uma produção é cancelada?",
    alternativas: {
      A: "São apagadas.",
      B: "Não são contabilizadas.",
      C: "Continuam registradas no histórico.",
      D: "São transformadas em uma nova fila.",
    },
    correta: "C",
  },
  {
    pergunta: "O Modo Ensino pode comandar ou movimentar a máquina real?",
    alternativas: {
      A: "Sim, sempre.",
      B: "Sim, se o usuário for administrador.",
      C: "Somente durante o questionário.",
      D: "Não. O Modo Ensino é destinado ao treinamento e não deve comandar a máquina.",
    },
    correta: "D",
  },
];

const estado = {
  usuario: null,
  tipoUsuario: "",
  moduloAberto: null,
  pronto: false,
  sincronizandoConclusao: false,
  pararEscuta: null,
  progresso: criarProgressoVazio(),
};

const elementos = {
  progressCard: document.querySelector(".progress-card"),
  progressText: document.getElementById("progressText"),
  progressPercent: document.getElementById("progressPercent"),
  progressFill: document.getElementById("progressFill"),
  progressTrack: document.querySelector(".progress-track"),
  progressStatus: document.getElementById("progressStatus"),
  moduleDialog: document.getElementById("moduleDialog"),
  moduleNumber: document.getElementById("moduleNumber"),
  moduleTitle: document.getElementById("moduleTitle"),
  moduleDescription: document.getElementById("moduleDescription"),
  moduleContent: document.getElementById("moduleContent"),
  completeModuleButton: document.getElementById("completeModuleButton"),
  startQuizButton: document.getElementById("startQuizButton"),
  quizDialog: document.getElementById("quizDialog"),
  quizForm: document.getElementById("quizForm"),
  pageMessage: document.getElementById("pageMessage"),
};

function configurarVideo() {
  const video = document.getElementById("trainingVideo");
  const fonte = document.getElementById("trainingVideoSource");
  const placeholder = document.getElementById("videoPlaceholder");
  const arquivoConfigurado = fonte.getAttribute("src");

  if (arquivoConfigurado) {
    video.hidden = false;
    placeholder.hidden = true;
    video.load();
  }
}

function criarProgressoVazio() {
  return {
    iniciado: false,
    iniciadoEm: null,
    ultimoAcessoEm: null,
    modulosConcluidos: Object.fromEntries(
      MODULOS_CHAVES.map((chave) => [chave, false]),
    ),
    questionario: {
      tentativas: 0,
      ultimaPontuacao: 0,
      melhorPontuacao: 0,
      ultimoPercentual: 0,
      melhorPercentual: 0,
      aprovado: false,
      ultimaTentativaEm: null,
    },
    concluido: false,
    concluidoEm: null,
  };
}

function normalizarProgresso(dados = {}) {
  const vazio = criarProgressoVazio();
  const modulosRecebidos = dados.modulosConcluidos || {};
  const questionarioRecebido = dados.questionario || {};

  return {
    ...vazio,
    ...dados,
    modulosConcluidos: Object.fromEntries(
      MODULOS_CHAVES.map((chave) => [chave, modulosRecebidos[chave] === true]),
    ),
    questionario: {
      ...vazio.questionario,
      ...questionarioRecebido,
      aprovado: questionarioRecebido.aprovado === true,
    },
    concluido: dados.concluido === true,
  };
}

function caminhoModoEnsino() {
  return `usuarios/${estado.usuario.uid}/modoEnsino`;
}

function definirInterfacePronta(pronto) {
  estado.pronto = pronto;

  document.querySelectorAll(".module-card").forEach((card) => {
    card.disabled = !pronto;
  });

  elementos.startQuizButton.disabled = !pronto;
}

function mostrarMensagem(mensagem = "", sucesso = false) {
  elementos.pageMessage.textContent = mensagem;
  elementos.pageMessage.classList.toggle("is-success", sucesso);
}

function abrirDialog(dialog) {
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
    return;
  }

  dialog.setAttribute("open", "");
}

function fecharDialog(dialog) {
  if (typeof dialog.close === "function") {
    dialog.close();
    return;
  }

  dialog.removeAttribute("open");
}

function atualizarInterface() {
  const concluidos = MODULOS_CHAVES.filter(
    (chave) => estado.progresso.modulosConcluidos[chave],
  ).length;
  const percentual = Math.floor((concluidos / MODULOS_CHAVES.length) * 100);
  const aprovado = estado.progresso.questionario.aprovado === true;
  const treinamentoConcluido = concluidos === MODULOS_CHAVES.length && aprovado;

  elementos.progressText.textContent = `${concluidos} de 8 módulos concluídos`;
  elementos.progressPercent.textContent = `${percentual}%`;
  elementos.progressFill.style.width = `${percentual}%`;
  elementos.progressTrack.setAttribute("aria-valuenow", String(percentual));
  elementos.progressCard.classList.toggle("is-complete", treinamentoConcluido);

  if (treinamentoConcluido) {
    elementos.progressStatus.textContent = "Treinamento concluído";
  } else if (concluidos === MODULOS_CHAVES.length) {
    elementos.progressStatus.textContent = "Guia concluído. Faça o teste para concluir o treinamento.";
  } else if (aprovado) {
    elementos.progressStatus.textContent = "Teste aprovado. Conclua os módulos restantes.";
  } else if (concluidos > 0) {
    elementos.progressStatus.textContent = "Continue o treinamento no seu ritmo.";
  } else {
    elementos.progressStatus.textContent = "Inicie pelo primeiro módulo.";
  }

  document.querySelectorAll(".module-card").forEach((card) => {
    const chave = card.dataset.module;
    const concluido = estado.progresso.modulosConcluidos[chave] === true;
    const status = card.querySelector(".module-card__status");

    card.classList.toggle("is-complete", concluido);
    status.textContent = concluido ? "✓ CONCLUÍDO" : "NÃO CONCLUÍDO";
  });

  if (estado.moduloAberto) {
    atualizarBotaoModulo();
  }
}

function atualizarBotaoModulo() {
  const concluido = estado.progresso.modulosConcluidos[estado.moduloAberto] === true;

  elementos.completeModuleButton.disabled = concluido;
  elementos.completeModuleButton.textContent = concluido
    ? "✓ CONCLUÍDO"
    : "MARCAR COMO CONCLUÍDO";
}

function abrirModulo(chave) {
  const modulo = MODULOS[chave];

  if (!modulo || !estado.pronto) {
    return;
  }

  estado.moduloAberto = chave;
  elementos.moduleNumber.textContent = modulo.numero;
  elementos.moduleTitle.textContent = modulo.titulo;
  elementos.moduleDescription.textContent = modulo.descricao;
  elementos.moduleContent.innerHTML = modulo.conteudo;

  if (chave === "modulo08" && estado.tipoUsuario === "admin") {
    const adminContent = elementos.moduleContent.querySelector("[data-admin-content]");
    adminContent.innerHTML = '<p class="notice">Administradores também possuem acesso às informações consolidadas da empresa e aos indicadores dos operadores.</p>';
  }

  atualizarBotaoModulo();
  abrirDialog(elementos.moduleDialog);
}

async function marcarModuloConcluido() {
  const chave = estado.moduloAberto;

  if (!chave || !estado.usuario || estado.progresso.modulosConcluidos[chave]) {
    return;
  }

  elementos.completeModuleButton.disabled = true;
  elementos.completeModuleButton.textContent = "SALVANDO...";

  try {
    await update(ref(db, `${caminhoModoEnsino()}/modulosConcluidos`), {
      [chave]: true,
    });

    estado.progresso.modulosConcluidos[chave] = true;
    atualizarInterface();
    await sincronizarConclusao();
    mostrarMensagem(`${MODULOS[chave].numero} salvo no seu progresso.`, true);
  } catch (erro) {
    console.error("Não foi possível concluir o módulo:", erro);
    atualizarBotaoModulo();
    mostrarMensagem("Não foi possível salvar o módulo. Verifique sua conexão e tente novamente.");
  }
}

function renderizarQuestionario() {
  const questoesHtml = QUESTOES.map((questao, indice) => {
    const alternativasHtml = Object.entries(questao.alternativas)
      .map(
        ([letra, texto]) => `
          <label class="answer-option">
            <input type="radio" name="questao${indice + 1}" value="${letra}" />
            <span><strong>${letra})</strong> ${texto}</span>
          </label>
        `,
      )
      .join("");

    return `
      <fieldset class="question-card">
        <legend>
          <span class="question-number">QUESTÃO ${indice + 1}</span>
          ${questao.pergunta}
        </legend>
        <div class="answers">${alternativasHtml}</div>
      </fieldset>
    `;
  }).join("");

  elementos.quizForm.innerHTML = `
    ${questoesHtml}
    <p class="form-message" id="quizMessage" role="alert"></p>
    <div class="dialog-actions">
      <button class="primary-button" type="submit">FINALIZAR TESTE</button>
    </div>
  `;
}

function abrirQuestionario() {
  if (!estado.pronto) {
    return;
  }

  renderizarQuestionario();
  abrirDialog(elementos.quizDialog);
}

async function salvarResultadoQuestionario(pontuacao, percentual) {
  const questionarioRef = ref(db, `${caminhoModoEnsino()}/questionario`);
  const snapshot = await get(questionarioRef);
  const anterior = snapshot.exists() ? snapshot.val() : {};
  const tentativas = Number(anterior.tentativas) || 0;
  const melhorPontuacaoAnterior = Number(anterior.melhorPontuacao) || 0;
  const melhorPercentualAnterior = Number(anterior.melhorPercentual) || 0;

  const resultado = {
    tentativas: tentativas + 1,
    ultimaPontuacao: pontuacao,
    melhorPontuacao: Math.max(melhorPontuacaoAnterior, pontuacao),
    ultimoPercentual: percentual,
    melhorPercentual: Math.max(melhorPercentualAnterior, percentual),
    aprovado: anterior.aprovado === true || percentual >= 80,
    ultimaTentativaEm: Date.now(),
  };

  await update(questionarioRef, resultado);
  estado.progresso.questionario = resultado;
  atualizarInterface();
  await sincronizarConclusao();
}

async function finalizarQuestionario(evento) {
  evento.preventDefault();

  const dadosFormulario = new FormData(elementos.quizForm);
  const respostas = QUESTOES.map((_, indice) => dadosFormulario.get(`questao${indice + 1}`));
  const mensagem = document.getElementById("quizMessage");

  if (respostas.some((resposta) => resposta === null)) {
    mensagem.textContent = "Responda às 5 questões antes de finalizar.";
    return;
  }

  const pontuacao = respostas.reduce(
    (total, resposta, indice) => total + (resposta === QUESTOES[indice].correta ? 1 : 0),
    0,
  );
  const percentual = (pontuacao / QUESTOES.length) * 100;
  const botaoFinalizar = elementos.quizForm.querySelector('button[type="submit"]');

  botaoFinalizar.disabled = true;
  botaoFinalizar.textContent = "SALVANDO RESULTADO...";
  mensagem.textContent = "";

  try {
    await salvarResultadoQuestionario(pontuacao, percentual);
    mostrarResultadoQuestionario(pontuacao, percentual);
    mostrarMensagem("Resultado do teste salvo no seu progresso.", true);
  } catch (erro) {
    console.error("Não foi possível salvar o questionário:", erro);
    botaoFinalizar.disabled = false;
    botaoFinalizar.textContent = "FINALIZAR TESTE";
    mensagem.textContent = "Não foi possível salvar o resultado. Verifique sua conexão e tente novamente.";
  }
}

function mostrarResultadoQuestionario(pontuacao, percentual) {
  const aprovadoNestaTentativa = percentual >= 80;
  const titulo = aprovadoNestaTentativa ? "TREINAMENTO APROVADO" : "REVISE O CONTEÚDO";
  const descricao = aprovadoNestaTentativa
    ? "Você demonstrou conhecimento sobre o fluxo básico do SoldaTouch."
    : "Revise os módulos e tente novamente.";

  elementos.quizForm.innerHTML = `
    <section class="quiz-result ${aprovadoNestaTentativa ? "is-approved" : ""}" aria-live="polite">
      <p class="result-score">${pontuacao}/5</p>
      <p>${percentual}% de aproveitamento</p>
      <h3>${titulo}</h3>
      <p>${descricao}</p>
      <div class="result-actions">
        <button class="secondary-button" id="reviewGuideButton" type="button">REVISAR GUIA</button>
        <button class="primary-button" id="retryQuizButton" type="button">TENTAR NOVAMENTE</button>
      </div>
    </section>
  `;

  document.getElementById("reviewGuideButton").addEventListener("click", () => {
    fecharDialog(elementos.quizDialog);
    document.getElementById("guiaRapido").scrollIntoView({ behavior: "smooth" });
  });

  document.getElementById("retryQuizButton").addEventListener("click", renderizarQuestionario);
}

async function sincronizarConclusao() {
  if (!estado.usuario || !estado.pronto || estado.sincronizandoConclusao) {
    return;
  }

  const todosModulosConcluidos = MODULOS_CHAVES.every(
    (chave) => estado.progresso.modulosConcluidos[chave] === true,
  );
  const aprovado = estado.progresso.questionario.aprovado === true;
  const deveEstarConcluido = todosModulosConcluidos && aprovado;

  if (estado.progresso.concluido === deveEstarConcluido) {
    return;
  }

  const atualizacao = { concluido: deveEstarConcluido };

  if (deveEstarConcluido && !estado.progresso.concluidoEm) {
    atualizacao.concluidoEm = Date.now();
  }

  estado.sincronizandoConclusao = true;

  try {
    await update(ref(db, caminhoModoEnsino()), atualizacao);
  } catch (erro) {
    console.error("Não foi possível atualizar a conclusão do treinamento:", erro);
    mostrarMensagem("Seu progresso foi salvo, mas não foi possível atualizar o estado final do treinamento.");
  } finally {
    estado.sincronizandoConclusao = false;
  }
}

async function iniciarProgresso() {
  const modoEnsinoRef = ref(db, caminhoModoEnsino());
  const snapshot = await get(modoEnsinoRef);
  const agora = Date.now();

  if (!snapshot.exists()) {
    await update(modoEnsinoRef, {
      iniciado: true,
      iniciadoEm: agora,
      ultimoAcessoEm: agora,
      modulosConcluidos: Object.fromEntries(
        MODULOS_CHAVES.map((chave) => [chave, false]),
      ),
      questionario: {
        tentativas: 0,
        ultimaPontuacao: 0,
        melhorPontuacao: 0,
        ultimoPercentual: 0,
        melhorPercentual: 0,
        aprovado: false,
      },
      concluido: false,
    });
  } else {
    await update(modoEnsinoRef, {
      ultimoAcessoEm: agora,
    });
  }

  estado.pararEscuta = onValue(
    modoEnsinoRef,
    (progressoSnapshot) => {
      estado.progresso = normalizarProgresso(progressoSnapshot.val() || {});
      definirInterfacePronta(true);
      atualizarInterface();
      void sincronizarConclusao();
    },
    (erro) => {
      console.error("Não foi possível acompanhar o progresso:", erro);
      definirInterfacePronta(false);
      mostrarMensagem("Não foi possível carregar seu progresso de treinamento.");
    },
  );
}

document.querySelectorAll(".module-card").forEach((card) => {
  card.addEventListener("click", () => abrirModulo(card.dataset.module));
});

document.querySelectorAll("[data-close-dialog]").forEach((botao) => {
  botao.addEventListener("click", () => fecharDialog(botao.closest("dialog")));
});

document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.addEventListener("click", (evento) => {
    if (evento.target === dialog) {
      fecharDialog(dialog);
    }
  });
});

elementos.completeModuleButton.addEventListener("click", marcarModuloConcluido);
elementos.startQuizButton.addEventListener("click", abrirQuestionario);
elementos.quizForm.addEventListener("submit", finalizarQuestionario);

definirInterfacePronta(false);
configurarVideo();

onAuthStateChanged(auth, async (usuario) => {
  if (estado.pararEscuta) {
    estado.pararEscuta();
    estado.pararEscuta = null;
  }

  if (!usuario) {
    window.location.replace("../solda-login/login.html");
    return;
  }

  estado.usuario = usuario;

  try {
    const usuarioSnapshot = await get(ref(db, `usuarios/${usuario.uid}`));
    estado.tipoUsuario = usuarioSnapshot.exists()
      ? String(usuarioSnapshot.val().tipoUsuario || "").toLowerCase()
      : "";

    await iniciarProgresso();
  } catch (erro) {
    console.error("Não foi possível iniciar o Modo Ensino:", erro);
    definirInterfacePronta(false);
    mostrarMensagem("Não foi possível iniciar o treinamento. Verifique sua conexão e tente novamente.");
  }
});
