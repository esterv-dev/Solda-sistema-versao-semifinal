import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  ref,
  update,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const nome = document.getElementById("nome");
const cpf = document.getElementById("cpf");
const empresa =
  document.getElementById("empresa");
const email = document.getElementById("email");
const senha = document.getElementById("senha");

const btnCadastrar =
  document.getElementById("btnCadastrar");

btnCadastrar.addEventListener(
  "click",
  async () => {

    try {

      // ==============================
      // VALIDAR CAMPOS
      // ==============================

      if (
        !nome.value.trim() ||
        !cpf.value.trim() ||
        !empresa.value.trim() ||
        !email.value.trim() ||
        !senha.value
      ) {

        alert(
          "Preencha todos os campos."
        );

        return;
      }


      // ==============================
      // CRIAR ADMIN NO AUTH
      // ==============================

      const credencial =
        await createUserWithEmailAndPassword(
          auth,
          email.value.trim(),
          senha.value
        );


      const uid =
        credencial.user.uid;


      // ==============================
      // ID DA EMPRESA
      // ==============================

      const empresaId =
        "empresa_" + uid;


      // ==============================
      // EMPRESA
      // ==============================

      const dadosEmpresa = {

        nome:
          empresa.value.trim(),

        adminUid:
          uid,

        criadoEm:
          Date.now()

      };


      // ==============================
      // ADMINISTRADOR
      // ==============================

      const dadosUsuario = {

        nome:
          nome.value.trim(),

        cpf:
          cpf.value.trim(),

        email:
          email.value.trim(),

        empresaId:
          empresaId,

        tipoUsuario:
          "admin",

        criadoEm:
          Date.now()

      };


      // ==============================
      // SALVAR
      // ==============================

      const atualizacoes = {};


      atualizacoes[
        `empresas/${empresaId}`
      ] = dadosEmpresa;


      atualizacoes[
        `usuarios/${uid}`
      ] = dadosUsuario;


      await update(
        ref(db),
        atualizacoes
      );


      alert(
        "Empresa e administrador criados com sucesso!"
      );


      window.location.href =
        "login.html";


    } catch (error) {

      console.error(
        "Erro ao criar empresa:",
        error
      );

      alert(
        error.message
      );

    }

  }
);