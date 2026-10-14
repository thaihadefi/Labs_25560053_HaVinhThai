import { useCallback } from 'react';
import { useFetch } from '../hooks/useFetch.js';
import { getComments } from '../services/postApi.js';

const NO_COMMENTS = { comments: [] };

export default function PostDetail({ post, onClose }) {
  const loadComments = useCallback(
    signal => (post.isLocal ? Promise.resolve(NO_COMMENTS) : getComments(post.id, signal)),
    [post.id, post.isLocal]
  );
  const { data, loading, error } = useFetch(loadComments);

  return (
    <aside className="panel detail">
      <button className="btn-light close" onClick={onClose}>
        Close
      </button>
      <h2>{post.title}</h2>
      <p className="body">{post.body}</p>

      <h3>Comments</h3>
      {loading && <p>Loading comments...</p>}
      {error && <p className="error">Error: {error}</p>}
      {!loading && !error && data.comments.length === 0 && (
        <p className="muted">No comments yet.</p>
      )}
      {!loading && !error && data.comments.length > 0 && (
        <ul className="comments">
          {data.comments.map(comment => (
            <li key={comment.id}>
              <strong>@{comment.user.username}</strong>
              <p>{comment.body}</p>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
