import { describe, expect, it } from "vitest";
import { initialBoard, initialWorkspace } from "./dummyData";
import {
  boardExportFilename,
  importBoard,
  parseBoardExport,
  remintBoardIds,
  serializeBoardExport,
} from "./boardTransfer";

describe("boardTransfer", () => {
  it("round-trips a board through serialize and parse", () => {
    const raw = serializeBoardExport(initialBoard);
    const parsed = parseBoardExport(raw);
    expect(parsed).toEqual(initialBoard);
  });

  it("accepts a bare board object", () => {
    expect(parseBoardExport(JSON.stringify(initialBoard))).toEqual(
      initialBoard
    );
  });

  it("rejects invalid JSON", () => {
    expect(parseBoardExport("{nope")).toBeNull();
    expect(parseBoardExport(JSON.stringify({ format: "other" }))).toBeNull();
  });

  it("remints board and card ids", () => {
    const reminted = remintBoardIds(initialBoard);
    expect(reminted.id).not.toBe(initialBoard.id);
    expect(reminted.columns[0].cards[0].id).not.toBe(
      initialBoard.columns[0].cards[0].id
    );
    expect(reminted.name).toBe(initialBoard.name);
  });

  it("imports a board into the workspace and selects it", () => {
    const next = importBoard(initialWorkspace, initialBoard);
    expect(next.boards).toHaveLength(2);
    expect(next.activeBoardId).toBe(next.boards[1].id);
    expect(next.boards[1].name).toBe(initialBoard.name);
    expect(next.boards[1].id).not.toBe(initialBoard.id);
  });

  it("builds a safe export filename", () => {
    expect(boardExportFilename("Product Launch")).toBe(
      "product-launch.flowdeck.json"
    );
    expect(boardExportFilename("  ")).toBe("board.flowdeck.json");
  });
});
