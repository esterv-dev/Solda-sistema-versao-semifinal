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



function alternarMovimento() {
  if (!executandoPrograma) {
    return;
  }

  programaPausado = !programaPausado;

  const botao =
    document.getElementById("btnPlayPause");

  botao.innerText = programaPausado
    ? "Continuar execução"
    : "Pausar execução";

  document.getElementById(
    "statusPrograma"
  ).innerText = programaPausado
    ? "Programa pausado."
    : "Executando programa...";
}

/* =====================================
GIRAR MESA
===================================== */

let girando = false;

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

    historico.push({
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
        [],
    });
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
function animate() {
  requestAnimationFrame(animate);

  const deltaSegundos = Math.min(
    relogioAnimacao.getDelta(),
    0.05
  );

  controls.update();

  /* ==========================
  MOVIMENTO MANUAL
  ========================== */

  if (!executandoPrograma) {
  let direcao = 0;

  if (teclasPressionadas.ArrowUp) {
    direcao += 1;
  }

  if (teclasPressionadas.ArrowDown) {
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
  MOVIMENTO DA MESA
  ========================== */
if (
  girando &&
  mesaReal &&
  !executandoPrograma
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
    pontos[indicePontoAtual];

  if (!pontoAtual) {
    concluirProgramaAtual();
  } else {
    const destinoZ =
      Number(
        pontoAtual.zMm
      );

    const destinoMesaBruto =
      Number(
        pontoAtual
          .anguloMesaGraus
      );

    if (
      !Number.isFinite(destinoZ) ||
      !Number.isFinite(
        destinoMesaBruto
      )
    ) {
      console.error(
        "Ponto com coordenadas inválidas:",
        pontoAtual
      );

      executandoPrograma = false;

      const statusPrograma =
        document.getElementById(
          "statusPrograma"
        );

      if (statusPrograma) {
        statusPrograma.innerText =
          `Erro nas coordenadas de P${indicePontoAtual + 1}.`;
      }
    } else {
      const destinoMesa =
        normalizarAnguloGraus(
          destinoMesaBruto
        );

      /*
      =========================
      MOVIMENTO DO CABEÇOTE
      =========================
      */

      const diferencaZ =
        destinoZ -
        estadoMaquina
          .posicaoZMm;

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
          estadoMaquina
            .posicaoZMm +
            deslocamentoZ
        );
      } else {
        definirPosicaoZMm(
          destinoZ
        );
      }

      /*
      =========================
      MOVIMENTO DA MESA
      =========================
      */

      const anguloAtual =
        obterAnguloMesaGraus();

      const diferencaMesa =
        diferencaAngularCurta(
          destinoMesa,
          anguloAtual
        );

      const chegouMesa =
        Math.abs(
          diferencaMesa
        ) <=
        TOLERANCIA_MESA_GRAUS;

      if (!chegouMesa) {
        const movimentoMaximoMesa =
          VELOCIDADE_MESA_PROGRAMA_GRAUS_S *
          deltaSegundos;

        const movimentoMesaGraus =
          Math.sign(
            diferencaMesa
          ) *
          Math.min(
            Math.abs(
              diferencaMesa
            ),
            movimentoMaximoMesa
          );

        mesaReal.rotation.z +=
          THREE.MathUtils.degToRad(
            movimentoMesaGraus
          );

        const statusMesa =
          document.getElementById(
            "statusMesa"
          );

        if (statusMesa) {
          statusMesa.innerText =
            "POSICIONANDO";
        }
      } else {
        definirAnguloMesaGraus(
          destinoMesa
        );

        const statusMesa =
          document.getElementById(
            "statusMesa"
          );

        if (statusMesa) {
          statusMesa.innerText =
            "PARADA";
        }
      }

      /*
      =========================
      INFORMAÇÕES DA EXECUÇÃO
      =========================
      */

      const execucaoAtual =
        document.getElementById(
          "execucaoAtual"
        );

      if (execucaoAtual) {
        execucaoAtual.innerText =
          `P${indicePontoAtual + 1}/${pontos.length} | Z: ${destinoZ.toFixed(2)} mm | Mesa: ${destinoMesa.toFixed(2)}°`;
      }

      /*
      =========================
      PONTO ALCANÇADO
      =========================
      */

      if (
        chegouZ &&
        chegouMesa
      ) {
        definirPosicaoZMm(
          destinoZ
        );

        definirAnguloMesaGraus(
          destinoMesa
        );

        if (
          pontoAtual
            .solda?.ativar
        ) {
          criarFaiscas();
        }

        console.log(
          `P${indicePontoAtual + 1} alcançado`,
          {
            zMm:
              estadoMaquina
                .posicaoZMm,

            anguloMesaGraus:
              obterAnguloMesaGraus(),
          }
        );

        indicePontoAtual++;

        if (
          indicePontoAtual >=
          pontos.length
        ) {
          concluirProgramaAtual();
        } else {
          const statusPrograma =
            document.getElementById(
              "statusPrograma"
            );

          if (statusPrograma) {
            statusPrograma.innerText =
              `Movendo para P${indicePontoAtual + 1}...`;
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
    let i = faiscas.length - 1;
    i >= 0;
    i--
  ) {
    const faisca = faiscas[i];

    faisca.position.x +=
      faisca.userData.vx;

    faisca.position.y +=
      faisca.userData.vy;

    faisca.position.z +=
      faisca.userData.vz;

    faisca.userData.vida--;

    if (faisca.userData.vida <= 0) {
      scene.remove(faisca);
      faiscas.splice(i, 1);
    }
  }

  renderer.render(scene, camera);
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
async function carregarProgramaFila(nomePrograma) {
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

    iniciarExecucaoPrograma();
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

function iniciarExecucaoPrograma() {
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

  // Impede a rotação manual durante
  // a execução automática.
  girando = false;

  executandoPrograma = true;
  programaPausado = false;
  indicePontoAtual = 0;

  const botaoPausa =
    document.getElementById(
      "btnPlayPause"
    );

  if (botaoPausa) {
    botaoPausa.disabled = false;
    botaoPausa.innerText =
      "Pausar execução";
  }

  const statusMesa =
    document.getElementById(
      "statusMesa"
    );

  if (statusMesa) {
    statusMesa.innerText =
      "POSICIONANDO";
  }

  const execucaoAtual =
    document.getElementById(
      "execucaoAtual"
    );

  if (execucaoAtual) {
    execucaoAtual.innerText =
      `Executando P1 de ${pontos.length}`;
  }

  const statusPrograma =
    document.getElementById(
      "statusPrograma"
    );

  if (statusPrograma) {
    statusPrograma.innerText =
      "Executando programa...";
  }
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
    document.getElementById(
      "btnPlayPause"
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

  const filaSalva =
    localStorage.getItem(
      "filaProducao"
    );

  /*
  =============================
  MODO FILA DE PRODUÇÃO
  =============================
  */

  if (filaSalva) {
    inicioExecucao =
      Date.now();

    inicioProducao =
      Date.now();

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

    indiceFila = 0;
    repeticaoAtual = 0;

    if (
      filaProducao.length > 0
    ) {
      await carregarProgramaFila(
        filaProducao[0].programa
      );
    } else {
      localStorage.removeItem(
        "filaProducao"
      );
    }

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
}

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
function concluirProgramaAtual() {
  executandoPrograma = false;
  programaPausado = false;
  girando = false;

  const botaoPausa =
    document.getElementById("btnPlayPause");

  botaoPausa.disabled = true;
  botaoPausa.innerText =
    "Pausar execução";

  document.getElementById(
    "statusMesa"
  ).innerText = "PARADA";

  if (filaProducao.length === 0) {
    document.getElementById(
      "statusPrograma"
    ).innerText =
      "Programa concluído.";

    return;
  }

  const itemAtual =
    filaProducao[indiceFila];

  repeticaoAtual++;

  atualizarBarraProgresso();
  atualizarTempoRestante();

  document.getElementById(
    "execucaoAtual"
  ).innerText =
    `${repeticaoAtual}/${itemAtual.quantidade}`;

  if (
    repeticaoAtual <
    Number(itemAtual.quantidade)
  ) {
    void carregarProgramaFila(
      itemAtual.programa
    );

    return;
  }

  indiceFila++;
  repeticaoAtual = 0;

  if (indiceFila < filaProducao.length) {
    void carregarProgramaFila(
      filaProducao[indiceFila].programa
    );

    return;
  }

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
