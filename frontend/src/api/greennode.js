import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

export const runTrainingJob = () => api.post("/tracker/run");
export const getTrainingRuns = () => api.get("/tracker/runs");
export const getSchedulerRecommendation = () => api.get("/scheduler/recommendation");
export const compressPrompt = (text) => api.post("/cleaner/compress", { text });