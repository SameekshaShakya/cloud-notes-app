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

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// Enable Offline Persistence
firebase.firestore().enablePersistence({ synchronizeTabs: true })
  .then(() => console.log("[Firestore] Offline enabled"))
  .catch((err) => console.log("[Firestore] Persistence error:", err.code));


// ---------------- DOM ELEMENTS ----------------
const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");

const email = document.getElementById("email");
const password = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");

const newDocBtn = document.getElementById("newDoc");
const documentsList = document.getElementById("documentsList");
const docTitle = document.getElementById("docTitle");
const docContent = document.getElementById("docContent");

const deleteBtn = document.getElementById("deleteBtn");
const downloadBtn = document.getElementById("downloadBtn");
const shareBtn = document.getElementById("shareBtn");

const profileBtn = document.getElementById("profileBtn");
const profileMenu = document.getElementById("profileMenu");
const changePassBtn = document.getElementById("changePassBtn");
const signoutBtn = document.getElementById("signoutBtn");

const modal = document.getElementById("changePasswordModal");
const savePassBtn = document.getElementById("savePassBtn");
const cancelPassBtn = document.getElementById("cancelPassBtn");
const currentPassword = document.getElementById("currentPassword");
const newPassword = document.getElementById("newPassword");
const confirmPassword = document.getElementById("confirmPassword");
const passMsg = document.getElementById("passMsg");

// NEW PWA ELEMENTS (auto created)
let deferredPrompt;
let installPopup;
let offlineBadge;
let updatePopup;


// ---------------- AUTH ----------------
signupBtn.onclick = () => {
  const e = email.value.trim(), p = password.value;
  if (!e || !p) return alert("Enter email & password");
  auth.createUserWithEmailAndPassword(e, p).catch(err => alert(err.message));
};

loginBtn.onclick = () => {
  const e = email.value.trim(), p = password.value;
  if (!e || !p) return alert("Enter email & password");
  auth.signInWithEmailAndPassword(e, p).catch(err => alert(err.message));
};

signoutBtn.onclick = () => auth.signOut();

// Profile dropdown
profileBtn.onclick = () => profileMenu.classList.toggle("hidden");

document.addEventListener("click", (e) => {
  if (!profileBtn.contains(e.target))
    profileMenu.classList.add("hidden");
});

// Auth listener
auth.onAuthStateChanged(user => {
  if (user) {
    currentUserId = user.uid;
    authSection.style.display = "none";
    appSection.style.display = "flex";
    startListeningNotes();

    // After login → download all cache for offline
    requestOfflineCache();
  } else {
    currentUserId = null;
    appSection.style.display = "none";
    authSection.style.display = "flex";
    stopListeningNotes();
  }
});


// ---------------- NOTES LOGIC (unchanged) ----------------
// (Keeping your entire Firestore notes code exactly the same as before)

let currentUserId = null;
let currentDocId = null;
let notesUnsubscribe = null;

function startListeningNotes() {
  if (notesUnsubscribe) notesUnsubscribe();

  const notesRef = db.collection("users").doc(currentUserId).collection("notes");

  notesUnsubscribe = notesRef.orderBy("timestamp", "desc").onSnapshot(snapshot => {
    documentsList.innerHTML = "";

    snapshot.forEach(doc => {
      const li = document.createElement("li");
      li.textContent = doc.data().title || "Untitled";
      li.dataset.id = doc.id;
      li.onclick = () => openDocument(doc.id);
      if (doc.id === currentDocId) li.classList.add("active");
      documentsList.appendChild(li);
    });
  });
}

function stopListeningNotes() {
  if (notesUnsubscribe) notesUnsubscribe();
  documentsList.innerHTML = "";
}

newDocBtn.onclick = () => {
  if (!currentUserId) return alert("Login first");

  db.collection("users")
    .doc(currentUserId)
    .collection("notes")
    .add({
      title: "New Note",
      content: "",
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
};

function openDocument(id) {
  currentDocId = id;

  const ref = db.collection("users").doc(currentUserId).collection("notes").doc(id);

  ref.get().then(doc => {
    docTitle.value = doc.data().title || "";
    docContent.value = doc.data().content || "";
  });

  ref.onSnapshot(doc => {
    docTitle.value = doc.data().title || "";
    docContent.value = doc.data().content || "";
  });
}

let saveTimer = null;
function scheduleSave() {
  if (!currentDocId) return;

  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    db.collection("users")
      .doc(currentUserId)
      .collection("notes")
      .doc(currentDocId)
      .update({
        title: docTitle.value,
        content: docContent.value
      });
  }, 700);
}

docTitle.oninput = scheduleSave;
docContent.oninput = scheduleSave;

deleteBtn.onclick = () => {
  if (!currentDocId) return alert("Select a note first");

  db.collection("users")
    .doc(currentUserId)
    .collection("notes")
    .doc(currentDocId)
    .delete();

  currentDocId = null;
  docTitle.value = "";
  docContent.value = "";
};

downloadBtn.onclick = () => {
  if (!currentDocId) return alert("Select a note first");
  const text = `${docTitle.value}\n\n${docContent.value}`;
  const blob = new Blob([text], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = docTitle.value || "note.txt";
  a.click();
};

shareBtn.onclick = () => {
  navigator.clipboard.writeText(docContent.value);
  alert("Copied!");
};


// ---------------- CHANGE PASSWORD ----------------
changePassBtn.onclick = () => {
  modal.classList.remove("hidden");
};
cancelPassBtn.onclick = () => modal.classList.add("hidden");

savePassBtn.onclick = () => {
  const user = auth.currentUser;
  if (!user) return;

  const cred = firebase.auth.EmailAuthProvider.credential(
    user.email,
    currentPassword.value
  );

  user.reauthenticateWithCredential(cred)
    .then(() => user.updatePassword(newPassword.value))
    .then(() => {
      passMsg.textContent = "Password updated!";
      setTimeout(() => modal.classList.add("hidden"), 1200);
    })
    .catch(err => passMsg.textContent = err.message);
};


// ----------------------------------------------------
// --------------------- PWA LOGIC --------------------
// ----------------------------------------------------

/* ---------- 1. REGISTER SERVICE WORKER ---------- */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").then(reg => {
    console.log("[SW] Registered", reg);

    // Detect new SW waiting
    if (reg.waiting) showUpdatePopup(reg.waiting);

    reg.addEventListener("updatefound", () => {
      const newWorker = reg.installing;
      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          showUpdatePopup(newWorker);
        }
      });
    });
  });
}


/* ---------- 2. INSTALL POPUP (A2HS) ---------- */
window.addEventListener("load", () => {
  const s = document.getElementById("webSplash");
  setTimeout(() => s.style.opacity = 0, 300); 
  setTimeout(() => s.remove(), 800);
});


// Create popup UI
function showInstallPopup() {
  if (installPopup) installPopup.remove();

  installPopup = document.createElement("div");
  installPopup.className = "install-popup";
  installPopup.innerHTML = `
    <div class="install-box">
      <img src="/icons/icon-192.png" class="install-logo">
      <h3>Install KeepSafe</h3>
      <p>Use it offline on your device.</p>
      <button id="installBtn" class="btn full">Install App</button>
      <button id="closeInstall" class="btn ghost full">Maybe later</button>
    </div>
  `;
  document.body.appendChild(installPopup);

  document.getElementById("installBtn").onclick = async () => {
    installPopup.remove();
    deferredPrompt.prompt();
    deferredPrompt = null;
  };
  document.getElementById("closeInstall").onclick = () => installPopup.remove();
}


/* ---------- 3. OFFLINE READY BADGE ---------- */
function requestOfflineCache() {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage("downloadOffline");
    showOfflineBadge();
  }
}

function showOfflineBadge() {
  if (offlineBadge) offlineBadge.remove();

  offlineBadge = document.createElement("div");
  offlineBadge.className = "offline-badge";
  offlineBadge.textContent = "✓ Ready offline";
  document.body.appendChild(offlineBadge);

  setTimeout(() => offlineBadge.remove(), 3000);
}


/* ---------- 4. UPDATE POPUP WHEN NEW SW AVAILABLE ---------- */
function showUpdatePopup(worker) {
  if (updatePopup) updatePopup.remove();

  updatePopup = document.createElement("div");
  updatePopup.className = "update-popup";
  updatePopup.innerHTML = `
    <div class="update-box">
      <p>New version available</p>
      <button id="updateNow" class="btn full">Update</button>
    </div>
  `;
  document.body.appendChild(updatePopup);

  document.getElementById("updateNow").onclick = () => {
    worker.postMessage("skipWaiting");
    updatePopup.remove();
  };

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    window.location.reload();
  });
}











