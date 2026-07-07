
const btnMapaAnterior = document.getElementById("btnMapaAnterior");
const btnMapaProximo = document.getElementById("btnMapaProximo");
const nomeMapaPrograma = document.getElementById("nomeMapaPrograma");

let indiceMapaAtual = 0;
let historicoGlobal = [];


const totalProduzido = document.getElementById("totalProduzido");
const totalProgramas = document.getElementById("totalProgramas");
const eficienciaMedia = document.getElementById("eficienciaMedia");

const tempoTotal = document.getElementById("tempoTotal");
const consumoArame = document.getElementById("consumoArame");

const programaAtual = document.getElementById("programaAtual");
const pecasAtual = document.getElementById("pecasAtual");
const tempoAtual = document.getElementById("tempoAtual");
const percentualAtual = document.getElementById("percentualAtual");

const listaFila = document.getElementById("listaFila");
const historicoRecente = document.getElementById("historicoRecente");
const tempoProgramas = document.getElementById("tempoProgramas");

const graficoProgresso = document.getElementById("graficoProgresso");
const graficoPizza = document.getElementById("graficoPizza");
const graficoBarras = document.getElementById("graficoBarras");
const graficoLinha = document.getElementById("graficoLinha");
const graficoPontos = document.getElementById("graficoPontos");

document.getElementById("btnVoltar").addEventListener("click", () => {
  window.location.href = "../solda-system/index.html";
});

function carregarHistorico() {
  return JSON.parse(localStorage.getItem("historicoProducao")) || [];
}

function carregarFila() {
  return JSON.parse(localStorage.getItem("filaProducao")) || [];
}

function atualizarDataHora() {
  const agora = new Date();

  document.getElementById("dataAtual").innerText =
    agora.toLocaleDateString("pt-BR");

  document.getElementById("horaAtual").innerText =
    agora.toLocaleTimeString("pt-BR");
}

function converterTempoParaSegundos(tempo) {
  if (!tempo || !tempo.includes(":")) return 0;

  const partes = tempo.split(":").map(Number);

  return partes[0] * 60 + partes[1];
}

function formatarTempo(segundosTotais) {
  const minutos = Math.floor(segundosTotais / 60);
  const segundos = segundosTotais % 60;

  return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}

function agruparPorPrograma(historico) {
  const dados = {};

  historico.forEach((item) => {
    if (!dados[item.programa]) {
      dados[item.programa] = 0;
    }

    dados[item.programa] += Number(item.quantidade) || 0;
  });

  return dados;
}

function atualizarKpis(historico) {
  let total = 0;
  let somaEficiencia = 0;
  let segundos = 0;

  historico.forEach((item) => {
    total += Number(item.quantidade) || 0;
    somaEficiencia += Number(item.eficiencia) || 98;
    segundos += converterTempoParaSegundos(item.tempo);
  });

  totalProduzido.innerText = total;
  totalProgramas.innerText = historico.length;
  tempoTotal.innerText = formatarTempo(segundos);

  eficienciaMedia.innerText =
    historico.length > 0
      ? Math.round(somaEficiencia / historico.length) + "%"
      : "0%";

  consumoArame.innerText = (total * 0.019).toFixed(2) + " kg";

}
function atualizarProducaoAtual(fila, historico) {
  if (fila.length > 0) {
    const atual = fila[0];

    programaAtual.innerText = atual.programa;
    pecasAtual.innerText = `0 / ${atual.quantidade}`;
    tempoAtual.innerText = "Em fila";
    percentualAtual.innerText = "0%";

    desenharProgressoCircular(graficoProgresso, 0);
    return;
  }

  if (historico.length > 0) {
    const ultimo = historico[historico.length - 1];

    programaAtual.innerText = ultimo.programa;
    pecasAtual.innerText = `${ultimo.quantidade} / ${ultimo.quantidade}`;
    tempoAtual.innerText = ultimo.tempo || "--";
    percentualAtual.innerText = "100%";

    desenharProgressoCircular(graficoProgresso, 100);
    return;
  }

  programaAtual.innerText = "--";
  pecasAtual.innerText = "0 / 0";
  tempoAtual.innerText = "--";
  percentualAtual.innerText = "0%";

  desenharProgressoCircular(graficoProgresso, 0);
}

function atualizarFila(fila, historico) {
  listaFila.innerHTML = "";

  if (fila.length > 0) {
    fila.forEach((item, index) => {
      const percentual = index === 0 ? 0 : 0;

      listaFila.innerHTML += `
        <div class="item-fila">
          <strong>${item.programa}</strong>
          <span>${item.quantidade} peças aguardando</span>
          <div class="barra-mini">
            <div style="width:${percentual}%"></div>
          </div>
        </div>
      `;
    });

    return;
  }

  if (historico.length > 0) {
    listaFila.innerHTML = `
      <p style="color:#94a3b8;">
        Nenhuma fila ativa.
      </p>
      <div class="item-fila">
        <strong>Última produção</strong>
        <span>${historico[historico.length - 1].programa}</span>
        <div class="barra-mini">
          <div style="width:100%"></div>
        </div>
      </div>
    `;

    return;
  }

  listaFila.innerHTML = `<p style="color:#94a3b8;">Nenhuma fila ativa.</p>`;
}

function atualizarHistorico(historico) {
  historicoRecente.innerHTML = "";

  if (historico.length === 0) {
    historicoRecente.innerHTML = `<p style="color:#94a3b8;">Nenhum histórico registrado.</p>`;
    return;
  }

  historico
    .slice()
    .reverse()
    .slice(0, 6)
    .forEach((item) => {
      historicoRecente.innerHTML += `
        <div class="evento">
          <span>${item.hora || "--"}</span>
          <p>Peça concluída - ${item.programa} (${item.quantidade})</p>
        </div>
      `;
    });
}

function atualizarTempoProgramas(historico) {
  tempoProgramas.innerHTML = "";

  const agrupado = {};

  historico.forEach((item) => {
    if (!agrupado[item.programa]) {
      agrupado[item.programa] = 0;
    }

    agrupado[item.programa] += converterTempoParaSegundos(item.tempo);
  });

  const nomes = Object.keys(agrupado);

  if (nomes.length === 0) {
    tempoProgramas.innerHTML = `<p style="color:#94a3b8;">Sem dados de tempo.</p>`;
    return;
  }

  const maior = Math.max(...Object.values(agrupado));

  nomes.forEach((nome) => {
    const valor = agrupado[nome];
    const porcentagem = (valor / maior) * 100;

    tempoProgramas.innerHTML += `
      <div class="tempo-item">
        <span>${nome.substring(0, 12)}</span>

        <div class="tempo-barra">
          <div style="width:${porcentagem}%"></div>
        </div>

        <strong>${formatarTempo(valor)}</strong>
      </div>
    `;
  });
}

function ajustarCanvas(canvas) {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  return canvas.getContext("2d");
}

function desenharProgressoCircular(canvas, valor) {
  const ctx = ajustarCanvas(canvas);
  const centroX = canvas.width / 2;
  const centroY = canvas.height / 2;
  const raio = Math.min(canvas.width, canvas.height) / 2 - 18;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.lineWidth = 15;
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.arc(centroX, centroY, raio, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "#0ea5e9";
  ctx.beginPath();
  ctx.arc(
    centroX,
    centroY,
    raio,
    -Math.PI / 2,
    -Math.PI / 2 + (Math.PI * 2 * valor) / 100
  );
  ctx.stroke();
}

function desenharPizza(canvas, dados) {
  const ctx = ajustarCanvas(canvas);
  const nomes = Object.keys(dados);
  const valores = Object.values(dados);
  const total = valores.reduce((a, b) => a + b, 0);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (total === 0) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "16px Segoe UI";
    ctx.fillText("Sem dados", 30, 50);
    return;
  }

  const cores = ["#0ea5e9", "#00e5ff", "#14b8a6", "#1d4ed8", "#22c55e"];
  let inicio = -Math.PI / 2;

  nomes.forEach((nome, i) => {
    const fatia = (valores[i] / total) * Math.PI * 2;

    ctx.fillStyle = cores[i % cores.length];
    ctx.beginPath();
    ctx.moveTo(110, 125);
    ctx.arc(110, 125, 78, inicio, inicio + fatia);
    ctx.closePath();
    ctx.fill();

    inicio += fatia;

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "14px Segoe UI";
    ctx.fillText(`${nome} - ${valores[i]}`, 220, 70 + i * 28);
  });

  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(110, 125, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
}

function desenharBarras(canvas, dados) {
  const ctx = ajustarCanvas(canvas);
  const nomes = Object.keys(dados);
  const valores = Object.values(dados);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (nomes.length === 0) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "16px Segoe UI";
    ctx.fillText("Sem dados", 30, 50);
    return;
  }

  const maior = Math.max(...valores);
  const largura = canvas.width / nomes.length - 24;

  nomes.forEach((nome, i) => {
    const altura = (valores[i] / maior) * (canvas.height - 75);
    const x = 18 + i * (largura + 24);
    const y = canvas.height - altura - 38;

    const grad = ctx.createLinearGradient(0, y, 0, canvas.height);
    grad.addColorStop(0, "#00e5ff");
    grad.addColorStop(1, "#1d4ed8");

    ctx.fillStyle = grad;
    ctx.fillRect(x, y, largura, altura);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px Segoe UI";
    ctx.fillText(valores[i], x + largura / 2 - 8, y - 8);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px Segoe UI";
    ctx.fillText(nome.substring(0, 10), x, canvas.height - 14);
  });
}

function desenharLinha(canvas, historico) {
  const ctx = ajustarCanvas(canvas);
  const pontos = historico.map((item) => Number(item.eficiencia) || 98);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (pontos.length === 0) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "16px Segoe UI";
    ctx.fillText("Sem dados", 30, 50);
    return;
  }

  ctx.strokeStyle = "rgba(255,255,255,0.09)";
  ctx.lineWidth = 1;

  for (let i = 1; i <= 4; i++) {
    const y = (canvas.height / 5) * i;
    ctx.beginPath();
    ctx.moveTo(25, y);
    ctx.lineTo(canvas.width - 25, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "#22c55e";
  ctx.lineWidth = 4;
  ctx.beginPath();

  pontos.forEach((valor, i) => {
    const x = 30 + i * ((canvas.width - 60) / Math.max(pontos.length - 1, 1));
    const y = canvas.height - 30 - (valor / 100) * (canvas.height - 60);

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();

  pontos.forEach((valor, i) => {
    const x = 30 + i * ((canvas.width - 60) / Math.max(pontos.length - 1, 1));
    const y = canvas.height - 30 - (valor / 100) * (canvas.height - 60);

    ctx.fillStyle = "#00e5ff";
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  });
}
function desenharMapaPontos(canvas, historico, indice) {
  const ctx = ajustarCanvas(canvas);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(0,229,255,0.14)";
  ctx.lineWidth = 1;

  for (let x = 30; x < canvas.width; x += 35) {
    ctx.beginPath();
    ctx.moveTo(x, 20);
    ctx.lineTo(x - 80, canvas.height - 30);
    ctx.stroke();
  }

  for (let y = 30; y < canvas.height; y += 35) {
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(canvas.width - 20, y);
    ctx.stroke();
  }

  if (historico.length === 0) {
    nomeMapaPrograma.innerText = "Programa: --";
    ctx.fillStyle = "#94a3b8";
    ctx.font = "16px Segoe UI";
    ctx.fillText("Sem pontos registrados", 30, 50);
    return;
  }

  const item = historico[indice];
  const pontos = item.pontos || [];

  nomeMapaPrograma.innerText = `Programa: ${item.programa}`;

  if (pontos.length === 0) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "16px Segoe UI";
    ctx.fillText("Programa sem pontos salvos", 30, 50);
    return;
  }

  const margemX = 45;
  const larguraUtil = canvas.width - margemX * 2;
  const alturaUtil = canvas.height - 90;

  const zValores = pontos.map((ponto) => Number(ponto.z) || 0);
  const zMin = Math.min(...zValores);
  const zMax = Math.max(...zValores);

  function calcularX(index) {
    if (pontos.length === 1) {
      return canvas.width / 2;
    }

    return margemX + index * (larguraUtil / (pontos.length - 1));
  }

  function calcularY(z) {
    if (zMax === zMin) {
      return canvas.height / 2;
    }

    return canvas.height - 50 - ((z - zMin) / (zMax - zMin)) * alturaUtil;
  }

  ctx.strokeStyle = "#0ea5e9";
  ctx.lineWidth = 3;
  ctx.beginPath();

  pontos.forEach((ponto, indexPonto) => {
    const x = calcularX(indexPonto);
    const y = calcularY(Number(ponto.z));

    if (indexPonto === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();

  pontos.forEach((ponto, indexPonto) => {
    const x = calcularX(indexPonto);
    const y = calcularY(Number(ponto.z));

    ctx.fillStyle = ponto.girarMesa ? "#00e5ff" : "#cbd5e1";
    ctx.beginPath();
    ctx.arc(x, y, ponto.girarMesa ? 8 : 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "13px Segoe UI";
    ctx.fillText("P" + (indexPonto + 1), x - 8, y - 14);
  });

  ctx.fillStyle = "#94a3b8";
  ctx.font = "12px Segoe UI";
  ctx.fillText(
    "Azul = mesa girando | Cinza = mesa parada",
    25,
    canvas.height - 12
  );
}
function iniciarPainel() {
  const historico = carregarHistorico();
  const fila = carregarFila();
  const producaoPorPrograma = agruparPorPrograma(historico);

  atualizarDataHora();
  atualizarKpis(historico);
atualizarProducaoAtual(fila, historico);
atualizarFila(fila, historico);
  atualizarHistorico(historico);
  atualizarTempoProgramas(historico);

  desenharPizza(graficoPizza, producaoPorPrograma);
  desenharBarras(graficoBarras, producaoPorPrograma);
  desenharLinha(graficoLinha, historico);
  historicoGlobal = historico;

if (historicoGlobal.length > 0) {
  indiceMapaAtual = historicoGlobal.length - 1;
}

desenharMapaPontos(graficoPontos, historicoGlobal, indiceMapaAtual);
}

iniciarPainel();
btnMapaAnterior.addEventListener("click", () => {
  if (historicoGlobal.length === 0) return;

  indiceMapaAtual--;

  if (indiceMapaAtual < 0) {
    indiceMapaAtual = historicoGlobal.length - 1;
  }

  desenharMapaPontos(graficoPontos, historicoGlobal, indiceMapaAtual);
});

btnMapaProximo.addEventListener("click", () => {
  if (historicoGlobal.length === 0) return;

  indiceMapaAtual++;

  if (indiceMapaAtual >= historicoGlobal.length) {
    indiceMapaAtual = 0;
  }

  desenharMapaPontos(graficoPontos, historicoGlobal, indiceMapaAtual);
});
setInterval(atualizarDataHora, 1000);
window.addEventListener("resize", iniciarPainel);