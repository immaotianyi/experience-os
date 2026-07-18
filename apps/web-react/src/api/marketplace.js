/**
 * Marketplace API endpoints.
 */
import { getJson, postJson } from "./client.js";

export const searchMarketplace = (params = {}) => {
  const q = new URLSearchParams();
  if (params.query) q.set("query", params.query);
  if (params.license) q.set("license", params.license);
  if (params.pricingModel) q.set("pricingModel", params.pricingModel);
  if (params.sellerId) q.set("sellerId", params.sellerId);
  if (params.sortBy) q.set("sortBy", params.sortBy);
  if (params.limit) q.set("limit", params.limit);
  return getJson(`/api/marketplace/search?${q.toString()}`);
};

export const fetchListing = (listingId) =>
  getJson(`/api/marketplace/listing?listingId=${encodeURIComponent(listingId)}`);

export const fetchListingVersions = (skillId) =>
  getJson(`/api/marketplace/versions?skillId=${encodeURIComponent(skillId)}`);

export const recordDownload = (listingId) =>
  postJson("/api/marketplace/download", { listingId });

export const fetchMarketplaceStats = () => getJson("/api/marketplace/stats");

export const publishSkill = (body) => postJson("/api/marketplace/publish", body);
export const unpublishListing = (listingId) => postJson("/api/marketplace/unpublish", { listingId });
export const suspendListing = (listingId) => postJson("/api/marketplace/suspend", { listingId });
