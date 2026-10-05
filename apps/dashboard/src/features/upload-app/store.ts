import { createStore, useStore } from 'zustand';

/** A file on its way to storage, which the server knows nothing about yet. */
export interface FileBeingUploaded {
  id: string;
  name: string;
  progress: number;
  startedAt: string;
}

interface UploadAppStore {
  uploads: FileBeingUploaded[];
  shouldOpenUploadList: boolean;
  startUpload: (name: string) => string;
  setUploadProgress: (id: string, progress: number) => void;
  finishUpload: (id: string) => void;
  setShouldOpenUploadList: (shouldOpen: boolean) => void;
}

/**
 * The uploads this tab is sending, and whether the list of them is open.
 *
 * A file takes a while to reach storage and the server has no submission for it
 * until it arrives, so the only account of it is here. The popover opens when
 * one starts, which is how the person sees it is happening at all.
 */
export const uploadAppStore = createStore<UploadAppStore>((set) => ({
  uploads: [],
  shouldOpenUploadList: false,

  startUpload: (name) => {
    const id = crypto.randomUUID();

    set((state) => ({
      uploads: [...state.uploads, { id, name, progress: 0, startedAt: new Date().toISOString() }],
      shouldOpenUploadList: true,
    }));

    return id;
  },

  setUploadProgress: (id, progress) =>
    set((state) => ({
      uploads: state.uploads.map((upload) => (upload.id === id ? { ...upload, progress } : upload)),
    })),

  /* Dropped once the server has it: from here on the submission is the account of it. */
  finishUpload: (id) =>
    set((state) => ({ uploads: state.uploads.filter((upload) => upload.id !== id) })),

  setShouldOpenUploadList: (shouldOpenUploadList) => set({ shouldOpenUploadList }),
}));

/** The uploads this tab is sending, and whether the list of them is open. */
export const useUploadAppStore = () => useStore(uploadAppStore);
