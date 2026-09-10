# Ponte CLP (Node-RED) — SoldaTech

Liga o CLP Schneider **M200 CE24T** (Modbus TCP) ao broker **HiveMQ Cloud** que o
site já usa. Nenhum arquivo do site precisou mudar pra parte de comunicação —
`new-program/mqtt-maquina.js` já publica/escuta os tópicos
`soldatech/maquina/*`. O que muda com esta ponte é o CLP passar a responder de
verdade nesses tópicos.

> **Importante — sem sensor de posição:** o eixo Z desta máquina não tem
> encoder/régua, só os fins de curso de cima e de baixo. Por isso a produção
> automática (pontos com Z em mm) continua sendo **simulada no site**, mesmo
> com o CLP conectado. O que este mapa entrega é o espelhamento em tempo real
> de **subindo / descendo / parado / bateu no limite** (o "gêmeo digital" de
> movimento) e o liga/desliga real da mesa giratória.

## 1. Instalar o Node-RED

```powershell
npm install -g node-red
node-red
```

Abra `http://localhost:1880`. Em **Menu → Manage palette → Install**, procure e
instale **`node-red-contrib-modbus`**.

## 2. Importar o flow

**Menu → Import** e selecione `node-red/flows.json`. Depois do import:

1. Abra o nó **"CLP M200 CE24T"** e ajuste `tcpHost` pro IP real do CLP
   (placeholder atual: `192.168.1.50`, porta `502`).
2. Abra o nó **"HiveMQ Cloud - SoldaTech"** e preencha usuário/senha (pra
   testar rápido dá pra usar a mesma credencial hardcoded no site,
   `soldatech-web`; pra produção, crie uma credencial separada no console do
   HiveMQ Cloud restrita a subscribe em `soldatech/maquina/comando` e publish
   em `soldatech/maquina/status` e `soldatech/maquina/erro`).
3. **Deploy**.

## 3. Mapa de registradores (o que falta no ladder)

O M200 CE24T expõe as `%MW` diretamente como holding registers Modbus TCP
(endereço Modbus = número do `%MW`, sem offset).

### Já existe (feito por você, Rung0-9) — nada a mudar

- `%MW0:X0` / `%MW1:X0` / `%MW2:X0` já disparam `%M1`/`%M2`/`%M3` em paralelo
  (OU) com os botões físicos `%I0.5`/`%I0.6`/`%I0.7`.
- A ponte usa isso escrevendo o valor **inteiro** em `%MW2` (`1`=liga mesa,
  `0`=desliga mesa) quando o site manda `MESA_START`/`MESA_STOP`. `%MW0` e
  `%MW1` (sobe/desce) ficam reservados — o site não manda esse comando ainda.

### Falta criar — 7 rungs novos, só leitura, não mexem no Rung0-9

Aloque (se ainda não alocou) `%MW10` e `%MW11` em **Palavras da memória** e
marque "Usado".

| Registrador | Conteúdo |
|---|---|
| `%MW10` bit 0 | `1` = braço subindo (espelho de `%Q0.0`) |
| `%MW10` bit 1 | `1` = braço descendo (espelho de `%Q0.1`) |
| `%MW10` bit 2 | `1` = mesa girando (espelho de `%Q0.2`) |
| `%MW10` bit 3 | `1` = fim de curso de baixo ativo (espelho de `%I0.10`) |
| `%MW10` bit 4 | `1` = fim de curso de cima ativo (espelho de `%I0.11`) |
| `%MW10` bit 5 | `1` = emergência ativa (espelho de `%I0.4`) |
| `%MW11` | heartbeat — contador que só precisa ficar incrementando |

### Rungs em Lista de Instrução (IL) pra colar depois do Rung9

Cada rung novo: clique **+** pra criar um rung, troque o dropdown da
linguagem dele de **LD** pra **IL**, cole a instrução correspondente.

```
RUNG10:
LD %Q0.0
ST %MW10:X0

RUNG11:
LD %Q0.1
ST %MW10:X1

RUNG12:
LD %Q0.2
ST %MW10:X2

RUNG13:
LD %I0.10
ST %MW10:X3

RUNG14:
LD %I0.11
ST %MW10:X4

RUNG15:
LD %I0.4
ST %MW10:X5

RUNG16:
[%MW11:=%MW11+1]
```

Nenhum desses rungs escreve em `%Q`, `%M` ou em qualquer coisa que já existe
— são só cópias de leitura pra dentro de `%MW10`/`%MW11`. Não tem como travar
um fim de curso ou a emergência com isso.

## 4. O que a ponte faz, resumidamente

- **Site → CLP**: `MESA_START`/`MESA_STOP` viram escrita de `1`/`0` em
  `%MW2` (o resto dos comandos, ex. `MOVER_PONTO`, é ignorado pela ponte —
  fica só no log do Node-RED — porque não há como confirmar posição real).
- **CLP → Site**: a cada 300ms, lê `%MW10`/`%MW11` e publica em
  `soldatech/maquina/status`:
  ```json
  {
    "tipo": "STATUS",
    "subindo": true,
    "descendo": false,
    "mesaGirando": false,
    "limiteBaixo": false,
    "limiteCima": false,
    "emergencia": false,
    "timestamp": 1234567890
  }
  ```
  Na borda de subida da emergência, publica também um `ERRO` em
  `soldatech/maquina/erro`.

O site (`new-program/novoprograma.js`) já escuta esse `STATUS` e move o
cabeçote 3D na mesma direção do braço real, travando exatamente no fim de
curso quando ele é atingido — isso roda o tempo todo, não só durante
produção.

## 5. Testar sem o CLP ligado

Com o Node-RED rodando mas o CLP inacessível, os nós de debug "Falha de
comunicação Modbus" aparecem na aba de debug — esperado. Pra simular sem
hardware, injete direto na função "Traduzir %MW10-%MW11 -> MQTT" com um nó
`inject` temporário: `msg.payload = [1, 42]` simula "subindo" (bit0=1);
`[8, 42]` simula fim de curso de baixo atingido (bit3=1).
