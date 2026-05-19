// engine/connectors/github/github-agent.js

import { Octokit } from "@octokit/rest";

/**
 * GITHUB AGENT
 * WebKurier GitHub Executor
 */

export class GitHubAgent {
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });

    this.owner = process.env.GITHUB_OWNER;
  }

  /**
   * Получить информацию о репозитории
   */
  async getRepo(repo) {
    try {
      const response = await this.octokit.repos.get({
        owner: this.owner,
        repo
      });

      return response.data;
    } catch (error) {
      console.error("GET REPO ERROR:", error.message);
    }
  }

  /**
   * Создать issue
   */
  async createIssue(repo, title, body) {
    try {
      const response = await this.octokit.issues.create({
        owner: this.owner,
        repo,
        title,
        body
      });

      console.log("ISSUE CREATED:", response.data.html_url);

      return response.data;
    } catch (error) {
      console.error("CREATE ISSUE ERROR:", error.message);
    }
  }

  /**
   * Создать branch
   */
  async createBranch(repo, newBranch, fromBranch = "main") {
    try {
      const base = await this.octokit.repos.getBranch({
        owner: this.owner,
        repo,
        branch: fromBranch
      });

      const sha = base.data.commit.sha;

      await this.octokit.git.createRef({
        owner: this.owner,
        repo,
        ref: `refs/heads/${newBranch}`,
        sha
      });

      console.log("BRANCH CREATED:", newBranch);

      return true;
    } catch (error) {
      console.error("CREATE BRANCH ERROR:", error.message);
    }
  }

  /**
   * Получить файл
   */
  async getFile(repo, path, branch = "main") {
    try {
      const response = await this.octokit.repos.getContent({
        owner: this.owner,
        repo,
        path,
        ref: branch
      });

      return response.data;
    } catch (error) {
      console.error("GET FILE ERROR:", error.message);
    }
  }

  /**
   * Обновить файл
   */
  async updateFile({
    repo,
    path,
    content,
    message,
    branch = "main"
  }) {
    try {
      const existingFile = await this.getFile(
        repo,
        path,
        branch
      );

      const sha = existingFile.sha;

      const encodedContent = Buffer.from(
        content
      ).toString("base64");

      const response =
        await this.octokit.repos.createOrUpdateFileContents({
          owner: this.owner,
          repo,
          path,
          message,
          content: encodedContent,
          sha,
          branch
        });

      console.log("FILE UPDATED:", path);

      return response.data;
    } catch (error) {
      console.error("UPDATE FILE ERROR:", error.message);
    }
  }

  /**
   * Создать новый файл
   */
  async createFile({
    repo,
    path,
    content,
    message,
    branch = "main"
  }) {
    try {
      const encodedContent = Buffer.from(
        content
      ).toString("base64");

      const response =
        await this.octokit.repos.createOrUpdateFileContents({
          owner: this.owner,
          repo,
          path,
          message,
          content: encodedContent,
          branch
        });

      console.log("FILE CREATED:", path);

      return response.data;
    } catch (error) {
      console.error("CREATE FILE ERROR:", error.message);
    }
  }

  /**
   * Создать Pull Request
   */
  async createPullRequest({
    repo,
    title,
    body,
    head,
    base = "main"
  }) {
    try {
      const response =
        await this.octokit.pulls.create({
          owner: this.owner,
          repo,
          title,
          body,
          head,
          base
        });

      console.log(
        "PULL REQUEST CREATED:",
        response.data.html_url
      );

      return response.data;
    } catch (error) {
      console.error(
        "CREATE PULL REQUEST ERROR:",
        error.message
      );
    }
  }

  /**
   * Workflow полного цикла
   */
  async executeWorkflow({
    repo,
    issueTitle,
    issueBody,
    branch,
    filePath,
    fileContent,
    commitMessage,
    prTitle,
    prBody
  }) {
    console.log("=================================");
    console.log("WEBKURIER GITHUB WORKFLOW");
    console.log("=================================");

    await this.createIssue(
      repo,
      issueTitle,
      issueBody
    );

    await this.createBranch(
      repo,
      branch
    );

    await this.createFile({
      repo,
      path: filePath,
      content: fileContent,
      message: commitMessage,
      branch
    });

    await this.createPullRequest({
      repo,
      title: prTitle,
      body: prBody,
      head: branch
    });

    console.log("=================================");
    console.log("WORKFLOW FINISHED");
    console.log("=================================");
  }
}

/**
 * EXPORT
 */

const githubAgent = new GitHubAgent();

export default githubAgent;