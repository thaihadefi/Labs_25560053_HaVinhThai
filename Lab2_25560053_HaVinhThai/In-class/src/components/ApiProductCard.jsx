export default function ApiProductCard({ title, price, thumbnail, selected, onClick }) {
  return (
    <button className={`card clickable${selected ? ' selected' : ''}`} onClick={onClick}>
      <img src={thumbnail} alt={title} />
      <h3>{title}</h3>
      <p className="price">${price}</p>
    </button>
  );
}
