export const adminNavItems = [
  { href: "/admin", label: "Overview", permission: "admin:access" as const },
  {
    href: "/admin/products",
    label: "Products",
    permission: "products:read" as const,
  },
  {
    href: "/admin/inventory",
    label: "Inventory",
    permission: "inventory:read" as const,
  },
  {
    href: "/admin/batches",
    label: "Batches",
    permission: "inventory:write" as const,
  },
  {
    href: "/admin/inventory/history",
    label: "Stock history",
    permission: "inventory:read" as const,
  },
  {
    href: "/admin/orders",
    label: "Orders",
    permission: "orders:read" as const,
  },
  {
    href: "/admin/returns",
    label: "Returns",
    permission: "returns:manage" as const,
  },
  {
    href: "/admin/restock",
    label: "Restock demand",
    permission: "restock:read" as const,
  },
] as const;
