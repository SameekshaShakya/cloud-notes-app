🛡️ KeepSafe – Secure Cloud Notes App
A Cloud-Synced, Offline-Ready, Installable PWA for taking secure notes

KeepSafe is a modern, secure note-taking web application built with Firebase Authentication, Firestore, and Progressive Web App (PWA) features.
It supports offline mode, auto-save, real-time sync, and Add to Home Screen installation on mobile & desktop.

🚀 Features
🔐 Authentication
Email + Password login
New user signup
Secure password change
Logout & profile menu

📝 Notes System
Create, update, delete notes
Auto-save with debounce
Real-time Firestore sync across devices
Per-user note isolation
Download note as .txt
Copy/share note easily

📱 PWA Features (Progressive Web App)
Install App button
Custom install popup
Works 100% offline
Service Worker caching
Splash screen + App icon
PWA-optimized manifest
Maskable + transparent + standard icons
Works like a native app on Android, Windows, macOS

⚡ Offline Support
Firestore offline persistence (enablePersistence)

Service Worker caching:
HTML
JS
CSS
Icons
Manifest
Full offline reading + editing
Data syncs automatically when online again

🧰 Tech Stack
Layer	Technology
Frontend	HTML, CSS, JavaScript
Auth	Firebase Authentication
Database	Firebase Firestore
Hosting	Firebase Hosting
Offline	Service Worker + Cache API
Installation	Web App Manifest (PWA)
📦 Project Structure
cloud-notes-app/
│── index.html
│── style.css
│── script.js
│── sw.js
│── manifest.json
│── /icons
│     ├── icon-192.png
│     ├── icon-512.png
│     ├── icon-maskable.png
│     └── icon-transparent.png
│── /firebase.json
│── /404.html

📲 Installation (User)
Install as App (Mobile/Desktop)
Open the website
Click “Install App” button
OR from the browser menu → “Install KeepSafe”
Works like a native app with no browser bar

🔧 Run or Deploy
Deploy to Firebase
firebase deploy

Local preview
firebase serve

🧾 How It Works
🔐 Authentication Flow
Firebase Auth tracks login state
onAuthStateChanged() switches UI between login & notes

📝 Notes Flow
Notes stored under:
users/{userId}/notes/{noteId}
Real-time listeners keep notes updated
Auto-save every 700ms while typing

🌐 Offline Mode
Firestore caches writes & reads locally
Service Worker caches app shell assets
App loads even with no internet

🎨 UI Enhancements
Header logo added
Minimal clean teal/yellow/black theme
Responsive sidebar + editor
Smooth fade animations

🖼️ Branding
Custom cloud-note-lock logo
Maskable icons for Android
Splash screen support in manifest

🛠️ Future Improvements
Folder-based note organization
Tag system
Voice notes
Encrypted local storage mode
Reminder notifications

👩‍💻 Author
Sameeksha Shakya
