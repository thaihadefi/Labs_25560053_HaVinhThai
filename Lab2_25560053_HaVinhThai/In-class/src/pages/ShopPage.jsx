// Exercise 2: Product List and Shopping Cart (your own data)
import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import Cart from '../components/Cart.jsx';
import { fakeFetchProducts } from '../data/products.js';

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('All');
  const [cart, setCart] = useState([]);

  useEffect(() => {
    let ignore = false;
    fakeFetchProducts().then(data => {
      if (ignore) return;
      setProducts(data);
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    document.title = `Cart (${cartCount})`;
  }, [cartCount]);

  const categories = ['All', ...new Set(products.map(p => p.category))];

  const visibleProducts = products.filter(
    p =>
      p.name.toLowerCase().includes(keyword.trim().toLowerCase()) &&
      (category === 'All' || p.category === category)
  );

  function addToCart(product) {
    setCart(items =>
      items.some(i => i.id === product.id)
        ? items.map(i => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i))
        : [...items, { ...product, quantity: 1 }]
    );
  }

  function removeFromCart(id) {
    setCart(items => items.filter(i => i.id !== id));
  }

  return (
    <div className="layout">
      <section>
        <h1>Shop</h1>
        <div className="toolbar">
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="Search by name..."
          />
          <select value={category} onChange={e => setCategory(e.target.value)}>
            {categories.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : visibleProducts.length === 0 ? (
          <p className="muted">No products match your search.</p>
        ) : (
          <div className="grid">
            {visibleProducts.map(p => (
              <ProductCard
                key={p.id}
                name={p.name}
                price={p.price}
                inStock={p.inStock}
                onAddToCart={() => addToCart(p)}
              />
            ))}
          </div>
        )}
      </section>

      <Cart items={cart} onRemove={removeFromCart} />
    </div>
  );
}
