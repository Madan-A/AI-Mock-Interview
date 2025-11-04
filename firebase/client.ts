// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";




// Import the functions you need from the SDKs you need


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCi-8dGfFYJi2SE9HBhSuFkufCs7jFxn3I",
  authDomain: "prepwise-73047.firebaseapp.com",
  projectId: "prepwise-73047",
  storageBucket: "prepwise-73047.firebasestorage.app",
  messagingSenderId: "521012547049",
  appId: "1:521012547049:web:17e428cf37da235b2d4f78",
  measurementId: "G-SFSW0CD6WG"
};

// Initialize Firebase

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
