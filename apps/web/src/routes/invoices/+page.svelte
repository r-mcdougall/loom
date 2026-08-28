<script lang="ts">
  import { createClientSchema, createInvoiceSchema, invoiceStatusEnum } from "@loom/types";
  import { ApiError, clientsApi, invoicesApi } from "$lib/api";
  import type { Client, Invoice } from "$lib/api";
  import { session } from "$lib/session.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let invoices = $state<Invoice[]>([]);
  let clients = $state<Client[]>([]);

  $effect(() => {
    invoices = data.invoices;
    clients = data.clients;
  });

  const statuses = invoiceStatusEnum.options;

  interface ItemRow {
    description: string;
    quantity: number;
    unitPrice: number;
  }

  let items = $state<ItemRow[]>([{ description: "", quantity: 1, unitPrice: 0 }]);

  function addItem(): void {
    items = [...items, { description: "", quantity: 1, unitPrice: 0 }];
  }

  function removeItem(index: number): void {
    items = items.filter((_, i) => i !== index);
  }

  function invoiceTotal(invoice: Invoice): number {
    return invoice.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
  }

  function money(value: number): string {
    return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
  }

  function requireToken(): string {
    const token = session.accessToken;
    if (!token) {
      throw new ApiError("Session expired", 401);
    }
    return token;
  }

  // Client form
  let clientName = $state("");
  let clientEmail = $state("");
  let clientPhone = $state("");
  let clientAddress = $state("");
  let clientTaxId = $state("");
  let clientError = $state<string | undefined>(undefined);
  let clientCreated = $state<string | undefined>(undefined);
  let creatingClient = $state(false);

  async function onCreateClient(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    clientError = undefined;
    clientCreated = undefined;

    const parsed = createClientSchema.safeParse({
      name: clientName,
      email: clientEmail,
      phone: clientPhone || undefined,
      address: clientAddress || undefined,
      taxId: clientTaxId || undefined,
    });

    if (!parsed.success) {
      clientError = parsed.error.issues.map((issue) => issue.message).join(", ");
      return;
    }

    creatingClient = true;
    try {
      const client = await clientsApi.create(requireToken(), parsed.data);
      clients = [...clients, client];
      clientCreated = client.id;
      clientName = "";
      clientEmail = "";
      clientPhone = "";
      clientAddress = "";
      clientTaxId = "";
    } catch (err) {
      clientError = err instanceof ApiError ? err.message : "Failed to create client";
    } finally {
      creatingClient = false;
    }
  }

  // Invoice form
  let invoiceClientId = $state("");
  let invoiceStatus = $state<string>(statuses[0]);
  let invoiceIssueDate = $state("");
  let invoiceDueDate = $state("");
  let invoiceNotes = $state("");
  let invoiceError = $state<string | undefined>(undefined);
  let invoiceCreated = $state<string | undefined>(undefined);
  let creatingInvoice = $state(false);

  async function onCreateInvoice(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    invoiceError = undefined;
    invoiceCreated = undefined;

    const parsed = createInvoiceSchema.safeParse({
      clientId: invoiceClientId,
      issueDate: invoiceIssueDate,
      dueDate: invoiceDueDate,
      status: invoiceStatus || undefined,
      notes: invoiceNotes || undefined,
      items,
    });

    if (!parsed.success) {
      invoiceError = parsed.error.issues.map((issue) => issue.message).join(", ");
      return;
    }

    creatingInvoice = true;
    try {
      const invoice = await invoicesApi.create(requireToken(), parsed.data);
      invoices = [...invoices, invoice];
      invoiceCreated = invoice.id;
      invoiceClientId = "";
      invoiceIssueDate = "";
      invoiceDueDate = "";
      invoiceNotes = "";
      items = [{ description: "", quantity: 1, unitPrice: 0 }];
    } catch (err) {
      invoiceError = err instanceof ApiError ? err.message : "Failed to create invoice";
    } finally {
      creatingInvoice = false;
    }
  }
</script>

<h1 class="text-2xl font-semibold">Invoices</h1>
<p class="mt-1 text-sm text-slate-500">
  Connected to <code>apps/api</code> at <code>/invoices</code> and <code>/clients</code>.
</p>

<!-- Invoice list -->
<section class="mt-8">
  <h2 class="text-lg font-medium">All invoices ({invoices.length})</h2>

  {#if invoices.length === 0}
    <p class="mt-2 text-sm text-slate-500">No invoices yet.</p>
  {:else}
    <div class="mt-3 overflow-x-auto rounded border border-slate-200 bg-white">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-100 text-xs uppercase text-slate-500">
          <tr>
            <th class="px-3 py-2">ID</th>
            <th class="px-3 py-2">Client</th>
            <th class="px-3 py-2">Status</th>
            <th class="px-3 py-2">Items</th>
            <th class="px-3 py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {#each invoices as invoice (invoice.id)}
            <tr class="border-t border-slate-100 align-top">
              <td class="px-3 py-2 font-mono text-xs">{invoice.id}</td>
              <td class="px-3 py-2">{invoice.client.name}</td>
              <td class="px-3 py-2">
                <span class="rounded bg-slate-100 px-2 py-0.5 text-xs">{invoice.status}</span>
              </td>
              <td class="px-3 py-2">
                <ul class="list-disc pl-4">
                  {#each invoice.items as item (item.id)}
                    <li>{item.description} — {item.quantity} × {money(item.unitPrice)}</li>
                  {/each}
                </ul>
              </td>
              <td class="px-3 py-2 text-right font-medium">{money(invoiceTotal(invoice))}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</section>

<!-- Create client -->
<section class="mt-10">
  <h2 class="text-lg font-medium">New client</h2>

  {#if clientError}
    <p class="mt-2 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
      {clientError}
    </p>
  {:else if clientCreated}
    <p class="mt-2 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
      Client {clientCreated} created.
    </p>
  {/if}

  <form
    onsubmit={onCreateClient}
    class="mt-3 grid gap-3 rounded border border-slate-200 bg-white p-4 sm:grid-cols-2"
  >
    <label class="text-sm">
      <span class="mb-1 block font-medium">Name</span>
      <input name="name" required bind:value={clientName} class="w-full rounded border border-slate-300 px-2 py-1" />
    </label>
    <label class="text-sm">
      <span class="mb-1 block font-medium">Email</span>
      <input type="email" name="email" required bind:value={clientEmail} class="w-full rounded border border-slate-300 px-2 py-1" />
    </label>
    <label class="text-sm">
      <span class="mb-1 block font-medium">Phone (optional)</span>
      <input name="phone" bind:value={clientPhone} class="w-full rounded border border-slate-300 px-2 py-1" />
    </label>
    <label class="text-sm">
      <span class="mb-1 block font-medium">Tax ID (optional)</span>
      <input name="taxId" bind:value={clientTaxId} class="w-full rounded border border-slate-300 px-2 py-1" />
    </label>
    <label class="text-sm sm:col-span-2">
      <span class="mb-1 block font-medium">Address (optional)</span>
      <input name="address" bind:value={clientAddress} class="w-full rounded border border-slate-300 px-2 py-1" />
    </label>
    <div class="sm:col-span-2">
      <button
        type="submit"
        disabled={creatingClient}
        class="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        Create client
      </button>
    </div>
  </form>
</section>

<!-- Create invoice -->
<section class="mt-10">
  <h2 class="text-lg font-medium">New invoice</h2>

  {#if invoiceError}
    <p class="mt-2 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
      {invoiceError}
    </p>
  {:else if invoiceCreated}
    <p class="mt-2 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
      Invoice {invoiceCreated} created.
    </p>
  {/if}

  {#if clients.length === 0}
    <p class="mt-3 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700">
      Create a client first — an invoice needs one.
    </p>
  {:else}
    <form onsubmit={onCreateInvoice} class="mt-3 space-y-4 rounded border border-slate-200 bg-white p-4">
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="text-sm">
          <span class="mb-1 block font-medium">Client</span>
          <select name="clientId" required bind:value={invoiceClientId} class="w-full rounded border border-slate-300 px-2 py-1">
            <option value="" disabled>Select a client</option>
            {#each clients as client (client.id)}
              <option value={client.id}>{client.name} ({client.email})</option>
            {/each}
          </select>
        </label>

        <label class="text-sm">
          <span class="mb-1 block font-medium">Status</span>
          <select name="status" bind:value={invoiceStatus} class="w-full rounded border border-slate-300 px-2 py-1">
            {#each statuses as status (status)}
              <option value={status}>{status}</option>
            {/each}
          </select>
        </label>

        <label class="text-sm">
          <span class="mb-1 block font-medium">Issue date</span>
          <input type="date" name="issueDate" required bind:value={invoiceIssueDate} class="w-full rounded border border-slate-300 px-2 py-1" />
        </label>

        <label class="text-sm">
          <span class="mb-1 block font-medium">Due date</span>
          <input type="date" name="dueDate" required bind:value={invoiceDueDate} class="w-full rounded border border-slate-300 px-2 py-1" />
        </label>
      </div>

      <label class="block text-sm">
        <span class="mb-1 block font-medium">Notes (optional)</span>
        <textarea name="notes" rows="2" bind:value={invoiceNotes} class="w-full rounded border border-slate-300 px-2 py-1"></textarea>
      </label>

      <fieldset class="space-y-2">
        <legend class="text-sm font-medium">Items</legend>

        {#each items as item, index (index)}
          <div class="grid gap-2 sm:grid-cols-[1fr_6rem_8rem_auto]">
            <input
              name="itemDescription"
              required
              bind:value={item.description}
              placeholder="Description"
              class="rounded border border-slate-300 px-2 py-1 text-sm"
            />
            <input
              name="itemQuantity"
              type="number"
              step="any"
              min="0"
              required
              bind:value={item.quantity}
              placeholder="Qty"
              class="rounded border border-slate-300 px-2 py-1 text-sm"
            />
            <input
              name="itemUnitPrice"
              type="number"
              step="any"
              min="0"
              required
              bind:value={item.unitPrice}
              placeholder="Unit price"
              class="rounded border border-slate-300 px-2 py-1 text-sm"
            />
            <button
              type="button"
              onclick={() => removeItem(index)}
              disabled={items.length === 1}
              class="rounded border border-slate-300 px-2 py-1 text-sm disabled:opacity-40"
            >
              Remove
            </button>
          </div>
        {/each}

        <button type="button" onclick={addItem} class="rounded border border-slate-300 px-3 py-1 text-sm">
          + Add item
        </button>
      </fieldset>

      <button
        type="submit"
        disabled={creatingInvoice}
        class="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        Create invoice
      </button>
    </form>
  {/if}
</section>
