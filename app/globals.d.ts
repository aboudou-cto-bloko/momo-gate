declare module "*.css";

// Polaris Web Components — déclarations pour les éléments non typés dans @shopify/polaris-types
declare namespace JSX {
  interface IntrinsicElements {
    "s-app-nav": React.HTMLAttributes<HTMLElement>;
  }
}
