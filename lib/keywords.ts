export function extractKeywords(text: string): string[] {
  const stopwords = new Set(['the', 'is', 'at', 'which', 'and', 'on', 'in', 'of', 'to', 'a', 'it', 'for', 'that', 'this', 'with', 'what', 'who', 'how', 'when', 'why', 'are', 'was', 'does']);
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
  const candidates = words.filter(w => !stopwords.has(w) && w.length > 3);
  return candidates.slice(0, 2);
}
