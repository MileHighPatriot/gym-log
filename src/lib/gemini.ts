export const GEMINI_KEY_STORAGE = 'gym-log-gemini-key'

export type PhotoGuess = {
  name: string
  grams: number
  kcal: number
  protein: number
  confidence: number
}

export function loadGeminiKey(): string {
  try {
    return localStorage.getItem(GEMINI_KEY_STORAGE) ?? ''
  } catch {
    return ''
  }
}

export function saveGeminiKey(key: string) {
  const trimmed = key.trim()
  if (!trimmed) localStorage.removeItem(GEMINI_KEY_STORAGE)
  else localStorage.setItem(GEMINI_KEY_STORAGE, trimmed)
}

export async function fileToInline(file: File): Promise<{ mime: string; data: string }> {
  const buf = await file.arrayBuffer()
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return { mime: file.type || 'image/jpeg', data: btoa(binary) }
}

export async function estimateFoodPhoto(file: File, key: string): Promise<PhotoGuess[]> {
  const { mime, data } = await fileToInline(file)
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: 'Estimate the foods on this plate. Return JSON only: {"items":[{"name":"","grams":0,"kcal":0,"protein":0,"confidence":0}]}. confidence is 0-1. Be conservative. If unsure, still guess one item.',
              },
              { inline_data: { mime_type: mime, data } },
            ],
          },
        ],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    },
  )
  if (!res.ok) throw new Error('Photo estimate failed')
  const payload = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('No estimate')
  const parsed = JSON.parse(text) as { items?: PhotoGuess[] }
  const items = Array.isArray(parsed.items) ? parsed.items : []
  return items
    .filter((item) => item && item.name && item.kcal >= 0)
    .map((item) => ({
      name: String(item.name),
      grams: Math.max(0, Number(item.grams) || 0),
      kcal: Math.max(0, Math.round(Number(item.kcal) || 0)),
      protein: Math.max(0, Math.round((Number(item.protein) || 0) * 10) / 10),
      confidence: Math.min(1, Math.max(0, Number(item.confidence) || 0)),
    }))
}
