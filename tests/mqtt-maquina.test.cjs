const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const { EventEmitter } = require("node:events");

class EventoCustomizado extends Event {
  constructor(tipo, opcoes = {}) {
    super(tipo);
    this.detail = opcoes.detail;
  }
}

class ClienteMqttFalso extends EventEmitter {
  constructor() {
    super();
    this.publicacoes = [];
    this.inscricoes = [];
  }

  subscribe(topicos, opcoes, callback) {
    this.inscricoes.push({ topicos, opcoes });
    callback?.(null);
  }

  publish(topico, payload, opcoes, callback) {
    this.publicacoes.push({ topico, payload: JSON.parse(payload), opcoes });
    callback?.(null);
  }
}

function criarAmbiente() {
  const cliente = new ClienteMqttFalso();
  let conexoesCriadas = 0;
  let sequenciaUuid = 0;
  const janela = new EventTarget();

  Object.assign(janela, {
    crypto: {
      randomUUID: () => `uuid-${++sequenciaUuid}`,
    },
    mqtt: {
      connect: () => {
        conexoesCriadas += 1;
        return cliente;
      },
    },
    setTimeout,
    clearTimeout,
    setInterval: () => 1,
    clearInterval: () => {},
  });

  const documento = {
    getElementById: () => null,
    createElement: () => ({ setAttribute() {} }),
    createTextNode: (texto) => ({ texto }),
  };
  const consoleSilencioso = {
    log() {},
    info() {},
    warn() {},
    error() {},
  };
  const contexto = vm.createContext({
    window: janela,
    document: documento,
    console: consoleSilencioso,
    CustomEvent: EventoCustomizado,
    Event,
    EventTarget,
    Error,
    Map,
    Set,
    Date,
    Math,
    JSON,
    Object,
    Array,
    String,
    Number,
    Promise,
    TypeError,
  });
  const arquivo = path.resolve(__dirname, "../new-program/mqtt-maquina.js");

  vm.runInContext(fs.readFileSync(arquivo, "utf8"), contexto, {
    filename: arquivo,
  });

  return {
    cliente,
    janela,
    obterConexoesCriadas: () => conexoesCriadas,
  };
}

test("camada MQTT preserva estados e correlaciona comandos", async () => {
  const ambiente = criarAmbiente();
  const { cliente, janela } = ambiente;
  const api = janela.SoldaTouchMQTT;

  assert.equal(ambiente.obterConexoesCriadas(), 1);
  assert.equal(janela.obterEstadoConexaoMaquina().mqttConectado, false);

  cliente.emit("connect");
  assert.equal(janela.obterEstadoConexaoMaquina().mqttConectado, true);
  assert.equal(janela.obterEstadoConexaoMaquina().clp, "AGUARDANDO RESPOSTA");

  const status = api.processarMensagemMaquina(
    api.topicos.status,
    JSON.stringify({ tipo: "STATUS", estado: "PRONTA" }),
  );
  assert.equal(status.processado, true);
  assert.equal(janela.obterEstadoConexaoMaquina().clp, "CONECTADO");

  assert.doesNotThrow(() => {
    api.processarMensagemMaquina(api.topicos.status, "STATUS_LEGADO");
  });

  const promessaOk = api.enviarComandoComConfirmacao("TESTE", { valor: 1 });
  const comandoOk = cliente.publicacoes.at(-1).payload;
  assert.match(comandoOk.idComando, /^cmd-/);
  assert.deepEqual(
    Object.keys(comandoOk),
    ["idComando", "comando", "dados", "origem", "timestamp"],
  );
  api.processarMensagemMaquina(
    api.topicos.resposta,
    JSON.stringify({ idComando: comandoOk.idComando, tipo: "COMANDO_OK" }),
  );
  assert.equal((await promessaOk).tipo, "COMANDO_OK");

  const promessaPonto = api.enviarComandoComConfirmacao(
    "MOVER_PONTO",
    { zMm: 12 },
    { tiposSucesso: ["PONTO_ATINGIDO"] },
  );
  const comandoPonto = cliente.publicacoes.at(-1).payload;
  api.processarMensagemMaquina(
    api.topicos.resposta,
    JSON.stringify({
      idComando: comandoPonto.idComando,
      tipo: "PONTO_ATINGIDO",
    }),
  );
  assert.equal((await promessaPonto).tipo, "PONTO_ATINGIDO");

  const mesaPronta = api.aguardarEventoMaquina("MESA_READY", { timeoutMs: 50 });
  api.processarMensagemMaquina(
    api.topicos.resposta,
    JSON.stringify({ tipo: "MESA_READY" }),
  );
  assert.equal((await mesaPronta).tipo, "MESA_READY");

  assert.doesNotThrow(() => {
    api.processarMensagemMaquina(
      api.topicos.resposta,
      JSON.stringify({ idComando: "cmd-inexistente", tipo: "COMANDO_OK" }),
    );
  });

  await assert.rejects(
    api.enviarComandoComConfirmacao("SEM_RESPOSTA", {}, { timeoutMs: 5 }),
    (erro) => erro.codigo === "MQTT_COMMAND_TIMEOUT",
  );

  const promessaErro = api.enviarComandoComConfirmacao("COM_ERRO");
  const comandoErro = cliente.publicacoes.at(-1).payload;
  api.processarMensagemMaquina(
    api.topicos.erro,
    JSON.stringify({
      idComando: comandoErro.idComando,
      tipo: "ERRO",
      mensagem: "Falha simulada",
    }),
  );
  await assert.rejects(promessaErro, (erro) => erro.idComando === comandoErro.idComando);

  cliente.emit("close");
  assert.equal(janela.obterEstadoConexaoMaquina().mqttConectado, false);
  assert.equal(janela.obterEstadoConexaoMaquina().clp, "INDISPONÍVEL");

  cliente.emit("connect");
  assert.equal(ambiente.obterConexoesCriadas(), 1);
  assert.equal(janela.obterEstadoConexaoMaquina().clp, "AGUARDANDO RESPOSTA");

  const capacidades = janela.SoldaTouchIntegracaoFisica.obterCapacidades();
  assert.equal(capacidades.movimentoManual, false);
  assert.equal(capacidades.soldagem, false);
});
