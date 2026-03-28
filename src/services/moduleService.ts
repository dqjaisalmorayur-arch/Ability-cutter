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
  onSnapshot,
  getDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Module, QuizResult } from '../types';

const COLLECTION_NAME = 'modules';
const RESULTS_COLLECTION = 'quiz_results';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const moduleService = {
  // Get all modules
  getModules: async (): Promise<Module[]> => {
    try {
      const q = query(collection(db, COLLECTION_NAME));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Module))
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
      return [];
    }
  },

  // Subscribe to modules
  subscribeToModules: (callback: (modules: Module[]) => void) => {
    const q = query(collection(db, COLLECTION_NAME));
    return onSnapshot(q, 
      (snapshot) => {
        const modules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Module))
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        callback(modules);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
      }
    );
  },

  // Add a new module
  addModule: async (moduleData: Omit<Module, 'id'>): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...moduleData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
      return '';
    }
  },

  // Update a module
  updateModule: async (id: string, moduleData: Partial<Module>): Promise<void> => {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...moduleData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
    }
  },

  // Delete a module
  deleteModule: async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    }
  },

  // Save quiz result
  saveQuizResult: async (result: Omit<QuizResult, 'id'>): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, RESULTS_COLLECTION), {
        ...result,
        timestamp: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, RESULTS_COLLECTION);
      return '';
    }
  },

  // Subscribe to quiz results (for admin)
  subscribeToResults: (callback: (results: QuizResult[]) => void) => {
    const q = query(collection(db, RESULTS_COLLECTION), orderBy('timestamp', 'desc'));
    return onSnapshot(q, 
      (snapshot) => {
        const results = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
        } as QuizResult));
        callback(results);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, RESULTS_COLLECTION);
      }
    );
  }
};
