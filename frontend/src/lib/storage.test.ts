import { beforeEach, describe, expect, it, vi } from "vitest";
import { initialBoard, initialWorkspace } from "./dummyData";
import {
  LEGACY_BOARD_STORAGE_KEY,
  WORKSPACE_STORAGE_KEY,
  isValidBoard,
  isValidWorkspace,
  loadWorkspace,
  saveWorkspace,
} from "./storage";

function createMemoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
}

describe("storage", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createMemoryStorage());
    Reflect.deleteProperty(window, "flowdeck");
  });

  it("round-trips a workspace through save and load", async () => {
    await saveWorkspace(initialWorkspace);
    await expect(loadWorkspace()).resolves.toEqual(initialWorkspace);
  });

  it("returns null for missing data", async () => {
    await expect(loadWorkspace()).resolves.toBeNull();
  });

  it("returns null for invalid JSON", async () => {
    window.localStorage.setItem(WORKSPACE_STORAGE_KEY, "{not-json");
    await expect(loadWorkspace()).resolves.toBeNull();
  });

  it("returns null for wrong shape", async () => {
    window.localStorage.setItem(
      WORKSPACE_STORAGE_KEY,
      JSON.stringify({ boards: [], activeBoardId: "x" })
    );
    await expect(loadWorkspace()).resolves.toBeNull();
  });

  it("migrates legacy single-board storage", async () => {
    window.localStorage.setItem(
      LEGACY_BOARD_STORAGE_KEY,
      JSON.stringify({ columns: initialBoard.columns })
    );
    const workspace = await loadWorkspace();
    expect(workspace?.boards).toHaveLength(1);
    expect(workspace?.boards[0].columns).toEqual(initialBoard.columns);
    expect(workspace?.activeBoardId).toBe(initialBoard.id);
  });

  it("uses Electron bridge when available", async () => {
    const fileStore = { data: null as unknown };
    const bridge = {
      loadWorkspace: vi.fn(async () => fileStore.data),
      saveWorkspace: vi.fn(async (workspace: typeof initialWorkspace) => {
        fileStore.data = workspace;
        return true;
      }),
      exportBoardFile: vi.fn(async () => ({ ok: true })),
      importBoardFile: vi.fn(async () => null),
    };
    window.flowdeck = bridge;

    await saveWorkspace(initialWorkspace);
    expect(bridge.saveWorkspace).toHaveBeenCalledWith(initialWorkspace);
    await expect(loadWorkspace()).resolves.toEqual(initialWorkspace);
  });

  it("migrates localStorage into Electron file once", async () => {
    window.localStorage.setItem(
      WORKSPACE_STORAGE_KEY,
      JSON.stringify(initialWorkspace)
    );

    const fileStore = { data: null as unknown };
    const bridge = {
      loadWorkspace: vi.fn(async () => fileStore.data),
      saveWorkspace: vi.fn(async (workspace: typeof initialWorkspace) => {
        fileStore.data = workspace;
        return true;
      }),
      exportBoardFile: vi.fn(async () => ({ ok: true })),
      importBoardFile: vi.fn(async () => null),
    };
    window.flowdeck = bridge;

    const loaded = await loadWorkspace();
    expect(loaded).toEqual(initialWorkspace);
    expect(bridge.saveWorkspace).toHaveBeenCalledWith(initialWorkspace);
    expect(window.localStorage.getItem(WORKSPACE_STORAGE_KEY)).toBeNull();
  });

  it("validates boards and workspaces", () => {
    expect(isValidBoard(initialBoard)).toBe(true);
    expect(isValidBoard(null)).toBe(false);
    expect(isValidWorkspace(initialWorkspace)).toBe(true);
    expect(isValidWorkspace({ boards: [], activeBoardId: "x" })).toBe(false);
  });

  it("accepts cards with a valid deadline and rejects malformed ones", () => {
    const withCard = (card: Record<string, unknown>) => ({
      ...initialBoard,
      columns: [{ id: "c", name: "C", cards: [card] }],
    });
    const base = { id: "a", title: "A", details: "" };

    expect(isValidBoard(withCard(base))).toBe(true);
    expect(isValidBoard(withCard({ ...base, deadline: "2026-10-01" }))).toBe(
      true
    );
    expect(isValidBoard(withCard({ ...base, deadline: "tomorrow" }))).toBe(
      false
    );
    expect(isValidBoard(withCard({ ...base, deadline: 20261001 }))).toBe(false);
  });
});
