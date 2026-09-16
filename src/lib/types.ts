export type Currency = "USD" | "CAD" | "EUR" | "GBP";
export type InvoiceStatus = "draft" | "sent" | "paid";

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export interface Party {
  name: string;
  email: string;
  address?: string;
}

export interface Invoice {
  id: string;
  creatorToken: string;
  from: Party;
  billTo: Party;
  lineItems: LineItem[];
  currency: Currency;
  issueDate: string;
  dueDate: string;
  notes?: string;
  paymentInstructions?: string;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

export interface CreateInvoiceInput {
  from: Party;
  billTo: Party;
  lineItems: Omit<LineItem, "id">[];
  currency: Currency;
  issueDate: string;
  dueDate: string;
  notes?: string;
  paymentInstructions?: string;
  status?: InvoiceStatus;
}
