let portaSerial = null;
let leitorSerial = null;
let lendoSerial = false;
let promessaLeitura = null;
let bufferRecepcao = "";const CHAVE_RECONEXAO_ESP32 =
  "esp32ReconectarAutomaticamente";

const CONFIGURACAO_SERIAL_ESP32 = {
  baudRate: 115200,
  dataBits: 8,
  stopBits: 1,
  parity: "none",
  flowControl: "none",
};

function aguardar(
  milissegundos
) {
  return new Promise(
    (resolve) => {
      setTimeout(
        resolve,
        milissegundos
      );
    }
  );
}

const codificador =
  new TextEncoder();

const decodificador =
  new TextDecoder();

const statusConexao =
  document.getElementById(
    "statusConexao"
  );

const terminal =
  document.getElementById(
    "terminal"
  );

const btnConectar =
  document.getElementById(
    "btnConectar"
  );

const btnDesconectar =
  document.getElementById(
    "btnDesconectar"
  );

const botoesComando = [
  document.getElementById(
    "btnPing"
  ),

  document.getElementById(
    "btnLigar"
  ),

  document.getElementById(
    "btnDesligar"
  ),

  document.getElementById(
    "btnEmergencia"
  ),

  document.getElementById(
    "btnEnviarZ"
  ),

  document.getElementById(
    "btnEnviarMesa"
  ),
];

function registrarTerminal(
  mensagem
) {
  const horario =
    new Date().toLocaleTimeString(
      "pt-BR"
    );

  terminal.textContent +=
    `\n[${horario}] ${mensagem}`;

  terminal.scrollTop =
    terminal.scrollHeight;

  console.log(mensagem);
}

function atualizarInterface(
  conectado
) {
  statusConexao.textContent =
    conectado
      ? "CONECTADA"
      : "DESCONECTADA";

  statusConexao.classList.toggle(
    "conectado",
    conectado
  );

  btnConectar.disabled =
    conectado;

  btnDesconectar.disabled =
    !conectado;

  botoesComando.forEach(
    (botao) => {
      if (botao) {
        botao.disabled =
          !conectado;
      }
    }
  );
}

async function abrirPortaESP32(
  porta,
  reconexaoAutomatica = false
) {
  if (!porta) {
    throw new Error(
      "Porta serial inválida."
    );
  }

  /*
  Evita tentar abrir novamente uma
  porta que já está aberta nesta página.
  */
  if (
    portaSerial === porta &&
    portaSerial.readable &&
    portaSerial.writable
  ) {
    return true;
  }

  portaSerial = porta;

  try {
    await portaSerial.open(
      CONFIGURACAO_SERIAL_ESP32
    );

    lendoSerial = true;
    bufferRecepcao = "";

    atualizarInterface(true);

    sessionStorage.setItem(
      CHAVE_RECONEXAO_ESP32,
      "true"
    );

    if (reconexaoAutomatica) {
      terminal.textContent =
        "ESP32 reconectada automaticamente.";

      registrarTerminal(
        "PC: ESP32 reconectada automaticamente."
      );
    } else {
      terminal.textContent =
        "Porta serial aberta.";

      registrarTerminal(
        "PC: ESP32 conectada."
      );
    }

    promessaLeitura =
      lerDadosDaESP32();

    return true;
  } catch (erro) {
    portaSerial = null;
    lendoSerial = false;

    atualizarInterface(false);

    throw erro;
  }
}

async function conectarESP32() {
  if (!window.isSecureContext) {
    alert(
      "Abra esta página pelo Live Server em localhost ou 127.0.0.1."
    );

    return;
  }

  if (
    !("serial" in navigator)
  ) {
    alert(
      "Este navegador não suporta comunicação serial. Use o Google Chrome no computador."
    );

    return;
  }

  try {
    const portaEscolhida =
      await navigator.serial
        .requestPort();

    await abrirPortaESP32(
      portaEscolhida,
      false
    );
  } catch (erro) {
    portaSerial = null;
    lendoSerial = false;

    atualizarInterface(false);

    if (
      erro.name ===
      "NotFoundError"
    ) {
      registrarTerminal(
        "Seleção da ESP32 cancelada."
      );

      return;
    }

    console.error(
      "Erro ao conectar ESP32:",
      erro
    );

    registrarTerminal(
      `ERRO AO CONECTAR: ${erro.message}`
    );
  }
}

async function reconectarESP32Autorizada() {
  if (
    sessionStorage.getItem(
      CHAVE_RECONEXAO_ESP32
    ) !== "true"
  ) {
    return;
  }

  if (
    !window.isSecureContext ||
    !("serial" in navigator)
  ) {
    return;
  }

  registrarTerminal(
    "Procurando ESP32 autorizada..."
  );

  try {
    const portasAutorizadas =
      await navigator.serial
        .getPorts();

    if (
      portasAutorizadas.length === 0
    ) {
      registrarTerminal(
        "Nenhuma ESP32 autorizada foi encontrada."
      );

      return;
    }

    /*
    Neste projeto existe somente uma
    ESP32 autorizada, então utilizamos
    a primeira porta encontrada.
    */
    const portaAutorizada =
      portasAutorizadas[0];

    /*
    Quando voltamos de outra página,
    a porta anterior pode levar alguns
    instantes para ser liberada.
    */
    for (
      let tentativa = 1;
      tentativa <= 5;
      tentativa++
    ) {
      try {
        await abrirPortaESP32(
          portaAutorizada,
          true
        );

        return;
      } catch (erro) {
        portaSerial = null;

        console.warn(
          `Tentativa ${tentativa} de reconexão falhou:`,
          erro
        );

        if (tentativa < 5) {
          await aguardar(500);
        } else {
          registrarTerminal(
            "Não foi possível reconectar automaticamente. Use o botão Conectar ESP32."
          );
        }
      }
    }
  } catch (erro) {
    console.error(
      "Erro ao procurar ESP32 autorizada:",
      erro
    );

    registrarTerminal(
      `ERRO NA RECONEXÃO: ${erro.message}`
    );
  }
}

async function lerDadosDaESP32() {
  try {
    while (
      portaSerial?.readable &&
      lendoSerial
    ) {
      leitorSerial =
        portaSerial.readable
          .getReader();

      try {
        while (lendoSerial) {
          const {
            value,
            done,
          } =
            await leitorSerial
              .read();

          if (done) {
            break;
          }

          if (!value) {
            continue;
          }

          bufferRecepcao +=
            decodificador.decode(
              value,
              {
                stream: true,
              }
            );

          const linhas =
            bufferRecepcao.split(
              /\r?\n/
            );

          bufferRecepcao =
            linhas.pop() || "";

          linhas.forEach(
            (linha) => {
              const mensagem =
                linha.trim();

              if (mensagem) {
                registrarTerminal(
                  `ESP32 → PC: ${mensagem}`
                );
              }
            }
          );
        }
      } catch (erro) {
        if (lendoSerial) {
          console.error(
            "Erro de leitura:",
            erro
          );

          registrarTerminal(
            `ERRO DE LEITURA: ${erro.message}`
          );
        }
      } finally {
        leitorSerial
          ?.releaseLock();

        leitorSerial = null;
      }
    }
  } finally {
    promessaLeitura = null;
  }
}

async function enviarComando(
  comando
) {
  if (
    !portaSerial?.writable
  ) {
    registrarTerminal(
      "ESP32 não está conectada."
    );

    return;
  }

  const escritor =
    portaSerial.writable
      .getWriter();

  try {
    const mensagem =
      `${comando}\n`;

    await escritor.write(
      codificador.encode(
        mensagem
      )
    );

    registrarTerminal(
      `PC → ESP32: ${comando}`
    );
  } catch (erro) {
    console.error(
      "Erro ao enviar comando:",
      erro
    );

    registrarTerminal(
      `ERRO DE ENVIO: ${erro.message}`
    );
  } finally {
    escritor.releaseLock();
  }
}

window.enviarComandoESP32 =
  enviarComando;

window.esp32EstaConectada =
  function() {
    return Boolean(
      portaSerial?.readable &&
      portaSerial?.writable
    );
  };

async function desconectarESP32() {
  lendoSerial = false;

  try {
    if (leitorSerial) {
      await leitorSerial.cancel();
    }

    if (promessaLeitura) {
      await promessaLeitura;
    }

    if (portaSerial) {
      await portaSerial.close();
    }

    registrarTerminal(
      "PC: ESP32 desconectada."
    );
  } catch (erro) {
    console.error(
      "Erro ao desconectar:",
      erro
    );

    registrarTerminal(
      `ERRO AO DESCONECTAR: ${erro.message}`
    );
  } finally {
    portaSerial = null;
    leitorSerial = null;
    promessaLeitura = null;
    lendoSerial = false;
    bufferRecepcao = "";

    sessionStorage.removeItem(
  CHAVE_RECONEXAO_ESP32
);

    atualizarInterface(false);

    window.addEventListener(
  "DOMContentLoaded",
  () => {
    void reconectarESP32Autorizada();
  }
);
  }
}

btnConectar.addEventListener(
  "click",
  conectarESP32
);

btnDesconectar.addEventListener(
  "click",
  desconectarESP32
);

document
  .getElementById(
    "btnPing"
  )
  .addEventListener(
    "click",
    () => {
      void enviarComando(
        "PING"
      );
    }
  );

document
  .getElementById(
    "btnLigar"
  )
  .addEventListener(
    "click",
    () => {
      void enviarComando(
        "SAIDA_ON"
      );
    }
  );

document
  .getElementById(
    "btnDesligar"
  )
  .addEventListener(
    "click",
    () => {
      void enviarComando(
        "SAIDA_OFF"
      );
    }
  );

document
  .getElementById(
    "btnEmergencia"
  )
  .addEventListener(
    "click",
    () => {
      void enviarComando(
        "EMERGENCIA"
      );
    }
  );

document
  .getElementById(
    "btnEnviarZ"
  )
  .addEventListener(
    "click",
    () => {
      const valorZ =
        Number(
          document
            .getElementById(
              "valorZ"
            )
            .value
        );

      if (
        !Number.isFinite(valorZ)
      ) {
        alert(
          "Digite uma altura válida."
        );

        return;
      }

      void enviarComando(
        `Z:${valorZ.toFixed(2)}`
      );
    }
  );

document
  .getElementById(
    "btnEnviarMesa"
  )
  .addEventListener(
    "click",
    () => {
      const valorMesa =
        Number(
          document
            .getElementById(
              "valorMesa"
            )
            .value
        );

      if (
        !Number.isFinite(
          valorMesa
        )
      ) {
        alert(
          "Digite um ângulo válido."
        );

        return;
      }

      void enviarComando(
        `MESA:${valorMesa.toFixed(2)}`
      );
    }
  );

navigator.serial
  ?.addEventListener(
    "disconnect",
    () => {
      registrarTerminal(
        "A ESP32 foi desconectada fisicamente."
      );

      portaSerial = null;
      lendoSerial = false;

      atualizarInterface(false);
    }
  );

window.addEventListener(
  "beforeunload",
  () => {
    lendoSerial = false;
  }
);

atualizarInterface(false);
