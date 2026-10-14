import { useCallback, useState } from 'react';
import PostForm from '../components/PostForm.jsx';
import PostItem from '../components/PostItem.jsx';
import PostDetail from '../components/PostDetail.jsx';
import { useDebounce } from '../hooks/useDebounce.js';
import { useFetch } from '../hooks/useFetch.js';
import { addPost, deletePost, getPosts, searchPosts } from '../services/postApi.js';

const PAGE_SIZE = 10;

const keyOf = post => post.localKey ?? post.id;

export default function BlogPage() {
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [deletingKey, setDeletingKey] = useState(null);
  const [actionError, setActionError] = useState(null);

  const search = useDebounce(keyword.trim(), 400);

  const loadPosts = useCallback(
    signal => {
      const skip = (page - 1) * PAGE_SIZE;
      return search
        ? searchPosts(search, PAGE_SIZE, skip, signal)
        : getPosts(PAGE_SIZE, skip, signal);
    },
    [search, page]
  );
  const { data, setData, loading, error } = useFetch(loadPosts);

  const posts = data?.posts ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handleSearchChange(e) {
    setKeyword(e.target.value);
    setPage(1);
  }

  async function handleAdd(values) {
    const created = await addPost(values);
    const newPost = {
      ...created,
      tags: [],
      reactions: { likes: 0, dislikes: 0 },
      isLocal: true,
      localKey: `local-${Date.now()}`,
    };
    setData(d => ({ ...d, posts: [newPost, ...(d?.posts ?? [])], total: (d?.total ?? 0) + 1 }));
  }

  async function handleDelete(post) {
    if (!window.confirm(`Delete "${post.title}"?`)) return;

    const key = keyOf(post);
    setDeletingKey(key);
    setActionError(null);
    try {
      if (!post.isLocal) {
        const deleted = await deletePost(post.id);
        if (!deleted.isDeleted) throw new Error('the server did not confirm the deletion');
      }
      setData(d => ({ ...d, posts: d.posts.filter(p => keyOf(p) !== key), total: d.total - 1 }));
      if (selected && keyOf(selected) === key) setSelected(null);
    } catch (err) {
      setActionError(`Could not delete the post: ${err.message}`);
    } finally {
      setDeletingKey(null);
    }
  }

  return (
    <div className="layout">
      <section>
        <h1>Mini Blog Manager</h1>
        <PostForm onSubmit={handleAdd} />

        <input
          className="search"
          value={keyword}
          onChange={handleSearchChange}
          placeholder="Search posts..."
        />

        {actionError && <p className="error">{actionError}</p>}
        {loading && <p>Loading...</p>}
        {error && <p className="error">Error: {error}</p>}
        {!loading && !error && posts.length === 0 && <p className="muted">No posts found.</p>}
        {!loading &&
          !error &&
          posts.map(post => (
            <PostItem
              key={keyOf(post)}
              post={post}
              selected={selected && keyOf(selected) === keyOf(post)}
              deleting={deletingKey === keyOf(post)}
              onView={() => setSelected(post)}
              onDelete={() => handleDelete(post)}
            />
          ))}

        <div className="pagination">
          <button onClick={() => setPage(p => p - 1)} disabled={page === 1 || loading}>
            Previous
          </button>
          <span>
            Page {page} / {totalPages}
          </span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages || loading}>
            Next
          </button>
        </div>
      </section>

      {selected && <PostDetail post={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
