/**
 * WebODM client (MVP)
 * You provide WEBODM_URL + token.
 */

export class WebODMClient {
  constructor({ baseUrl, token }) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.token = token;
  }

  async createProject(name) {
    const r = await fetch(`${this.baseUrl}/api/projects/`, {
      method: "POST",
      headers: this._h(),
      body: JSON.stringify({ name })
    });
    return r.json();
  }

  async createTask(projectId, options = {}) {
    // WebODM expects multipart upload for images in real use.
    // MVP: create task without files, you add upload pipeline later.
    const r = await fetch(`${this.baseUrl}/api/projects/${projectId}/tasks/`, {
      method: "POST",
      headers: this._h(),
      body: JSON.stringify({
        name: options.name || "WK Task",
        options: options.webodm_options || {}
      })
    });
    return r.json();
  }

  async getTask(projectId, taskId) {
    const r = await fetch(`${this.baseUrl}/api/projects/${projectId}/tasks/${taskId}/`, {
      headers: this._h()
    });
    return r.json();
  }

  _h() {
    return {
      "Content-Type": "application/json",
      "Authorization": `Token ${this.token}`
    };
  }
}