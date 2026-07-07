const selectPrograma = document.getElementById("selectPrograma");
const quantidade = document.getElementById("quantidade");
const filaDiv = document.getElementById("fila");
const statusProducao = document.getElementById("statusProducao");

const kpiFila = document.getElementById("kpiFila");
const kpiProduzidos = document.getElementById("kpiProduzidos");
const kpiEficiencia = document.getElementById("kpiEficiencia");
const kpiStatus = document.getElementById("kpiStatus");

let fila = [];
let produzidos = 0;
let filaProcessando = false;

async function carregarProgramas() {
  selectPrograma.innerHTML = `
    <option value="">Selecione um programa</option>
  `;

  if (!window.listarProgramasFirebase) {
    alert("Firebase dos programas não carregou.");
    return;
  }

  const programas =
    await window.listarProgramasFirebase();

  Object.entries(programas).forEach(([chave, dados]) => {
    const option = document.createElement("option");

    option.value = chave;
    option.textContent = dados.nome || chave;

    selectPrograma.appendChild(option);
  });
}

function adicionarFila() {
  const programa = selectPrograma.value;
  const qtd = Number(quantidade.value);

  if (!programa) {
    alert("Selecione um programa.");
    return;
  }

  if (qtd <= 0) {
    alert("Informe uma quantidade válida.");
    return;
  }

  fila.push({
    programa: programa,
    quantidade: qtd
  });

  atualizarFila();
}

function atualizarFila() {
  filaDiv.innerHTML = "";

  kpiFila.innerText = fila.length;
  kpiProduzidos.innerText = produzidos;

  if (fila.length === 0) {
    filaDiv.innerHTML = `
      <p class="vazio">Nenhum programa adicionado.</p>
    `;

    if (!filaProcessando) {
      kpiStatus.innerText = "Stand-by";
      kpiEficiencia.innerText = "0%";
    }

    return;
  }

  fila.forEach((item, index) => {
    const card = document.createElement("div");

    card.className = "item-fila aguardando";

    card.innerHTML = `
      <div class="item-info">
        <strong>${item.programa}</strong>
        <span>Quantidade: ${item.quantidade}</span>
      </div>

      <button class="btn-remover" onclick="removerFila(${index})">
        Remover
      </button>
    `;

    filaDiv.appendChild(card);
  });

  const eficiencia = Math.min(98, 70 + fila.length * 7);
  kpiEficiencia.innerText = eficiencia + "%";
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

function iniciarProducao() {
  if (fila.length === 0) {
    alert("Adicione programas à fila.");
    return;
  }

  localStorage.removeItem("historicoJaSalvo");

  localStorage.setItem(
    "filaProducao",
    JSON.stringify(fila)
  );

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

  const producaoDia =
    await window.buscarProducaoDiaFirebase();

  produzidos = producaoDia.totalPecas || 0;

  kpiProduzidos.innerText = produzidos;
}

document.getElementById("btnAdicionar").addEventListener("click", adicionarFila);
document.getElementById("btnLimpar").addEventListener("click", limparFila);
document.getElementById("btnIniciar").addEventListener("click", iniciarProducao);

document.getElementById("btnVoltar").addEventListener("click", () => {
  window.location.href = "../solda-system/index.html";
});

window.addEventListener("DOMContentLoaded", async () => {
  await carregarProgramas();
  await carregarProducaoDia();
  atualizarFila();
});