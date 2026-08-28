import { browser } from "$app/environment";
import type { AuthTokens } from "./api";

const ACCESS_KEY = "loom_access";
const REFRESH_KEY = "loom_refresh";

let accessToken = $state<string | null>(
  browser ? localStorage.getItem(ACCESS_KEY) : null,
);
let refreshToken = $state<string | null>(
  browser ? localStorage.getItem(REFRESH_KEY) : null,
);

export const session = {
  get accessToken(): string | null {
    return accessToken;
  },
  get refreshToken(): string | null {
    return refreshToken;
  },
  get authenticated(): boolean {
    return accessToken !== null;
  },
};

export function setTokens(tokens: AuthTokens): void {
  accessToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
  if (browser) {
    localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  }
}

export function clearTokens(): void {
  accessToken = null;
  refreshToken = null;
  if (browser) {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }
}
