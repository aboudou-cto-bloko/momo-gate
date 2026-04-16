/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as http from "../http.js";
import type * as merchants from "../merchants.js";
import type * as payments from "../payments.js";
import type * as payments_actions from "../payments_actions.js";
import type * as payout_actions from "../payout_actions.js";
import type * as payouts from "../payouts.js";
import type * as sessions from "../sessions.js";
import type * as shopify from "../shopify.js";
import type * as webhook_moneroo from "../webhook_moneroo.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  http: typeof http;
  merchants: typeof merchants;
  payments: typeof payments;
  payments_actions: typeof payments_actions;
  payout_actions: typeof payout_actions;
  payouts: typeof payouts;
  sessions: typeof sessions;
  shopify: typeof shopify;
  webhook_moneroo: typeof webhook_moneroo;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
