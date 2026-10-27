/** Submit only succeeds after an explicit provider acknowledgement. */
export async function submitInquiry(endpoint, data, fetcher = fetch, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' }, signal: controller.signal });
    const result = await response.json();
    if (!response.ok || !result || result.ok !== true) throw new Error('Submission not confirmed');
  } finally { clearTimeout(timer); }
}
