import { useEffect, useState } from 'react';
import { getProduct } from '../services/productApi.js';

export default function ProductDetail({ id, onClose }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        setProduct(await getProduct(id, controller.signal));
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [id]);

  return (
    <aside className="panel detail">
      <button className="btn-light close" onClick={onClose}>
        Close
      </button>
      {loading && <p>Loading...</p>}
      {error && <p className="error">Error: {error}</p>}
      {!loading && !error && product && (
        <>
          <img src={product.thumbnail} alt={product.title} />
          <h2>{product.title}</h2>
          <p className="muted">{product.description}</p>
          <p>
            <strong>Price:</strong> ${product.price}
          </p>
          <p>
            <strong>Rating:</strong> {product.rating} / 5
          </p>
          <p>
            <strong>Stock:</strong> {product.stock}
          </p>
        </>
      )}
    </aside>
  );
}
