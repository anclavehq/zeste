// Globals set by third-party tags, read in the tests.
declare global {
  interface Window {
    dataLayer?: IArguments[];
    __zesteManifest?: import('../src/manager.ts').ZesteManifest[];
  }
}

export {};
