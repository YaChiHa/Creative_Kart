import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { registerServiceWorker } from "./pwa/registerServiceWorker";
import "./styles.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error('Aurelle: the "#root" element is missing from index.html.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

registerServiceWorker();
