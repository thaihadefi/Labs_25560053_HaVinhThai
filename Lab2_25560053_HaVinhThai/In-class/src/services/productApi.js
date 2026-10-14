const BASE_URL = import.meta.env.VITE_API_URL ?? 'https://dummyjson.com';

async function request(path, options = {}) {
  const res = await fetch(BASE_URL + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const getProducts = (limit, skip, signal) =>
  request(`/products?limit=${limit}&skip=${skip}&select=title,price,thumbnail`, { signal });

export const getProduct = (id, signal) => request(`/products/${id}`, { signal });
