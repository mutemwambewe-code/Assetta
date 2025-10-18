

export type Tenant = {
  id: string;
  name: string;
  avatarUrl: string; // Was avatarId
  property: string;
  unit: string;
  phone: string;
  email: string;
  rentStatus: 'Paid' | 'Pending' | 'Overdue';
  rentAmount: number;
  leaseStartDate: string;
  leaseEndDate: string;
  paymentHistorySummary: string;
  paymentHistory: Payment[];
};

export type Payment = {
  id: string;
  date: string;
  amount: number;
  method: 'Mobile Money' | 'Bank Transfer' | 'Cash';
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
};

export type Expense = {
  id: string;
  propertyId: string;
  date: string;
  category: 'Maintenance' | 'Utilities' | 'Management' | 'Repair' | 'Other';
  description: string;
  amount: number;
}
