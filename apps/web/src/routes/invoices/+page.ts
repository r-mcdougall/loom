import { redirect } from "@sveltejs/kit";
import { ApiError, clientsApi, invoicesApi } from "$lib/api";
import { session } from "$lib/session.svelte";
import type { PageLoad } from "./$types";

export const load: PageLoad = async () => {
  const token = session.accessToken;
  if (!token) {
    redirect(303, "/login");
  }

  try {
    const [invoices, clients] = await Promise.all([
      invoicesApi.list(token),
      clientsApi.list(token),
    ]);
    return { invoices, clients };
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      redirect(303, "/login");
    }
    throw err;
  }
};
