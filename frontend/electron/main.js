const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const http = require("node:http");

app.setName("Flowdeck");

const WORKSPACE_FILE = "workspace.json";
const isDev = !app.isPackaged;

function workspacePath() {
  return path.join(app.getPath("userData"), WORKSPACE_FILE);
}

function ensureUserDataDir() {
  const dir = app.getPath("userData");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".ico")) return "image/x-icon";
  if (filePath.endsWith(".woff2")) return "font/woff2";
  if (filePath.endsWith(".woff")) return "font/woff";
  return "application/octet-stream";
}

function startStaticServer(rootDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const urlPath = decodeURIComponent(
          new URL(req.url || "/", "http://127.0.0.1").pathname
        );
        const relative = urlPath === "/" ? "index.html" : urlPath.replace(/^\//, "");
        const filePath = path.normalize(path.join(rootDir, relative));
        if (!filePath.startsWith(rootDir)) {
          res.writeHead(403);
          res.end("Forbidden");
          return;
        }
        fs.readFile(filePath, (err, data) => {
          if (err) {
            res.writeHead(404);
            res.end("Not found");
            return;
          }
          res.writeHead(200, { "Content-Type": contentType(filePath) });
          res.end(data);
        });
      } catch {
        res.writeHead(500);
        res.end("Error");
      }
    });

    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Failed to bind static server"));
        return;
      }
      resolve({ server, port: address.port });
    });
  });
}

ipcMain.handle("workspace:load", async () => {
  ensureUserDataDir();
  const file = workspacePath();
  if (!fs.existsSync(file)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(file, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
});

ipcMain.handle("workspace:save", async (_event, workspace) => {
  ensureUserDataDir();
  const file = workspacePath();
  fs.writeFileSync(file, JSON.stringify(workspace, null, 2), "utf8");
  return true;
});

ipcMain.handle("board:export", async (_event, { defaultFilename, content }) => {
  const result = await dialog.showSaveDialog({
    title: "Export board",
    defaultPath: defaultFilename || "board.flowdeck.json",
    filters: [{ name: "Flowdeck Board", extensions: ["json"] }],
  });
  if (result.canceled || !result.filePath) {
    return { ok: false };
  }
  fs.writeFileSync(result.filePath, content, "utf8");
  return { ok: true, filePath: result.filePath };
});

ipcMain.handle("board:import", async () => {
  const result = await dialog.showOpenDialog({
    title: "Import board",
    filters: [{ name: "Flowdeck Board", extensions: ["json"] }],
    properties: ["openFile"],
  });
  if (result.canceled || !result.filePaths?.[0]) {
    return null;
  }
  return fs.readFileSync(result.filePaths[0], "utf8");
});

/** @type {import('http').Server | null} */
let staticServer = null;

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 900,
    minHeight: 600,
    title: "Flowdeck",
    backgroundColor: "#f7fafc",
    icon: path.join(__dirname, "..", "build", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    await win.loadURL("http://localhost:3000");
  } else {
    const outDir = path.join(__dirname, "..", "out");
    const { server, port } = await startStaticServer(outDir);
    staticServer = server;
    await win.loadURL(`http://127.0.0.1:${port}`);
  }
}

app.whenReady().then(async () => {
  await createWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (staticServer) {
    staticServer.close();
    staticServer = null;
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});
