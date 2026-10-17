import { site } from "../config/site";
import { Logo } from "./Logo";

export function Hero() {
  return (
    <section id="top" className="hero" aria-labelledby="hero-heading">
      <div className="container hero__inner">
        <div className="hero__copy">
          <p className="eyebrow">{site.name}</p>
          <h1 id="hero-heading" className="hero__heading">
            {site.hero.heading}
          </h1>
          <p className="hero__text">{site.hero.text}</p>
          <div className="hero__actions">
            <a className="button button--primary" href="#promise">
              Our promise
            </a>
            <a className="button button--secondary" href="#collection">
              The collection
            </a>
          </div>
        </div>
        <div className="hero__mark" aria-hidden="true">
          <Logo size={160} strokeWidth={1.5} />
        </div>
      </div>
    </section>
  );
}
