import { ThumbsDown, ThumbsUp } from 'lucide-react';

export default function PostItem({ post, selected, deleting, onView, onDelete }) {
  const { title, tags = [], reactions } = post;

  return (
    <article className={`panel post${selected ? ' selected' : ''}`}>
      <h3>{title}</h3>
      {tags.length > 0 && (
        <div className="tags">
          {tags.map(tag => (
            <span key={tag} className="tag">
              #{tag}
            </span>
          ))}
        </div>
      )}
      <p className="muted reactions">
        <ThumbsUp size={16} /> {reactions?.likes ?? 0}
        <ThumbsDown size={16} /> {reactions?.dislikes ?? 0}
      </p>
      <div className="actions">
        <button className="btn-light" onClick={onView}>
          View
        </button>
        <button className="btn-danger" onClick={onDelete} disabled={deleting}>
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </article>
  );
}
