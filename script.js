// ----------------- Firebase Config -----------------
const firebaseConfig = {
    apiKey: "AIzaSyDmp-ShGFWDC6RsiXsNUdAsokBjgXfQijc",
    authDomain: "keepsafe-90397.firebaseapp.com",
    projectId: "keepsafe-90397",
    storageBucket: "keepsafe-90397.appspot.com",
    messagingSenderId: "155400159752",
    appId: "1:155400159752:web:6c8996570456c4ea8387bd",
    measurementId: "G-MSJRFRLSJY"
};

// Init Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// ⭐ FIX: Cache DOM elements
const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");
const email = document.getElementById("email");
const password = document.getElementById("password");
const documentsList = document.getElementById("documentsList");
const docTitle = document.getElementById("docTitle");
const docContent = document.getElementById("docContent");

// ---------------- Authentication ----------------

document.getElementById("signupBtn").onclick = () => {
    auth.createUserWithEmailAndPassword(email.value, password.value)
        .catch(err => alert(err.message));
};

document.getElementById("loginBtn").onclick = () => {
    auth.signInWithEmailAndPassword(email.value, password.value)
        .catch(err => alert(err.message));
};

document.getElementById("logoutBtn").onclick = () => auth.signOut();

auth.onAuthStateChanged(user => {
    if (user) {
        authSection.style.display = "none";
        appSection.style.display = "block";
        loadDocuments();
    } else {
        authSection.style.display = "block";
        appSection.style.display = "none";
    }
});

// ---------------- Firestore Document Logic ----------------

let currentDocId = null;

function loadDocuments() {
    db.collection("documents")
      .orderBy("timestamp")
      .onSnapshot(snapshot => {

        documentsList.innerHTML = "";

        snapshot.forEach(doc => {
            let li = document.createElement("li");
            li.innerText = doc.data().title;
            li.onclick = () => openDocument(doc.id);
            documentsList.appendChild(li);
        });
    });
}

document.getElementById("newDoc").onclick = () => {
    db.collection("documents").add({
        title: "Untitled Document",
        content: "",
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
};

function openDocument(docId) {
    currentDocId = docId;

    db.collection("documents").doc(docId)
      .onSnapshot(doc => {
        docTitle.value = doc.data().title;
        docContent.value = doc.data().content;
    });
}

// Auto-save when typing
docTitle.oninput = docContent.oninput = () => {
    if (!currentDocId) return;

    db.collection("documents").doc(currentDocId).update({
        title: docTitle.value,
        content: docContent.value
    });
};



