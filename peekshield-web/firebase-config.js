import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDQlsuNfu60uQ0f4aOwE_1T1gLEmHA9DEA",
  authDomain: "appmoviles-81078.firebaseapp.com",
  projectId: "appmoviles-81078",
  storageBucket: "appmoviles-81078.firebasestorage.app"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
