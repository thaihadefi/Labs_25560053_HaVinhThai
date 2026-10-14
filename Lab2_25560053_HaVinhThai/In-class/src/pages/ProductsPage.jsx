// Exercise 1: Components and Props
import ProductCard from '../components/ProductCard.jsx';

const products = [
  { id: 1, name: 'Keyboard', price: 25, inStock: true },
  { id: 2, name: 'Mouse', price: 12, inStock: false },
  { id: 3, name: 'Monitor', price: 180, inStock: true },
];

export default function ProductsPage() {
  return (
    <div>
      <h1>Products</h1>
      <div className="grid">
        {products.map(p => (
          <ProductCard key={p.id} name={p.name} price={p.price} inStock={p.inStock} />
        ))}
      </div>
    </div>
  );
}
