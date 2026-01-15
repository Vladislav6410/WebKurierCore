import { MediaCleanerAgent } from "./media-cleaner-agent.js";
import { MediaCleanerStorage } from "./storage/media-cleaner-storage.js";

export function createMediaCleanerAgent({ securityClient, chainClient } = {}) {
  const storage = new MediaCleanerStorage();
  return new MediaCleanerAgent({ securityClient, chainClient, storage });
}