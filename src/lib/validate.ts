import type { CreateInvoiceInput } from "./types";

export type ValidationErrors = Record<string, string>;

export function validateInvoice(
  input: Partial<CreateInvoiceInput>
): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!input.billTo?.name?.trim()) {
    errors.clientName = "Add a client name";
  }

  if (!input.from?.name?.trim()) {
    errors.fromName = "Add a business name";
  }

  if (!input.from?.email?.trim()) {
    errors.fromEmail = "Add your email";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.from.email.trim())) {
    errors.fromEmail = "Enter a valid email";
  }

  if (input.billTo?.email?.trim()) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.billTo.email.trim())) {
      errors.clientEmail = "Enter a valid email";
    }
  }

  const items = input.lineItems ?? [];
  const validItems = items.filter(
    (i) => i.description?.trim() && Number(i.quantity) > 0
  );

  if (validItems.length === 0) {
    errors.lineItems = "Add at least one item";
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.description?.trim() && !item.quantity && !item.rate) continue;
    if (!item.description?.trim()) {
      errors[`item_${i}_desc`] = "Add a description";
    }
    if (!(Number(item.quantity) > 0)) {
      errors[`item_${i}_qty`] = "Enter a valid amount";
    }
    if (Number.isNaN(Number(item.rate)) || Number(item.rate) < 0) {
      errors[`item_${i}_rate`] = "Enter a valid amount";
    }
  }

  if (!input.issueDate) {
    errors.issueDate = "Add an issue date";
  }
  if (!input.dueDate) {
    errors.dueDate = "Add a due date";
  }

  return errors;
}
