import { site } from "../config/site";

// Stage 1 deliberately shows no products. Stage 2 replaces this panel with the real
// storefront once the inventory is available.
export function CollectionStatus() {
  return (
    <section id="collection" className="section" aria-labelledby="collection-heading">
      <div className="container">
        <p className="eyebrow">What is coming</p>
        <h2 id="collection-heading" className="section__heading">
          The collection
        </h2>
        <div className="status-panel">
          <p className="status-panel__title">
            <span className="status-panel__dot" aria-hidden="true" />
            {site.status}
          </p>
          <p className="status-panel__text">{site.statusDetail}</p>
        </div>
      </div>
    </section>
  );
}
