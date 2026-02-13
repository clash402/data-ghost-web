/* eslint-disable class-methods-use-this */
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

class ResizeObserverMock {
  observe = () => {};

  unobserve = () => {};

  disconnect = () => {};
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
