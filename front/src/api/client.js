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
  },
};
