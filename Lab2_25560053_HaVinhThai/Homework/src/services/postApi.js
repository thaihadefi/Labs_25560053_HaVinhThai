const BASE_URL = import.meta.env.VITE_API_URL ?? 'https://dummyjson.com';

async function request(path, options = {}) {
  const res = await fetch(BASE_URL + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const getPosts = (limit, skip, signal) =>
  request(`/posts?limit=${limit}&skip=${skip}`, { signal });

export const searchPosts = (keyword, limit, skip, signal) =>
  request(`/posts/search?q=${encodeURIComponent(keyword)}&limit=${limit}&skip=${skip}`, {
    signal,
  });

export const getComments = (postId, signal) => request(`/posts/${postId}/comments`, { signal });

export const addPost = ({ title, body }) =>
  request('/posts/add', { method: 'POST', body: JSON.stringify({ title, body, userId: 1 }) });

export const deletePost = id => request(`/posts/${id}`, { method: 'DELETE' });
