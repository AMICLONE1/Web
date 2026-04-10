// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB3uL_n_Y1aKfA7zdbmI23oj2dsdLmtHoM",
  authDomain: "bmsflash-a1c55.firebaseapp.com",
  databaseURL:
    "https://bmsflash-a1c55-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bmsflash-a1c55",
  storageBucket: "bmsflash-a1c55.firebasestorage.app",
  messagingSenderId: "988844241003",
  appId: "1:988844241003:web:3d0995cd3350c2e2d6c12e",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
