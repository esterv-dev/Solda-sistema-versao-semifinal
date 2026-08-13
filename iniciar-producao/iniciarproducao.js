const selectPrograma = document.getElementById("selectPrograma");
const quantidade = document.getElementById("quantidade");
const tipoMaterial = document.getElementById("tipoMaterial");

const materialSolda = document.getElementById("materialSolda");
const filaDiv = document.getElementById("fila");
const statusProducao = document.getElementById("statusProducao");

const kpiFila = document.getElementById("kpiFila");
const kpiProduzidos = document.getElementById("kpiProduzidos");
const kpiEficiencia = document.getElementById("kpiEficiencia");
const kpiStatus = document.getElementById("kpiStatus");

let fila = [];
let produzidos = 0;
let filaProcessando = false;
let programasDisponiveis = {};

async function carregarProgramas() {
  selectPrograma.innerHTML = `
    <option value="">
      Carregando programas...
    </option>
  `;

  selectPrograma.disabled = true;

  if (
    !window
      .listarProgramasFirebase
  ) {
    selectPrograma.innerHTML = `
      <option value="">
        Firebase indisponível
      </option>
    `;

    statusProducao.innerText =
      "O Firebase dos programas não foi carregado.";

    return;
  }

  try {
    programasDisponiveis =
      await window
        .listarProgramasFirebase();

    const programas =
      Object.entries(
        programasDisponiveis
      );

    selectPrograma.innerHTML = `
      <option value="">
        Selecione um programa
      </option>
    `;

    if (programas.length === 0) {
      selectPrograma.innerHTML = `
        <option value="">
          Nenhum programa salvo
        </option>
      `;

      statusProducao.innerText =
        "Crie um programa antes de iniciar uma produção.";

      return;
    }

    programas
      .sort(
        (
          [, programaA],
          [, programaB]
        ) => {
          return (
            programaA.nome || ""
          ).localeCompare(
            programaB.nome || "",
            "pt-BR"
          );
        }
      )
      .forEach(
        ([chave, programa]) => {
          const pontos =
            Array.isArray(
              programa.pontos
            )
              ? programa.pontos
              : Object.values(
                  programa.pontos ||
                    {}
                );

          if (
            Number(
              programa.versaoFormato
            ) !== 3 ||
            pontos.length === 0
          ) {
            return;
          }

          const option =
            document.createElement(
              "option"
            );

          option.value =
            chave;

          option.textContent =
            `${programa.nome || chave} — ${pontos.length} pontos`;

          selectPrograma.appendChild(
            option
          );
        }
      );

    if (
      selectPrograma.options.length ===
      1
    ) {
      selectPrograma.innerHTML = `
        <option value="">
          Nenhum programa válido
        </option>
      `;

      statusProducao.innerText =
        "Nenhum programa possui coordenadas válidas.";

      return;
    }

    selectPrograma.disabled =
      false;
  } catch (erro) {
    console.error(
      "Erro ao carregar programas:",
      erro
    );

    selectPrograma.innerHTML = `
      <option value="">
        Erro ao carregar
      </option>
    `;

    statusProducao.innerText =
      "Não foi possível carregar os programas.";
  }
}

function adicionarFila() {
  if (filaProcessando) {
    alert(
      "A produção já está sendo iniciada."
    );

    return;
  }

  const chavePrograma =
    selectPrograma.value;

  const qtd =
    Number(
      quantidade.value
    );

  if (!chavePrograma) {
    alert(
      "Selecione um programa."
    );

    return;
  }

  if (
    !Number.isInteger(qtd) ||
    qtd < 1
  ) {
    alert(
      "Informe uma quantidade inteira maior que zero."
    );

    quantidade.focus();

    return;
  }

  const programa =
    programasDisponiveis[
      chavePrograma
    ];

  if (!programa) {
    alert(
      "O programa selecionado não foi encontrado."
    );

    return;
  }

  const pontos =
    Array.isArray(
      programa.pontos
    )
      ? programa.pontos
      : Object.values(
          programa.pontos || {}
        );

const tipoMaterialSelecionado =
  tipoMaterial.value;

const materialSoldaSelecionado =
  materialSolda.value;

const itemExistente =
  fila.find(
    (item) =>
      item.programa ===
        chavePrograma &&
      item.tipoMaterial ===
        tipoMaterialSelecionado &&
      item.materialSolda ===
        materialSoldaSelecionado
  );

  if (itemExistente) {
    itemExistente.quantidade +=
      qtd;
  } else {
    fila.push({
      programa:
        chavePrograma,

      nome:
        programa.nome ||
        chavePrograma,

      quantidade:
        qtd,

      totalPontos:
        pontos.length,
tipoMaterial:
  tipoMaterialSelecionado,

materialSolda:
  materialSoldaSelecionado,
    });
  }

  selectPrograma.value = "";
  quantidade.value = "1";

  atualizarFila();

  statusProducao.innerText =
    `Programa "${programa.nome || chavePrograma}" adicionado à fila.`;
}

function atualizarFila() {
  filaDiv.innerHTML = "";

  const totalExecucoes =
    fila.reduce(
      (total, item) =>
        total +
        Number(
          item.quantidade
        ),
      0
    );

  kpiFila.innerText =
    fila.length;

  kpiProduzidos.innerText =
    produzidos;

  if (fila.length === 0) {
    const mensagem =
      document.createElement("p");

    mensagem.className =
      "vazio";

    mensagem.innerText =
      "Nenhum programa adicionado.";

    filaDiv.appendChild(
      mensagem
    );

    if (!filaProcessando) {
      kpiStatus.innerText =
        "Stand-by";

      kpiEficiencia.innerText =
        "0%";

      statusProducao.innerText =
        "Aguardando início...";
    }

    return;
  }

  fila.forEach(
    (item, index) => {
      const card =
        document.createElement(
          "div"
        );

      card.className =
        "item-fila aguardando";

      const informacoes =
        document.createElement(
          "div"
        );

      informacoes.className =
        "item-info";

      const nome =
        document.createElement(
          "strong"
        );

      nome.innerText =
        `${index + 1}. ${item.nome}`;

      const quantidadeTexto =
        document.createElement(
          "span"
        );

      quantidadeTexto.innerText =
        `Quantidade: ${item.quantidade}`;

      const pontosTexto =
        document.createElement(
          "span"
        );

      pontosTexto.innerText =
        `Pontos por ciclo: ${item.totalPontos}`;

      const materialTexto =
        document.createElement(
          "span"
        );

      materialTexto.innerText =
        `Material: ${item.tipoMaterial}`;

      const soldaTexto =
        document.createElement(
          "span"
        );

      soldaTexto.innerText =
        `Material de solda: ${item.materialSolda}`;

      informacoes.appendChild(
        nome
      );

      informacoes.appendChild(
        quantidadeTexto
      );

      informacoes.appendChild(
        pontosTexto
      );

      informacoes.appendChild(
        materialTexto
      );

      informacoes.appendChild(
        soldaTexto
      );

      const botaoRemover =
        document.createElement(
          "button"
        );

      botaoRemover.type =
        "button";

      botaoRemover.className =
        "btn-remover";

      botaoRemover.innerText =
        "Remover";

      botaoRemover.addEventListener(
        "click",
        () => {
          removerFila(index);
        }
      );

      card.appendChild(
        informacoes
      );

      card.appendChild(
        botaoRemover
      );

      filaDiv.appendChild(
        card
      );
    }
  );

  kpiStatus.innerText =
    "Fila pronta";

  kpiEficiencia.innerText =
    "98%";

  statusProducao.innerText =
    `${fila.length} programa(s) e ${totalExecucoes} execução(ões) na fila.`;
}

function removerFila(index) {
  if (filaProcessando) {
    alert("Não é possível remover enquanto a produção está rodando.");
    return;
  }

  fila.splice(index, 1);
  atualizarFila();
}

function limparFila() {
  if (filaProcessando) {
    alert("A produção está em andamento.");
    return;
  }

  fila = [];
  produzidos = 0;

  statusProducao.innerText = "Aguardando início...";
  kpiStatus.innerText = "Stand-by";

  atualizarFila();
}

async function iniciarProducao() {
  
  
  /*
==========================
VERIFICAR PRODUÇÃO PENDENTE
==========================
*/

if (
  window.buscarProducaoAtualFirebase
) {

  try {

    const producaoAtual =
      await window
        .buscarProducaoAtualFirebase();


    if (
      producaoAtual &&
      (
        producaoAtual.status ===
          "PAUSADO"
        ||
        producaoAtual.status ===
          "EXECUTANDO"
      )
    ) {

      alert(
        `Existe uma produção pendente.\n\n` +
        `Programa: ${
          producaoAtual.programa || "--"
        }\n` +
        `Concluídas: ${
          producaoAtual.quantidadeConcluida || 0
        } / ${
          producaoAtual.quantidadeTotal || 0
        }\n\n` +
        `Continue essa produção antes de iniciar outra.`
      );


      window.location.href =
        "../new-program/novoprograma.html";

      return;
    }

  } catch (erro) {

    console.error(
      "Erro ao verificar produção pendente:",
      erro
    );

    alert(
      "Não foi possível verificar se existe uma produção pendente."
    );

    return;
  }
}
  
  
  if (fila.length === 0) {
    alert("Adicione programas à fila.");
    return;
  }

  localStorage.removeItem("historicoJaSalvo");

  localStorage.setItem("filaProducao", JSON.stringify(fila));

  statusProducao.innerText = "Enviando fila para a máquina 3D...";
  kpiStatus.innerText = "Transferindo";

  setTimeout(() => {
    window.location.href = "../new-program/novoprograma.html";
  }, 800);
}
async function carregarProducaoDia() {
  if (!window.buscarProducaoDiaFirebase) {
    return;
  }

  const producaoDia = await window.buscarProducaoDiaFirebase();

  produzidos = producaoDia.totalPecas || 0;

  kpiProduzidos.innerText = produzidos;
}

document
  .getElementById("btnAdicionar")
  .addEventListener("click", adicionarFila);
document.getElementById("btnLimpar").addEventListener("click", limparFila);
document
  .getElementById("btnIniciar")
  .addEventListener("click", iniciarProducao);

document.getElementById("btnVoltar").addEventListener("click", () => {
  window.location.href = "../solda-system/index.html";
});

window.addEventListener("DOMContentLoaded", async () => {
  await carregarProgramas();
  await carregarProducaoDia();
  atualizarFila();
});
