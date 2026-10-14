import { useState } from 'react';

export default function PostForm({ onSubmit }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError('Title and body are both required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSubmit({ title: title.trim(), body: body.trim() });
      setTitle('');
      setBody('');
    } catch (err) {
      setError(`Could not add the post: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="panel form" onSubmit={handleSubmit}>
      <h2>New post</h2>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Body"
        rows={4}
      />
      {error && <p className="error">{error}</p>}
      <button className="btn-primary" type="submit" disabled={saving}>
        {saving ? 'Adding...' : 'Add post'}
      </button>
    </form>
  );
}
