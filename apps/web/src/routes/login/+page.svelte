<script lang="ts">
  import { goto } from "$app/navigation";
  import { loginSchema } from "@loom/types";
  import { ApiError, authApi } from "$lib/api";
  import { session, setTokens } from "$lib/session.svelte";

  let email = $state("");
  let password = $state("");
  let error = $state<string | undefined>(undefined);
  let submitting = $state(false);

  $effect(() => {
    if (session.authenticated) {
      goto("/invoices");
    }
  });

  async function onSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    error = undefined;

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      error = parsed.error.issues.map((issue) => issue.message).join(", ");
      return;
    }

    submitting = true;
    try {
      const tokens = await authApi.login(parsed.data);
      setTokens(tokens);
      await goto("/invoices");
    } catch (err) {
      error = err instanceof ApiError ? err.message : "Unable to reach the API";
    } finally {
      submitting = false;
    }
  }
</script>

<div class="mx-auto max-w-sm">
  <h1 class="text-2xl font-semibold">Log in</h1>
  <p class="mt-1 text-sm text-slate-500">
    No account? <a href="/register" class="underline">Create one</a>.
  </p>

  {#if error}
    <p class="mt-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
      {error}
    </p>
  {/if}

  <form onsubmit={onSubmit} class="mt-6 space-y-4 rounded border border-slate-200 bg-white p-4">
    <label class="block text-sm">
      <span class="mb-1 block font-medium">Email</span>
      <input
        type="email"
        name="email"
        required
        bind:value={email}
        class="w-full rounded border border-slate-300 px-2 py-1"
      />
    </label>

    <label class="block text-sm">
      <span class="mb-1 block font-medium">Password</span>
      <input
        type="password"
        name="password"
        required
        bind:value={password}
        class="w-full rounded border border-slate-300 px-2 py-1"
      />
    </label>

    <button
      type="submit"
      disabled={submitting}
      class="w-full rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
    >
      Log in
    </button>
  </form>
</div>
