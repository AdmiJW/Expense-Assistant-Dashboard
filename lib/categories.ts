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

const CATEGORY_ALIAS_ENTRIES = [
    ["食物", ["食品", "餐饮", "餐飲"]],
    ["飲料", ["饮料"]],
    ["交通", []],
    ["購物", ["购物"]],
    ["娛樂", ["娱乐"]],
    ["居家", []],
    ["數位產品", ["数位产品", "数字产品", "数码产品", "數字產品", "数码用品"]],
    ["醫療", ["医疗"]],
    ["旅行", ["旅遊", "旅游"]],
    ["其他", []],
] as const satisfies readonly [ExpenseCategory, readonly string[]][]

// Compatibility for existing SQLite/MCP data that may contain simplified
// Chinese category names while the dashboard keeps traditional labels canonical.
export const CATEGORY_ALIASES: Record<string, ExpenseCategory> =
    Object.fromEntries(
        CATEGORY_ALIAS_ENTRIES.flatMap(([canonical, aliases]) => [
            [canonical, canonical],
            ...aliases.map((alias) => [alias, canonical] as const),
        ]),
    ) as Record<string, ExpenseCategory>

export function normalizeCategory(category: string): ExpenseCategory | string {
    return CATEGORY_ALIASES[category.trim()] ?? category
}

export function getCategoryAliases(category: string): string[] {
    const canonical = normalizeCategory(category)
    const aliases = CATEGORY_ALIAS_ENTRIES.find(
        ([value]) => value === canonical,
    )
    if (!aliases) return [category]
    return [aliases[0], ...aliases[1]]
}

export function categoriesMatch(left: string, right: string): boolean {
    return normalizeCategory(left) === normalizeCategory(right)
}
