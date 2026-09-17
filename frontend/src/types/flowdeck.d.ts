import type { Workspace } from "@/lib/types";

export type FlowdeckBridge = {
  loadWorkspace: () => Promise<unknown>;
  saveWorkspace: (workspace: Workspace) => Promise<boolean>;
  exportBoardFile: (
    defaultFilename: string,
    content: string
  ) => Promise<{ ok: boolean; filePath?: string }>;
  importBoardFile: () => Promise<string | null>;
};

declare global {
  interface Window {
    flowdeck?: FlowdeckBridge;
  }
}

export {};
