export type Card = {
  id: string;
  title: string;
  details: string;
};

export type Column = {
  id: string;
  name: string;
  cards: Card[];
};

export type Board = {
  id: string;
  name: string;
  description: string;
  columns: Column[];
};

export type Workspace = {
  boards: Board[];
  activeBoardId: string;
};
