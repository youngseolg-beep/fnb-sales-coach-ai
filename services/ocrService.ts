export async function callOcr(
  imageBase64: string,
  mimeType = "image/jpeg",
  options?: {
    userEmail?: string;
    country?: string;
    brand?: string;
    menuCandidates?: string[];
  }
) {
  const res = await fetch("/api/ocr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageBase64,
      mimeType,
      userEmail: options?.userEmail || "",
      country: options?.country || "",
      brand: options?.brand || "",
      menuCandidates: options?.menuCandidates || [],
    }),
  });

  const json = await res.json();
  if (!res.ok || !json?.ok) {
    throw new Error(json?.message || json?.error || "OCR server error");
  }

  return json;
}
