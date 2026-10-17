import { site } from "../config/site";
import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <a className="brand" href="#top" aria-label={`${site.name}, back to top`}>
          <Logo size={36} />
          <span className="brand__name">{site.name}</span>
        </a>
        <nav aria-label="Main">
          <ul className="nav">
            {site.nav.map((item) => (
              <li key={item.href}>
                <a className="nav__link" href={item.href}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
