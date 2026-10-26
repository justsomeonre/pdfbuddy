/// <reference types="vite/client" />

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module 'gifshot' {
  const gifshot: any;
  export default gifshot;
}

declare module 'gifenc' {
  export const GIFEncoder: any;
  export const quantize: any;
  export const applyPalette: any;
}
