async function checkHealth() {
  const badge = document.getElementById("healthBadge");

  try {
    const response = await fetch("/api/agents/engineer/health");
    const data = await response.json();

    if (data.ok) {
      badge.textContent = data.hasOpenAIKey
        ? `online • ${data.model} • key ok`
        : `online • ${data.model} • key missing`;
      return;
    }

    badge.textContent = "health check failed";
  } catch (error) {
    badge.textContent = "offline";
  }
}

async function runEngineerTask() {
  const promptInput = document.getElementById("promptInput");
  const outputBox = document.getElementById("outputBox");
  const runBtn = document.getElementById("runBtn");

  const prompt = promptInput.value.trim();
  if (!prompt) {
    outputBox.textContent = "Please enter a task.";
    return;
  }

  runBtn.disabled = true;
  runBtn.textContent = "Running...";
  outputBox.textContent = "Processing...";

  try {
    const response = await fetch("/api/agents/engineer/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt,
        context: {
          source: "engineer-ui",
          app: "WebKurierCore"
        }
      })
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      outputBox.textContent = data.error || "Request failed.";
      return;
    }

    outputBox.textContent = data.output || "No output returned.";
  } catch (error) {
    outputBox.textContent = error.message || "Unknown error.";
  } finally {
    runBtn.disabled = false;
    runBtn.textContent = "Run EngineerAgent";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  checkHealth();
  document.getElementById("runBtn").addEventListener("click", runEngineerTask);
});