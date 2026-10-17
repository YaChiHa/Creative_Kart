import { site } from "../config/site";

export function PromiseSection() {
  return (
    <section id="promise" className="section" aria-labelledby="promise-heading">
      <div className="container">
        <p className="eyebrow">Why Aurelle</p>
        <h2 id="promise-heading" className="section__heading">
          Our promise
        </h2>
        <ul className="cards">
          {site.promise.map((item, index) => (
            <li key={item.title} className="card">
              <span className="card__index" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="card__title">{item.title}</h3>
              <p className="card__text">{item.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
