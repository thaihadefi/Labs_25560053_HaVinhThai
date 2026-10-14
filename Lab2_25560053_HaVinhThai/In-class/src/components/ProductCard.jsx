const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200">' +
      '<rect width="100%" height="100%" fill="#e5e7eb"/>' +
      '<text x="50%" y="50%" fill="#6b7280" font-family="sans-serif" font-size="20" ' +
      'text-anchor="middle" dominant-baseline="middle">No image</text>' +
      '</svg>'
  );

export default function ProductCard({
  name,
  price,
  inStock = true,
  image = PLACEHOLDER,
  onAddToCart,
}) {
  return (
    <div className="card">
      {price < 20 && <span className="badge">Low price!</span>}
      <img src={image} alt={name} />
      <h3>{name}</h3>
      <p>{price.toLocaleString()} USD</p>
      {inStock ? (
        <span className="stock in">In stock</span>
      ) : (
        <span className="stock out">Sold out</span>
      )}
      {onAddToCart && (
        <button className="btn-primary" onClick={onAddToCart} disabled={!inStock}>
          Add to cart
        </button>
      )}
    </div>
  );
}
