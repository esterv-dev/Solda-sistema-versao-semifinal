import { auth } from "./firebase.js";

import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const email = document.getElementById("email");
const senha = document.getElementById("senha");

const btnEntrar = document.getElementById("btnEntrar");
const btnCriar = document.getElementById("btnCriar");

const mensagem = document.getElementById("mensagem");


// ================= LOGIN =================

btnEntrar.addEventListener("click", async () => {

  try{

    await signInWithEmailAndPassword(
      auth,
      email.value,
      senha.value
    );

    mensagem.innerHTML = "Login realizado!";

    // próxima página
 window.location.href = "../solda-system/index.html";

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