/* -------------------- FIREBASE CONFIG -------------------- */
const firebaseConfig = {
  apiKey: "AIzaSyBRxFNnPe-6mDDYcFU0wCJiIIyjx6YD9vY",
  authDomain: "crimenews-3e31a.firebaseapp.com",
  projectId: "crimenews-3e31a",
  storageBucket: "crimenews-3e31a.appspot.com",
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

/* ----------- CAPTURAR ELEMENTOS DO HTML ----------------- */

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const suggestForm = document.getElementById("suggestForm");
const postForm = document.getElementById("postForm");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");

const registerEmail = document.getElementById("registerEmail");
const registerPassword = document.getElementById("registerPassword");
const registerUsername = document.getElementById("registerUsername");

const suggestTitle = document.getElementById("suggestTitle");
const suggestContent = document.getElementById("suggestContent");

const postTitle = document.getElementById("postTitle");
const postContent = document.getElementById("postContent");
const postImageURL = document.getElementById("postImageURL");

const logoutBtn = document.getElementById("logoutBtn");
const darkModeToggle = document.getElementById("darkModeToggle");
const userDisplay = document.getElementById("userDisplay");

/* -------------------- TROCAR PÁGINAS -------------------- */
function showPage(id) {
    document.querySelectorAll(".page").forEach(sec => sec.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
}

/* ------------------------- LOGIN --------------------------- */
if (loginForm) {
    loginForm.addEventListener("submit", async e => {
        e.preventDefault();

        try {
            await auth.signInWithEmailAndPassword(loginEmail.value, loginPassword.value);
            showPage("home");
        } catch (err) {
            alert(err.message);
        }
    });
}

/* ----------------------- REGISTRO -------------------------- */
if (registerForm) {
    registerForm.addEventListener("submit", async e => {
        e.preventDefault();

        try {
            const cred = await auth.createUserWithEmailAndPassword(
                registerEmail.value,
                registerPassword.value
            );

            await db.collection("usuarios").doc(cred.user.uid).set({
                email: registerEmail.value,
                username: registerUsername.value
            });

            showPage("home");
        } catch (err) {
            alert(err.message);
        }
    });
}

/* -------------------------- SAIR --------------------------- */
logoutBtn.addEventListener("click", () => auth.signOut());

/* ------ MOSTRAR NOME DO USUÁRIO LOGADO E BOTÕES ----------- */
auth.onAuthStateChanged(async user => {

    const loginBtn = document.getElementById("loginBtn");
    const registerBtn = document.getElementById("registerBtn");

    if (user) {
        logoutBtn.classList.remove("hidden");
        userDisplay.classList.remove("hidden");
        loginBtn.classList.add("hidden");
        registerBtn.classList.add("hidden");

        const snap = await db.collection("usuarios").doc(user.uid).get();
        const nome = snap.exists ? snap.data().username : user.email;

        userDisplay.innerText = "👤 " + nome;

    } else {
        logoutBtn.classList.add("hidden");
        userDisplay.classList.add("hidden");
        loginBtn.classList.remove("hidden");
        registerBtn.classList.remove("hidden");
    }
});

/* -------------------- CARREGAR NOTÍCIAS -------------------- */
function carregarNoticias() {
    db.collection("noticias")
    .orderBy("timestamp", "desc")
    .onSnapshot(snapshot => {

        let html = "";

        snapshot.forEach(doc => {
            const n = doc.data();

            html += `
                <div class="noticia">
                    <h3>${n.titulo}</h3>
                    <img src="${n.imagem}" style="width:100%; border-radius:6px;">
                    <p>${n.conteudo}</p>
                    <small>Autor: ${n.autor}</small>
                </div>
            `;
        });

        document.getElementById("newsList").innerHTML = html;
    });
}

carregarNoticias();

/* ---------------------- SUGESTÕES ------------------------- */
if (suggestForm) {
    suggestForm.addEventListener("submit", e => {
        e.preventDefault();

        db.collection("sugestoes").add({
            titulo: suggestTitle.value,
            conteudo: suggestContent.value,
            timestamp: new Date()
        });

        alert("Sugestão enviada!");
    });
}

/* ------------- PUBLICAR NOTÍCIA COM URL DA IMAGEM ---------- */
postForm.addEventListener("submit", async e => {
    e.preventDefault();

    if (!auth.currentUser) {
        alert("Você precisa estar logado!");
        return;
    }

    const snap = await db.collection("usuarios").doc(auth.currentUser.uid).get();
    const autor = snap.exists ? snap.data().username : auth.currentUser.email;

    db.collection("noticias").add({
        titulo: postTitle.value,
        conteudo: postContent.value,
        imagem: postImageURL.value,
        autor: autor,
        timestamp: new Date()
    });

    alert("Notícia publicada!");
});

/* ---------------------- MODO ESCURO ------------------------ */
darkModeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
});
