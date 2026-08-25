/* =====================================
CENA 3D COM MODELO REAL DO SOLIDWORKS
===================================== */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020617);

/* =====================================
CAMERA
===================================== */

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);
camera.position.set(1500, 800, 1500);
camera.lookAt(0, 1.5, 0);

/* =====================================
RENDER
===================================== */

const renderer = new THREE.WebGLRenderer({
  antialias: true,
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;

document.body.appendChild(renderer.domElement);

/* =====================================
CONTROLES CAMERA
===================================== */

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 2;
controls.maxDistance = 80;
controls.target.set(0, 1.5, 0);

/* =====================================
/* =====================================
LUZES
===================================== */

const ambiente = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambiente);

const luzPrincipal = new THREE.DirectionalLight(0xffffff, 0.9);
luzPrincipal.position.set(12, 20, 10);
luzPrincipal.castShadow = true;
scene.add(luzPrincipal);

const luzSuave = new THREE.HemisphereLight(0xffffff, 0x111827, 0.6);
scene.add(luzSuave);

/* =====================================
PISO DE REFERÊNCIA
===================================== */

const piso = new THREE.Mesh(
  new THREE.PlaneGeometry(80, 80),
  new THREE.MeshStandardMaterial({
    color: 0x111827,
    metalness: 0.15,
    roughness: 0.85,
  })
);

piso.rotation.x = -Math.PI / 2;
piso.receiveShadow = true;
scene.add(piso);

const grid = new THREE.GridHelper(80, 80, 0x334155, 0x1e293b);
grid.position.y = 0.01;
scene.add(grid);

/* =====================================
MODELO REAL EXPORTADO DO SOLIDWORKS
===================================== */

let modeloMaquina = null;
const caminhoModelo = "../assets/models/montagem_victor_final.glb";



const dracoLoader = new THREE.DRACOLoader();
dracoLoader.setDecoderPath(
  "https://www.gstatic.com/draco/versioned/decoders/1.5.6/"
);



const loader = new THREE.GLTFLoader();
loader.setDRACOLoader(dracoLoader);

let suporteMovel = null;
let suporteIndutor = null;
let indutor = null;
let bobina = null;
let mesaReal = null;
let finalizacaoEmAndamento = false;
let rotacaoInicialMesaZ = 0;

const conjuntoMovel = new THREE.Group();
const conjuntoMesa = new THREE.Group();

conjuntoMovel.name = "ConjuntoMovelSolda";
conjuntoMesa.name = "ConjuntoMesaGiratoria";

loader.load(
  caminhoModelo,
  (gltf) => {
    modeloMaquina = gltf.scene;
    console.log("Modelo carregado com sucesso!");

    // 1. Aplica rotação e escala na máquina inteira PRIMEIRO (seu código original)
    modeloMaquina.rotation.x = 0;
    modeloMaquina.rotation.y = Math.PI;
    modeloMaquina.rotation.z = Math.PI / 2 - 0.06;


  
   modeloMaquina.add(conjuntoMovel);
modeloMaquina.add(conjuntoMesa);
/*
=====================================
LOCALIZAÇÃO SEGURA DAS PEÇAS DO GLB
=====================================
*/

function normalizarNome3D(nome = "") {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function encontrarObjetoPorTermos(...termos) {
  const termosNormalizados = termos.map(normalizarNome3D);
  const candidatos = [];

  modeloMaquina.traverse((objeto) => {
    if (!objeto.name) {
      return;
    }

    const nomeNormalizado = normalizarNome3D(objeto.name);

    const corresponde = termosNormalizados.every((termo) =>
      nomeNormalizado.includes(termo)
    );

    if (corresponde) {
      candidatos.push(objeto);
    }
  });

  if (candidatos.length === 0) {
    console.warn(
      `Nenhum objeto encontrado com os termos: ${termos.join(", ")}`
    );

    return null;
  }

  if (candidatos.length > 1) {
    console.warn(
      `Mais de um objeto encontrado com os termos: ${termos.join(", ")}`,
      candidatos.map((objeto) => ({
        nome: objeto.name,
        tipo: objeto.type,
      }))
    );
  }

  return candidatos[0];
}

suporteMovel =
  encontrarObjetoPorTermos("ap", "4001");

suporteIndutor =
  encontrarObjetoPorTermos("suporte", "indutor");

indutor =
  modeloMaquina.getObjectByName("Indutor-1") ||
  encontrarObjetoPorTermos("indutor");

bobina =
  modeloMaquina.getObjectByName("Bobina-1") ||
  encontrarObjetoPorTermos("bobina");

mesaReal = null;

modeloMaquina.traverse((objeto) => {
  if (
    mesaReal ||
    !objeto.isMesh ||
    !objeto.name
  ) {
    return;
  }

  const nomeNormalizado =
    normalizarNome3D(objeto.name);

  if (
    nomeNormalizado.includes(
      "mesagiratoria"
    )
  ) {
    mesaReal = objeto;
  }
});

if (mesaReal) {
  rotacaoInicialMesaZ =
  mesaReal.rotation.z;
  console.log(
    "Mesa giratória correta encontrada:",
    {
      nome: mesaReal.name,
      tipo: mesaReal.type,
      pai:
        mesaReal.parent?.name ||
        "sem pai",
      posicaoLocal: {
        x: mesaReal.position.x,
        y: mesaReal.position.y,
        z: mesaReal.position.z,
      },
    }
  );
} else {
  console.error(
    "A malha da mesa giratória não foi encontrada."
  );
}
function adicionarMarcadorNaMesa() {
  if (!mesaReal) {
    console.warn(
      "Não foi possível adicionar o marcador: mesa não encontrada."
    );

    return;
  }

  const marcadorAntigo =
    mesaReal.getObjectByName(
      "MarcadorRotacaoMesa"
    );

  if (marcadorAntigo) {
    mesaReal.remove(marcadorAntigo);
  }

  // Atualiza todas as posições da máquina.
  modeloMaquina.updateMatrixWorld(true);

  // Calcula a posição da mesa no mundo.
  const caixaMesa =
    new THREE.Box3().setFromObject(
      mesaReal
    );

  const tamanhoMesa =
    new THREE.Vector3();

  const centroMesa =
    new THREE.Vector3();

  caixaMesa.getSize(tamanhoMesa);
  caixaMesa.getCenter(centroMesa);

  const tamanhoCubo =
    Math.max(
      0.15,
      Math.min(
        tamanhoMesa.x,
        tamanhoMesa.z
      ) * 0.15
    );

  const cuboRosa =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        tamanhoCubo,
        tamanhoCubo,
        tamanhoCubo
      ),

      new THREE.MeshStandardMaterial({
        color: 0xff1493,
        emissive: 0xff1493,
        emissiveIntensity: 0.5,
        metalness: 0.1,
        roughness: 0.35,
      })
    );

  cuboRosa.name =
    "MarcadorRotacaoMesa";

  // Posição mundial: em cima e fora do centro.
  const posicaoMundo =
    new THREE.Vector3(
      centroMesa.x +
        tamanhoMesa.x * 0.28,

      caixaMesa.max.y +
        tamanhoCubo / 2 +
        0.02,

      centroMesa.z
    );

  // Primeiro coloca na cena.
  scene.add(cuboRosa);

  cuboRosa.position.copy(
    posicaoMundo
  );

  cuboRosa.castShadow = true;
  cuboRosa.receiveShadow = true;

  // Depois torna filho da mesa mantendo
  // a posição mundial correta.
  mesaReal.attach(cuboRosa);

  console.log(
    "Cubo rosa colocado sobre a mesa.",
    {
      posicaoMundo,
      tamanhoCubo,
    }
  );
}

  console.group("Peças selecionadas automaticamente");

console.log(
  "Suporte móvel:",
  suporteMovel?.name || "NÃO ENCONTRADO"
);

console.log(
  "Suporte do indutor:",
  suporteIndutor?.name || "NÃO ENCONTRADO"
);

console.log(
  "Indutor:",
  indutor?.name || "NÃO ENCONTRADO"
);

console.log(
  "Bobina:",
  bobina?.name || "NÃO ENCONTRADO"
);

console.log(
  "Mesa real:",
  mesaReal?.name || "NÃO ENCONTRADO"
);

console.groupEnd();

const pecasEncontradas = {
  suporteMovel,
  suporteIndutor,
  indutor,
  bobina,
  mesaReal,
};

Object.entries(pecasEncontradas).forEach(([nome, objeto]) => {
  if (objeto) {
    console.log(`Peça encontrada: ${nome}`, objeto);
  } else {
    console.error(`Peça não encontrada: ${nome}`);
  }
});

conjuntoMovel.position.set(0, 0, 0);
conjuntoMesa.position.set(0, 0, 0);
if (suporteMovel) {
  conjuntoMovel.attach(suporteMovel);
}

if (suporteIndutor) {
  conjuntoMovel.attach(suporteIndutor);
}

if (indutor) {
  conjuntoMovel.attach(indutor);
}

if (bobina) {
  conjuntoMovel.attach(bobina);
}

// if (mesaReal) {
//   conjuntoMesa.attach(mesaReal);
// }



    const pecasAusentes = Object.entries({
  suporteMovel,
  suporteIndutor,
  indutor,
  bobina,
  mesaReal,
})
  .filter(([, objeto]) => !objeto)
  .map(([nome]) => nome);

if (pecasAusentes.length === 0) {
  console.log(
    "Hierarquia móvel criada com todas as peças."
  );
} else {
  console.warn(
    "Hierarquia criada parcialmente. Peças ausentes:",
    pecasAusentes
  );
}
modeloMaquina.traverse((objeto) => {

  if (!objeto.isMesh) return;



  const nome = objeto.name.toLowerCase();



  let cor = 0x6b7280; // padrão cinza industrial



  if (nome.includes("perfil")) {

    cor = 0x374151; // estrutura

  } else if (nome.includes("chapa_base")) {

    cor = 0x9ca3af; // base da mesa

  } else if (nome.includes("chapa_490")) {

    cor = 0x4b5563; // laterais

  } else if (nome.includes("mesa_girat")) {

    cor = 0xd1d5db; // mesa giratória

  } else if (nome.includes("canaleta")) {

    cor = 0x111827; // canaletas

  } else if (nome.includes("clp") || nome.includes("quadro_el")) {

    cor = 0x1f2937; // elétrica

  } else if (nome.includes("atuador") || nome.includes("bloco_compensador")) {

    cor = 0xcbd5e1; // atuador

  } else if (nome.includes("indutor") || nome.includes("suporte_indutor")) {

    cor = 0xf59e0b; // indutor/cabecote

  } else if (nome.includes("mesh_")) {

    cor = 0x94a3b8; // peças sem nome

  } else if (nome.includes("ap-400")) {

    cor = 0xd1d5db; // componentes do atuador

  } else if (

    nome.includes("manette") ||

    nome.includes("vis_") ||

    nome.includes("clip") ||

    nome.includes("coque")

  ) {

    cor = 0x111827; // detalhes pequenos

  }



  objeto.material = new THREE.MeshStandardMaterial({

    color: cor,

    metalness: 0.35,

    roughness: 0.55,

    side: THREE.DoubleSide

  });



  objeto.castShadow = true;

  objeto.receiveShadow = true;

});



ajustarModeloNaCena(modeloMaquina);
scene.add(modeloMaquina);
adicionarMarcadorNaMesa();
if (MODO_CALIBRACAO) {
  conjuntoMovel.position.x =
    POSICAO_CALIBRACAO_INICIAL_X;

  console.log(
    "Modo calibração iniciado em X:",
    conjuntoMovel.position.x
  );
} else {
  definirPosicaoZMm(
    POSICAO_INICIAL_Z_MM
  );
}
// void iniciarSistema();

void iniciarSistema();

const statusPrograma =
  document.getElementById(
    "statusPrograma"
  );

if (statusPrograma) {
  statusPrograma.innerText =
    "Modelo carregado, todas as peças móveis unidas.";
}
  },
  undefined,
  (erro) => {
    console.error("Erro ao carregar o modelo GLB:", erro);
    document.getElementById("statusPrograma").innerText = "Erro ao carregar o modelo 3D.";
  }
);



function ajustarModeloNaCena(modelo) {
  const box = new THREE.Box3().setFromObject(modelo);
  const tamanho = new THREE.Vector3();
  const centro = new THREE.Vector3();

  box.getSize(tamanho);
  box.getCenter(centro);

  const maiorEixo = Math.max(tamanho.x, tamanho.y, tamanho.z);
const escalaDesejada = 12 / maiorEixo;

  modelo.scale.setScalar(escalaDesejada);

  const boxEscalado = new THREE.Box3().setFromObject(modelo);
  const centroEscalado = new THREE.Vector3();
  boxEscalado.getCenter(centroEscalado);

modelo.position.sub(centroEscalado);

// Descobre onde está a parte mais baixa da máquina.
const boxNoCentro =
  new THREE.Box3().setFromObject(modelo);

// Coloca os pés exatamente sobre o piso.
modelo.position.y +=
  -boxNoCentro.min.y + 0.01;

  const boxFinal = new THREE.Box3().setFromObject(modelo);
  const tamanhoFinal = new THREE.Vector3();
  const centroFinal = new THREE.Vector3();

  boxFinal.getSize(tamanhoFinal);
  boxFinal.getCenter(centroFinal);

  controls.target.set(0, Math.max(1.2, tamanhoFinal.y * 0.45), 0);
  controls.update();

  camera.position.set(
    tamanhoFinal.x * 0.9,
    tamanhoFinal.y * 0.75,
    tamanhoFinal.z * 1.15
  );

  camera.near = 0.01;
  camera.far = 2000;
  camera.updateProjectionMatrix();
}

/* =====================================
REFERÊNCIAS VISUAIS DO PROCESSO
===================================== */

const materialcabecote = new THREE.MeshPhysicalMaterial({
  color: 0xff8800,
  emissive: 0xff6600,
  emissiveIntensity: 0.35,
  metalness: 1,
  roughness: 0.25,
});

const cabecote = new THREE.Group();

const corpocabecote = new THREE.Mesh(
  new THREE.CylinderGeometry(0.08, 0.18, 1.1, 32),
  materialcabecote
);

corpocabecote.rotation.z = Math.PI / 2;
// cabecote.add(corpocabecote);

const ponteiracabecote = new THREE.Mesh(
  new THREE.ConeGeometry(0.16, 0.35, 32),
  materialcabecote
);

ponteiracabecote.rotation.z = -Math.PI / 2;
ponteiracabecote.position.x = -0.7;

const materialArame = new THREE.MeshPhysicalMaterial({
  color: 0xb45309,
  metalness: 1,
  roughness: 0.3,
});

const roloArame = new THREE.Mesh(
  new THREE.CylinderGeometry(0.22, 0.22, 0.08, 32),
  materialArame
);

roloArame.rotation.x = Math.PI / 2;
roloArame.position.set(0.35, 0, -0.2);
// cabecote.add(roloArame);

const fioArame = new THREE.Mesh(
  new THREE.CylinderGeometry(0.015, 0.015, 0.45, 8),
  materialArame
);

fioArame.rotation.z = Math.PI / 2;
fioArame.position.set(-0.85, 0, 0);

const luzSolda = new THREE.PointLight(0x00bbff, 0.3, 2);





/* =====================================
ESTADO LÓGICO DA MÁQUINA
===================================== */
const MODO_CALIBRACAO = false;

// Estes valores só são usados quando o modo de calibração está ativo.
const VELOCIDADE_CALIBRACAO_X = 0.015;
const LIMITE_TESTE_X_MIN = -0.35;
const LIMITE_TESTE_X_MAX = 0.05;
const POSICAO_CALIBRACAO_INICIAL_X = -0.17;

// Escala lógica temporária.
const Z_MIN_MM = 1;
const Z_MAX_MM = 55.9;

// Limites visuais calibrados novamente.
const POSICAO_CENA_MIN_X = -0.12851;
const POSICAO_CENA_MAX_X = 0.01372;

// Velocidades.
const VELOCIDADE_JOG_MM_S = 20;
const VELOCIDADE_PROGRAMA_MM_S = 25;
const VELOCIDADE_MESA_GRAUS_S = 45;
const TOLERANCIA_Z_MM = 0.2;
const VELOCIDADE_MESA_PROGRAMA_GRAUS_S =
  45;

const TOLERANCIA_MESA_GRAUS =
  0.5;


// Posição inicial aproximadamente no meio.
const POSICAO_INICIAL_Z_MM = 30;
const estadoMaquina = {
  posicaoZMm: POSICAO_INICIAL_Z_MM,
};


/*
=====================================
ESTADO DA EXECUÇÃO
=====================================

Separado de estadoMaquina,
que atualmente guarda a posição Z.
*/
const EstadoExecucao = {
  PARADA: "PARADA",
  AGUARDANDO_PECA: "AGUARDANDO_PECA",
  PREPARANDO: "PREPARANDO",
  EXECUTANDO: "EXECUTANDO",
  PAUSADO: "PAUSADO",
  FINALIZADO: "FINALIZADO",
  CANCELADO: "CANCELADO",
  EMERGENCIA: "EMERGENCIA"
};

let estadoExecucao =
  EstadoExecucao.PARADA;


/*
Na simulação esperamos 1 segundo.

Futuramente este tempo será
substituído pela confirmação
MESA_READY vinda do CLP.
*/

const TEMPO_PREPARACAO_MESA_MS =
  1000;

  const TEMPO_CONFIRMACAO_PECA_MS =
  3000;

let aguardandoTrocaPeca =
  false;

const relogioAnimacao = new THREE.Clock();

function limitarPosicaoZ(valorMm) {
  return THREE.MathUtils.clamp(
    valorMm,
    Z_MIN_MM,
    Z_MAX_MM
  );
}

function converterMmParaCenaX(valorMm) {
  const valorLimitado = limitarPosicaoZ(valorMm);

  const proporcao =
    (valorLimitado - Z_MIN_MM) /
    (Z_MAX_MM - Z_MIN_MM);

  return THREE.MathUtils.lerp(
    POSICAO_CENA_MIN_X,
    POSICAO_CENA_MAX_X,
    proporcao
  );
}

function atualizarIndicadorPosicao() {
  const controleAltura =
    document.getElementById("altura");
    
   

  const valorAltura =
    document.getElementById("valorAltura");

  if (controleAltura) {
    controleAltura.value =
      estadoMaquina.posicaoZMm.toFixed(1);
  }

  if (valorAltura) {
    valorAltura.innerText =
      `${estadoMaquina.posicaoZMm.toFixed(1)} mm`;
  }
}

function definirPosicaoZMm(valorMm) {
  const novaPosicao = limitarPosicaoZ(
    Number(valorMm)
  );

  if (!Number.isFinite(novaPosicao)) {
    console.error("Posição Z inválida:", valorMm);
    return;
  }

  estadoMaquina.posicaoZMm = novaPosicao;

  conjuntoMovel.position.x =
    converterMmParaCenaX(novaPosicao);

  atualizarIndicadorPosicao();
}


const controleAltura =
  document.getElementById("altura");

if (controleAltura) {
  controleAltura.disabled =
    MODO_CALIBRACAO;

  controleAltura.min =
    String(Z_MIN_MM);

  controleAltura.max =
    String(Z_MAX_MM);

  controleAltura.step =
    "0.1";

  controleAltura.addEventListener(
    "input",
    () => {
      if (executandoPrograma) {
        controleAltura.value =
          estadoMaquina.posicaoZMm.toFixed(1);

        return;
      }

      definirPosicaoZMm(
        Number(controleAltura.value)
      );
    }
  );

  controleAltura.addEventListener(
    "change",
    () => {
      console.group(
        "Posição selecionada"
      );

      console.log(
        "Altura lógica:",
        `${estadoMaquina.posicaoZMm.toFixed(2)} mm`
      );

      console.log(
        "Posição visual X do grupo:",
        conjuntoMovel.position.x
      );

      console.log(
        "Posição visual Y do grupo:",
        conjuntoMovel.position.y
      );

      console.log(
        "Posição visual Z do grupo:",
        conjuntoMovel.position.z
      );

      console.groupEnd();
    }
  );
}

/* =====================================
PONTOS
===================================== */

let pontos = [];
let executandoPrograma = false;
let indicePontoAtual = 0;
let faiscas = [];
let filaProducao = [];
let indiceFila = 0;
let repeticaoAtual = 0;
let producaoCancelada = false;
let inicioExecucao = Date.now();
let inicioProducao = null;
let fimProducao = null;
let indiceUltimoPontoEnviadoESP32 =
  -1;



function salvarPonto() {
  if (executandoPrograma) {
    alert(
      "Não é possível salvar pontos enquanto um programa está sendo executado."
    );

    return;
  }

  if (!mesaReal) {
    alert(
      "A mesa giratória ainda não foi carregada."
    );

    return;
  }

  /*
  A mesa precisa estar parada para que
  o ângulo salvo seja exato.
  */
  if (girando) {
    alert(
      "Pare a mesa antes de salvar o ponto."
    );

    return;
  }

  const alturaZMm =
    Number(
      estadoMaquina.posicaoZMm.toFixed(2)
    );

  const anguloMesaGraus =
    Number(
      obterAnguloMesaGraus().toFixed(2)
    );

  const ponto = {
    id:
      typeof crypto.randomUUID ===
      "function"
        ? crypto.randomUUID()
        : `ponto-${Date.now()}-${pontos.length + 1}`,

    ordem:
      pontos.length + 1,

    zMm:
      alturaZMm,

    anguloMesaGraus:
      anguloMesaGraus,

    solda: {
      ativar: true,
    },
  };

  pontos.push(ponto);

  atualizarLista();

  const statusPrograma =
    document.getElementById(
      "statusPrograma"
    );

  if (statusPrograma) {
    statusPrograma.innerText =
      `Ponto P${ponto.ordem} salvo: Z ${ponto.zMm.toFixed(2)} mm e mesa ${ponto.anguloMesaGraus.toFixed(2)}°.`;
  }

  console.log(
    "Ponto salvo:",
    ponto
  );

  console.log(
    "Lista completa de pontos:",
    pontos
  );
}

function excluirPonto(idPonto) {
  if (executandoPrograma) {
    alert(
      "Não é possível excluir pontos enquanto um programa está sendo executado."
    );

    return;
  }

  const indicePonto =
    pontos.findIndex(
      (ponto) =>
        ponto.id === idPonto
    );

  if (indicePonto === -1) {
    console.error(
      "Ponto não encontrado:",
      idPonto
    );

    return;
  }

  const pontoEncontrado =
    pontos[indicePonto];

  const confirmarExclusao =
    confirm(
      `Deseja realmente excluir o ponto P${pontoEncontrado.ordem}?`
    );

  if (!confirmarExclusao) {
    return;
  }

  pontos.splice(
    indicePonto,
    1
  );

  // Reorganiza a numeração:
  // P1, P2, P3...
  pontos = pontos.map(
    (ponto, index) => ({
      ...ponto,
      ordem: index + 1,
    })
  );

  atualizarLista();

  const statusPrograma =
    document.getElementById(
      "statusPrograma"
    );

  if (statusPrograma) {
    statusPrograma.innerText =
      `Ponto P${pontoEncontrado.ordem} excluído com sucesso.`;
  }

  console.log(
    "Ponto excluído:",
    pontoEncontrado
  );

  console.log(
    "Pontos restantes:",
    pontos
  );
}


function atualizarLista() {
  const lista =
    document.getElementById("listaPontos");

  lista.innerHTML = "";

  if (pontos.length === 0) {
    const mensagem = document.createElement("p");
    mensagem.innerText =
      "Nenhum ponto salvo.";

    lista.appendChild(mensagem);
    return;
  }

  pontos.forEach((ponto, index) => {
    const card = document.createElement("div");

    card.style.marginTop = "10px";
    card.style.padding = "10px";
    card.style.borderRadius = "10px";
    card.style.background =
      "rgba(255,255,255,0.05)";
    card.style.borderLeft =
      "4px solid #38bdf8";

    const titulo =
      document.createElement("strong");

    titulo.innerText = `P${index + 1}`;

    const posicao =
      document.createElement("p");

    posicao.innerText =
      `Altura Z: ${Number(ponto.zMm).toFixed(2)} mm`;

const posicaoMesa =
  document.createElement("p");

posicaoMesa.innerText =
  `Mesa: ${Number(
    ponto.anguloMesaGraus
  ).toFixed(2)}°`;

  const botaoExcluir =
  document.createElement("button");

botaoExcluir.type =
  "button";

botaoExcluir.innerText =
  "Excluir ponto";

botaoExcluir.style.width =
  "100%";

botaoExcluir.style.marginTop =
  "8px";

botaoExcluir.style.padding =
  "8px";

botaoExcluir.style.border =
  "1px solid #ef4444";

botaoExcluir.style.borderRadius =
  "6px";

botaoExcluir.style.background =
  "rgba(239, 68, 68, 0.15)";

botaoExcluir.style.color =
  "#fca5a5";

botaoExcluir.style.cursor =
  "pointer";

botaoExcluir.style.fontWeight =
  "600";

botaoExcluir.addEventListener(
  "mouseenter",
  () => {
    botaoExcluir.style.background =
      "rgba(239, 68, 68, 0.30)";
  }
);

botaoExcluir.addEventListener(
  "mouseleave",
  () => {
    botaoExcluir.style.background =
      "rgba(239, 68, 68, 0.15)";
  }
);

botaoExcluir.addEventListener(
  "click",
  () => {
    excluirPonto(
      ponto.id
    );
  }
);

    card.appendChild(titulo);
    card.appendChild(posicao);
    card.appendChild(posicaoMesa);
    card.appendChild(botaoExcluir);

    lista.appendChild(card);
  });
}



/* =====================================
MOVIMENTO AUTOMÁTICO
===================================== */

let programaPausado = false;

async function salvarEstadoExecucaoFirebase(
  status
) {

  /*
  =============================
  VALIDAR PRODUÇÃO
  =============================
  */

  if (
    filaProducao.length === 0
  ) {

    console.warn(
      "Não existe fila de produção para salvar."
    );

    return;
  }


  if (
    typeof window
      .salvarProducaoAtualFirebase !==
      "function"
  ) {

    console.warn(
      "Função salvarProducaoAtualFirebase não disponível."
    );

    return;
  }


  /*
  =============================
  ITEM ATUAL DA FILA
  =============================
  */

  const itemAtual =
    filaProducao[
      indiceFila
    ];


  if (!itemAtual) {

    console.warn(
      "Item atual da fila não encontrado."
    );

    return;
  }


  /*
  =============================
  QUANTIDADES
  =============================
  */

  const quantidadeTotal =
    Number(
      itemAtual.quantidade
    ) || 0;


  const quantidadeConcluida =
    Number(
      repeticaoAtual
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


  /*
  =============================
  SALVAR FIREBASE
  =============================
  */

  try {

    await window
      .salvarProducaoAtualFirebase({

        programa:
          itemAtual.programa,

        quantidadeTotal:
          quantidadeTotal,

        quantidadeConcluida:
          quantidadeConcluida,

        repeticaoAtual:
          Math.min(
            quantidadeConcluida + 1,
            quantidadeTotal
          ),

        indiceFila:
          indiceFila,

        totalProgramasFila:
          filaProducao.length,

        fila:
          filaProducao,

        pontoAtual:
          indicePontoAtual + 1,

        totalPontos:
          pontos.length,

        status:
          status,

        percentual:
          percentual,

        inicioTimestamp:
          inicioProducao
      });


    console.log(
      "Estado salvo no Firebase:",
      {
        status:
          status,

        programa:
          itemAtual.programa,

        pontoAtual:
          indicePontoAtual + 1,

        quantidadeConcluida:
          quantidadeConcluida,

        quantidadeTotal:
          quantidadeTotal,

        percentual:
          percentual
      }
    );

  } catch (erro) {

    console.error(
      "Erro ao salvar estado da execução no Firebase:",
      erro
    );
  }
}

async function alternarMovimento() {

  /*
  =============================
  VALIDAR EXECUÇÃO
  =============================
  */

  if (!executandoPrograma) {

    console.warn(
      "Não existe execução ativa."
    );

    return;
  }


  const botao =
    document.getElementById(
      "btnPlayPause"
    );


  const statusPrograma =
    document.getElementById(
      "statusPrograma"
    );


  /*
  =============================
  PAUSAR PRODUÇÃO
  =============================
  */

  if (
    !programaPausado &&
    estadoExecucao ===
      EstadoExecucao.EXECUTANDO
  ) {

    /*
    Primeiro bloqueamos o
    movimento do cabeçote.
    */

    programaPausado =
      true;


    estadoExecucao =
      EstadoExecucao.PAUSADO;


    /*
    Depois paramos a mesa.
    */

    await pararMesaAutomatica();


    /*
    Atualiza interface.
    */

    if (botao) {

      botao.innerText =
        "Continuar execução";
    }


    if (statusPrograma) {

      statusPrograma.innerText =
        "Programa pausado.";
    }


    console.log(
      "Produção pausada.",
      {
        estado:
          estadoExecucao,

        pontoAtual:
          indicePontoAtual + 1,

        mesa:
          "PARADA"
      }
    );


    /*
    Salva no Firebase.

    Essa função será criada
    no próximo passo.
    */

    await salvarEstadoExecucaoFirebase(
      "PAUSADO"
    );


    return;
  }


  /*
  =============================
  CONTINUAR PRODUÇÃO
  =============================
  */

  if (
    programaPausado &&
    estadoExecucao ===
      EstadoExecucao.PAUSADO
  ) {

    /*
    Ainda NÃO liberamos o
    cabeçote.

    Primeiro entramos em
    PREPARANDO.
    */

    estadoExecucao =
      EstadoExecucao.PREPARANDO;


    if (botao) {

      botao.disabled =
        true;

      botao.innerText =
        "Preparando...";
    }


    if (statusPrograma) {

      statusPrograma.innerText =
        "Aguardando mesa estabilizar...";
    }


    /*
    Liga a mesa novamente.
    */

    await iniciarMesaAutomatica();


    /*
    Hoje espera 1 segundo.

    Futuramente:
    MESA_READY do CLP.
    */

    const mesaPronta =
      await aguardarMesaPronta();


    /*
    Se a mesa não estiver pronta,
    NÃO retomamos o cabeçote.
    */

    if (
      !mesaPronta ||
      estadoExecucao !==
        EstadoExecucao.PREPARANDO
    ) {

      await pararMesaAutomatica();


      estadoExecucao =
        EstadoExecucao.PAUSADO;


      programaPausado =
        true;


      if (botao) {

        botao.disabled =
          false;

        botao.innerText =
          "Continuar execução";
      }


      if (statusPrograma) {

        statusPrograma.innerText =
          "Não foi possível continuar a execução.";
      }


      return;
    }


    /*
    =============================
    RETOMAR CABEÇOTE
    =============================

    Só agora liberamos novamente
    o animate().
    */

    programaPausado =
      false;


    estadoExecucao =
      EstadoExecucao.EXECUTANDO;


    if (botao) {

      botao.disabled =
        false;

      botao.innerText =
        "Pausar execução";
    }


    if (statusPrograma) {

      statusPrograma.innerText =
        `Continuando P${
          indicePontoAtual + 1
        }...`;
    }


    atualizarStatusMesa(
      "GIRANDO"
    );


    console.log(
      "Produção retomada.",
      {
        estado:
          estadoExecucao,

        pontoAtual:
          indicePontoAtual + 1,

        mesa:
          "GIRANDO"
      }
    );


    /*
    Atualiza Firebase.
    */

    await salvarEstadoExecucaoFirebase(
      "EXECUTANDO"
    );
  }
}
/* =====================================
GIRAR MESA
===================================== */

let girando = false;

function atualizarStatusMesa(
  texto
) {

  const statusMesa =
    document.getElementById(
      "statusMesa"
    );

  if (statusMesa) {
    statusMesa.innerText =
      texto;
  }
}


function aguardar(
  milissegundos
) {

  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        milissegundos
      )
  );
}


/*
=====================================
CAMADA DE COMUNICAÇÃO DA MÁQUINA
=====================================

Hoje:
simulação 3D.

Futuramente:
MQTT -> ESP32/CLP.

O restante do sistema não precisa
saber qual tecnologia está em uso.
*/

async function solicitarComandoMaquina(
  comando,
  dados = {}
) {

  if (
    typeof window
      .enviarComandoMaquina ===
    "function"
  ) {

    return await window
      .enviarComandoMaquina(
        comando,
        dados
      );
  }


  console.log(
    "[SIMULAÇÃO] comando da máquina:",
    comando,
    dados
  );

  return true;
}


async function iniciarMesaAutomatica() {

  girando = true;

  atualizarStatusMesa(
    "GIRANDO"
  );


  await solicitarComandoMaquina(
    "MESA_START"
  );
}


async function pararMesaAutomatica() {

  girando = false;

  atualizarStatusMesa(
    "PARADA"
  );


  await solicitarComandoMaquina(
    "MESA_STOP"
  );
}


async function aguardarMesaPronta() {

  /*
  =============================
  SIMULAÇÃO ATUAL
  =============================
  */

  await aguardar(
    TEMPO_PREPARACAO_MESA_MS
  );


  /*
  FUTURO:

  return await
    aguardarConfirmacaoCLP(
      "MESA_READY"
    );

  O navegador NÃO deve considerar
  este delay como segurança física.
  */

  return true;
}

function girarMesa() {

  if (executandoPrograma) {
  alert(
    "A mesa está sendo controlada pelo programa em execução."
  );

  return;
}
  girando = !girando;

  const statusMesa =
    document.getElementById(
      "statusMesa"
    );

  if (statusMesa) {
    statusMesa.innerText =
      girando
        ? "GIRANDO"
        : "PARADA";
  }

  console.log(
    girando
      ? "Mesa iniciada."
      : "Mesa parada.",
    {
      rotacaoX: mesaReal?.rotation.x,
      rotacaoY: mesaReal?.rotation.y,
      rotacaoZ: mesaReal?.rotation.z,
    }
  );
}

function normalizarAnguloGraus(
  anguloGraus
) {
  return (
    (anguloGraus % 360) +
    360
  ) % 360;
}

function obterAnguloMesaGraus() {
  if (!mesaReal) {
    return 0;
  }

  const rotacaoRelativaRad =
    mesaReal.rotation.z -
    rotacaoInicialMesaZ;

  const anguloGraus =
    THREE.MathUtils.radToDeg(
      rotacaoRelativaRad
    );

  return normalizarAnguloGraus(
    anguloGraus
  );
}

function diferencaAngularCurta(
  destinoGraus,
  atualGraus
) {
  return (
    (
      destinoGraus -
      atualGraus +
      540
    ) %
      360
  ) - 180;
}

function definirAnguloMesaGraus(
  anguloGraus
) {
  if (!mesaReal) {
    return;
  }

  const anguloNormalizado =
    normalizarAnguloGraus(
      anguloGraus
    );

  mesaReal.rotation.z =
    rotacaoInicialMesaZ +
    THREE.MathUtils.degToRad(
      anguloNormalizado
    );
}

// BARRA
function atualizarBarraProgresso() {
  if (filaProducao.length === 0) return;

  let total = 0;
  let concluido = 0;

  filaProducao.forEach((item, index) => {
  total += Number(item.quantidade) || 0;

    if (index < indiceFila) {
    concluido += Number(item.quantidade) || 0;
    }
  });

  concluido += repeticaoAtual;

const porcentagem =
  total > 0
    ? Math.min(
        (concluido / total) * 100,
        100
      )
    : 0;
  document.getElementById("barraProgresso").style.width = porcentagem + "%";

  document.getElementById("textoProgresso").innerText =
    porcentagem.toFixed(0) + "%";
}
// TEmpo restante 

function atualizarTempoRestante() {

  if (filaProducao.length === 0)
    return;

  const agora = Date.now();

  const tempoDecorrido =
  (agora - inicioExecucao) / 1000;

  let totalExecucoes = 0;

  filaProducao.forEach(item => {

totalExecucoes += Number(item.quantidade) || 0;

  });

const execucoesAnteriores =
  filaProducao
    .slice(0, indiceFila)
    .reduce(
      (total, item) =>
        total +
        Number(item.quantidade),
      0
    );

const executadas =
  execucoesAnteriores +
  repeticaoAtual;

 document.getElementById(
  "tempoRestante"
).innerText =
  "Tempo restante: 00:00";

  if (executadas === 0) {
  document.getElementById("tempoRestante").innerText =
    "Tempo restante: calculando...";
  return;
}

const mediaPorExecucao = tempoDecorrido / executadas;

  const restantes =
  totalExecucoes - executadas;

  const segundosRestantes =
  Math.round(
    mediaPorExecucao * restantes
  );

  const minutos =
  Math.floor(
    segundosRestantes / 60
  );

  const segundos =
  segundosRestantes % 60;

  document.getElementById(
    "tempoRestante"
  ).innerText =
  `Tempo restante: ${
    String(minutos).padStart(2,"0")
  }:${String(segundos).padStart(2,"0")}`;

}
function calcularTempoProducao() {
  if (!inicioProducao) {
    return "00:00";
  }

  fimProducao = Date.now();

  const tempoTotalSegundos =
    Math.max(
      0,
      Math.round(
        (fimProducao -
          inicioProducao) / 1000
      )
    );

  const minutos =
    Math.floor(
      tempoTotalSegundos / 60
    );

  const segundos =
    tempoTotalSegundos % 60;

  return `${
    String(minutos).padStart(2, "0")
  }:${
    String(segundos).padStart(2, "0")
  }`;
}

async function registrarProducaoFinalizada() {
  const tempoFormatado =
    calcularTempoProducao();

  const historico =
    JSON.parse(
      localStorage.getItem(
        "historicoProducao"
      )
    ) || [];

  const agora = new Date();

  for (const item of filaProducao) {
    let programaCompleto = null;

    try {
      if (
        window.carregarProgramaFirebase
      ) {
        programaCompleto =
          await window.carregarProgramaFirebase(
            item.programa
          );
      }
    } catch (erro) {
      console.error(
        "Erro ao carregar programa para o histórico:",
        erro
      );
    }

   const registroHistorico = {
  data:
    agora.toLocaleDateString(
      "pt-BR"
    ),

  hora:
    agora.toLocaleTimeString(
      "pt-BR"
    ),

  programa:
    programaCompleto?.nome ||
    item.programa,

  chavePrograma:
    item.programa,

  quantidade:
    Number(item.quantidade),

  tempo:
    tempoFormatado,

  eficiencia: 98,

  status:
    "Concluído",

  unidade:
    programaCompleto?.unidade ||
    "mm",

  versaoFormato:
    programaCompleto
      ?.versaoFormato || 2,

  pontos:
    programaCompleto?.pontos ||
    []
};


/* mantém o histórico local por enquanto */
historico.push(registroHistorico);


/* salva também no Firebase */
if (
  window.salvarHistoricoProducaoFirebase
) {
  try {
    await window.salvarHistoricoProducaoFirebase(
      registroHistorico
    );
  } catch (erro) {
    console.error(
      "Erro ao salvar histórico no Firebase:",
      erro
    );
  }
}
  }

  localStorage.setItem(
    "historicoProducao",
    JSON.stringify(historico)
  );

  localStorage.setItem(
    "historicoJaSalvo",
    "true"
  );

  if (
    window.salvarProducaoDiaFirebase
  ) {
    await window.salvarProducaoDiaFirebase(
      filaProducao,
      tempoFormatado
    );
  }

  return tempoFormatado;
}

async function finalizarProducao() {
  if (finalizacaoEmAndamento) {
    return;
  }

  finalizacaoEmAndamento = true;
  executandoPrograma = false;
  programaPausado = false;
  girando = false;

  document.getElementById(
    "statusPrograma"
  ).innerText =
    "Produção concluída.";

  document.getElementById(
    "barraProgresso"
  ).style.width = "100%";

  document.getElementById(
    "textoProgresso"
  ).innerText = "100%";

  document.getElementById(
    "programaAtualExecucao"
  ).innerText =
    "Todos os programas executados";

  document.getElementById(
    "execucaoAtual"
  ).innerText =
    "Execução finalizada";

  document.getElementById(
    "tempoRestante"
  ).innerText =
    "Tempo restante: 00:00";

  document.getElementById(
    "statusMesa"
  ).innerText =
    "PARADA";

  try {
   if (
  !localStorage.getItem(
    "historicoJaSalvo"
  )
) {
  await registrarProducaoFinalizada();
}


/*
A produção só é removida do Firebase
depois que o histórico foi salvo
com sucesso.
*/

if (
  window.removerProducaoAtualFirebase
) {

  await window.removerProducaoAtualFirebase();
}


localStorage.removeItem(
  "filaProducao"
);

    console.log(
      "Produção registrada com sucesso."
    );
  } catch (erro) {
    console.error(
      "Erro ao finalizar produção:",
      erro
    );

    document.getElementById(
      "statusPrograma"
    ).innerText =
      "Produção concluída, mas ocorreu um erro ao salvar o histórico.";
  }
}
/* =====================================
ANIMAÇÃO (BUG DO cabecote VOADOR CORRIGIDO 🛠️)
===================================== */
// GERAR FAISCAS (Efeito Visual de Solda)
function criarFaiscas() {
  const origemFaisca =
    indutor ||
    suporteIndutor ||
    suporteMovel;

  if (!origemFaisca) {
    console.warn(
      "Não foi possível localizar a origem das faíscas."
    );

    return;
  }

  const posicaoMundo =
    new THREE.Vector3();

  origemFaisca.getWorldPosition(
    posicaoMundo
  );

  for (let i = 0; i < 30; i++) {
    const faisca = new THREE.Mesh(
      new THREE.SphereGeometry(
        0.04,
        8,
        8
      ),

      new THREE.MeshBasicMaterial({
        color:
          Math.random() > 0.5
            ? 0xff6600
            : 0xffcc00,
      })
    );

    faisca.position.copy(posicaoMundo);

    faisca.userData = {
      vx: (Math.random() - 0.5) * 0.25,
      vy: Math.random() * 0.25,
      vz: (Math.random() - 0.5) * 0.25,
      vida: 30,
    };

    scene.add(faisca);
    faiscas.push(faisca);
  }
}
/* =====================================
CONTROLE MANUAL — MODO ENSINO
===================================== */

const teclasPressionadas = {
  ArrowUp: false,
  ArrowDown: false,
};

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowUp") {
    event.preventDefault();

    if (!executandoPrograma) {
      teclasPressionadas.ArrowUp = true;
    }
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();

    if (!executandoPrograma) {
      teclasPressionadas.ArrowDown = true;
    }
  }

  if (
    (event.key === "g" || event.key === "G") &&
    !executandoPrograma
  ) {
    event.preventDefault();
    salvarPonto();
  }
});

window.addEventListener("keyup", (event) => {
  if (event.key === "ArrowUp") {
    teclasPressionadas.ArrowUp = false;
  }

  if (event.key === "ArrowDown") {
    teclasPressionadas.ArrowDown = false;
  }

  if (
    event.key === "ArrowUp" ||
    event.key === "ArrowDown"
  ) {
    console.group("POSIÇÃO DO CABEÇOTE");

    console.log(
      "Tecla:",
      event.key
    );

    console.log(
      "Posição visual X:",
      conjuntoMovel.position.x
    );

    console.log(
      "Posição visual completa:",
      {
        x: conjuntoMovel.position.x,
        y: conjuntoMovel.position.y,
        z: conjuntoMovel.position.z,
      }
    );

    console.groupEnd();
  }
});

function pararControleManual() {
  teclasPressionadas.ArrowUp = false;
  teclasPressionadas.ArrowDown = false;
}
window.addEventListener(
  "blur",
  pararControleManual
);
document.addEventListener(
  "visibilitychange",
  () => {
    if (document.hidden) {
      pararControleManual();
    }
  }
);
//
async function enviarPontoParaESP32(
  ponto,
  indice
) {

  /*
  =============================
  VERIFICAR CONEXÃO
  =============================
  */

  if (
    typeof window
      .esp32EstaConectada !==
      "function"
    ||
    !window
      .esp32EstaConectada()
  ) {

    console.warn(
      `P${indice + 1} não foi enviado: ESP32 desconectada.`
    );

    return;
  }


  /*
  =============================
  VERIFICAR FUNÇÃO DE ENVIO
  =============================
  */

  if (
    typeof window
      .enviarComandoESP32 !==
      "function"
  ) {

    console.error(
      "A função de envio para a ESP32 não está disponível."
    );

    return;
  }


  /*
  =============================
  POSIÇÃO DO PONTO
  =============================

  O ponto agora controla somente
  a posição Z do cabeçote.

  A mesa é controlada separadamente.
  */

  const zMm =
    Number(
      ponto.zMm
    );


  /*
  =============================
  VALIDAR POSIÇÃO
  =============================
  */

  if (
    !Number.isFinite(
      zMm
    )
  ) {

    console.error(
      `P${indice + 1} possui Z inválido.`,
      ponto
    );

    return;
  }


  /*
  =============================
  LOG
  =============================
  */

  console.log(
    `Enviando P${indice + 1} para a ESP32:`,
    {
      zMm
    }
  );


  /*
  =============================
  ENVIAR CABEÇOTE
  =============================
  */

  await window
    .enviarComandoESP32(
      `Z:${zMm.toFixed(2)}`
    );
}

function animate() {
  requestAnimationFrame(animate);

  const deltaSegundos =
    Math.min(
      relogioAnimacao.getDelta(),
      0.05
    );

  controls.update();


  /* ==========================
  MOVIMENTO MANUAL
  ========================== */

  if (!executandoPrograma) {

    let direcao = 0;


    if (
      teclasPressionadas.ArrowUp
    ) {
      direcao += 1;
    }


    if (
      teclasPressionadas.ArrowDown
    ) {
      direcao -= 1;
    }


    if (direcao !== 0) {

      if (MODO_CALIBRACAO) {

        const deslocamentoVisual =
          direcao *
          VELOCIDADE_CALIBRACAO_X *
          deltaSegundos;


        conjuntoMovel.position.x =
          THREE.MathUtils.clamp(
            conjuntoMovel.position.x +
              deslocamentoVisual,

            LIMITE_TESTE_X_MIN,
            LIMITE_TESTE_X_MAX
          );

      } else {

        const deslocamentoMm =
          direcao *
          VELOCIDADE_JOG_MM_S *
          deltaSegundos;


        definirPosicaoZMm(
          estadoMaquina.posicaoZMm +
            deslocamentoMm
        );
      }
    }
  }


  /* ==========================
  MOVIMENTO CONTÍNUO DA MESA
  ========================== */

  if (
    girando &&
    mesaReal
  ) {

    const velocidadeRadS =
      THREE.MathUtils.degToRad(
        VELOCIDADE_MESA_GRAUS_S
      );


    mesaReal.rotation.z +=
      velocidadeRadS *
      deltaSegundos;
  }


  /* ==========================
  EXECUÇÃO AUTOMÁTICA
  ========================== */

  if (
    executandoPrograma &&
    !programaPausado
  ) {

    const pontoAtual =
      pontos[
        indicePontoAtual
      ];


    /*
    Se não existe mais ponto,
    a peça terminou.
    */

    if (!pontoAtual) {

      void concluirProgramaAtual();

    } else {


      /*
      ==========================
      ENVIO DO PONTO
      ==========================

      O ponto é enviado somente
      uma vez enquanto estivermos
      trabalhando nele.
      */

      if (
        indiceUltimoPontoEnviadoESP32 !==
        indicePontoAtual
      ) {

        indiceUltimoPontoEnviadoESP32 =
          indicePontoAtual;


        void enviarPontoParaESP32(
          pontoAtual,
          indicePontoAtual
        );
      }


      /*
      ==========================
      DESTINO DO CABEÇOTE
      ==========================
      */

      const destinoZ =
        Number(
          pontoAtual.zMm
        );


      /*
      ==========================
      VALIDAÇÃO
      ==========================
      */

      if (
        !Number.isFinite(
          destinoZ
        )
      ) {

        console.error(
          "Ponto com coordenada Z inválida:",
          pontoAtual
        );


        /*
        Se existe erro de ponto,
        interrompemos o movimento
        e colocamos a máquina
        em condição pausada.
        */

        executandoPrograma =
          false;

        programaPausado =
          true;

        estadoExecucao =
          EstadoExecucao.PAUSADO;


        void pararMesaAutomatica();


        const statusPrograma =
          document.getElementById(
            "statusPrograma"
          );


        if (statusPrograma) {

          statusPrograma.innerText =
            `Erro na coordenada de P${
              indicePontoAtual + 1
            }.`;
        }

      } else {


        /*
        ==========================
        MOVIMENTO DO CABEÇOTE
        ==========================
        */

        const diferencaZ =
          destinoZ -
          estadoMaquina.posicaoZMm;


        const chegouZ =
          Math.abs(
            diferencaZ
          ) <=
          TOLERANCIA_Z_MM;


        if (!chegouZ) {

          const deslocamentoMaximo =
            VELOCIDADE_PROGRAMA_MM_S *
            deltaSegundos;


          const deslocamentoZ =
            Math.sign(
              diferencaZ
            ) *
            Math.min(
              Math.abs(
                diferencaZ
              ),
              deslocamentoMaximo
            );


          definirPosicaoZMm(
            estadoMaquina.posicaoZMm +
              deslocamentoZ
          );

        } else {

          definirPosicaoZMm(
            destinoZ
          );
        }


        /*
        ==========================
        ESTADO DA MESA
        ==========================

        Na execução automática
        a mesa NÃO procura mais
        um ângulo salvo em cada
        ponto.

        Enquanto a produção
        estiver executando,
        ela continua girando.
        */

        atualizarStatusMesa(
          "GIRANDO"
        );


        /*
        ==========================
        INFORMAÇÕES DA EXECUÇÃO
        ==========================
        */

        const execucaoAtual =
          document.getElementById(
            "execucaoAtual"
          );


        if (execucaoAtual) {

          execucaoAtual.innerText =
            `P${
              indicePontoAtual + 1
            }/${
              pontos.length
            } | Z: ${
              destinoZ.toFixed(2)
            } mm | Mesa: GIRANDO`;
        }


        /*
        ==========================
        PONTO ALCANÇADO
        ==========================

        Agora o ponto depende
        somente da posição Z.

        A mesa continua girando
        independentemente disso.
        */

        if (chegouZ) {

          definirPosicaoZMm(
            destinoZ
          );


          /*
          Efeito visual de solda.
          */

          if (
            pontoAtual.solda
              ?.ativar
          ) {

            criarFaiscas();
          }


          console.log(
            `P${
              indicePontoAtual + 1
            } alcançado`,
            {
              zMm:
                estadoMaquina
                  .posicaoZMm,

              mesa:
                "GIRANDO"
            }
          );


          /*
          Vai para o próximo
          ponto do programa.
          */

          indicePontoAtual++;


          /*
          ==========================
          FIM DOS PONTOS
          ==========================
          */

          if (
            indicePontoAtual >=
            pontos.length
          ) {

            void concluirProgramaAtual();

          } else {

            const statusPrograma =
              document.getElementById(
                "statusPrograma"
              );


            if (
              statusPrograma
            ) {

              statusPrograma.innerText =
                `Movendo para P${
                  indicePontoAtual + 1
                }...`;
            }
          }
        }
      }
    }
  }


  /* ==========================
  ANIMAÇÃO DAS FAÍSCAS
  ========================== */

  for (
    let i =
      faiscas.length - 1;

    i >= 0;

    i--
  ) {

    const faisca =
      faiscas[i];


    faisca.position.x +=
      faisca.userData.vx;


    faisca.position.y +=
      faisca.userData.vy;


    faisca.position.z +=
      faisca.userData.vz;


    faisca.userData.vida--;


    if (
      faisca.userData.vida <= 0
    ) {

      scene.remove(
        faisca
      );


      faiscas.splice(
        i,
        1
      );
    }
  }


  renderer.render(
    scene,
    camera
  );
}
/* =====================================
SALVAR E CARREGAR PROGRAMA
===================================== */

async function salvarPrograma() {
  if (pontos.length === 0) {
    alert("Nenhum ponto salvo!");
    return;
  }

const nomeDigitado = prompt(
  "Digite o nome do programa:"
);

const nome =
  nomeDigitado?.trim();

if (!nome) {
  alert(
    "Digite um nome válido para o programa."
  );

  return;
}
const programa = {
  nome: nome,

  dataCriacao:
    new Date().toISOString(),

  dataExibicao:
    new Date().toLocaleString(
      "pt-BR"
    ),

  versaoFormato: 3,

  unidade: "mm",

  eixos: {
    alturaZ: "mm",
    mesa: "graus",
  },

  limites: {
    zMinMm: Z_MIN_MM,
    zMaxMm: Z_MAX_MM,
    mesaMinGraus: 0,
    mesaMaxGraus: 360,
  },

  totalPontos:
    pontos.length,

  pontos: pontos.map(
    (ponto, index) => ({
      id: ponto.id,

      ordem:
        index + 1,

      zMm:
        Number(ponto.zMm),

      anguloMesaGraus:
        Number(
          ponto.anguloMesaGraus
        ),

      solda: {
        ativar:
          Boolean(
            ponto.solda?.ativar
          ),
      },
    })
  ),
};

  if (!window.salvarProgramaFirebase) {
    alert("Firebase não carregou.");
    return;
  }

try {
  const chavePrograma =
    await window.salvarProgramaFirebase(
      nome,
      programa
    );

  localStorage.setItem(
    "programaAtual",
    chavePrograma
  );

  const statusPrograma =
    document.getElementById(
      "statusPrograma"
    );

  if (statusPrograma) {
    statusPrograma.innerText =
      `Programa "${nome}" salvo com sucesso!`;
  }
} catch (erro) {
  console.error(
    "Erro ao salvar programa:",
    erro
  );

  alert(
    "Não foi possível salvar o programa."
  );
}
}
async function carregarProgramaFila(
  nomePrograma,
  iniciarAutomaticamente = true
) {
  if (!window.carregarProgramaFirebase) {
    console.error(
      "Função carregarProgramaFirebase não está disponível."
    );

    return;
  }

  try {
    const programa =
      await window.carregarProgramaFirebase(
        nomePrograma
      );

    if (!programa) {
      console.error(
        "Programa da fila não encontrado:",
        nomePrograma
      );

      return;
    }

    const pontosCarregados =
      prepararPontosDoPrograma(programa);

    if (
      pontosCarregados === null ||
      pontosCarregados.length === 0
    ) {
      document.getElementById(
        "statusPrograma"
      ).innerText =
        "Programa inválido ou sem pontos.";

      return;
    }

    pontos = pontosCarregados;

    atualizarLista();

    indicePontoAtual = 0;
    executandoPrograma = false;

    document.getElementById(
      "programaAtualExecucao"
    ).innerText =
      `Programa: ${programa.nome}`;

    if (iniciarAutomaticamente) {
  iniciarExecucaoPrograma();
}
  } catch (erro) {
    console.error(
      "Erro ao carregar programa da fila:",
      erro
    );

    document.getElementById(
      "statusPrograma"
    ).innerText =
      "Erro ao carregar programa da fila.";
  }
}

function prepararPontosDoPrograma(
  programa
) {
  if (
    !programa ||
    !programa.pontos
  ) {
    return [];
  }

  const pontosOriginais =
    Array.isArray(programa.pontos)
      ? [...programa.pontos]
      : Object.values(
          programa.pontos
        );

  if (
    pontosOriginais.length === 0
  ) {
    return [];
  }

  if (
    Number(
      programa.versaoFormato
    ) !== 3
  ) {
    alert(
      `O programa "${programa.nome || "sem nome"}" está em um formato antigo e não possui as coordenadas completas da mesa.`
    );

    return null;
  }

  const pontosOrdenados =
    pontosOriginais.sort(
      (pontoA, pontoB) => {
        return (
          Number(pontoA.ordem) -
          Number(pontoB.ordem)
        );
      }
    );

  const pontosPreparados = [];

  for (
    let index = 0;
    index <
    pontosOrdenados.length;
    index++
  ) {
    const ponto =
      pontosOrdenados[index];

    const zMm =
      Number(ponto.zMm);

    const anguloMesaGraus =
      Number(
        ponto.anguloMesaGraus
      );

    if (!Number.isFinite(zMm)) {
      alert(
        `O ponto P${index + 1} possui uma altura inválida.`
      );

      return null;
    }

    if (
      zMm < Z_MIN_MM ||
      zMm > Z_MAX_MM
    ) {
      alert(
        `O ponto P${index + 1} possui altura fora dos limites: ${zMm} mm.`
      );

      return null;
    }

    if (
      !Number.isFinite(
        anguloMesaGraus
      )
    ) {
      alert(
        `O ponto P${index + 1} não possui um ângulo válido para a mesa.`
      );

      return null;
    }

    pontosPreparados.push({
      id:
        ponto.id ||
        `ponto-carregado-${index + 1}`,

      ordem:
        index + 1,

      zMm:
        Number(
          zMm.toFixed(2)
        ),

      anguloMesaGraus:
        Number(
          normalizarAnguloGraus(
            anguloMesaGraus
          ).toFixed(2)
        ),

      solda: {
        ativar:
          Boolean(
            ponto.solda?.ativar
          ),
      },
    });
  }

  return pontosPreparados;
} 

async function carregarProgramaParaExecucao() {
  const chavePrograma =
    localStorage.getItem(
      "programaAtual"
    );

  if (!chavePrograma) {
    return;
  }

  if (
    !window
      .carregarProgramaFirebase
  ) {
    console.error(
      "Firebase de programas ainda não foi carregado."
    );

    return;
  }

  try {
    const programa =
      await window
        .carregarProgramaFirebase(
          chavePrograma
        );

    if (!programa) {
      alert(
        "O programa selecionado não foi encontrado."
      );

      return;
    }

    const pontosCarregados =
      prepararPontosDoPrograma(
        programa
      );

    if (
      pontosCarregados === null ||
      pontosCarregados.length === 0
    ) {
      return;
    }

    pontos =
      pontosCarregados;

    indicePontoAtual =
      0;

    executandoPrograma =
      false;

    programaPausado =
      false;

    girando =
      false;

    atualizarLista();

    const programaAtual =
      document.getElementById(
        "programaAtualExecucao"
      );

    if (programaAtual) {
      programaAtual.innerText =
        `Programa: ${programa.nome}`;
    }

    const execucaoAtual =
      document.getElementById(
        "execucaoAtual"
      );

    if (execucaoAtual) {
      execucaoAtual.innerText =
        `Preparando P1 de ${pontos.length}`;
    }

    const statusPrograma =
      document.getElementById(
        "statusPrograma"
      );

    if (statusPrograma) {
      statusPrograma.innerText =
        `Programa "${programa.nome}" carregado. Iniciando execução...`;
    }

    // Impede que atualizar a página
    // execute novamente sozinho.
    localStorage.removeItem(
      "modoPrograma"
    );

    iniciarExecucaoPrograma();
  } catch (erro) {
    console.error(
      "Erro ao carregar programa para execução:",
      erro
    );

    const statusPrograma =
      document.getElementById(
        "statusPrograma"
      );

    if (statusPrograma) {
      statusPrograma.innerText =
        "Erro ao carregar o programa.";
    }
  }
}

async function carregarPrograma() {
  const nome =
    localStorage.getItem("programaAtual");

  if (!nome) {
    return;
  }

  if (!window.carregarProgramaFirebase) {
    console.warn(
      "Função carregarProgramaFirebase não encontrada."
    );

    return;
  }

  try {
    const programa =
      await window.carregarProgramaFirebase(
        nome
      );

    if (!programa) {
      return;
    }

    const pontosCarregados =
      prepararPontosDoPrograma(programa);

    if (pontosCarregados === null) {
      return;
    }

    pontos = pontosCarregados;

    executandoPrograma = false;
    programaPausado = false;
    indicePontoAtual = 0;

    atualizarLista();

    const statusPrograma =
      document.getElementById(
        "statusPrograma"
      );

    if (statusPrograma) {
      statusPrograma.innerText =
        `Programa "${programa.nome}" carregado para edição`;
    }
  } catch (erro) {
    console.error(
      "Erro ao carregar programa:",
      erro
    );

    const statusPrograma =
      document.getElementById(
        "statusPrograma"
      );

    if (statusPrograma) {
      statusPrograma.innerText =
        "Erro ao carregar o programa.";
    }
  }
}

async function iniciarExecucaoPrograma(
  usarContagemInicial = true
) {

  /*
  =============================
  VALIDAR PROGRAMA
  =============================
  */

  if (pontos.length === 0) {

    const statusPrograma =
      document.getElementById(
        "statusPrograma"
      );

    if (statusPrograma) {
      statusPrograma.innerText =
        "O programa não possui pontos.";
    }

    return;
  }


  /*
  =============================
  VALIDAR MESA
  =============================
  */

  if (!mesaReal) {

    const statusPrograma =
      document.getElementById(
        "statusPrograma"
      );

    if (statusPrograma) {
      statusPrograma.innerText =
        "A mesa giratória não foi encontrada.";
    }

    return;
  }


  pararControleManual();


  /*
  =============================
  ESTADO PREPARANDO
  =============================
  */

  executandoPrograma = true;

  programaPausado = true;

  estadoExecucao =
    EstadoExecucao.PREPARANDO;

  indicePontoAtual = 0;

  indiceUltimoPontoEnviadoESP32 =
    -1;


  const botaoPausa =
    document.getElementById(
      "btnPlayPause"
    );


  const statusPrograma =
    document.getElementById(
      "statusPrograma"
    );


  const execucaoAtual =
    document.getElementById(
      "execucaoAtual"
    );


  if (botaoPausa) {

    botaoPausa.disabled = true;

    botaoPausa.innerText =
      "Preparando...";
  }


  if (execucaoAtual) {

    execucaoAtual.innerText =
      `Preparando P1 de ${pontos.length}`;
  }


  /*
  =============================
  CONTAGEM 3...2...1
  =============================

  É usada na PRIMEIRA peça.

  Nas próximas peças já existe
  a contagem do botão
  PEÇA POSICIONADA.
  */

  if (usarContagemInicial) {

    const contagemConcluida =
  await executarContagemRegressiva(
    "Iniciando produção",
    true
  );

    if (!contagemConcluida) {
      return;
    }


    if (
      estadoExecucao !==
      EstadoExecucao.PREPARANDO
    ) {
      return;
    }
  }


  /*
  =============================
  INICIAR MESA
  =============================
  */

  if (statusPrograma) {

    statusPrograma.innerText =
      "Iniciando mesa...";
  }


  await iniciarMesaAutomatica();


  /*
  =============================
  AGUARDAR MESA
  =============================
  */

  if (statusPrograma) {

    statusPrograma.innerText =
      "Aguardando mesa estabilizar...";
  }


  const mesaPronta =
    await aguardarMesaPronta();


  if (!mesaPronta) {

    await pararMesaAutomatica();

    executandoPrograma = false;

    programaPausado = true;

    estadoExecucao =
      EstadoExecucao.PARADA;


    if (botaoPausa) {

      botaoPausa.disabled = true;

      botaoPausa.innerText =
        "Pausar execução";
    }


    if (statusPrograma) {

      statusPrograma.innerText =
        "A mesa não ficou pronta para execução.";
    }

    return;
  }


  if (
    estadoExecucao !==
    EstadoExecucao.PREPARANDO
  ) {
    return;
  }


  /*
  =============================
  COMEÇAR EXECUÇÃO
  =============================
  */

  programaPausado = false;

  estadoExecucao =
    EstadoExecucao.EXECUTANDO;


  if (botaoPausa) {

    botaoPausa.disabled = false;

    botaoPausa.innerText =
      "Pausar execução";
  }


  atualizarStatusMesa(
    "GIRANDO"
  );


  if (execucaoAtual) {

    execucaoAtual.innerText =
      `Executando P1 de ${pontos.length}`;
  }


  if (statusPrograma) {

    statusPrograma.innerText =
      "Executando programa...";
  }


  console.log(
    "Máquina liberada para execução.",
    {
      estado: estadoExecucao,
      mesa: "GIRANDO",
      pontoInicial: 1
    }
  );
}

function ocultarElemento(elemento) {
  if (elemento) {
    elemento.style.display = "none";
  }
}

function ocultarControlesProducao() {
  ocultarElemento(
    document.getElementById("altura")
  );

  ocultarElemento(
    document.querySelector(
      'label[for="altura"]'
    )
  );

  

  ocultarElemento(
    document.querySelector(
      'button[onclick="girarMesa()"]'
    )
  );

  ocultarElemento(
    document.querySelector(
      'button[onclick="salvarPonto()"]'
    )
  );

  ocultarElemento(
    document.querySelector(
      'button[onclick="salvarPrograma()"]'
    )
  );

  ocultarElemento(
    document.getElementById(
      "listaPontos"
    )
  );
}
async function iniciarSistema() {
  recuperarBackupProgramas();

  finalizacaoEmAndamento = false;

  let filaSalva =
  localStorage.getItem(
    "filaProducao"
  );


let producaoSalvaFirebase =
  null;


try {

  if (
    window.buscarProducaoAtualFirebase
  ) {

    producaoSalvaFirebase =
      await window
        .buscarProducaoAtualFirebase();
  }

} catch (erro) {

  console.error(
    "Erro ao verificar produção salva no Firebase:",
    erro
  );
}


/*
Se a fila não estiver mais
no navegador, tenta recuperar
a fila salva no Firebase.
*/

if (
  !filaSalva &&
  producaoSalvaFirebase &&
  Array.isArray(
    producaoSalvaFirebase.fila
  ) &&
  producaoSalvaFirebase.fila.length > 0
) {

  filaSalva =
    JSON.stringify(
      producaoSalvaFirebase.fila
    );


  localStorage.setItem(
    "filaProducao",
    filaSalva
  );


  console.log(
    "Fila recuperada do Firebase."
  );
}

  /*
  =============================
  MODO FILA DE PRODUÇÃO
  =============================
  */

  if (filaSalva) {

    inicioExecucao = Date.now();
    inicioProducao = Date.now();

    ocultarControlesProducao();

    try {

      filaProducao =
        JSON.parse(filaSalva);

      if (
        !Array.isArray(
          filaProducao
        )
      ) {
        filaProducao = [];
      }

    } catch (erro) {

      console.error(
        "Fila de produção inválida:",
        erro
      );

      localStorage.removeItem(
        "filaProducao"
      );

      filaProducao = [];
    }


    /*
    =============================
    BUSCAR PRODUÇÃO ATUAL
    =============================
    */

let producaoRecuperada =
  producaoSalvaFirebase;


    /*
    Consideramos produção pendente
    tanto PAUSADO quanto EXECUTANDO.

    Se o navegador fechou enquanto
    estava executando, ao retornar
    sempre volta PAUSADA.
    */

   const existeProducaoPendente =
  producaoRecuperada &&
  (
    producaoRecuperada.status ===
      "PAUSADO"
    ||
    producaoRecuperada.status ===
      "EXECUTANDO"
    ||
    producaoRecuperada.status ===
      "AGUARDANDO_PECA"
  );


    /*
    =============================
    RESTAURAR ESTADO
    =============================
    */

   if (
  existeProducaoPendente
) {

  indiceFila =
    Number(
      producaoRecuperada.indiceFila
    ) || 0;


  repeticaoAtual =
    Number(
      producaoRecuperada
        .quantidadeConcluida
    ) || 0;


  inicioProducao =
    Number(
      producaoRecuperada
        .inicioTimestamp
    ) || Date.now();


  /*
  Se estava esperando troca de peça,
  mantém AGUARDANDO_PECA.

  Se estava EXECUTANDO ou PAUSADO,
  ao reabrir volta PAUSADO.
  */

  const statusRecuperacao =
    producaoRecuperada.status ===
      "AGUARDANDO_PECA"
      ? "AGUARDANDO_PECA"
      : "PAUSADO";


  girando =
    false;


  if (
    statusRecuperacao ===
    "AGUARDANDO_PECA"
  ) {

    executandoPrograma =
      false;

    programaPausado =
      false;

    estadoExecucao =
      EstadoExecucao
        .AGUARDANDO_PECA;

    aguardandoTrocaPeca =
      true;

  } else {

    executandoPrograma =
      true;

    programaPausado =
      true;

    estadoExecucao =
      EstadoExecucao.PAUSADO;

    aguardandoTrocaPeca =
      false;
  }


  atualizarStatusMesa(
    "PARADA"
  );


  /*
  Atualiza o Firebase com o
  estado seguro recuperado.
  */

  if (
    window
      .salvarProducaoAtualFirebase
  ) {

    try {

      await window
        .salvarProducaoAtualFirebase({
          ...producaoRecuperada,

          status:
            statusRecuperacao
        });


      producaoRecuperada.status =
        statusRecuperacao;

    } catch (erro) {

      console.error(
        "Erro ao restaurar estado da produção:",
        erro
      );
    }
  }

} else {

  indiceFila =
    0;

  repeticaoAtual =
    0;

  programaPausado =
    false;

  executandoPrograma =
    false;

  estadoExecucao =
    EstadoExecucao.PARADA;

  aguardandoTrocaPeca =
    false;
}

    /*
    =============================
    CARREGAR FILA
    =============================
    */

    if (
      filaProducao.length > 0
    ) {

      const primeiroItem =
        filaProducao[0];


      /*
      Se não existe produção salva,
      significa que esta fila está
      começando agora.
      */

      if (
  !existeProducaoPendente
) {

        if (
          window.salvarProducaoAtualFirebase
        ) {

          try {

            await window
              .salvarProducaoAtualFirebase({

                programa:
                  primeiroItem.programa,

                quantidadeTotal:
                  Number(
                    primeiroItem.quantidade
                  ),

                quantidadeConcluida:
                  0,

                repeticaoAtual:
                  1,

                indiceFila:
                  0,

                totalProgramasFila:
                  filaProducao.length,

                  fila:
                  filaProducao,

                status:
                  "EXECUTANDO",

                percentual:
                  0,

                inicioTimestamp:
                  inicioProducao
              });

          } catch (erro) {

            console.error(
              "Erro ao criar produção atual no Firebase:",
              erro
            );
          }
        }
      }


      /*
      Recupera exatamente o programa
      da fila onde a produção parou.
      */

      const itemParaCarregar =
        filaProducao[
          indiceFila
        ];


      if (
        itemParaCarregar
      ) {

        /*
        Produção nova:
        carrega e inicia.

        Produção recuperada:
        apenas carrega.
        */

        await carregarProgramaFila(
          itemParaCarregar.programa,
          !existeProducaoPendente
        );


        /*
        =============================
        PRODUÇÃO RECUPERADA
        =============================
        */

       if (
  existeProducaoPendente
) {

  girando =
    false;


  /*
  =============================
  RECUPERAR TIPO DE ESTADO
  =============================
  */

  if (
    producaoRecuperada.status ===
      "AGUARDANDO_PECA"
  ) {

    /*
    A máquina terminou uma peça
    e está esperando o operador
    colocar a próxima.
    */

    executandoPrograma =
      false;

    programaPausado =
      false;

    estadoExecucao =
      EstadoExecucao
        .AGUARDANDO_PECA;

    aguardandoTrocaPeca =
      true;


    atualizarStatusMesa(
      "PARADA"
    );


    mostrarPainelTrocaPeca();

  } else {

    /*
    Se estava PAUSADO ou
    EXECUTANDO antes de fechar,
    volta de forma segura PAUSADA.
    */

    executandoPrograma =
      true;

    programaPausado =
      true;

    estadoExecucao =
      EstadoExecucao.PAUSADO;

    aguardandoTrocaPeca =
      false;


    atualizarStatusMesa(
      "PARADA"
    );
  }

          /*
          Recuperar ponto salvo.
          */

          const pontoSalvo =
            Number(
              producaoRecuperada
                .pontoAtual
            );


          if (
            Number.isFinite(
              pontoSalvo
            )
            &&
            pontos.length > 0
          ) {

            indicePontoAtual =
              THREE.MathUtils.clamp(
                pontoSalvo - 1,
                0,
                pontos.length - 1
              );

          } else {

            indicePontoAtual = 0;
          }


          /*
          Permite reenviar o ponto
          para ESP32 somente depois
          que o operador continuar.
          */

          indiceUltimoPontoEnviadoESP32 =
            -1;


          const botao =
  document.getElementById(
    "btnPlayPause"
  );


if (botao) {

  if (
    estadoExecucao ===
      EstadoExecucao.AGUARDANDO_PECA
  ) {

    botao.disabled =
      true;

    botao.innerText =
      "Pausar execução";

  } else {

    botao.disabled =
      false;

    botao.innerText =
      "Continuar execução";
  }
}


          const statusPrograma =
            document.getElementById(
              "statusPrograma"
            );

if (
  statusPrograma
) {

  if (
    estadoExecucao ===
      EstadoExecucao.AGUARDANDO_PECA
  ) {

    statusPrograma.innerText =
      `Peça ${
        producaoRecuperada
          .quantidadeConcluida || 0
      } de ${
        producaoRecuperada
          .quantidadeTotal || 0
      } concluída. Posicione a próxima peça.`;

  } else {

    statusPrograma.innerText =
      `Produção pausada. ${
        producaoRecuperada
          .quantidadeConcluida || 0
      } / ${
        producaoRecuperada
          .quantidadeTotal || 0
      } peças concluídas.`;
  }
}


          const execucaoAtual =
            document.getElementById(
              "execucaoAtual"
            );

if (
  execucaoAtual
) {

  if (
    estadoExecucao ===
      EstadoExecucao.AGUARDANDO_PECA
  ) {

    execucaoAtual.innerText =
      `${repeticaoAtual}/${
        producaoRecuperada
          .quantidadeTotal || 0
      } peças concluídas | aguardando nova peça`;

  } else {

    execucaoAtual.innerText =
      `${repeticaoAtual}/${
        producaoRecuperada
          .quantidadeTotal || 0
      } peças | P${
        indicePontoAtual + 1
      }/${
        pontos.length
      } aguardando retomada`;
  }
}


          const statusMesa =
            document.getElementById(
              "statusMesa"
            );


          if (
            statusMesa
          ) {

            statusMesa.innerText =
              "PARADA";
          }

          if (
  statusMesa
) {

  statusMesa.innerText =
    "PARADA";
}


/*
Atualiza a barra com o progresso
recuperado do Firebase.
*/

atualizarBarraProgresso();
        }
      }

    } else {

      localStorage.removeItem(
        "filaProducao"
      );
    }


    /*
    Entrou em modo fila.
    Não continua para os modos abaixo.
    */

    return;
  }


  /*
  =============================
  PROGRAMA SELECIONADO
  =============================
  */

  const modoPrograma =
    localStorage.getItem(
      "modoPrograma"
    );


  if (
    modoPrograma === "executar"
  ) {

    await carregarProgramaParaExecucao();
  }
}// <-- fecha iniciarSistema()


function salvarBackupProgramas() {
  const backup = [];

  for (let i = 0; i < localStorage.length; i++) {
    const chave = localStorage.key(i);

    if (
      chave === "programaAtual" ||
      chave === "filaProducao" ||
      chave === "historicoProducao" ||
      chave === "historicoJaSalvo" ||
      chave.startsWith("firebase:")
    ) {
      continue;
    }

    try {
      const dados = JSON.parse(localStorage.getItem(chave));

      if (!dados || !Array.isArray(dados.pontos)) {
        continue;
      }

      backup.push({
        chave: chave,
        dados: dados
      });
    } catch (erro) {
      console.warn("Ignorado no backup:", chave);
    }
  }

  localStorage.setItem(
    "backupProgramas",
    JSON.stringify(backup)
  );
}

function recuperarBackupProgramas() {
  const programasAtuais = [];

  for (let i = 0; i < localStorage.length; i++) {
    const chave = localStorage.key(i);

    try {
      const dados = JSON.parse(localStorage.getItem(chave));

      if (dados && Array.isArray(dados.pontos)) {
        programasAtuais.push(chave);
      }
    } catch (erro) {}
  }

  if (programasAtuais.length > 0) return;

  const backup = JSON.parse(
    localStorage.getItem("backupProgramas")
  ) || [];

  backup.forEach((item) => {
    localStorage.setItem(
      item.chave,
      JSON.stringify(item.dados)
    );
  });
}

function mostrarPainelTrocaPeca() {

  const painel =
    document.getElementById(
      "painelTrocaPeca"
    );

  const mensagem =
    document.getElementById(
      "mensagemTrocaPeca"
    );

  const contador =
    document.getElementById(
      "contadorTrocaPeca"
    );

  const botao =
    document.getElementById(
      "btnPecaPosicionada"
    );


  if (painel) {
    painel.style.display =
      "block";
  }


  if (mensagem) {

    mensagem.innerText =
      "Retire a peça concluída, posicione a próxima peça e confirme.";
  }


  if (contador) {

    contador.innerText =
      "";
  }


  if (botao) {

    botao.disabled =
      false;

    botao.innerText =
      "PEÇA POSICIONADA";
  }
}


function esconderPainelTrocaPeca() {

  const painel =
    document.getElementById(
      "painelTrocaPeca"
    );

  const contador =
    document.getElementById(
      "contadorTrocaPeca"
    );


  if (painel) {

    painel.style.display =
      "none";
  }


  if (contador) {

    contador.innerText =
      "";
  }
}

async function executarContagemRegressiva(
  mensagemBase = "Iniciando",
  usarPainelInicio = false
) {

  const contadorTroca =
    document.getElementById(
      "contadorTrocaPeca"
    );

  const painelInicio =
    document.getElementById(
      "painelContagemInicio"
    );

  const contadorInicio =
    document.getElementById(
      "contadorInicio"
    );

  const statusPrograma =
    document.getElementById(
      "statusPrograma"
    );


  /*
  Se for o início da produção,
  mostra um painel próprio.
  */

  if (
    usarPainelInicio &&
    painelInicio
  ) {

    painelInicio.style.display =
      "block";
  }


  for (
    let segundos = 3;
    segundos >= 1;
    segundos--
  ) {

    const mensagem =
      `${mensagemBase} em ${segundos}...`;


    /*
    Contador da troca de peça.
    */

    if (
      !usarPainelInicio &&
      contadorTroca
    ) {

      contadorTroca.innerText =
        mensagem;
    }


    /*
    Contador da primeira peça.
    */

    if (
      usarPainelInicio &&
      contadorInicio
    ) {

      contadorInicio.innerText =
        mensagem;
    }


    if (statusPrograma) {

      statusPrograma.innerText =
        mensagem;
    }


    await aguardar(
      1000
    );
  }


  /*
  Esconde o painel inicial.
  */

  if (
    usarPainelInicio &&
    painelInicio
  ) {

    painelInicio.style.display =
      "none";
  }


  if (contadorInicio) {

    contadorInicio.innerText =
      "";
  }


  if (contadorTroca) {

    contadorTroca.innerText =
      "";
  }


  return true;
}

async function iniciarContagemTrocaPeca() {

  const botao =
    document.getElementById(
      "btnPecaPosicionada"
    );


  if (
    estadoExecucao !==
    EstadoExecucao.AGUARDANDO_PECA
  ) {
    return false;
  }


  if (botao) {
    botao.disabled = true;
    botao.innerText =
      "AGUARDE...";
  }


  const resultado =
    await executarContagemRegressiva(
      "Iniciando próxima peça"
    );


  if (
    estadoExecucao !==
    EstadoExecucao.AGUARDANDO_PECA
  ) {
    return false;
  }


  return resultado;
}

async function confirmarPecaPosicionada() {

  /*
  Só funciona quando realmente
  estamos esperando nova peça.
  */

  if (
    estadoExecucao !==
    EstadoExecucao.AGUARDANDO_PECA
  ) {
    return;
  }


  /*
  =============================
  CONTAGEM DA TROCA
  =============================
  */

  const contagemConcluida =
    await iniciarContagemTrocaPeca();


  if (!contagemConcluida) {
    return;
  }


  /*
  =============================
  LOCALIZAR PROGRAMA
  =============================
  */

  const itemAtual =
    filaProducao[
      indiceFila
    ];


  if (!itemAtual) {

    console.error(
      "Não foi possível localizar o próximo item da produção."
    );

    return;
  }


  /*
  Esconde o painel depois
  da contagem.
  */

  esconderPainelTrocaPeca();


  /*
  Carrega os pontos, mas NÃO
  inicia automaticamente.
  */

  await carregarProgramaFila(
    itemAtual.programa,
    false
  );


  aguardandoTrocaPeca =
    false;


  /*
  Inicia SEM nova contagem.

  A contagem 3...2...1 já
  aconteceu acima.
  */

  await iniciarExecucaoPrograma(
    false
  );
}

async function concluirProgramaAtual() {

  /*
  =============================
  FINALIZAR MOVIMENTO DA PEÇA
  =============================
  */

  executandoPrograma =
    false;

  programaPausado =
    false;


  /*
  Ao concluir uma peça, a mesa
  precisa parar para permitir
  a troca segura.
  */

  await pararMesaAutomatica();


  const botaoPausa =
    document.getElementById(
      "btnPlayPause"
    );


  if (botaoPausa) {

    botaoPausa.disabled =
      true;

    botaoPausa.innerText =
      "Pausar execução";
  }


  if (
    filaProducao.length === 0
  ) {

    estadoExecucao =
      EstadoExecucao.FINALIZADO;


    const statusPrograma =
      document.getElementById(
        "statusPrograma"
      );


    if (statusPrograma) {

      statusPrograma.innerText =
        "Programa concluído.";
    }


    return;
  }


  const itemAtual =
    filaProducao[
      indiceFila
    ];


  if (!itemAtual) {

    console.error(
      "Item atual da fila não encontrado."
    );

    return;
  }


  /*
  =============================
  CONTAR PEÇA CONCLUÍDA
  =============================
  */

  repeticaoAtual++;


  const quantidadeTotal =
    Number(
      itemAtual.quantidade
    ) || 0;


  const percentualPrograma =
    quantidadeTotal > 0
      ? Math.round(
          (
            repeticaoAtual /
            quantidadeTotal
          ) * 100
        )
      : 0;


  /*
  =============================
  ATUALIZAR FIREBASE
  =============================
  */

  if (
    window
      .salvarProducaoAtualFirebase
  ) {

    try {

      await window
        .salvarProducaoAtualFirebase({

          programa:
            itemAtual.programa,

          quantidadeTotal:
            quantidadeTotal,

          quantidadeConcluida:
            repeticaoAtual,

          repeticaoAtual:
            Math.min(
              repeticaoAtual + 1,
              quantidadeTotal
            ),

          indiceFila:
            indiceFila,

          totalProgramasFila:
            filaProducao.length,

          fila:
            filaProducao,

          status:
            repeticaoAtual >=
            quantidadeTotal
              ? "CONCLUIDO_PROGRAMA"
              : "AGUARDANDO_PECA",

          percentual:
            percentualPrograma,

          pontoAtual:
            0,

          totalPontos:
            pontos.length,

          inicioTimestamp:
            inicioProducao
        });

    } catch (erro) {

      console.error(
        "Erro ao atualizar produção atual:",
        erro
      );
    }
  }


  atualizarBarraProgresso();

  atualizarTempoRestante();


  const execucaoAtual =
    document.getElementById(
      "execucaoAtual"
    );


  if (execucaoAtual) {

    execucaoAtual.innerText =
      `${repeticaoAtual}/${quantidadeTotal} peças concluídas`;
  }


  /*
  =============================
  AINDA FALTAM PEÇAS DO MESMO
  PROGRAMA
  =============================
  */

  if (
    repeticaoAtual <
    quantidadeTotal
  ) {

    estadoExecucao =
      EstadoExecucao.AGUARDANDO_PECA;


    aguardandoTrocaPeca =
      true;


    const statusPrograma =
      document.getElementById(
        "statusPrograma"
      );


    if (statusPrograma) {

      statusPrograma.innerText =
        `Peça ${repeticaoAtual} de ${quantidadeTotal} concluída. Aguardando troca da peça.`;
    }


    atualizarStatusMesa(
      "PARADA"
    );


    mostrarPainelTrocaPeca();


    /*
    Não chamamos mais:
    carregarProgramaFila()

    O operador precisa confirmar
    a próxima peça primeiro.
    */

    return;
  }


  /*
  =============================
  PROGRAMA ATUAL COMPLETO
  =============================
  */

  indiceFila++;

  repeticaoAtual =
    0;


  /*
  =============================
  EXISTE OUTRO PROGRAMA NA FILA
  =============================
  */

  if (
    indiceFila <
    filaProducao.length
  ) {

    const proximoItem =
      filaProducao[
        indiceFila
      ];


    estadoExecucao =
      EstadoExecucao.AGUARDANDO_PECA;


    aguardandoTrocaPeca =
      true;


    if (
      window
        .salvarProducaoAtualFirebase
    ) {

      try {

        await window
          .salvarProducaoAtualFirebase({

            programa:
              proximoItem.programa,

            quantidadeTotal:
              Number(
                proximoItem.quantidade
              ),

            quantidadeConcluida:
              0,

            repeticaoAtual:
              1,

            indiceFila:
              indiceFila,

            totalProgramasFila:
              filaProducao.length,

            fila:
              filaProducao,

            status:
              "AGUARDANDO_PECA",

            percentual:
              0,

            pontoAtual:
              0,

            inicioTimestamp:
              inicioProducao
          });

      } catch (erro) {

        console.error(
          "Erro ao preparar próximo programa:",
          erro
        );
      }
    }


    const statusPrograma =
      document.getElementById(
        "statusPrograma"
      );


    if (statusPrograma) {

      statusPrograma.innerText =
        `Programa anterior concluído. Posicione a peça para "${proximoItem.programa}".`;
    }


    mostrarPainelTrocaPeca();


    return;
  }


  /*
  =============================
  ÚLTIMA PEÇA DA FILA
  =============================
  */

  estadoExecucao =
    EstadoExecucao.FINALIZADO;


  esconderPainelTrocaPeca();


  void finalizarProducao();
}

animate();



/* =====================================
RESPONSIVO
===================================== */
document
  .getElementById("btnVoltar")
  ?.addEventListener(
    "click",
    () => {
      window.location.href =
        "../solda-system/index.html";
    }
  );


window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
