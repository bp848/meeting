import { Meeting } from '../types';

const DB_NAME = 'MeetingMinuteMasterDB';
const DB_VERSION = 1;
const STORE_NAME = 'meetings';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB error:", event);
      reject("Database error");
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const getAllMeetingsFromStorage = async (): Promise<Meeting[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      // Sort by date descending
      const meetings = request.result as Meeting[];
      meetings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      resolve(meetings);
    };

    request.onerror = () => {
      reject("Failed to retrieve meetings");
    };
  });
};

export const saveMeetingToStorage = async (meeting: Meeting): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(meeting);

    request.onsuccess = () => resolve();
    request.onerror = () => reject("Failed to save meeting");
  });
};

export const deleteMeetingFromStorage = async (id: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject("Failed to delete meeting");
  });
};
