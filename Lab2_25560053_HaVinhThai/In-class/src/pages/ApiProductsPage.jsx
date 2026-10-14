// Exercise 3: Real Data from a Public API
import { useEffect, useState } from 'react';
import ApiProductCard from '../components/ApiProductCard.jsx';
import ProductDetail from '../components/ProductDetail.jsx';
import { getProducts } from '../services/productApi.js';

const PAGE_SIZE = 12;

export default function ApiProductsPage() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getProducts(PAGE_SIZE, (page - 1) * PAGE_SIZE, controller.signal);
        setProducts(data.products);
        setTotal(data.total);
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort(); // cleanup: cancel the request
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="layout">
      <section>
        <h1>Products (DummyJSON)</h1>

        {loading && <p>Loading...</p>}
        {error && <p className="error">Error: {error}</p>}
        {!loading && !error && (
          <div className="grid">
            {products.map(p => (
              <ApiProductCard
                key={p.id}
                title={p.title}
                price={p.price}
                thumbnail={p.thumbnail}
                selected={p.id === selectedId}
                onClick={() => setSelectedId(p.id)}
              />
            ))}
          </div>
        )}

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

      {selectedId && <ProductDetail id={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
