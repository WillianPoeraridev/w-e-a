/** Trimmed, serializable shapes passed from server components to client UI. */
export type CategoryLite = {
  id: string;
  name: string;
  kind: "income" | "expense";
  color: string;
};

export type MemberLite = {
  userId: string;
  displayName: string;
  color: string;
};
