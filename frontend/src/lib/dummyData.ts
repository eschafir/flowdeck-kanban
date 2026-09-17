import type { Board, Column, Workspace } from "./types";

export function emptyColumns(): Column[] {
  return [
    { id: "col-backlog", name: "Backlog", cards: [] },
    { id: "col-todo", name: "To Do", cards: [] },
    { id: "col-progress", name: "In Progress", cards: [] },
    { id: "col-review", name: "Review", cards: [] },
    { id: "col-done", name: "Done", cards: [] },
  ];
}

export const initialBoard: Board = {
  id: "board-demo",
  name: "Product Launch",
  description: "Demo board with sample work items.",
  columns: [
    {
      id: "col-backlog",
      name: "Backlog",
      cards: [
        {
          id: "card-1",
          title: "Define product vision",
          details: "Draft the elevator pitch and success metrics for launch.",
        },
        {
          id: "card-2",
          title: "Map user journeys",
          details: "Sketch the primary flows for creating and moving work.",
        },
      ],
    },
    {
      id: "col-todo",
      name: "To Do",
      cards: [
        {
          id: "card-3",
          title: "Design board layout",
          details: "Finalize column spacing, typography, and card hierarchy.",
        },
        {
          id: "card-4",
          title: "Choose accent treatments",
          details:
            "Apply yellow highlights and purple action buttons consistently.",
        },
      ],
    },
    {
      id: "col-progress",
      name: "In Progress",
      cards: [
        {
          id: "card-5",
          title: "Build drag and drop",
          details: "Enable moving cards within and across columns smoothly.",
        },
      ],
    },
    {
      id: "col-review",
      name: "Review",
      cards: [
        {
          id: "card-6",
          title: "Polish empty states",
          details: "Ensure empty columns still feel intentional and usable.",
        },
      ],
    },
    {
      id: "col-done",
      name: "Done",
      cards: [
        {
          id: "card-7",
          title: "Seed demo board",
          details: "Populate the board with realistic starter cards.",
        },
      ],
    },
  ],
};

export const initialWorkspace: Workspace = {
  boards: [initialBoard],
  activeBoardId: initialBoard.id,
};
