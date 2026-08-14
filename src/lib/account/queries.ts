import "server-only";

import {
  CommunicationPurpose,
  PaymentStatus,
  type Prisma,
} from "@/generated/prisma/client";
import { db } from "@/lib/db";

export async function getCustomerDashboard(customerId: string) {
  const customer = await db.customer.findUniqueOrThrow({
    where: { id: customerId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          emailVerified: true,
          passwordHash: true,
          lastLoginAt: true,
          active: true,
          role: true,
        },
      },
      preferences: true,
      orders: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { items: true, payments: true, fulfilments: true },
      },
    },
  });

  return customer;
}

export async function listCustomerOrders(customerId: string) {
  return db.order.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    include: { items: true, payments: true, fulfilments: true },
  });
}

export async function getCustomerOrder(customerId: string, number: string) {
  return db.order.findFirst({
    where: { customerId, number },
    include: {
      items: true,
      payments: true,
      fulfilments: { orderBy: { createdAt: "desc" } },
      returnRequests: true,
    },
  });
}

export async function listCustomerAddresses(customerId: string) {
  return db.address.findMany({
    where: { customerId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getCustomerPreferences(customerId: string) {
  const [customer, restockRequests, consentEvents] = await Promise.all([
    db.customer.findUniqueOrThrow({
      where: { id: customerId },
      include: { preferences: true },
    }),
    db.restockRequest.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
    }),
    db.consentEvent.findMany({
      where: { customerId, purpose: CommunicationPurpose.NEWSLETTER_EMAIL },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);
  return { customer, restockRequests, consentEvents };
}

export async function listAdminCustomers(input: {
  search?: string;
  skip?: number;
  take?: number;
}) {
  const take = Math.min(input.take ?? 50, 100);
  const skip = input.skip ?? 0;
  const search = input.search?.trim();

  const where: Prisma.CustomerWhereInput = search
    ? {
        OR: [
          { email: { contains: search, mode: "insensitive" } },
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { orders: { some: { number: { contains: search, mode: "insensitive" } } } },
        ],
      }
    : {};

  const [rows, total] = await Promise.all([
    db.customer.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take,
      include: {
        user: {
          select: {
            id: true,
            role: true,
            active: true,
            passwordHash: true,
            emailVerified: true,
            lastLoginAt: true,
          },
        },
        preferences: {
          where: { purpose: CommunicationPurpose.NEWSLETTER_EMAIL },
        },
        orders: {
          select: {
            id: true,
            total: true,
            paymentStatus: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    db.customer.count({ where }),
  ]);

  return {
    total,
    take,
    skip,
    customers: rows.map((customer) => {
      const paid = customer.orders.filter(
        (order) => order.paymentStatus === PaymentStatus.PAID,
      );
      const lifetime = paid.reduce((sum, order) => sum + Number(order.total), 0);
      return {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        accountStatus: !customer.user
          ? "no_user"
          : !customer.user.active
            ? "deactivated"
            : customer.user.passwordHash
              ? "active"
              : "pending_setup",
        paidOrderCount: paid.length,
        lifetimePaidTotal: lifetime,
        lastOrderAt: customer.orders[0]?.createdAt ?? null,
        newsletterStatus: customer.preferences[0]?.status ?? "OPTED_OUT",
        resendSyncStatus: customer.resendSyncStatus,
        updatedAt: customer.updatedAt,
      };
    }),
  };
}

export async function getAdminCustomer(id: string) {
  return db.customer.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          active: true,
          passwordHash: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
        },
      },
      addresses: true,
      preferences: true,
      consentEvents: { orderBy: { createdAt: "desc" }, take: 50 },
      restockRequests: { orderBy: { createdAt: "desc" } },
      orders: {
        orderBy: { createdAt: "desc" },
        include: { items: true },
      },
      returnRequests: { orderBy: { createdAt: "desc" } },
      integrationOutbox: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
}
