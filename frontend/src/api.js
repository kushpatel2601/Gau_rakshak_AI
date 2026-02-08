const API_URL = "http://localhost:8000";

export async function predictCow(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/predict`, {
    method: "POST",
    body: formData,
  });

  return await res.json();
}

export async function getHistory() {
  try {
    const res = await fetch(`${API_URL}/history`);
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch history:", error);
    return [];
  }
}
