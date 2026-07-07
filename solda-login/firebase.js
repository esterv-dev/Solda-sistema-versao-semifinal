import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDB8QbUeXwx_-dmtly0_0GE2ieCwvnYVGc",
  authDomain: "projeto-solda.firebaseapp.com",
  databaseURL: "https://projeto-solda-default-rtdb.firebaseio.com",
  projectId: "projeto-solda",
  storageBucket: "projeto-solda.firebasestorage.app",
  messagingSenderId: "355208250825",
  appId: "1:355208250825:web:92ddd629ace90ae38f5418"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getDatabase(app);

export { auth, db };