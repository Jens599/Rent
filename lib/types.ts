export interface Tenant {
  id: string;
  name: string;
  baseRent: number;
  contact?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  tenantName: string;
  date: string;
  baseRent: number;
  previousMonthReading: number;
  currentMonthReading: number;
  unitsConsumed: number;
  electricityCost: number;
  total: number;
}
