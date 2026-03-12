const fs = require("fs");
const { execSync } = require("child_process");

function safeRemove(path) {
  try {
    fs.rmSync(path, { force: true });
  } catch (_) {
    // Ignore: stale lock cleanup should be best-effort.
  }
}

function freePort3001OnWindows() {
  try {
    const output = execSync(
      'powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess"',
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
    );

    const pids = output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((pid) => Number(pid))
      .filter((pid) => Number.isInteger(pid) && pid > 0);

    for (const pid of pids) {
      try {
        process.kill(pid, "SIGTERM");
      } catch (_) {
        try {
          execSync(`taskkill //PID ${pid} //F`, { stdio: "ignore" });
        } catch (_) {
          // Ignore if process is already gone or inaccessible.
        }
      }
    }
  } catch (_) {
    // Ignore if command is unavailable or no listener exists.
  }
}

safeRemove(".next-cache/dev/lock");
safeRemove(".next/dev/lock");

if (process.platform === "win32") {
  freePort3001OnWindows();
}
