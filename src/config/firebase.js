// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBN3khxqaQpC8Ws9EQ7syvnPC_rLasMOL0",
  authDomain: "flightlog-82a3c.firebaseapp.com",
  projectId: "flightlog-82a3c",
  storageBucket: "flightlog-82a3c.firebasestorage.app",
  messagingSenderId: "959347389178",
  appId: "1:959347389178:web:f175b4aac3b755b71d8f43",
  measurementId: "G-CDV75B04DY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
// Force Google to show account picker every time
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const GOOGLE_CLIENT_ID = "870884007039-9got7ia77t611u2fugedlq6j7kftf51p.apps.googleusercontent.com";
export const GOOGLE_API_KEY = "AIzaSyArv6AbTjFIM_nuCm4VKZAZTdfP_y2G0ag";
export const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"];
export const SCOPES = "https://www.googleapis.com/auth/gmail.readonly";
