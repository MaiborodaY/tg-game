import { spawn } from "node:child_process";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const repoRoot = process.cwd();
const fighterAssetsRoot = path.join(repoRoot, "gladiator-arena", "public", "assets", "fighters");
const quality = Number.parseFloat(process.argv[2] ?? "0.92");
const chromeCandidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

const resolvedChromePath = await findExistingPath(chromeCandidates);

if (!resolvedChromePath) {
  throw new Error("Could not find Chrome or Edge for WebP conversion.");
}

const pngFiles = await listFiles(fighterAssetsRoot, ".png");
const userDataDir = path.join(tmpdir(), `gladiator-webp-${Date.now()}`);

await mkdir(userDataDir, { recursive: true });

const chrome = spawn(resolvedChromePath, [
  "--headless=new",
  "--disable-gpu",
  "--remote-debugging-port=0",
  `--user-data-dir=${userDataDir}`,
  "about:blank",
], {
  stdio: ["ignore", "ignore", "pipe"],
});

try {
  const port = await waitForDevToolsPort(userDataDir);
  const targets = await fetchJson(`http://127.0.0.1:${port}/json/list`);
  const page = targets.find((target) => target.type === "page" && target.webSocketDebuggerUrl);

  if (!page) {
    throw new Error("Could not find a Chrome page target.");
  }

  const cdp = await connectCdp(page.webSocketDebuggerUrl);
  await cdp.send("Runtime.enable");

  let originalTotal = 0;
  let webpTotal = 0;

  for (const pngPath of pngFiles) {
    const png = await readFile(pngPath);
    const webpDataUrl = await convertPngToWebp(cdp, png, quality);
    const webp = Buffer.from(webpDataUrl.replace(/^data:image\/webp;base64,/, ""), "base64");
    const webpPath = pngPath.replace(/\.png$/i, ".webp");

    await writeFile(webpPath, webp);
    originalTotal += png.byteLength;
    webpTotal += webp.byteLength;

    console.log(`${path.relative(repoRoot, pngPath)} ${formatBytes(png.byteLength)} -> ${formatBytes(webp.byteLength)}`);
  }

  await cdp.close();
  console.log(`Total ${formatBytes(originalTotal)} -> ${formatBytes(webpTotal)}`);
} finally {
  chrome.kill();
  await waitForProcessExit(chrome);

  try {
    await rm(userDataDir, { recursive: true, force: true });
  } catch (error) {
    console.warn(`Could not remove temporary Chrome profile: ${error.message}`);
  }
}

async function listFiles(root, extension) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      files.push(...await listFiles(fullPath, extension));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(extension)) {
      files.push(fullPath);
    }
  }

  return files;
}

async function findExistingPath(candidates) {
  for (const candidate of candidates) {
    try {
      await readFile(candidate);

      return candidate;
    } catch {
      // Keep trying the next browser path.
    }
  }

  return undefined;
}

async function waitForDevToolsPort(userDataDirPath) {
  const portFile = path.join(userDataDirPath, "DevToolsActivePort");

  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const [port] = (await readFile(portFile, "utf8")).trim().split(/\r?\n/);

      return port;
    } catch {
      await delay(50);
    }
  }

  throw new Error("Chrome did not expose DevToolsActivePort in time.");
}

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while fetching ${url}`);
  }

  return response.json();
}

async function connectCdp(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  const pending = new Map();
  let nextId = 1;

  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    const request = pending.get(message.id);

    if (!request) {
      return;
    }

    pending.delete(message.id);

    if (message.error) {
      request.reject(new Error(message.error.message));
      return;
    }

    request.resolve(message.result);
  });

  return {
    send(method, params = {}) {
      const id = nextId;
      nextId += 1;

      socket.send(JSON.stringify({ id, method, params }));

      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
      });
    },
    close() {
      socket.close();
    },
  };
}

async function convertPngToWebp(cdp, png, webpQuality) {
  const dataUrl = `data:image/png;base64,${png.toString("base64")}`;
  const expression = `
    new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0);
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("WebP encoder returned an empty blob."));
            return;
          }
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        }, "image/webp", ${webpQuality});
      };
      image.onerror = () => reject(new Error("Could not load PNG data URL."));
      image.src = ${JSON.stringify(dataUrl)};
    })
  `;
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
    timeout: 30000,
  });

  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text);
  }

  return result.result.value;
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function waitForProcessExit(process) {
  if (process.exitCode !== null) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    process.once("exit", resolve);
  });
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}
