async function deployed() {
  const res = await fetch('/api/deployed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Address: contractAddress })
  });

}