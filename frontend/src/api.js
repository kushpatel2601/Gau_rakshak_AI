const API_URL = (import.meta.env?.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "");

async function readResponse(res) {
  const data = await res.json().catch(() => {
    throw new Error(`The server returned an invalid response (HTTP ${res.status}).`);
  });
  if (data === null || typeof data !== "object") {
    throw new Error(`The server returned an invalid response (HTTP ${res.status}).`);
  }
  if (!res.ok || data.error) {
    throw new Error(
      typeof data.detail === "string" ? data.detail : data.error || `Request failed (HTTP ${res.status}).`
    );
  }
  return data;
}

export async function predictCow(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/predict`, {
    method: "POST",
    body: formData,
  });

  return readResponse(res);
}

export async function getHistory() {
  const res = await fetch(`${API_URL}/history`);
  const data = await readResponse(res);
  if (!Array.isArray(data)) {
    throw new Error("The server returned invalid history data.");
  }
  return data;
}
