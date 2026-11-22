import { createAction, createEntityAdapter, createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";
import type { Job, JobFilter, Truck } from "@/lib/types";

/** Full state from the server — replaces everything (initial load and every reconnect). */
export const snapshotReceived = createAction<{ trucks: Truck[]; jobs: Job[]; serverTime: number }>(
  "realtime/snapshotReceived",
);
/** Incremental changes pushed by the server. */
export const deltaReceived = createAction<{ trucks: Truck[]; jobs: Job[]; serverTime: number }>(
  "realtime/deltaReceived",
);

// ---------- trucks ----------
export const trucksAdapter = createEntityAdapter<Truck>();

const trucksSlice = createSlice({
  name: "trucks",
  initialState: trucksAdapter.getInitialState(),
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(snapshotReceived, (state, { payload }) => trucksAdapter.setAll(state, payload.trucks))
      .addCase(deltaReceived, (state, { payload }) => trucksAdapter.upsertMany(state, payload.trucks));
  },
});

// ---------- jobs ----------
export const jobsAdapter = createEntityAdapter<Job>();

const jobsSlice = createSlice({
  name: "jobs",
  initialState: jobsAdapter.getInitialState(),
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(snapshotReceived, (state, { payload }) => jobsAdapter.setAll(state, payload.jobs))
      .addCase(deltaReceived, (state, { payload }) => jobsAdapter.upsertMany(state, payload.jobs));
  },
});

// ---------- connection ----------
export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "disconnected";

interface ConnectionState {
  status: ConnectionStatus;
  attempt: number;
  retryInMs: number | null;
  lastMessageAt: number | null;
}

const initialConnection: ConnectionState = {
  status: "connecting",
  attempt: 0,
  retryInMs: null,
  lastMessageAt: null,
};

const connectionSlice = createSlice({
  name: "connection",
  initialState: initialConnection,
  reducers: {
    connecting: (state) => {
      state.status = state.attempt > 0 ? "reconnecting" : "connecting";
      state.retryInMs = null;
    },
    connected: (state) => {
      state.status = "connected";
      state.attempt = 0;
      state.retryInMs = null;
    },
    reconnectScheduled: (state, { payload }: PayloadAction<{ attempt: number; retryInMs: number }>) => {
      state.status = "reconnecting";
      state.attempt = payload.attempt;
      state.retryInMs = payload.retryInMs;
    },
    disconnected: (state) => {
      state.status = "disconnected";
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      (action) => snapshotReceived.match(action) || deltaReceived.match(action),
      (state, action: PayloadAction<{ serverTime: number }>) => {
        state.lastMessageAt = action.payload.serverTime;
      },
    );
  },
});

// ---------- ui ----------
export interface Toast {
  id: string;
  message: string;
  tone: "success" | "error" | "info";
}

interface UiState {
  selectedTruckId: string | null;
  jobFilter: JobFilter;
  search: string;
  autoDispatch: boolean;
  toasts: Toast[];
}

const initialUi: UiState = {
  selectedTruckId: null,
  jobFilter: "all",
  search: "",
  autoDispatch: true,
  toasts: [],
};

const uiSlice = createSlice({
  name: "ui",
  initialState: initialUi,
  reducers: {
    truckSelected: (state, { payload }: PayloadAction<string | null>) => {
      state.selectedTruckId = state.selectedTruckId === payload ? null : payload;
    },
    jobFilterChanged: (state, { payload }: PayloadAction<JobFilter>) => {
      state.jobFilter = payload;
    },
    searchChanged: (state, { payload }: PayloadAction<string>) => {
      state.search = payload;
    },
    autoDispatchToggled: (state, { payload }: PayloadAction<boolean>) => {
      state.autoDispatch = payload;
    },
    toastAdded: {
      reducer: (state, { payload }: PayloadAction<Toast>) => {
        state.toasts.push(payload);
      },
      prepare: (message: string, tone: Toast["tone"] = "info") => ({
        payload: { id: nanoid(), message, tone },
      }),
    },
    toastDismissed: (state, { payload }: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== payload);
    },
  },
});

export const trucksReducer = trucksSlice.reducer;
export const jobsReducer = jobsSlice.reducer;
export const connectionReducer = connectionSlice.reducer;
export const uiReducer = uiSlice.reducer;

export const { connecting, connected, reconnectScheduled, disconnected } = connectionSlice.actions;
export const {
  truckSelected,
  jobFilterChanged,
  searchChanged,
  autoDispatchToggled,
  toastAdded,
  toastDismissed,
} = uiSlice.actions;
