
// Firebase CDN (use one version consistently)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendPasswordResetEmail, signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import {
  getFirestore, doc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// >>> My real web config (from Project settings → Web app)
const firebaseConfig = {
  apiKey: "AIzaSyCwGg2TiDWEgcoHfRxnsxMnJ1jqH5gGrbo",
  authDomain: "boundarysystem-7fc99.firebaseapp.com",
  projectId: "boundarysystem-7fc99",
  storageBucket: "boundarysystem-7fc99.firebasestorage.app",
  messagingSenderId: "641478149005",
  appId: "1:641478149005:web:c62f876f28d1ab71f5f3c4",
  measurementId: "G-7LY3K4G94K"
};

// One and only initialization
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// (You can continue wiring the overlay here)
// Create profile on first sign-up:
async function createProfile(uid, email) {
  await setDoc(doc(db, "users", uid), { ownerId: uid, email, createdAt: serverTimestamp() });
}

// Expose logout for UI
window.appSignOut = () => signOut(auth);

// Example handlers (hook these to the overlay UI you added)
window.__signIn = (email, pass) => signInWithEmailAndPassword(auth, email, pass);
window.__signUp = async (email, pass) => {
  const { user } = await createUserWithEmailAndPassword(auth, email, pass);
  await createProfile(user.uid, email);
  return user;
};
window.__reset = (email) => sendPasswordResetEmail(auth, email);

// Gate visibility
console.log("Setting up onAuthStateChanged listener...");
onAuthStateChanged(auth, (user) => {
  console.log("onAuthStateChanged callback fired. User:", user);
  const gate = document.getElementById('firebase-auth-gate-container'); // overlay div
  // Hide legacy login if present
  const legacy = document.querySelector('#auth-screen');
  console.log("Hiding legacy screen:", legacy);
  legacy?.style.setProperty('display','none','important');

  if (user) {
    console.log("User is authenticated. Hiding gate.");
    gate && (gate.style.display = 'none');
    // Show the main app content
    const appContainer = document.getElementById('app');
    if(appContainer) appContainer.classList.remove('hidden');

    // Dispatch a custom event to let the main app know we're authenticated
    window.dispatchEvent(new CustomEvent('firebase-authenticated'));

  } else {
    console.log("User is not authenticated. Showing gate.");
    gate && (gate.style.display = 'flex');
  }
});
console.log("onAuthStateChanged listener is set.");

// Handle the signup form submission
const signupForm = document.getElementById('signup-form');
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const errorDiv = document.getElementById('signup-error');
  try {
    await window.__signUp(email, password);
    // The onAuthStateChanged listener will handle hiding the form
  } catch (error) {
    console.error("Signup error:", error);
    errorDiv.textContent = error.message;
  }
});

// Handle the login form submission
const loginForm = document.getElementById('login-form');
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const errorDiv = document.getElementById('login-error');
  try {
    await window.__signIn(email, password);
    // The onAuthStateChanged listener will handle hiding the form
  } catch (error) {
    console.error("Login error:", error);
    errorDiv.textContent = error.message;
  }
});

// Handle forgot password
document.getElementById('forgot-password').addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    if (!email) {
        alert('Please enter your email address in the email field to reset your password.');
        return;
    }
    try {
        await window.__reset(email);
        alert('Password reset email sent! Please check your inbox.');
    } catch (error) {
        console.error("Password reset error:", error);
        document.getElementById('login-error').textContent = error.message;
    }
});


// Toggle between login and signup forms
const loginContainer = document.getElementById('login-container');
const signupContainer = document.getElementById('signup-container');
document.getElementById('show-login').addEventListener('click', (e) => {
  e.preventDefault();
  signupContainer.style.display = 'none';
  loginContainer.style.display = 'block';
});
document.getElementById('show-signup').addEventListener('click', (e) => {
  e.preventDefault();
  loginContainer.style.display = 'none';
  signupContainer.style.display = 'block';
});

// Sanity log for debugging in DevTools
console.log('apiKey starts with:', firebaseConfig.apiKey?.slice(0,5));
