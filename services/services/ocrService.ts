export async function callOcr(imageBase64: string, mimeType = "image/jpeg") {
  const res = await fetch("/api/ocr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64, mimeType }),
  });

  const json = await res.json();
  if (!res.ok || !json?.ok) {
    throw new Error(json?.message || json?.error || "OCR server error");
  }
  return json; // { ok:true, rawText, items, totals }
}
