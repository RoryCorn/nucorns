async function request(path, { method = "GET", body, headers, isForm = false } = {}) {
  const opts = {
    method,
    credentials: "include",
    headers: isForm ? headers : { "Content-Type": "application/json", ...headers },
  };
  if (body != null) opts.body = isForm ? body : JSON.stringify(body);
  const res = await fetch(`/api${path}`, opts);
  let data = null;
  try { data = await res.json(); } catch (e) {}
  if (!res.ok) {
    const err = new Error((data && data.error) || res.statusText || "Request failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  del: (path) => request(path, { method: "DELETE" }),
  upload: (path, file, fieldName = "file") => {
    const form = new FormData();
    form.append(fieldName, file);
    return request(path, { method: "POST", body: form, isForm: true });
  },
};
