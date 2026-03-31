async function markCompiled() {
  const res = await fetch('/api/markCompiled', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Name: contractAddress })
  });

}