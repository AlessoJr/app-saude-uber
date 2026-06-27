const firebaseConfig = {
  apiKey: "AIzaSyAGLWTSjLaWw3Y3i1JK9F4mvrW0jR2J8bA",
  authDomain: "app-saude-uber.firebaseapp.com",
  projectId: "app-saude-uber",
  storageBucket: "app-saude-uber.firebasestorage.app",
  messagingSenderId: "750658373068",
  appId: "1:750658373068:web:ce183222601f8601134969"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
