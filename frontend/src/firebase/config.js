import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: "AIzaSyDf2w3fl9abY-9Q6IKH7rDAIQ4LTOB4i-M",
  authDomain: "datadict-85106.firebaseapp.com",
  projectId: "datadict-85106",
  storageBucket: "datadict-85106.firebasestorage.app",
  messagingSenderId: "664523635506",
  appId: "1:664523635506:web:e4cd81166cd12860be752b",
  measurementId: "G-D79TT3K0DQ"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null

export default app
