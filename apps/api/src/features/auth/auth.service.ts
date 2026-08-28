import { eq } from "drizzle-orm";
import { sign } from "hono/jwt";
import type { LoginInput, RefreshInput, RegisterInput } from "@loom/types";
import { db } from "../../db";
import { refreshTokens, users } from "../../db/schema";
import { env } from "../../env";
import { ConflictError, UnauthorizedError } from "../../shared/errors";
import { parseDurationToSeconds } from "../../shared/time";

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

// Refresh tokens are opaque UUIDs; a fast SHA-256 digest is enough (and lets us
// look them up by equality) since they carry full entropy, unlike passwords.
export function hashRefreshToken(token: string): string {
  return new Bun.CryptoHasher("sha256").update(token).digest("hex");
}

async function issueTokens(userId: string): Promise<AuthTokens> {
  const now = Math.floor(Date.now() / 1000);

  const accessToken = await sign(
    { sub: userId, exp: now + parseDurationToSeconds(env.JWT_ACCESS_EXPIRES_IN) },
    env.JWT_ACCESS_SECRET,
  );

  const refreshExpiresInSeconds = parseDurationToSeconds(env.REFRESH_TOKEN_EXPIRES_IN);
  const refreshToken = crypto.randomUUID();

  await db.insert(refreshTokens).values({
    userId,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt: new Date((now + refreshExpiresInSeconds) * 1000),
  });

  return { accessToken, refreshToken };
}

export async function registerUser(input: RegisterInput): Promise<AuthTokens> {
  const existing = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });
  if (existing) {
    throw new ConflictError("An account with this email already exists");
  }

  const passwordHash = await Bun.password.hash(input.password);
  const [user] = await db
    .insert(users)
    .values({ name: input.name, email: input.email, passwordHash })
    .returning();

  if (!user) {
    throw new Error("Failed to create user");
  }

  return issueTokens(user.id);
}

export async function loginUser(input: LoginInput): Promise<AuthTokens> {
  const user = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });
  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const isValid = await Bun.password.verify(input.password, user.passwordHash);
  if (!isValid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  return issueTokens(user.id);
}

/**
 * Validates a refresh token, revokes it, and issues a fresh token pair
 * (rotation). An unknown, expired, or already-used token is rejected.
 */
export async function rotateRefreshToken(input: RefreshInput): Promise<AuthTokens> {
  const tokenHash = hashRefreshToken(input.refreshToken);
  const stored = await db.query.refreshTokens.findFirst({
    where: eq(refreshTokens.tokenHash, tokenHash),
  });

  if (!stored) {
    throw new UnauthorizedError("Invalid refresh token");
  }

  await db.delete(refreshTokens).where(eq(refreshTokens.id, stored.id));

  if (stored.expiresAt.getTime() <= Date.now()) {
    throw new UnauthorizedError("Refresh token has expired");
  }

  return issueTokens(stored.userId);
}

/** Revokes a refresh token. Idempotent — an unknown token is a no-op. */
export async function revokeRefreshToken(input: RefreshInput): Promise<void> {
  const tokenHash = hashRefreshToken(input.refreshToken);
  await db.delete(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash));
}
