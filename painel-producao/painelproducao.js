
const btnMapaAnterior = document.getElementById("btnMapaAnterior");
const btnMapaProximo = document.getElementById("btnMapaProximo");
const nomeMapaPrograma = document.getElementById("nomeMapaPrograma");

let indiceMapaAtual = 0;
let historicoGlobal = [];

let historicoFiltrado = [];

let periodoSelecionado = "hoje";

let producaoAtualGlobal = null;

const botoesPeriodo =
  document.querySelectorAll(".btn-periodo");


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

async function carregarHistorico() {

  let detalhado = [];
  let diario = [];


  try {

    if (
      window
        .buscarHistoricoProducaoFirebase
    ) {

      detalhado =
        await window
          .buscarHistoricoProducaoFirebase();

          console.log(
  "DETALHADO DIRETO DO FIREBASE:",
  detalhado
);

      if (!Array.isArray(detalhado)) {
        detalhado = [];
      }
    }


    if (
      window
        .buscarHistoricoDiarioFirebase
    ) {

      diario =
        await window
          .buscarHistoricoDiarioFirebase();

      if (!Array.isArray(diario)) {
        diario = [];
      }
    }

  } catch (erro) {

    console.error(
      "Erro ao carregar histórico:",
      erro
    );
  }


  /*
  ==============================
  DIAS COM HISTÓRICO DETALHADO
  ==============================
  */

  const diasDetalhados =
    new Set();


  detalhado.forEach(
    (item) => {

      const data =
        obterDataRegistro(item);


      if (!data) {
        return;
      }


      const chaveDia =
        `${data.getFullYear()}-` +
        `${String(
          data.getMonth() + 1
        ).padStart(2, "0")}-` +
        `${String(
          data.getDate()
        ).padStart(2, "0")}`;


      diasDetalhados.add(
        chaveDia
      );
    }
  );


  /*
  ==============================
  RECUPERA SOMENTE DIAS ANTIGOS
  ==============================

  Se o dia já possui histórico
  detalhado, NÃO usamos o resumo
  diário daquele dia.

  Isso evita duplicação e permite
  contar cancelamentos parciais.
  */

  const recuperados =
    diario.filter(
      (item) => {

        const data =
          obterDataRegistro(item);


        if (!data) {
          return false;
        }


        const chaveDia =
          `${data.getFullYear()}-` +
          `${String(
            data.getMonth() + 1
          ).padStart(2, "0")}-` +
          `${String(
            data.getDate()
          ).padStart(2, "0")}`;


        return (
          !diasDetalhados.has(
            chaveDia
          )
        );
      }
    );


  const completo = [
    ...detalhado,
    ...recuperados
  ];


  completo.sort(
    (a, b) => {

      const dataA =
        obterDataRegistro(a);

      const dataB =
        obterDataRegistro(b);


      return (
        (dataA?.getTime() || 0)
        -
        (dataB?.getTime() || 0)
      );
    }
  );


  console.log(
    "Histórico detalhado:",
    detalhado
  );

  console.log(
    "Histórico diário recuperado:",
    recuperados
  );

  console.log(
    "Histórico final do painel:",
    completo
  );


  if (completo.length > 0) {
    return completo;
  }


  return (
    JSON.parse(
      localStorage.getItem(
        "historicoProducao"
      )
    ) || []
  );
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

function obterDataRegistro(item) {

  /*
  Registros novos do Firebase
  possuem timestamp.
  */

  if (item.timestamp) {
    return new Date(Number(item.timestamp));
  }


  /*
  Compatibilidade com registros
  que possuem apenas:
  data: "10/08/2026"
  */

  if (item.data) {

    const partes =
      item.data.split("/");

    if (partes.length === 3) {

      const dia =
        Number(partes[0]);

      const mes =
        Number(partes[1]) - 1;

      const ano =
        Number(partes[2]);

      return new Date(
        ano,
        mes,
        dia
      );
    }
  }


  return null;
}

function filtrarHistoricoPorPeriodo(
  historico,
  periodo
) {

  if (periodo === "todos") {
    return [...historico];
  }

  const agora = new Date();

  const inicioHoje = new Date(
    agora.getFullYear(),
    agora.getMonth(),
    agora.getDate()
  );

  const fimHoje = new Date(
    agora.getFullYear(),
    agora.getMonth(),
    agora.getDate(),
    23,
    59,
    59,
    999
  );

  let dataLimite;

  if (periodo === "hoje") {

    dataLimite = inicioHoje;

  } else {

    const quantidadeDias =
      Number(periodo);

    dataLimite =
      new Date(inicioHoje);

    dataLimite.setDate(
      dataLimite.getDate()
      - (quantidadeDias - 1)
    );
  }

  return historico.filter(
    (item) => {

      const dataRegistro =
        obterDataRegistro(item);

      if (!dataRegistro) {
        return false;
      }

      return (
        dataRegistro >= dataLimite
        &&
        dataRegistro <= fimHoje
      );
    }
  );
}
function producaoFoiCancelada(
  item
) {

  return (
    String(
      item?.status || ""
    ).toUpperCase() ===
    "CANCELADO"
  );
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

function agruparProducaoPorData(
  historico
) {

  const dados = {};


  historico.forEach(
    (item) => {

      const data =
        obterDataRegistro(item);


      if (!data) {
        return;
      }


      const chave =
        data.toLocaleDateString(
          "pt-BR"
        );


      if (!dados[chave]) {

        dados[chave] = {
          data:
            new Date(
              data.getFullYear(),
              data.getMonth(),
              data.getDate()
            ),

          quantidade: 0
        };
      }


      dados[chave].quantidade +=
        Number(item.quantidade) || 0;
    }
  );


  return Object.values(dados)
    .sort(
      (a, b) =>
        a.data - b.data
    );
}

function atualizarKpis(
  historicoProduzido,
  historicoConcluido
) {

  let totalPecas = 0;

  let somaEficiencia = 0;

  let segundos = 0;


  /*
  Todas as peças reais,
  inclusive antes de cancelar.
  */

  historicoProduzido.forEach(
    (item) => {

      totalPecas +=
        Number(
          item.quantidade
        ) || 0;
    }
  );


  /*
  Somente produções realmente
  concluídas.
  */

  historicoConcluido.forEach(
    (item) => {

      somaEficiencia +=
        Number(
          item.eficiencia
        ) || 98;


      segundos +=
        converterTempoParaSegundos(
          item.tempo
        );
    }
  );


  totalProduzido.innerText =
    totalPecas;


  totalProgramas.innerText =
    historicoConcluido.length;


  tempoTotal.innerText =
    formatarTempo(
      segundos
    );


  eficienciaMedia.innerText =
    historicoConcluido.length > 0
      ? Math.round(
          somaEficiencia /
          historicoConcluido.length
        ) + "%"
      : "0%";


  consumoArame.innerText =
    (
      totalPecas *
      0.019
    ).toFixed(2) +
    " kg";
}
function atualizarProducaoAtual(
  producaoAtual,
  fila,
  historico
) {

  /*
  ==========================
  1. PRODUÇÃO REAL/ATUAL
  VINDO DO FIREBASE
  ==========================
  */

  if (producaoAtual) {

    const total =
      Number(
        producaoAtual.quantidadeTotal
      ) || 0;

    const concluidas =
      Number(
        producaoAtual.quantidadeConcluida
      ) || 0;

    const percentual =
      Number(
        producaoAtual.percentual
      ) || 0;


    programaAtual.innerText =
      producaoAtual.programa ||
      "--";


    pecasAtual.innerText =
      `${concluidas} / ${total}`;


    percentualAtual.innerText =
      `${percentual}%`;


    /*
    Status mostrado no campo
    onde antes aparecia o tempo.
    */

    if (
      producaoAtual.status ===
      "PAUSADO"
    ) {

      tempoAtual.innerText =
        "Pausado";

    } else if (
      producaoAtual.status ===
      "EXECUTANDO"
    ) {

      tempoAtual.innerText =
        "Executando";

    } else if (
      producaoAtual.status ===
      "CONCLUIDO_PROGRAMA"
    ) {

      tempoAtual.innerText =
        "Concluído";

    } else {

      tempoAtual.innerText =
        producaoAtual.status ||
        "--";
    }


    desenharProgressoCircular(
      graficoProgresso,
      percentual
    );

    return;
  }


  /*
  ==========================
  2. FALLBACK DA FILA
  ==========================
  */

  if (
    fila.length > 0
  ) {

    const atual =
      fila[0];

    programaAtual.innerText =
      atual.programa;

    pecasAtual.innerText =
      `0 / ${atual.quantidade}`;

    tempoAtual.innerText =
      "Em fila";

    percentualAtual.innerText =
      "0%";

    desenharProgressoCircular(
      graficoProgresso,
      0
    );

    return;
  }


  /*
  ==========================
  3. ÚLTIMA PRODUÇÃO
  CONCLUÍDA
  ==========================
  */

  if (
    historico.length > 0
  ) {

    const ultimo =
      historico[
        historico.length - 1
      ];

    programaAtual.innerText =
      ultimo.programa;

    pecasAtual.innerText =
      `${ultimo.quantidade} / ${ultimo.quantidade}`;

    tempoAtual.innerText =
      ultimo.tempo || "--";

    percentualAtual.innerText =
      "100%";

    desenharProgressoCircular(
      graficoProgresso,
      100
    );

    return;
  }


  /*
  ==========================
  4. SEM PRODUÇÃO
  ==========================
  */

  programaAtual.innerText =
    "--";

  pecasAtual.innerText =
    "0 / 0";

  tempoAtual.innerText =
    "--";

  percentualAtual.innerText =
    "0%";

  desenharProgressoCircular(
    graficoProgresso,
    0
  );
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

function atualizarHistorico(
  historico
) {

  historicoRecente.innerHTML =
    "";


  if (
    historico.length === 0
  ) {

    historicoRecente.innerHTML =
      `<p style="color:#94a3b8;">
        Nenhum histórico registrado.
      </p>`;

    return;
  }


  historico
    .slice()
    .reverse()
    .slice(0, 6)
    .forEach(
      (item) => {

        if (
          producaoFoiCancelada(
            item
          )
        ) {

          const concluida =
            Number(
              item.quantidadeConcluida ??
              item.quantidade
            ) || 0;


          const planejada =
            Number(
              item.quantidadePlanejada
            ) || 0;


          const percentual =
            Number(
              item.percentual
            ) || 0;


          historicoRecente.innerHTML += `
            <div class="evento">

              <span>
                ${item.data || "--"}
                <br>
                ${item.hora || "--"}
              </span>

              <p>
                Produção cancelada -
                ${item.programa || "--"}
                (${concluida}/${planejada}
                peças - ${percentual}%)
              </p>

            </div>
          `;

          return;
        }


        historicoRecente.innerHTML += `
          <div class="evento">

            <span>
              ${item.data || "--"}
              <br>
              ${item.hora || "--"}
            </span>

            <p>
              Produção concluída -
              ${item.programa || "--"}
              (${item.quantidade || 0}
              peças)
            </p>

          </div>
        `;
      }
    );
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

function desenharBarras(
  canvas,
  historico
) {

  const ctx =
    ajustarCanvas(canvas);


  const dados =
    agruparProducaoPorData(
      historico
    );


  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  if (dados.length === 0) {

    ctx.fillStyle =
      "#94a3b8";

    ctx.font =
      "16px Segoe UI";

    ctx.fillText(
      "Sem dados neste período",
      30,
      50
    );

    return;
  }


  const valores =
    dados.map(
      item => item.quantidade
    );


  const maior =
    Math.max(...valores, 1);


  const espacoDisponivel =
    canvas.width - 50;


  const larguraBloco =
    espacoDisponivel /
    dados.length;


  const larguraBarra =
    Math.min(
      55,
      Math.max(
        12,
        larguraBloco * 0.55
      )
    );


  dados.forEach(
    (item, i) => {

      const alturaMaxima =
        canvas.height - 80;


      const altura =
        (
          item.quantidade /
          maior
        ) * alturaMaxima;


      const x =
        25
        + i * larguraBloco
        + (
          larguraBloco
          - larguraBarra
        ) / 2;


      const y =
        canvas.height
        - altura
        - 45;


      const grad =
        ctx.createLinearGradient(
          0,
          y,
          0,
          canvas.height
        );


      grad.addColorStop(
        0,
        "#00e5ff"
      );


      grad.addColorStop(
        1,
        "#1d4ed8"
      );


      ctx.fillStyle =
        grad;


      ctx.fillRect(
        x,
        y,
        larguraBarra,
        altura
      );


      /*
      quantidade
      */

      ctx.fillStyle =
        "#ffffff";

      ctx.font =
        "bold 12px Segoe UI";


      ctx.fillText(
        item.quantidade,
        x,
        y - 7
      );


      /*
      data
      */

      const dataTexto =
        item.data
          .toLocaleDateString(
            "pt-BR",
            {
              day: "2-digit",
              month: "2-digit"
            }
          );


      ctx.fillStyle =
        "#94a3b8";

      ctx.font =
        "11px Segoe UI";


      ctx.fillText(
        dataTexto,
        x - 3,
        canvas.height - 18
      );
    }
  );
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

  const zValores = pontos.map(
    (ponto) => Number(ponto.zMm) || 0
);
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
    const y = calcularY(Number(ponto.zMm));

    if (indexPonto === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();

  pontos.forEach((ponto, indexPonto) => {
    const x = calcularX(indexPonto);
    const y = calcularY(Number(ponto.zMm));

    ctx.fillStyle = ponto.anguloMesaGraus ? "#00e5ff" : "#cbd5e1";
    ctx.beginPath();
    ctx.arc(x, y, ponto.anguloMesaGraus ? 8 : 6, 0, Math.PI * 2);
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

function atualizarPainelPeriodo() {

  historicoFiltrado =
    filtrarHistoricoPorPeriodo(
      historicoGlobal,
      periodoSelecionado
    );


const historicoConcluido =
  historicoFiltrado.filter(
    (item) => {

      const status =
        String(
          item.status || ""
        ).toUpperCase();


      return (
        status === "CONCLUÍDO" ||
        status === "CONCLUIDO"
      );
    }
  );


  const producaoPorPrograma =
    agruparPorPrograma(
      historicoFiltrado
    );


  atualizarKpis(
    historicoFiltrado,
    historicoConcluido
  );


  atualizarHistorico(
    historicoFiltrado
  );


  atualizarTempoProgramas(
    historicoConcluido
  );


  desenharPizza(
    graficoPizza,
    producaoPorPrograma
  );


  desenharBarras(
    graficoBarras,
    historicoFiltrado
  );


  desenharLinha(
    graficoLinha,
    historicoConcluido
  );


  if (
    historicoFiltrado.length > 0
  ) {

    indiceMapaAtual =
      historicoFiltrado.length - 1;

  } else {

    indiceMapaAtual = 0;
  }


  desenharMapaPontos(
    graficoPontos,
    historicoFiltrado,
    indiceMapaAtual
  );
}
async function iniciarPainel() {

  const historico =
    await carregarHistorico();


  const fila =
    carregarFila();

    try {

  if (
    window.buscarProducaoAtualFirebase
  ) {

    producaoAtualGlobal =
      await window.buscarProducaoAtualFirebase();
  }

} catch (erro) {

  console.error(
    "Erro ao buscar produção atual:",
    erro
  );

  producaoAtualGlobal = null;
}


  /*
  Guarda TODO o histórico
  vindo do Firebase.
  */

  historicoGlobal =
    historico;


  atualizarDataHora();


  /*
  Produção Atual e fila
  não dependem do filtro
  dos gráficos.
  */

atualizarProducaoAtual(
  producaoAtualGlobal,
  fila,
  historicoGlobal
);


  atualizarFila(
    fila,
    historicoGlobal
  );


  /*
  Gráficos e KPIs
  usam o período selecionado.
  */

  atualizarPainelPeriodo();
}


async function iniciarPainelComFirebase() {

  let tentativas = 0;

  /*
  Aguarda o firebase-programas.js
  terminar de carregar.
  */

  while (
    (
      !window.buscarHistoricoProducaoFirebase ||
      !window.buscarHistoricoDiarioFirebase ||
      !window.buscarProducaoAtualFirebase
    )
    &&
    tentativas < 50
  ) {

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          100
        )
    );

    tentativas++;
  }


  /*
  Se as funções ainda não existem,
  não usamos dados antigos do
  localStorage como se fossem atuais.
  */

  if (
    !window.buscarHistoricoProducaoFirebase
  ) {

    console.error(
      "Firebase do painel não foi carregado."
    );

    return;
  }


  console.log(
    "Firebase do painel carregado."
  );


  await iniciarPainel();


  /*
  Depois que o painel estiver pronto,
  começa a observação em tempo real.
  */

  await iniciarObservacaoProducaoAtual();
}

async function iniciarObservacaoProducaoAtual() {

  /*
  Aguarda o módulo do Firebase
  ficar disponível.
  */

  let tentativas = 0;


  while (
    !window.observarProducaoAtualFirebase
    &&
    tentativas < 30
  ) {

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          100
        )
    );

    tentativas++;
  }


  if (
    !window.observarProducaoAtualFirebase
  ) {

    console.warn(
      "Observador da produção atual não ficou disponível."
    );

    return;
  }


  try {

    await window.observarProducaoAtualFirebase(
      (producaoAtual) => {

        /*
        Atualiza variável local
        imediatamente.
        */

        producaoAtualGlobal =
          producaoAtual;


        /*
        Recupera fila apenas para
        manter compatibilidade.
        */

        const fila =
          carregarFila();


        /*
        Atualiza somente o cartão
        da produção atual.
        */

        atualizarProducaoAtual(
          producaoAtualGlobal,
          fila,
          historicoGlobal
        );
      }
    );

  } catch (erro) {

    console.error(
      "Erro ao observar produção atual:",
      erro
    );
  }
}




botoesPeriodo.forEach(
  (botao) => {

    botao.addEventListener(
      "click",
      () => {

        periodoSelecionado =
          botao.dataset.periodo;


        botoesPeriodo.forEach(
          (item) =>
            item.classList.remove(
              "ativo"
            )
        );


        botao.classList.add(
          "ativo"
        );


        atualizarPainelPeriodo();
      }
    );
  }
);
btnMapaAnterior.addEventListener("click", () => {
if (historicoFiltrado.length === 0) return;

  indiceMapaAtual--;

  if (indiceMapaAtual < 0) {
   indiceMapaAtual = historicoFiltrado.length - 1;
  }
desenharMapaPontos(
  graficoPontos,
  historicoFiltrado,
  indiceMapaAtual
);
});

btnMapaProximo.addEventListener("click", () => {
  if (historicoFiltrado.length === 0) return;

  indiceMapaAtual++;

  if (
  indiceMapaAtual >=
  historicoFiltrado.length
) {
    indiceMapaAtual = 0;
  }

 desenharMapaPontos(
  graficoPontos,
  historicoFiltrado,
  indiceMapaAtual
);
});
setInterval(atualizarDataHora, 1000);
window.addEventListener(
  "resize",
  () => {

    const producaoPorPrograma =
      agruparPorPrograma(
        historicoFiltrado
      );


    desenharPizza(
      graficoPizza,
      producaoPorPrograma
    );


    desenharBarras(
      graficoBarras,
      historicoFiltrado
    );


    desenharLinha(
      graficoLinha,
      historicoFiltrado
    );


    desenharMapaPontos(
      graficoPontos,
      historicoFiltrado,
      indiceMapaAtual
    );
  }
);

iniciarPainelComFirebase();