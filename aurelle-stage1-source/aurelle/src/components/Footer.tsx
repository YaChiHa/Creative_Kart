import { site } from "../config/site";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <p className="site-footer__brand">
          <Logo size={24} />
          <span>{site.name}</span>
        </p>
        <p className="site-footer__note">{site.footer}</p>
        <a className="site-footer__top" href="#top">
          Back to top
        </a>
      </div>
    </footer>
  );
}
