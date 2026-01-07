import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // 務必確認有這行
import { getStorage } from "firebase/storage"; // Storage for image uploads

// 你的設定 (我幫你填好了)
const firebaseConfig = {
  apiKey: "AIzaSyD0UxYcX9LMILCI0THl4hb5T31NZltDz3k",
  authDomain: "p-m-s-5d2f9.firebaseapp.com",
  projectId: "p-m-s-5d2f9",
  storageBucket: "p-m-s-5d2f9.firebasestorage.app",
  messagingSenderId: "939707525340",
  appId: "1:939707525340:web:053c36c8d51a95354d6c19",
  measurementId: "G-Y7MKT3N4QG"
};

// 1. 初始化
const app = initializeApp(firebaseConfig);

// 2. ★ 關鍵：匯出 db (資料庫)、auth (驗證)、storage (儲存)
export const auth = getAuth(app);
export const db = getFirestore(app); // App.tsx 就是在找這個，找不到就會黑畫面！
export const storage = getStorage(app); // For image uploads
export const firebaseInitError = null;

// 3. 建立使用者功能
export const createSecondaryUser = async (email: string, password: string): Promise<string> => {
  if (!auth) throw new Error("Firebase 尚未初始化");

  const secondaryAppName = `secondaryApp-${Date.now()}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    await signOut(secondaryAuth);
    return userCredential.user.uid;
  } catch (error) {
    throw error;
  }
};