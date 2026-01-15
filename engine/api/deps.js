/**
 * Dependencies factory for API layer.
 * - securityClient: must gate all actions
 * - chainClient: must mint/audit coin events
 */

import { createSecurityClient } from "../clients/security-client.js";
import { createChainClient } from "../clients/chain-client.js";

export function createApiDeps() {
  const securityClient = createSecurityClient({
    baseUrl: process.env.SECURITY_URL || "",
    token: process.env.SECURITY_TOKEN || "",
    devAllow: process.env.DEV_ALLOW_SECURITY === "1",
  });

  const chainClient = createChainClient({
    baseUrl: process.env.CHAIN_URL || "",
    token: process.env.CHAIN_TOKEN || "",
  });

  return { securityClient, chainClient };
}