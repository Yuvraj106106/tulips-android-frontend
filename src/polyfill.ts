if (typeof document === 'undefined') {
  (global as any).document = {
    getElementById: () => null,
    createElement: (tag: string) => ({
      style: {},
      setAttribute: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      appendChild: () => {},
      removeChild: () => {},
      remove: () => {},
      parentNode: { removeChild: () => {} },
    }),
    createElementNS: (ns: string, tag: string) => ({
      style: {},
      setAttribute: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
    body: { appendChild: () => {}, removeChild: () => {}, style: {} },
    head: { appendChild: () => {}, removeChild: () => {} },
  };
}
if (typeof window === 'undefined') {
  (global as any).window = global;
}
if (typeof navigator === 'undefined') {
  (global as any).navigator = { userAgent: 'ReactNative' };
}