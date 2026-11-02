import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

const COL = "Trips";
const millis = (t) => t?.toMillis?.() ?? 0;

export async function createTrip(user, selection, data) {
  const ref = await addDoc(collection(db, COL), {
    userId: user.uid,
    userName: user.displayName || "",
    userEmail: user.email || "",
    selection,
    data,
    packed: {},
    isPublic: false,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listTrips(uid) {
  const snap = await getDocs(query(collection(db, COL), where("userId", "==", uid)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => millis(b.createdAt) - millis(a.createdAt));
}

export async function getTrip(id) {
  const snap = await getDoc(doc(db, COL, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export const updateTrip = (id, patch) => updateDoc(doc(db, COL, id), patch);
export const deleteTrip = (id) => deleteDoc(doc(db, COL, id));
