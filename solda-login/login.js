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

btnEntrar.addEventListener(
  "click",
  async () => {

    try {

      const credencial =
        await signInWithEmailAndPassword(
          auth,
          email.value,
          senha.value
        );

     const usuario =
  credencial.user;


// ===============================
// BUSCAR DADOS DO USUÁRIO
// ===============================

const usuarioRef =
  ref(
    db,
    `usuarios/${usuario.uid}`
  );


const snapshot =
  await get(usuarioRef);


if (!snapshot.exists()) {

  mensagem.innerHTML =
    "Dados do usuário não encontrados.";

  return;
}


const dadosUsuario =
  snapshot.val();


// ===============================
// SALVAR DADOS DA SESSÃO
// ===============================

sessionStorage.setItem(
  "uid",
  usuario.uid
);

sessionStorage.setItem(
  "empresaId",
  dadosUsuario.empresaId || ""
);

sessionStorage.setItem(
  "tipoUsuario",
  dadosUsuario.tipoUsuario || ""
);

sessionStorage.setItem(
  "nomeUsuario",
  dadosUsuario.nome || ""
);


// ===============================
// LOGIN OK
// ===============================

mensagem.innerHTML =
  "Login realizado!";


console.log(
  "Usuário logado:",
  usuario.uid
);

console.log(
  "Empresa:",
  dadosUsuario.empresaId
);

console.log(
  "Tipo de usuário:",
  dadosUsuario.tipoUsuario
);


window.location.href =
  "../solda-system/index.html";

    } catch(error) {

      mensagem.innerHTML =
        "Email ou senha incorretos";

      console.log(error);
    }
  }
);


// ================= IR PRA CRIAR CONTA =================

btnCriar.addEventListener("click", () => {

  window.location.href =
    "criarConta.html";

});