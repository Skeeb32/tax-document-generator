export type Jurisdiction = { code: string; name: string; currency: string };
export type TaxRecord = { id: string; description: string; source: string; amount: string };
export type InvestorInput = { id: string; name: string; share: string; paid: string };
export type Allocation = { id: string; name: string; share: number; estimateMinor: number; paidMinor: number | null; varianceMinor: number | null };
export type DistributionResult = {
  property: string;
  period: string;
  currency: string;
  grossMinor: number;
  reserveMinor: number;
  distributableMinor: number;
  allocations: Allocation[];
};
export type ChecklistItem = { id: string; title: string; owner: string; status: "Not started" | "In progress" | "Ready" | "Blocked" };
