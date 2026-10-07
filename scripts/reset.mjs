const response = await fetch(
  `${process.env.DEMO_API_URL || 'http://127.0.0.1:4310'}/__demo/reset`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Demo-Control': '1' },
    body: JSON.stringify({ count: Number(process.argv[2] || 120) }),
    signal: AbortSignal.timeout(5000),
  },
);
const data = await response.json();
if (!response.ok) throw new Error(data.error);
console.log(JSON.stringify(data, null, 2));
console.log('Reset sample data. Reload BOTH clients to use this run.');
