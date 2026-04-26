import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  timeout: 15000,
});

// --- THREATS ---
export const getThreats = (params) =>
  api.get("/feed/threats", { params });

// --- LOOKUP ---
export const lookupIP = (ip) =>
  api.get(`/lookup/${ip}`);

// --- PULSES ---
export const getPulses = (params) =>
  api.get("/pulses", { params });

export const refreshPulses = () =>
  api.post("/pulses/refresh");

export const getPulseIndicators = (id) =>
  api.get(`/pulses/indicators/${id}`);

export default api;