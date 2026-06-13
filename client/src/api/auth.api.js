import api, { unwrap } from "./axios";

export const authApi = {
  signup: (data) => api.post("/auth/signup", data).then(unwrap),
  login: (data) => api.post("/auth/login", data).then(unwrap),
  logout: () => api.post("/auth/logout").then(unwrap),
  registerKds: () => api.post("/auth/register-kds").then(unwrap),
};
