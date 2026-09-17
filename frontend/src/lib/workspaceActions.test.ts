import { describe, expect, it } from "vitest";
import { initialWorkspace } from "./dummyData";
import {
  createBoard,
  deleteBoard,
  getActiveBoard,
  selectBoard,
  updateBoardMeta,
} from "./workspaceActions";

describe("workspaceActions", () => {
  it("returns the active board", () => {
    expect(getActiveBoard(initialWorkspace).id).toBe(
      initialWorkspace.activeBoardId
    );
  });

  it("creates a board and selects it", () => {
    const next = createBoard(initialWorkspace, "Marketing", "Q2 campaigns");
    expect(next.boards).toHaveLength(2);
    expect(next.boards[1].name).toBe("Marketing");
    expect(next.boards[1].description).toBe("Q2 campaigns");
    expect(next.boards[1].columns).toHaveLength(5);
    expect(next.activeBoardId).toBe(next.boards[1].id);
  });

  it("selects an existing board", () => {
    const withExtra = createBoard(initialWorkspace, "Ops", "");
    const back = selectBoard(withExtra, initialWorkspace.activeBoardId);
    expect(back.activeBoardId).toBe(initialWorkspace.activeBoardId);
  });

  it("updates board name and description", () => {
    const next = updateBoardMeta(initialWorkspace, initialWorkspace.activeBoardId, {
      name: "Renamed",
      description: "New desc",
    });
    expect(getActiveBoard(next).name).toBe("Renamed");
    expect(getActiveBoard(next).description).toBe("New desc");
  });

  it("deletes a board and selects another", () => {
    const withExtra = createBoard(initialWorkspace, "Temp", "");
    const deleted = deleteBoard(withExtra, withExtra.activeBoardId);
    expect(deleted.boards).toHaveLength(1);
    expect(deleted.boards[0].id).toBe(initialWorkspace.activeBoardId);
    expect(deleted.activeBoardId).toBe(initialWorkspace.activeBoardId);
  });

  it("does not delete the last remaining board", () => {
    const next = deleteBoard(initialWorkspace, initialWorkspace.activeBoardId);
    expect(next).toBe(initialWorkspace);
  });
});
