import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  BillingInterval,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { ConvexSessionStorage } from "./lib/convex-session-storage";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new ConvexSessionStorage(process.env.CONVEX_URL!),
  distribution: AppDistribution.AppStore,
  billing: {
    // Starter : ~5 000 XOF/mois — 100 transactions, commission 5 %
    Starter: {
      lineItems: [
        {
          amount: 8,
          currencyCode: "USD",
          interval: BillingInterval.Every30Days,
        },
      ],
    },
    // Pro : ~15 000 XOF/mois — illimité, commission 2,5 %
    Pro: {
      lineItems: [
        {
          amount: 25,
          currencyCode: "USD",
          interval: BillingInterval.Every30Days,
        },
      ],
    },
  },
  hooks: {
    afterAuth: async ({ session }) => {
      // Créer ou réactiver le marchand dans Convex à chaque installation / reconnexion OAuth
      const client = new ConvexHttpClient(process.env.CONVEX_URL!);
      await client.mutation(api.merchants.install, { shop: session.shop });
    },
  },
  future: {
    expiringOfflineAccessTokens: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.October25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
