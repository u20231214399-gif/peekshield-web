const firebaseConfig = {
  apiKey: "AIzaSyDQlsuNfu60uQ0f4aOwE_1T1gLEmHA9DEA",
  authDomain: "appmoviles-81078.firebaseapp.com",
  projectId: "appmoviles-81078",
  storageBucket: "appmoviles-81078.firebasestorage.app"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Face++ credentials
const FACEPP_KEY = "emeeMX6PjmIr4SVUGE-dI7N1WYc1MQsH";
const FACEPP_SECRET = "viqVQaj-5yw6879NCxFDyEwdS5qH1Hz_";
const FACEPP_FACESET = "peekshield_estudiantes";
