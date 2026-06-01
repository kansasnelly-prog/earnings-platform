// ES‑module entry point for the backend suggestions route
import generateAiSuggestions from './generate-ai-suggestions.js';

export default async function handler(req, res) {
  console.log('[API Route] Forwarding request to AI handler');
  return await generateAiSuggestions(req, res);
}