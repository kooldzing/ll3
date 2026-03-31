async function connectWallet() {
  const res = await fetch('/api/connectWallet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: userAddress })
  });

}