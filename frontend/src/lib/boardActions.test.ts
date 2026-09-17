import { describe, expect, it } from "vitest";
import {
  addCard,
  deleteCard,
  findCardLocation,
  moveCard,
  renameColumn,
  updateCard,
} from "./boardActions";
import type { Board } from "./types";

const sampleBoard: Board = {
  id: "board-a",
  name: "Sample",
  description: "Test board",
  columns: [
    {
      id: "col-a",
      name: "Backlog",
      cards: [
        { id: "c1", title: "One", details: "First" },
        { id: "c2", title: "Two", details: "Second" },
      ],
    },
    {
      id: "col-b",
      name: "To Do",
      cards: [{ id: "c3", title: "Three", details: "Third" }],
    },
    {
      id: "col-c",
      name: "Done",
      cards: [],
    },
    {
      id: "col-d",
      name: "Review",
      cards: [],
    },
    {
      id: "col-e",
      name: "Blocked",
      cards: [],
    },
  ],
};

describe("renameColumn", () => {
  it("renames the target column", () => {
    const next = renameColumn(sampleBoard, "col-a", "Ideas");
    expect(next.columns[0].name).toBe("Ideas");
    expect(next.columns[1].name).toBe("To Do");
    expect(next.id).toBe("board-a");
  });
});

describe("addCard", () => {
  it("appends a card to the target column", () => {
    const next = addCard(sampleBoard, "col-b", "New task", "Details here");
    expect(next.columns[1].cards).toHaveLength(2);
    expect(next.columns[1].cards[1].title).toBe("New task");
    expect(next.columns[1].cards[1].details).toBe("Details here");
    expect(next.columns[1].cards[1].id).toBeTruthy();
  });

  it("trims title and details", () => {
    const next = addCard(sampleBoard, "col-c", "  Trimmed  ", "  body  ");
    expect(next.columns[2].cards[0].title).toBe("Trimmed");
    expect(next.columns[2].cards[0].details).toBe("body");
  });
});

describe("deleteCard", () => {
  it("removes the card from its column", () => {
    const next = deleteCard(sampleBoard, "c2");
    expect(next.columns[0].cards.map((c) => c.id)).toEqual(["c1"]);
    expect(next.columns[1].cards).toHaveLength(1);
  });
});

describe("updateCard", () => {
  it("updates title and details", () => {
    const next = updateCard(sampleBoard, "c1", {
      title: "Updated",
      details: "<p><strong>Bold</strong> body</p>",
    });
    expect(next.columns[0].cards[0].title).toBe("Updated");
    expect(next.columns[0].cards[0].details).toBe(
      "<p><strong>Bold</strong> body</p>"
    );
    expect(next.columns[0].cards[1].title).toBe("Two");
  });

  it("keeps the previous title when the new title is blank", () => {
    const next = updateCard(sampleBoard, "c1", {
      title: "   ",
      details: "kept",
    });
    expect(next.columns[0].cards[0].title).toBe("One");
    expect(next.columns[0].cards[0].details).toBe("kept");
  });
});

describe("findCardLocation", () => {
  it("returns column and index", () => {
    expect(findCardLocation(sampleBoard, "c3")).toEqual({
      columnId: "col-b",
      index: 0,
    });
  });

  it("returns null when missing", () => {
    expect(findCardLocation(sampleBoard, "missing")).toBeNull();
  });
});

describe("moveCard", () => {
  it("moves a card to another column at an index", () => {
    const next = moveCard(sampleBoard, "c1", "col-b", 0);
    expect(next.columns[0].cards.map((c) => c.id)).toEqual(["c2"]);
    expect(next.columns[1].cards.map((c) => c.id)).toEqual(["c1", "c3"]);
  });

  it("reorders within the same column", () => {
    const next = moveCard(sampleBoard, "c1", "col-a", 2);
    expect(next.columns[0].cards.map((c) => c.id)).toEqual(["c2", "c1"]);
  });

  it("moves to an empty column", () => {
    const next = moveCard(sampleBoard, "c3", "col-c", 0);
    expect(next.columns[1].cards).toHaveLength(0);
    expect(next.columns[2].cards.map((c) => c.id)).toEqual(["c3"]);
  });

  it("returns the same board when card is missing", () => {
    const next = moveCard(sampleBoard, "missing", "col-b", 0);
    expect(next).toBe(sampleBoard);
  });
});
