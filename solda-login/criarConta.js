import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  ref,
  set
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const nome = document.getElementById("nome");
const cpf = document.getElementById("cpf");
const cargo = document.getElementById("cargo");
const email = document.getElementById("email");
const senha = document.getElementById("senha");

const btnCadastrar =
  document.getElementById("btnCadastrar");

btnCadastrar.addEventListener("click", async () => {

  try {

    const credencial =
      await createUserWithEmailAndPassword(
        auth,
        email.value,
        senha.value
      );

    await set(
      ref(db, "usuarios/" + credencial.user.uid),
      {
        nome: nome.value,
        cpf: cpf.value,
        cargo: cargo.value,
        email: email.value
      }
    );

    alert("Conta criada!");

    window.location.href = "login.html";

  } catch (error) {

    console.error(error);
    alert(error.message);

  }

});