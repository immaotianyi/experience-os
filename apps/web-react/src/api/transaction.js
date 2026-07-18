/**
 * Transaction & Pricing API endpoints.
 */
import { getJson, postJson } from "./client.js";

export const fetchRevenueSummary = (sellerId) =>
  getJson(`/api/transaction/revenue?sellerId=${encodeURIComponent(sellerId)}`);

export const fetchTransactionHistory = (params = {}) => {
  const q = new URLSearchParams();
  if (params.buyerId) q.set("buyerId", params.buyerId);
  if (params.listingId) q.set("listingId", params.listingId);
  if (params.sellerId) q.set("sellerId", params.sellerId);
  if (params.limit) q.set("limit", params.limit);
  return getJson(`/api/transaction/history?${q.toString()}`);
};

export const fetchTransaction = (transactionId) =>
  getJson(`/api/transaction/get?transactionId=${encodeURIComponent(transactionId)}`);

export const processPurchase = (body) => postJson("/api/transaction/purchase", body);
export const processTrial = (body) => postJson("/api/transaction/trial", body);
export const refundTransaction = (transactionId) =>
  postJson("/api/transaction/refund", { transactionId });

export const fetchPricingBreakdown = (listingId, type = "purchase") =>
  getJson(`/api/pricing/breakdown?listingId=${encodeURIComponent(listingId)}&type=${type}`);

export const verifyBuyerLicense = (listingId, buyerId) =>
  getJson(`/api/transaction/verify-license?listingId=${encodeURIComponent(listingId)}&buyerId=${encodeURIComponent(buyerId)}`);
