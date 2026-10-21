// Tiny stand-ins for Next.js request-scoped APIs. No heavy imports here:
// this module is loaded from the vi.mock factories in setup.ts.

/** What next/navigation's redirect() does: abort by throwing. Tests catch it. */
export class RedirectSignal extends Error {
  constructor(public readonly url: string) {
    super(`REDIRECT:${url}`);
  }
}

const store = new Map<string, string>();

export const testCookies = {
  get: (name: string): string | undefined => store.get(name),
  set: (name: string, value: string): void => void store.set(name, value),
  delete: (name: string): void => void store.delete(name),
  clear: (): void => store.clear(),
  /** Shape of the object returned by next/headers cookies(). */
  jar: {
    get: (name: string) => (store.has(name) ? { name, value: store.get(name) as string } : undefined),
    set: (name: string, value: string) => void store.set(name, value),
    delete: (name: string) => void store.delete(name),
  },
};
