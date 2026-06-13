import api, { unwrap } from "./axios";

export const sessionsApi = {
  list: () => api.get("/sessions").then(unwrap),
  current: () => api.get("/sessions/current").then(unwrap),
  open: (data) => api.post("/sessions/open", data).then(unwrap),
  close: (id, data) => api.post(`/sessions/${id}/close`, data || {}).then(unwrap),
};
