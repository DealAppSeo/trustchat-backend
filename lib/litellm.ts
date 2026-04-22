export async function streamLiteLlm(prompt: string, model: string) {
  const url = `${process.env.LITELLM_BASE_URL || 'https://trinity-litellm-production.up.railway.app'}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.LITELLM_API_KEY || ''}`
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      stream: true
    })
  });
  return res.body;
}
