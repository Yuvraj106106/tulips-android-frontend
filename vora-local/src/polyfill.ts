// Polyfill for React Native to mock browser-specific globals
if (typeof document === 'undefined') {
  (global as any).document = {
    getElementById: () => ({
      remove: () => {},
      parentNode: { removeChild: () => {} },
    }),
    createElement: () => ({}),
    createElementNS: () => ({}),
    body: { appendChild: () => {} },
  };
}
if (typeof window === 'undefined') {
  (global as any).window = global;
}
