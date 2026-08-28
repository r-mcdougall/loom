<script lang="ts">
  import "../app.css";
  import { goto } from "$app/navigation";
  import { authApi } from "$lib/api";
  import { clearTokens, session } from "$lib/session.svelte";

  let { children }: { children: import("svelte").Snippet } = $props();

  async function logout(): Promise<void> {
    const refreshToken = session.refreshToken;
    clearTokens();
    if (refreshToken) {
      // Best effort — revoke server-side, but the local session is already gone.
      await authApi.logout(refreshToken).catch(() => undefined);
    }
    await goto("/login");
  }
</script>

<div class="min-h-screen bg-slate-50 text-slate-900">
  <header class="border-b border-slate-200 bg-white">
    <div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
      <a href="/invoices" class="font-semibold">Loom</a>
      {#if session.authenticated}
        <button
          type="button"
          onclick={logout}
          class="text-sm text-slate-600 hover:text-slate-900"
        >
          Log out
        </button>
      {/if}
    </div>
  </header>

  <main class="mx-auto max-w-5xl px-6 py-10">
    {@render children()}
  </main>
</div>
