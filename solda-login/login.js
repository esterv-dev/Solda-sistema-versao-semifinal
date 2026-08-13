import { auth, db } from "./firebase.js";

import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  ref,
  get
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const email = document.getElementById("email");
const senha = document.getElementById("senha");

const btnEntrar = document.getElementById("btnEntrar");
const btnCriar = document.getElementById("btnCriar");

const mensagem = document.getElementById("mensagem");


// ================= LOGIN =================

btnEntrar.addEventListener("click", async () => {

  try{

const credencial =
  await signInWithEmailAndPassword(
    auth,
    email.value,
    senha.value
  );

const usuario =
  credencial.user;

mensagem.innerHTML =
  "Login realizado!";


/*
==========================
VERIFICAR PRODUÇÃO PENDENTE
==========================
*/

try {

  const producaoRef =
    ref(
      db,
      `usuarios/${usuario.uid}/producaoAtual`
    );


  const snapshot =
    await get(producaoRef);


  if (
    snapshot.exists()
  ) {

    const producaoAtual =
      snapshot.val();


    const existeProducaoPendente =
      producaoAtual &&
      (
        producaoAtual.status ===
          "PAUSADO"
        ||
        producaoAtual.status ===
          "EXECUTANDO"
      );


    if (
      existeProducaoPendente
    ) {

      /*
      Existe produção que ainda
      não terminou.

      Vai DIRETO para a máquina 3D.
      */

      window.location.href =
        "../new-program/novoprograma.html";

      return;
    }
  }


  /*
  Não existe produção pendente.
  Abre o menu normalmente.
  */

  window.location.href =
    "../solda-system/index.html";


} catch (erro) {

  console.error(
    "Erro ao verificar produção pendente:",
    erro
  );


  /*
  Se houver erro na consulta,
  não iniciamos máquina nenhuma.

  Vai para o menu normalmente.
  */

  window.location.href =
    "../solda-system/index.html";
}

  }catch(error){

    mensagem.innerHTML = "Email ou senha incorretos";

    console.log(error);
  }

});


// ================= IR PRA CRIAR CONTA =================

btnCriar.addEventListener("click", () => {

  window.location.href =
    "criarConta.html";

});