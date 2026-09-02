/*
=====================================
MQTT - SOLDATECH
=====================================
*/

const MQTT_BROKER =
  "wss://0c8e76fe2d694a2e963905f30e8ab299.s1.eu.hivemq.cloud:8884/mqtt";

const MQTT_TOPICO_COMANDO =
  "soldatech/maquina/comando";

const MQTT_TOPICO_STATUS =
  "soldatech/maquina/status";

  const MQTT_TOPICO_RESPOSTA =
  "soldatech/maquina/resposta";

const MQTT_TOPICO_ERRO =
  "soldatech/maquina/erro";

let mqttCliente = null;
let mqttConectado = false;


/*
=====================================
CONECTAR AO BROKER
=====================================
*/

function conectarMQTT() {

  const clientId =
    "soldatech-web-" +
    Math.random()
      .toString(16)
      .substring(2, 10);


  console.log(
    "Conectando ao MQTT...",
    {
      broker:
        MQTT_BROKER,

      clientId:
        clientId
    }
  );


mqttCliente =
  mqtt.connect(
    MQTT_BROKER,
    {
      clientId:
        clientId,

      username:
        "soldatech-web",

      password:
        "ester2547",

      clean:
        true,

      reconnectPeriod:
        3000,

      connectTimeout:
        10000
    }
  );

  /*
  =============================
  CONECTADO
  =============================
  */

  mqttCliente.on(
    "connect",
    () => {

      mqttConectado =
        true;


      console.log(
        "✅ MQTT conectado ao broker!"
      );


      /*
      Escuta respostas/status.
      */

      mqttCliente.subscribe(
  [
    MQTT_TOPICO_STATUS,
    MQTT_TOPICO_RESPOSTA,
    MQTT_TOPICO_ERRO
  ],
  {
    qos: 0
  },
  erro => {

    if (erro) {

      console.error(
        "Erro ao assinar tópicos MQTT:",
        erro
      );

      return;
    }


    console.log(
      "✅ Inscrito nos tópicos da máquina."
    );
  }
);
    }
  );


  /*
  =============================
  RECEBER MENSAGEM
  =============================
  */

  mqttCliente.on(
    "message",
    (
      topico,
      mensagem
    ) => {

      const texto =
        mensagem.toString();


      console.log(
        "📥 MQTT recebido:",
        {
          topico:
            topico,

          mensagem:
            texto
        }
      );
    }
  );


  /*
  =============================
  DESCONECTADO
  =============================
  */

  mqttCliente.on(
    "close",
    () => {

      mqttConectado =
        false;


      console.warn(
        "MQTT desconectado."
      );
    }
  );


  /*
  =============================
  ERRO
  =============================
  */

  mqttCliente.on(
    "error",
    erro => {

      console.error(
        "Erro MQTT:",
        erro
      );
    }
  );
}


/*
=====================================
PUBLICAR COMANDO
=====================================
*/

function publicarMQTT(
  comando,
  dados = {}
) {

  if (
    !mqttCliente ||
    !mqttConectado
  ) {

    console.warn(
      "MQTT ainda não está conectado."
    );

    return false;
  }


  const mensagem = {

    comando:
      comando,

    dados:
      dados,

    origem:
      "SoldaTech",

    timestamp:
      Date.now()
  };


  const payload =
    JSON.stringify(
      mensagem
    );


  mqttCliente.publish(
    MQTT_TOPICO_COMANDO,
    payload,
    {
      qos: 0,
      retain: false
    }
  );


  console.log(
    "📤 MQTT enviado:",
    {
      topico:
        MQTT_TOPICO_COMANDO,

      payload:
        mensagem
    }
  );


  return true;
}


/*
=====================================
FUNÇÃO USADA PELA MÁQUINA
=====================================
*/

window.enviarComandoMaquina =
  async function(
    comando,
    dados = {}
  ) {

    return publicarMQTT(
      comando,
      dados
    );
  };


/*
=====================================
FUNÇÕES PARA TESTE
=====================================
*/

window.testarMQTT =
  function() {

    return publicarMQTT(
      "TESTE",
      {
        mensagem:
          "Olá do SoldaTech"
      }
    );
  };


window.mqttEstaConectado =
  function() {

    return mqttConectado;
  };


/*
=====================================
INICIAR
=====================================
*/

conectarMQTT();