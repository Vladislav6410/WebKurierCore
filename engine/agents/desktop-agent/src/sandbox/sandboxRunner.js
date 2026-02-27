import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { withTimeout } from "../utils/timeout.js";

function profilePath(profileName) {
  const p = path.resolve(process.cwd(), "src/sandbox/profiles", `${profileName}.json`);
  if (!fs.existsSync(p)) throw new Error(`Sandbox profile not found: ${p}`);
  return p;
}

export async function runInSandbox({ cmd, args, profile, job }) {
  const pPath = profilePath(profile);

  // Read timeout from profile (fallback)
  let timeoutMs = 60_000;
  try {
    const prof = JSON.parse(fs.readFileSync(pPath, "utf-8"));
    timeoutMs = Number(prof.timeout_ms || timeoutMs);
  } catch {}

  const run = () =>
    new Promise((resolve) => {
      const bwrapScript = path.resolve(process.cwd(), "src/sandbox/tools/bwrap.sh");

      const p = spawn("bash", [bwrapScript, pPath, cmd, ...args], {
        stdio: ["ignore", "pipe", "pipe"],
        env: {
          ...process.env,
          // Minimal env, avoid leaking secrets
          // DO NOT pass tokens here
        }
      });

      let out = "";
      let err = "";
      p.stdout.on("data", (d) => (out += d.toString()));
      p.stderr.on("data", (d) => (err += d.toString()));

      p.on("close", (code) => {
        resolve({
          ok: code === 0,
          code,
          stdout: out.slice(0, 20000),
          stderr: err.slice(0, 20000),
          profile
        });
      });
    });

  return await withTimeout(run(), timeoutMs, {
    ok: false,
    code: -1,
    stdout: "",
    stderr: `Timeout after ${timeoutMs}ms`,
    profile
  });
}