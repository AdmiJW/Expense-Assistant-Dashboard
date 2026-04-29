export const EXPENSE_CATEGORIES = [
  "食物",
  "飲料",
  "交通",
  "購物",
  "娛樂",
  "居家",
  "數位產品",
  "醫療",
  "旅行",
  "其他",
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]
