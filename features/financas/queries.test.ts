import { describe, expect, it } from "vitest";
import type { Member } from "@/lib/household";
import { computeOverview, type TxRow } from "./queries";

const members: Member[] = [
  {
    userId: "willian",
    displayName: "Willian",
    color: "#6366f1",
    role: "owner",
  },
  {
    userId: "angelica",
    displayName: "Angélica",
    color: "#ec4899",
    role: "member",
  },
];

const baseTx = {
  id: "tx",
  date: "2026-06-02",
  amountCents: 119000,
  scope: "shared",
  description: null,
  paid: true,
  categoryId: null,
  categoryName: null,
  categoryColor: null,
  recurringBillId: null,
} satisfies Omit<TxRow, "kind" | "payerUserId">;

describe("computeOverview couple split settlements", () => {
  it("subtracts partner repayments from the open settlement", () => {
    const rows: TxRow[] = [
      { ...baseTx, kind: "expense", payerUserId: "willian" },
      {
        ...baseTx,
        id: "settlement",
        kind: "settlement",
        amountCents: 59500,
        payerUserId: "angelica",
        description: "Acerto do casal",
      },
    ];

    const overview = computeOverview("2026-06", rows, members);

    expect(overview.income).toBe(0);
    expect(overview.expense).toBe(119000);
    expect(overview.balance).toBe(-119000);
    expect(overview.split.settlement).toBeNull();
    expect(overview.split.members.map((m) => m.balance)).toEqual([0, 0]);
  });

  it("keeps the remaining amount open after a partial repayment", () => {
    const rows: TxRow[] = [
      { ...baseTx, kind: "expense", payerUserId: "willian" },
      {
        ...baseTx,
        id: "partial-settlement",
        kind: "settlement",
        amountCents: 30000,
        payerUserId: "angelica",
        description: "Acerto parcial do casal",
      },
    ];

    const overview = computeOverview("2026-06", rows, members);

    expect(overview.split.settlement).toEqual({
      fromUserId: "angelica",
      fromName: "Angélica",
      toUserId: "willian",
      toName: "Willian",
      amount: 29500,
    });
    expect(overview.split.members.map((m) => m.balance)).toEqual([29500, -29500]);
  });
});
