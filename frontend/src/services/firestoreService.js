import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  setDoc
} from 'firebase/firestore'
import { db } from '../firebase/config'

// ── Chat History ────────────────────────────────────────────
const CHATS_COLLECTION = 'chats'

export async function getUserChats(userId) {
  const q = query(
    collection(db, CHATS_COLLECTION),
    where('userId', '==', userId)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => {
      const aTime = a.updatedAt?.toMillis?.() || a.updatedAt?.seconds * 1000 || 0
      const bTime = b.updatedAt?.toMillis?.() || b.updatedAt?.seconds * 1000 || 0
      return bTime - aTime
    })
}

export async function getChatsByTable(userId, connId, schema, table) {
  let q = query(
    collection(db, CHATS_COLLECTION),
    where('userId', '==', userId)
  )
  
  if (connId) {
    q = query(q, where('connId', '==', connId))
  }
  if (table) {
    q = query(q, where('table', '==', table))
  }
  
  const snapshot = await getDocs(q)
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0))
}

export async function createChat(userId, chatData) {
  const docRef = await addDoc(collection(db, CHATS_COLLECTION), {
    ...chatData,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateChat(chatId, messages, title) {
  const chatRef = doc(db, CHATS_COLLECTION, chatId)
  await updateDoc(chatRef, {
    messages,
    title,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteChat(chatId) {
  await deleteDoc(doc(db, CHATS_COLLECTION, chatId))
}

export async function getChat(chatId) {
  const docSnap = await getDoc(doc(db, CHATS_COLLECTION, chatId))
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() }
  }
  return null
}

// ── User Connections ────────────────────────────────────────
const CONNECTIONS_COLLECTION = 'connections'

export async function getUserConnections(userId) {
  const q = query(
    collection(db, CONNECTIONS_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export async function saveUserConnection(userId, connectionData) {
  // Store connection in Firestore (without sensitive data like password)
  const docRef = await addDoc(collection(db, CONNECTIONS_COLLECTION), {
    userId,
    name: connectionData.name,
    db_type: connectionData.db_type,
    host: connectionData.host,
    port: connectionData.port,
    database: connectionData.database,
    username: connectionData.username,
    // Note: We don't store the actual password in Firestore for security
    // The backend handles the actual connection
    backendId: connectionData.id, // Reference to backend connection ID
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function deleteUserConnection(connectionId) {
  await deleteDoc(doc(db, CONNECTIONS_COLLECTION, connectionId))
}

// ── User Preferences ────────────────────────────────────────
const USERS_COLLECTION = 'users'

export async function getUserPreferences(userId) {
  const docSnap = await getDoc(doc(db, USERS_COLLECTION, userId))
  if (docSnap.exists()) {
    return docSnap.data()
  }
  return {}
}

export async function saveUserPreferences(userId, preferences) {
  await setDoc(doc(db, USERS_COLLECTION, userId), preferences, { merge: true })
}
