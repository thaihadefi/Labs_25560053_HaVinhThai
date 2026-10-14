import { useState } from 'react';
import ProductsPage from './pages/ProductsPage.jsx';
import ShopPage from './pages/ShopPage.jsx';
import ApiProductsPage from './pages/ApiProductsPage.jsx';

const exercises = [
  { id: 1, label: 'Exercise 1: Components & Props', Page: ProductsPage },
  { id: 2, label: 'Exercise 2: Shop & Cart', Page: ShopPage },
  { id: 3, label: 'Exercise 3: DummyJSON API', Page: ApiProductsPage },
];

export default function App() {
  const [current, setCurrent] = useState(1);
  const { Page } = exercises.find(e => e.id === current);

  return (
    <>
      <nav className="tabs">
        {exercises.map(e => (
          <button
            key={e.id}
            className={e.id === current ? 'active' : ''}
            onClick={() => setCurrent(e.id)}
          >
            {e.label}
          </button>
        ))}
      </nav>
      <main>
        <Page />
      </main>
    </>
  );
}
