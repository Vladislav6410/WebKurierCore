// engine/agents/programmer/ui/programmer-ui.js
import { ProgrammerAgentClient } from "../programmer-agent.js";

const agent = new ProgrammerAgentClient();

let editor;
let currentPath = null;
let providerMode = "auto"; // openai | anthropic | auto | codex
let lastPatch = null;

function addMsg(role, text) {
  const box = document.getElementById("msgs");
  const div = document.createElement("div");
  div.className = "msg";
  div.innerHTML = `<div class="tag">${role}</div><div class="mono" style="white-space:pre-wrap">${escapeHtml(
    String(text ?? "")
  )}</div>`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));
}

async function refreshFiles() {
  const files = await agent.listFiles();
  const list = document.getElementById("fileList");
  list.innerHTML = "";
  files.forEach((p) => {
    const el = document.createElement("div");
    el.className = "item mono";
    el.textContent = p;
    el.onclick = async () => openFile(p);
    list.appendChild(el);
  });
}

async function openFile(path) {
  currentPath = path;
  const content = await agent.readFile(path);
  editor.setValue(content);
}

async function showDiff()