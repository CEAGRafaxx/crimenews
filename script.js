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
                const noticia = doc.data();
                html += `
                    <div class="noticia" onclick="abrirNoticia('${doc.id}')">
                        <h3>${noticia.titulo}</h3>
                        <img src="${noticia.imagem}" style="width:100%; border-radius:6px;">
                        <p>${noticia.conteudo.substring(0,120)}...</p>
                        <small>Clique para ver mais</small>
                    </div>
                `;
            });

            newsList.innerHTML = html;
        });
}


carregarNoticias();

async function abrirNoticia(id) {
    const doc = await db.collection("noticias").doc(id).get();
    if (!doc.exists) return;

    const noticia = doc.data();

    document.getElementById("viewPostContent").innerHTML = `
        <h2>${noticia.titulo}</h2>
        <img src="${noticia.imagem}" style="width:100%; border-radius:6px;">
        <p>${noticia.conteudo}</p>
        <small>Autor: ${noticia.autor}</small>
    `;

    window.currentPostId = id;

    carregarComentarios(id);

    showPage("viewPost");
}

function carregarComentarios(postId) {
    db.collection("noticias").doc(postId)
        .collection("comentarios")
        .orderBy("timestamp", "asc")
        .onSnapshot(snapshot => {
            let html = "";

            snapshot.forEach(doc => {
                const c = doc.data();
                html += `
                    <div class="comentario">
                        <strong>${c.autor}</strong>
                        <p>${c.texto}</p>
                        <small>${c.timestamp.toDate().toLocaleString()}</small>
                    </div>
                `;
            });

            document.getElementById("commentsList").innerHTML = html;
        });
}

document.getElementById("commentForm").addEventListener("submit", async e => {
    e.preventDefault();

    if (!auth.currentUser) {
        alert("Você precisa estar logado para comentar.");
        return;
    }

    const texto = document.getElementById("commentText").value;
    const postId = window.currentPostId;

    const userDoc = await db.collection("usuarios").doc(auth.currentUser.uid).get();
    const autor = userDoc.exists ? userDoc.data().username : auth.currentUser.email;

    db.collection("noticias").doc(postId)
      .collection("comentarios")
      .add({
          texto: texto,
          autor: autor,
          timestamp: new Date()
      });

    document.getElementById("commentText").value = "";
});


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
/* ---------------- PAINEL DE SUGESTÕES ---------------- */

function carregarSugestoes() {
    const container = document.getElementById("suggestionsList");

    db.collection("sugestoes")
      .orderBy("timestamp", "desc")
      .onSnapshot(snapshot => {

        if (snapshot.empty) {
            container.innerHTML = "<p>Nenhuma sugestão enviada ainda.</p>";
            return;
        }

        let html = "";

        snapshot.forEach(doc => {
            const sug = doc.data();
            const data = sug.timestamp ? sug.timestamp.toDate().toLocaleString() : "data desconhecida";

            html += `
                <div class="sug-item">
                    <h3>${sug.titulo}</h3>
                    <p>${sug.conteudo}</p>
                    <span class="dataSug">${data}</span>
                    <hr>
                </div>
            `;
        });

        container.innerHTML = html;
    });
}

carregarSugestoes();
