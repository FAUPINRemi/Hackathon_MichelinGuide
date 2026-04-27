const BASE = '/api';

function userHeaders() {
  try {
    const u = JSON.parse(localStorage.getItem('mg_user'));
    if (u?.id) return { 'X-User-Id': String(u.id) };
  } catch { /* ignore */ }
  return {};
}

async function get(path, params = {}) {
  const url = new URL(BASE + path, window.location.origin);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v !== undefined && v !== null) url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString(), { headers: userHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function post(path, body = {}) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...userHeaders() },
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
  collection: {
    continents:   ()                              => get('/collection/continents'),
    countries:    (continent)                     => get(`/collection/continents/${continent}/countries`),
    regions:      (countryCode)                   => get(`/collection/countries/${countryCode}/regions`),
    cities:       (countryCode, regionName)       => get(`/collection/countries/${countryCode}/regions/${encodeURIComponent(regionName)}/cities`),
    restaurants:  (countryCode, regionName, city) => get(`/collection/countries/${countryCode}/regions/${encodeURIComponent(regionName)}/cities/${encodeURIComponent(city)}/restaurants`),
    scan:         (payload)                       => post('/collection/scan', payload),
  },
  roadtrip: {
    parse:   (payload) => post('/roadtrip/parse',   payload),
    build:   (payload) => post('/roadtrip/build',   payload),
    plan:    (payload) => post('/roadtrip/plan',    payload),
    nearby:  (payload) => post('/roadtrip/nearby',  payload),
    compute: (payload) => post('/roadtrip/compute', payload),
    geocode: (q)       => get('/roadtrip/geocode',  { q }),
  },
  auth: {
    login: (mail, password) => post('/auth/login', { mail, password }),
  },
};
