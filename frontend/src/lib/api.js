const BASE = "/api";

export async function fetchLocations() {
  const res = await fetch(`${BASE}/locations`);
  if (!res.ok) throw new Error("Failed to load locations");
  return res.json();
}

export async function generateDesign(inputs) {
  const res = await fetch(`${BASE}/design`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(inputs),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to generate design");
  }
  return res.json();
}
