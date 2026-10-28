/*
  What this app imports from the React side.

  The React side ships a built bundle, type-checked by its own toolchain
  against its own dependencies. Only the shape this app calls is declared here.
*/
declare module '@irene/dashboard/embed' {
  export interface MountOptions {
    path?: string;
    chrome?: boolean;
    onNavigate?: (path: string) => void;
    config?: Record<string, string>;
    assetBase?: string;
  }

  export interface MountedPage {
    update(options: MountOptions): void;
    destroy(): void;
  }

  export function mountIrenePage(element: HTMLElement, options?: MountOptions): MountedPage;

  export function prefetchIrenePage(
    options?: Pick<MountOptions, 'config' | 'responses'>
  ): void;
}
