export {};

declare global {
  interface UnicornScene {
    destroy?: () => void;
  }
  interface Window {
    UnicornStudio?: {
      init: () => Promise<UnicornScene[]>;
      isInitialized?: boolean;
    };
  }
}
