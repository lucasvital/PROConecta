import { initializeApp } from '@react-native-firebase/app';

const firebaseConfig = {
  // Coloque aqui as configurações do seu google-services.json
  apiKey: "AIzaSyDeL9DhJuUizLecenx-J3IUSXLo06BxLWI",
  authDomain: "pro-conecta.firebaseapp.com",
  projectId: "pro-conecta",
  storageBucket: "pro-conecta.firebasestorage.app",
  messagingSenderId: "324954543058",
  appId: "1:324954543058:android:1ae3e8065637472863ae0b",
  measurementId: "your-measurement-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default app;
