const BASE = '/api';

async function get(path, params = {}) {
  const url = new URL(BASE + path, window.location.origin);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v !== undefined && v !== null) url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function post(path, body = {}) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let errorMessage = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      errorMessage = data.error || errorMessage;
    } catch {
      // ignore json parsing error
    }
    throw new Error(errorMessage);
  }
  return res.json();
}

export const api = {
  restaurants: {
    list: (params) => get('/restaurants', params),
    get:  (id)    => get(`/restaurants/${id}`),
  },
  hotels: {
    list: (params) => get('/hotels', params),
    get:  (id)    => get(`/hotels/${id}`),
  },
  roadtrip: {
    parse: (payload) => post('/roadtrip/parse', payload),
    build: (payload) => post('/roadtrip/build', payload),
  },
};
