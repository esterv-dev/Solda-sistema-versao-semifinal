// ======================================================
// FIREBASE
// ======================================================

import { auth, db } from "../solda-login/firebase.js";
import {
  getDatabase,
  ref,
  get
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";



// ======================================================
// VERIFICA LOGIN
// ======================================================

auth.onAuthStateChanged(async (user) => {

  if (!user) {

    window.location.href = "../solda-login/login.html";
    return;

  }

  const uid = user.uid;

  try {

    const snapshot = await get(ref(db, "usuarios/" + uid));

    if (snapshot.exists()) {

      const dados = snapshot.val();

     document.getElementById("nomeUsuario").innerText =
  dados.nome || "Usuário";

document.getElementById("tipoUsuario").innerText =
  dados.cargo || "Operador";

    }

  } catch (erro) {

    console.error("Erro ao buscar dados:", erro);

  }

});
