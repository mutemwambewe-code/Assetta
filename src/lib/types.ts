

export type Tenant = {
  id: string;
  name: string;
  avatarUrl: string; // Was avatarId
  property: string;
  unit: string;
  phone: string;
  email: string | '';
  rentStatus: 'Paid' | 'Pending' | 'Overdue';
  rentAmount: number;
  leaseStartDate: string;
  leaseEndDate: string;
  paymentHistorySummary: string;
  paymentHistory: Payment[];
  nextDueDate?: string;
  propertyId?: string; // Added propertyId
  balance?: number; // Added balance for improved rent tracking
};

export type Subscription = {
  id: string;
  userId: string;
  status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'incomplete';
  plan: 'basic' | 'pro';
  currentPeriodEnd: string; // ISO Date
  providerId?: string; // Lenco ID
  createdAt: string;
};

export type Payment = {
  id: string;
  userId?: string;
  tenantId?: string;
  propertyId?: string;
  date: string;
  amount: number;
  method: 'Mobile Money' | 'Bank Transfer' | 'Cash';
  status: 'pending' | 'completed' | 'failed';
  reference?: string; // Lenco Reference or Manual Ref
};

export type EnrichedPayment = Payment & {
  tenantName: string;
  property: string;
  unit: string;
};

export type Property = {
  id: string;
  name: string;
  location: string;
  units: number;
  occupied: number;
  type: 'Shopping Complex' | 'Boarding House' | 'Residential Apartments' | 'House' | 'Other';
};

export type OverviewStats = {
  rentCollected: number;
  outstandingRent: number;
  occupancyRate: number;
  collectionRate: number;
  totalTenants: number;
  totalProperties: number;
};

export type MessageLog = {
  id: string; // This can be the local temporary ID or the final provider ID
  providerId?: string; // The final ID from the SMS provider (e.g., Africa's Talking)
  tenantId: string;
  tenantName: string;
  message: string;
  date: string;
  method: 'SMS' | 'WhatsApp';
  direction?: 'incoming' | 'outgoing'; // Add direction
  status?: string; // For delivery reports
}

export type Template = {
  id: string;
  title: string;
  content: string;
  category: string;
  status: 'active' | 'trashed';
};

export type Expense = {
  id: string;
  propertyId: string;
  date: string;
  category: 'Maintenance' | 'Utilities' | 'Management' | 'Repair' | 'Other';
  description: string;
  amount: number;
}

export type Invoice = {
  id: string;
  tenantId: string;
  propertyId: string;
  issueDate: string;
  dueDate: string;
  items: { description: string; amount: number }[];
  totalAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  notes?: string;
  tenantName: string;
  propertyName: string;
};

export type InvoiceItem = {
  description: string;
  amount: number;
};

export type Lease = {
  id: string;
  userId: string;
  tenantId: string;
  propertyId: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  status: 'draft' | 'signed' | 'active' | 'terminated';
  pdfUrl?: string;
  signatureStatus?: 'pending' | 'signed';
};

export type MaintenanceTicket = {
  id: string;
  userId: string;
  propertyId: string;
  tenantId: string;
  category: 'Plumbing' | 'Electrical' | 'Structural' | 'Other';
  description: string;
  photos: string[];
  status: 'open' | 'in_progress' | 'resolved';
  cost: number;
  assignedVendorId?: string;
  createdAt: string;
};

export type Vendor = {
  id: string;
  userId: string;
  name: string;
  category: string;
  phone: string;
  email?: string;
  rating?: number;
};

export type TaxReturn = {
  id: string;
  userId: string;
  period: string; // e.g., "10-2023"
  grossRent: number;
  expenses: number;
  taxableIncome: number;
  taxDue: number;
  status: 'draft' | 'filed';
  filedDate?: string;
  receiptUrl?: string;
};

export type UtilityBill = {
  id: string;
  propertyId: string;
  propertyName: string;
  utilityType: 'Water' | 'Electricity' | 'Garbage' | 'Security' | 'Internet' | 'Other';
  billingPeriodStart: string;
  billingPeriodEnd: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  billUrl?: string;
};

export interface UserProfile {
  uid: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  role: 'USER' | 'ADMIN';
  trial_start_date: string | null;
  trial_end_date: string | null;
  subscription_status: 'TRIAL' | 'ACTIVE' | 'INACTIVE' | 'CANCELED' | 'PAST_DUE' | null;
  plan: 'monthly' | 'yearly' | null;
  current_period_end: string | null;
}
