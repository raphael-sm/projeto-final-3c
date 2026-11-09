export default function CategoryCard({ name, image, href = "#" }) {
  return (
    <a className="category" href={href}>
      <div className="category__img">{image && <img src={image} alt={name} loading="lazy" />}</div>
      <span>{name}</span>
    </a>
  );
}
