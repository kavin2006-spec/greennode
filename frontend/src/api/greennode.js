import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

export const runTrainingJob = () => api.post("/tracker/run");
export const getTrainingRuns = (limit = 20, offset = 0) =>api.get(`/tracker/runs?limit=${limit}&offset=${offset}`);
export const getRunsCount = () => api.get("/tracker/runs/count");
export const getSchedulerRecommendation = () => api.get("/scheduler/recommendation");
export const compressPrompt = (text) => api.post("/cleaner/compress", { text });
export const deferJob = (job) => api.post("/jobs/defer", job);
export const getJobQueue = () => api.get("/jobs/queue");
export const reorderJobs = (job_ids) => api.post("/jobs/reorder", job_ids);
export const getJobHistory = () => api.get("/jobs/history");