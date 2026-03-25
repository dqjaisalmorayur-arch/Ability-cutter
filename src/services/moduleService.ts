import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import { Module, QuizResult } from '../types';

const COLLECTION_NAME = 'modules';
const RESULTS_COLLECTION = 'quiz_results';

export const moduleService = {
  // Get all modules
  getModules: async (): Promise<Module[]> => {
    const q = query(collection(db, COLLECTION_NAME), orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Module));
  },

  // Subscribe to modules
  subscribeToModules: (callback: (modules: Module[]) => void) => {
    const q = query(collection(db, COLLECTION_NAME), orderBy('order', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const modules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Module));
      callback(modules);
    });
  },

  // Add a new module
  addModule: async (moduleData: Omit<Module, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...moduleData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  // Update a module
  updateModule: async (id: string, moduleData: Partial<Module>): Promise<void> => {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...moduleData,
      updatedAt: serverTimestamp()
    });
  },

  // Delete a module
  deleteModule: async (id: string): Promise<void> => {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  },

  // Save quiz result
  saveQuizResult: async (result: Omit<QuizResult, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, RESULTS_COLLECTION), {
      ...result,
      timestamp: serverTimestamp()
    });
    return docRef.id;
  },

  // Subscribe to quiz results (for admin)
  subscribeToResults: (callback: (results: QuizResult[]) => void) => {
    const q = query(collection(db, RESULTS_COLLECTION), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
      } as QuizResult));
      callback(results);
    });
  }
};
