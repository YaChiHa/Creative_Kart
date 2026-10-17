import { CollectionStatus } from "./components/CollectionStatus";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { PromiseSection } from "./components/PromiseSection";
import { SkipLink } from "./components/SkipLink";

export function App() {
  return (
    <>
      <SkipLink />
      <Header />
      <main id="main" tabIndex={-1}>
        <Hero />
        <PromiseSection />
        <CollectionStatus />
      </main>
      <Footer />
    </>
  );
}
