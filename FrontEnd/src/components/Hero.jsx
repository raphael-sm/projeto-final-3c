export default function Hero({ highlight, title, subtitle, image }) {
  return (
    <section className="hero" style={image ? { "--hero-image": `url(${image})` } : undefined}>
      <h1><em>{highlight}</em> {title}</h1>
      <p>{subtitle}</p>
    </section>
  );
}
