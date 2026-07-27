/**
 * Platform compatibility API endpoints.
 */
import { getJson, postJson } from "./client.js";

export const fetchPlatformHealth = () =>
  getJson("/api/platforms");

export const startPlatform = (name, options = {}) =>
  postJson(`/api/platforms/${encodeURIComponent(name)}/start`, options);
