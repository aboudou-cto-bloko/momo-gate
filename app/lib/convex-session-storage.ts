import { Session } from "@shopify/shopify-api";
import type { SessionStorage } from "@shopify/shopify-app-session-storage";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

/**
 * Adapter Shopify SessionStorage → Convex.
 *
 * Remplace PrismaSessionStorage. Utilise ConvexHttpClient côté serveur
 * (Node.js / React Router loaders) pour appeler les fonctions internes Convex.
 *
 * Usage dans shopify.server.ts :
 *   import { ConvexSessionStorage } from "./lib/convex-session-storage";
 *   sessionStorage: new ConvexSessionStorage(process.env.CONVEX_URL!)
 */
export class ConvexSessionStorage implements SessionStorage {
  private client: ConvexHttpClient;

  constructor(convexUrl: string) {
    this.client = new ConvexHttpClient(convexUrl);
  }

  async storeSession(session: Session): Promise<boolean> {
    await this.client.mutation(api.sessions.store, sessionToArgs(session));
    return true;
  }

  async loadSession(id: string): Promise<Session | undefined> {
    const row = await this.client.query(api.sessions.getByShopifyId, {
      shopifyId: id,
    });
    if (!row) return undefined;
    return rowToSession(row);
  }

  async deleteSession(id: string): Promise<boolean> {
    await this.client.mutation(api.sessions.deleteByShopifyId, {
      shopifyId: id,
    });
    return true;
  }

  async deleteSessions(ids: string[]): Promise<boolean> {
    await this.client.mutation(api.sessions.deleteMany, { shopifyIds: ids });
    return true;
  }

  async findSessionsByShop(shop: string): Promise<Session[]> {
    const rows = await this.client.query(api.sessions.getByShop, { shop });
    return rows.map(rowToSession);
  }
}

// ─── Helpers de sérialisation ─────────────────────────────────────────────────

type SessionRow = {
  shopifyId: string;
  shop: string;
  state: string;
  isOnline: boolean;
  scope?: string;
  expires?: number;
  accessToken: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  accountOwner: boolean;
  locale?: string;
  collaborator?: boolean;
  emailVerified?: boolean;
  refreshToken?: string;
  refreshTokenExpires?: number;
};

function sessionToArgs(s: Session): SessionRow {
  return {
    shopifyId: s.id,
    shop: s.shop,
    state: s.state,
    isOnline: s.isOnline,
    scope: s.scope ?? undefined,
    expires: s.expires ? s.expires.getTime() : undefined,
    accessToken: s.accessToken ?? "",
    userId: s.onlineAccessInfo?.associated_user?.id != null
      ? String(s.onlineAccessInfo?.associated_user.id)
      : undefined,
    firstName: s.onlineAccessInfo?.associated_user?.first_name ?? undefined,
    lastName: s.onlineAccessInfo?.associated_user?.last_name ?? undefined,
    email: s.onlineAccessInfo?.associated_user?.email ?? undefined,
    accountOwner: s.onlineAccessInfo?.associated_user?.account_owner ?? false,
    locale: s.onlineAccessInfo?.associated_user?.locale ?? undefined,
    collaborator: s.onlineAccessInfo?.associated_user?.collaborator ?? undefined,
    emailVerified: s.onlineAccessInfo?.associated_user?.email_verified ?? undefined,
  };
}

function rowToSession(row: SessionRow): Session {
  const session = new Session({
    id: row.shopifyId,
    shop: row.shop,
    state: row.state,
    isOnline: row.isOnline,
  });

  session.scope = row.scope;
  session.expires = row.expires ? new Date(row.expires) : undefined;
  session.accessToken = row.accessToken;

  if (row.isOnline && row.userId) {
    session.onlineAccessInfo = {
      expires_in: 0,
      associated_user_scope: row.scope ?? "",
      associated_user: {
        id: Number(row.userId),
        first_name: row.firstName ?? "",
        last_name: row.lastName ?? "",
        email: row.email ?? "",
        account_owner: row.accountOwner,
        locale: row.locale ?? "",
        collaborator: row.collaborator ?? false,
        email_verified: row.emailVerified ?? false,
      },
    };
  }

  return session;
}
