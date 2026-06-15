const COINGECKO = 'https://api.coingecko.com/api/v3';

export async function fetchBTCPrice() {
  const res = await fetch(
    `${COINGECKO}/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`
  );
  if (!res.ok) throw new Error('Price fetch failed');
  const data = await res.json();
  return {
    price:     data.bitcoin.usd,
    change24h: data.bitcoin.usd_24h_change,
    volume24h: data.bitcoin.usd_24h_vol,
    marketCap: data.bitcoin.usd_market_cap,
  };
}

export async function fetchBTCHistory(days = 365) {
  const res = await fetch(
    `${COINGECKO}/coins/bitcoin/market_chart?vs_currency=usd&days=${days}&interval=daily`
  );
  if (!res.ok) throw new Error('History fetch failed');
  const data = await res.json();
  return data.prices.map(([ts, price]) => ({ date: new Date(ts), price }));
}

export async function fetchFearGreed() {
  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=1');
    const data = await res.json();
    return {
      value: parseInt(data.data[0].value),
      label: data.data[0].value_classification,
    };
  } catch {
    return { value: 72, label: 'Greed' };
  }
}
