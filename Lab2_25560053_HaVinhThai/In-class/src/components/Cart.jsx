export default function Cart({ items, onRemove }) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <aside className="panel cart">
      <h2>Cart</h2>
      {items.length === 0 ? (
        <p className="muted">Your cart is empty.</p>
      ) : (
        <ul>
          {items.map(item => (
            <li key={item.id}>
              <span>
                {item.name} × {item.quantity}
              </span>
              <span>{(item.price * item.quantity).toLocaleString()} USD</span>
              <button className="btn-danger" onClick={() => onRemove(item.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="total">Total: {total.toLocaleString()} USD</p>
    </aside>
  );
}
