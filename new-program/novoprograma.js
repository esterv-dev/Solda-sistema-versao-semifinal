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
camera.lookAt(0, 0, 0);
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

loader.load(
  caminhoModelo,
  (gltf) => {
modeloMaquina = gltf.scene;
const carro =
modeloMaquina.getObjectByName(
"Atuador_Linear-1"
);

console.log(carro);

// rotação primeiro
modeloMaquina.rotation.x = 0;
modeloMaquina.rotation.y = Math.PI;
modeloMaquina.rotation.z = Math.PI / 2 -0.06 ;
modeloMaquina.scale.setScalar(1.2);




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

modeloMaquina.position.y += 2;

scene.add(modeloMaquina);
// if (carro) {
//     carro.position.y += 2;
// }

    document.getElementById("statusPrograma").innerText =
      "Modelo real da máquina carregado.";
  },
  undefined,
  (erro) => {
    console.error("Erro ao carregar o modelo GLB:", erro);

    document.getElementById("statusPrograma").innerText =
      "Erro ao carregar o modelo 3D. Verifique o caminho do arquivo GLB.";
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
modelo.position.y += 4;

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
// cabecote.add(ponteiracabecote);

// cabecote.position.set(2.8, 3.2, 0);
// cabecote.castShadow = true;
// scene.add(cabecote);

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
// cabecote.add(fioArame);
const luzSolda = new THREE.PointLight(0x00bbff, 0.3, 2);
// luzSolda.position.set(cabecote.position.x - 0.8, cabecote.position.y, cabecote.position.z);
// scene.add(luzSolda);

/*
  Grupo lógico da mesa.
  O modelo real completo fica parado na cena.
  Esta referência mantém a compatibilidade com o botão "GIRAR MESA"
  e com os programas salvos.
*/
const mesa = new THREE.Group();
scene.add(mesa);

const referenciaMesa = new THREE.Mesh(
  new THREE.CylinderGeometry(1.1, 1.1, 0.08, 64),
  new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.18,
  })
);

referenciaMesa.position.y = 0.12;
mesa.add(referenciaMesa);

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

  const ponto = {

    z: Number(
      cabecote.position.y.toFixed(2)
    ),

    girarMesa: girando

  };

  pontos.push(ponto);

  atualizarLista();

  console.log(pontos);
}



function atualizarLista() {
  const lista = document.getElementById("listaPontos");

  lista.innerHTML = "";

  pontos.forEach((ponto, index) => {
    lista.innerHTML += `
        <div style="
        margin-top:10px;
        padding:10px;
        border-radius:10px;
        background:rgba(255,255,255,0.05);
        border-left:4px solid #38bdf8;
        ">
            P${index + 1}<br>
           Altura (Z): ${ponto.z} cm<br>
Mesa:
${ponto.girarMesa ? "GIRANDO" : "PARADA"}
        </div>
        `;
  });
}

// GERAR FAISCAS
function criarFaiscas() {

    for(let i = 0; i < 30; i++) {

        const faisca = new THREE.Mesh(

            new THREE.SphereGeometry(
                0.04,
                8,
                8
            ),

            new THREE.MeshBasicMaterial({

                color: Math.random() > 0.5
                    ? 0xff6600
                    : 0xffcc00

            })

        );

        faisca.position.set(

            cabecote.position.x - 1,
            cabecote.position.y,
            cabecote.position.z

        );

        faisca.userData = {

            vx:(Math.random()-0.5)*0.25,

            vy:Math.random()*0.25,

            vz:(Math.random()-0.5)*0.25,

            vida:30

        };

        scene.add(faisca);

        faiscas.push(faisca);

    }

}

/* =====================================
MOVIMENTO AUTOMÁTICO
===================================== */

let movendocabecoteAutomatico = false;
let direcaocabecote = 1;



function alternarMovimento() {
  movendocabecoteAutomatico = !movendocabecoteAutomatico;
  const btn = document.getElementById("btnPlayPause");
  btn.innerText = movendocabecoteAutomatico ? "Pausar" : "Iniciar";
}

/* =====================================
GIRAR MESA
===================================== */

let girando = false;

function girarMesa() {
  girando = !girando;
  document.getElementById("statusMesa").innerText = girando
    ? "GIRANDO"
    : "PARADA";
}

// BARRA
function atualizarBarraProgresso() {
  if (filaProducao.length === 0) return;

  let total = 0;
  let concluido = 0;

  filaProducao.forEach((item, index) => {
    total += item.quantidade;

    if (index < indiceFila) {
      concluido += item.quantidade;
    }
  });

  concluido += repeticaoAtual;

  const porcentagem = Math.min((concluido / total) * 100, 100);

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

    totalExecucoes +=
    item.quantidade;

  });

  const executadas =
  indiceFila + repeticaoAtual;

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
  fimProducao = Date.now();

  const tempoTotalSegundos = Math.round(
    (fimProducao - inicioProducao) / 1000
  );

  const minutos = Math.floor(tempoTotalSegundos / 60);
  const segundos = tempoTotalSegundos % 60;

  return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}

function salvarHistoricoProducao() {
  const tempoFormatado = calcularTempoProducao();

  const historico =
    JSON.parse(localStorage.getItem("historicoProducao")) || [];

  filaProducao.forEach((item) => {
    historico.push({
      data: new Date().toLocaleDateString("pt-BR"),
      hora: new Date().toLocaleTimeString("pt-BR"),
      programa: item.programa,
      quantidade: Number(item.quantidade),
      tempo: tempoFormatado,
      eficiencia: 98,
      status: "Concluído"
    });
  });

  localStorage.setItem(
    "historicoProducao",
    JSON.stringify(historico)
  );

  return tempoFormatado;
}

/* =====================================
REGISTRAR PRODUÇÃO FINALIZADA
===================================== */

async function registrarProducaoFinalizada() {
  const tempoFormatado = salvarHistoricoProducao();

  if (window.salvarProducaoDiaFirebase) {
    await window.salvarProducaoDiaFirebase(
      filaProducao,
      tempoFormatado
    );
  }
}
/* =====================================
ANIMAÇÃO (BUG DO cabecote VOADOR CORRIGIDO 🛠️)
===================================== */


function animate() {
  requestAnimationFrame(animate);
  controls.update();

  if (girando) {
    mesa.rotation.y += 0.02;
  }

  luzSolda.intensity = 4 + Math.sin(Date.now() * 0.01);
  if (executandoPrograma) {
  const pontoAtual = pontos[indicePontoAtual];

if (pontoAtual) {

  girando =
  pontoAtual.girarMesa || false;

  document.getElementById(
    "statusMesa"
  ).innerText =
    girando
      ? "GIRANDO"
      : "PARADA";

}

document.getElementById(
  "statusMesa"
).innerText =
girando
? "GIRANDO"
: "PARADA";

    if (pontoAtual) {
      const velocidade = 0.02;

      const diferenca = pontoAtual.z - cabecote.position.y;

      if (Math.abs(diferenca) > 0.03) {
        cabecote.position.y += Math.sign(diferenca) * velocidade;
      } else {
        cabecote.position.y = pontoAtual.z;
        criarFaiscas();
        indicePontoAtual++;

        if (indicePontoAtual >= pontos.length) {

  executandoPrograma = false;

  if (filaProducao.length > 0) {

    const itemAtual =
    filaProducao[indiceFila];

    repeticaoAtual++;
    atualizarBarraProgresso();
    atualizarTempoRestante();

document.getElementById(
  "execucaoAtual"
).innerText =
`${repeticaoAtual}/${itemAtual.quantidade}`;

    if (repeticaoAtual < itemAtual.quantidade) {

      carregarProgramaFila(
        itemAtual.programa
      );

    } else {

      indiceFila++;

      repeticaoAtual = 0;

      if (
        indiceFila <
        filaProducao.length
      ) {

        carregarProgramaFila(
          filaProducao[indiceFila]
          .programa
        );

      } else {

       document.getElementById("statusPrograma").innerText =
  "Produção concluída";

document.getElementById("barraProgresso").style.width = "100%";

document.getElementById("textoProgresso").innerText = "100%";

document.getElementById("programaAtualExecucao").innerText =
  "Todos os programas executados";

document.getElementById("execucaoAtual").innerText =
  "Execução finalizada";

document.getElementById("tempoRestante").innerText =
  "Tempo restante: 00:00";
          document.getElementById(
  "tempoRestante"
).innerText =
  "Tempo restante: 00:00";
   if (!localStorage.getItem("historicoJaSalvo"))

localStorage.removeItem(
  "filaProducao"
);

      }
    }

  } else {

    document.getElementById(
      "statusPrograma"
    ).innerText =
      "Programa concluído";

  }

}
      }
    }
  }
  for (let i = faiscas.length - 1; i >= 0; i--) {
    const f = faiscas[i];

    f.position.x += f.userData.vx;
    f.position.y += f.userData.vy;
    f.position.z += f.userData.vz;

    f.userData.vida--;

    if (f.userData.vida <= 0) {
      scene.remove(f);
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

  const nome = prompt("Digite o nome do programa:");
  if (!nome) return;

  const programa = {
    nome: nome,
    data: new Date().toLocaleString("pt-BR"),
    pontos: pontos,
  };

  if (!window.salvarProgramaFirebase) {
    alert("Firebase não carregou.");
    return;
  }

  const chavePrograma =
    await window.salvarProgramaFirebase(nome, programa);

  localStorage.setItem("programaAtual", chavePrograma);

  document.getElementById("statusPrograma").innerText =
    `Programa "${nome}" salvo com sucesso!`;
}
async function carregarProgramaFila(nomePrograma) {

  if (!window.carregarProgramaFirebase) return;

  const programa = await window.carregarProgramaFirebase(nomePrograma);

  if (!programa) return;

  pontos = programa.pontos || [];

  atualizarLista();

  indicePontoAtual = 0;
  executandoPrograma = false;

  document.getElementById("statusPrograma").innerText =
    "Executando programa";

  document.getElementById("programaAtualExecucao").innerText =
    `Programa: ${programa.nome}`;

  iniciarExecucaoPrograma();
}

async function carregarPrograma() {
  const nome = localStorage.getItem("programaAtual");

  if (!nome) return;

  if (!window.carregarProgramaFirebase) return;

  const programa = await window.carregarProgramaFirebase(nome);

  if (!programa) return;

  pontos = programa.pontos || [];

  atualizarLista();

  document.getElementById("statusPrograma").innerText =
    `Programa "${programa.nome}" carregado`;

  iniciarExecucaoPrograma();
}
function iniciarExecucaoPrograma() {
  if (pontos.length === 0) {
    return;
  }

  movendocabecoteAutomatico = false;

  executandoPrograma = true;

  indicePontoAtual = 0;

  document.getElementById("statusPrograma").innerText =
    "Executando programa...";
}

function ocultarControlesProducao() {

  document.getElementById(
    "altura"
  ).style.display = "none";

  document.querySelector(
    "label"
  ).style.display = "none";

  document.getElementById(
    "btnPlayPause"
  ).style.display = "none";

  document.querySelector(
    'button[onclick="girarMesa()"]'
  ).style.display = "none";

  document.querySelector(
    'button[onclick="salvarPonto()"]'
  ).style.display = "none";

  document.querySelector(
    'button[onclick="salvarPrograma()"]'
  ).style.display = "none";

  document.getElementById(
    "listaPontos"
  ).style.display = "none";

}
async function iniciarSistema() {

  recuperarBackupProgramas();

  const filaSalva =
  localStorage.getItem("filaProducao");

  if (filaSalva) {

    inicioExecucao = Date.now();
    inicioProducao = Date.now();

    ocultarControlesProducao();

    filaProducao =
    JSON.parse(filaSalva);

    indiceFila = 0;
    repeticaoAtual = 0;

    if (filaProducao.length > 0) {

      await carregarProgramaFila(
        filaProducao[0].programa
      );

    }

  } else {

    await carregarPrograma();

  }

}

iniciarSistema();
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

animate();



/* =====================================
RESPONSIVO
===================================== */
document.getElementById("btnVoltar").addEventListener("click", () => {
  window.location.href = "../solda-system/index.html"; // ajuste o caminho
});


window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
