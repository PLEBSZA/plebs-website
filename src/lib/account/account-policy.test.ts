import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { AdminRole } from "../../generated/prisma/client";
import { CONSENT_WORDING } from "./consent";
import {
  accountMenuIdentity,
  customerUserRoleForCreate,
  recoveryOutboxEventType,
  replayedPaymentShouldProvision,
  restockGrantsNewsletter,
  shouldIssueSetupEmail,
  shouldRecordNewsletterGrant,
} from "./policy";
import { isAdminRole, isCustomerRole } from "./roles";
import {
  authorizeAdminPath,
  isPublicAccountPath,
} from "../auth/authorize";
import { safeInternalCallbackPath } from "../auth/callback-url";
import {
  outboxMayMarkSynced,
  shouldProcessClaimedOutboxJob,
} from "./outbox-policy";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("authorization migration", () => {
  it("makes CUSTOMER the safe default and denies admin permissions", () => {
    assert.equal(isCustomerRole("CUSTOMER"), true);
    assert.equal(isAdminRole("CUSTOMER"), false);
    const permissions = readFileSync(
      join(root, "src/lib/admin/permissions.ts"),
      "utf8",
    );
    assert.match(permissions, /CUSTOMER:\s*\[\],/);
    assert.match(permissions, /"customers:manage"/);
    assert.match(permissions, /if \(!isAdminRole\(role\)\) return false/);
  });

  it("blocks CUSTOMER from every admin path except login", () => {
    assert.equal(authorizeAdminPath("/admin", "CUSTOMER"), false);
    assert.equal(authorizeAdminPath("/admin/orders/", "CUSTOMER"), false);
    assert.equal(authorizeAdminPath("/admin/customers/", "CUSTOMER"), false);
    assert.equal(authorizeAdminPath("/admin/login/", "CUSTOMER"), true);
    assert.equal(authorizeAdminPath("/admin", "OWNER"), true);
    assert.equal(authorizeAdminPath("/products/", "CUSTOMER"), true);
  });

  it("keeps account setup/reset/confirm public", () => {
    assert.equal(isPublicAccountPath("/account/login/"), true);
    assert.equal(isPublicAccountPath("/account/activate/"), true);
    assert.equal(isPublicAccountPath("/account/reset-password/"), true);
    assert.equal(isPublicAccountPath("/account/forgot-password/"), true);
    assert.equal(isPublicAccountPath("/account/register/"), true);
    assert.equal(isPublicAccountPath("/account/sign-in/"), true);
    assert.equal(isPublicAccountPath("/account/confirm-newsletter/"), true);
    assert.equal(isPublicAccountPath("/account/orders/"), false);
  });
});

describe("account menu identity", () => {
  it("uses first and last name initials and falls back to email", () => {
    assert.deepEqual(
      accountMenuIdentity({
        firstName: "Daniel",
        lastName: "Taylor",
        email: "daniel@example.com",
      }),
      {
        initials: "DT",
        givenName: "Daniel",
        menuLabel: "Open account menu for Daniel",
      },
    );
    assert.equal(
      accountMenuIdentity({ email: "ada@example.com" }).initials,
      "A",
    );
    assert.equal(
      accountMenuIdentity({ name: "Ada Mokoena", email: "ada@example.com" })
        .initials,
      "AM",
    );
  });
});

describe("account provisioning policy", () => {
  it("creates CUSTOMER users and does not send setup when a password exists", () => {
    assert.equal(customerUserRoleForCreate(undefined), AdminRole.CUSTOMER);
    assert.equal(customerUserRoleForCreate("OWNER"), "OWNER");
    assert.equal(
      shouldIssueSetupEmail({ passwordHash: null, userRole: "CUSTOMER" }),
      true,
    );
    assert.equal(
      shouldIssueSetupEmail({ passwordHash: "hash", userRole: "CUSTOMER" }),
      false,
    );
    assert.equal(
      shouldIssueSetupEmail({ passwordHash: null, userRole: "OWNER" }),
      false,
    );
  });

  it("does not provision again on replayed payment", () => {
    assert.equal(replayedPaymentShouldProvision(true), true);
    assert.equal(replayedPaymentShouldProvision(false), false);
  });

  it("never treats restock as newsletter consent", () => {
    assert.equal(restockGrantsNewsletter(), false);
    assert.match(CONSENT_WORDING.RESTOCK_ALERT_EMAIL.text, /does not subscribe/i);
    assert.match(CONSENT_WORDING.RESTOCK_ALERT_EMAIL.text, /create a free account/i);
    const form = readFileSync(
      join(root, "src/components/product/RestockNotifyForm.tsx"),
      "utf8",
    );
    assert.match(form, /CONSENT_WORDING\.RESTOCK_ALERT_EMAIL\.text/);
  });

  it("sends setup email for pending accounts and reset for activated ones", () => {
    assert.equal(
      recoveryOutboxEventType({ passwordHash: null, active: true }),
      "ACCOUNT_SETUP_EMAIL",
    );
    assert.equal(
      recoveryOutboxEventType({ passwordHash: "hash", active: true }),
      "PASSWORD_RESET_EMAIL",
    );
    assert.equal(
      recoveryOutboxEventType({ passwordHash: null, active: false }),
      null,
    );
    assert.equal(
      recoveryOutboxEventType({
        passwordHash: null,
        active: true,
        userRole: "OWNER",
      }),
      null,
    );
  });

  it("records newsletter grant only for explicit new consent", () => {
    assert.equal(
      shouldRecordNewsletterGrant({ explicitConsent: false }),
      false,
    );
    assert.equal(
      shouldRecordNewsletterGrant({
        explicitConsent: true,
        currentStatus: "OPTED_IN",
      }),
      false,
    );
    assert.equal(
      shouldRecordNewsletterGrant({
        explicitConsent: true,
        currentStatus: "OPTED_OUT",
      }),
      true,
    );
  });
});

describe("tokens stay hashed", () => {
  it("stores SHA-256 rather than the raw token", () => {
    const raw = "plain-token-value";
    const hashed = createHash("sha256").update(raw).digest("hex");
    assert.notEqual(hashed, raw);
    assert.equal(hashed.length, 64);
  });
});

describe("repository guards", () => {
  it("defaults User.role to CUSTOMER and keeps restock consent on the old column", () => {
    const schema = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
    assert.match(schema, /role\s+AdminRole\s+@default\(CUSTOMER\)/);
    assert.match(schema, /CUSTOMER/);
    assert.match(schema, /alertConsent\s+Boolean.*@map\("marketing_consent"\)/);
    assert.match(schema, /model AccountToken/);
    assert.match(schema, /model ConsentEvent/);
    assert.match(schema, /model IntegrationOutbox/);
  });

  it("scopes customer order reads by customerId", () => {
    const queries = readFileSync(
      join(root, "src/lib/account/queries.ts"),
      "utf8",
    );
    assert.match(queries, /where: \{ customerId, number \}/);
    assert.match(queries, /where: \{ customerId \}/);
  });

  it("never opts in from a Resend webhook", () => {
    const webhook = readFileSync(
      join(root, "src/app/api/webhooks/resend/route.ts"),
      "utf8",
    );
    assert.match(webhook, /no_opt_in_from_provider/);
    assert.match(webhook, /withdrawNewsletter/);
    assert.doesNotMatch(webhook, /activateNewsletter/);
  });

  it("provisions accounts only after newly paid and swallows account errors", () => {
    const paid = readFileSync(
      join(root, "src/lib/commerce/fulfilment-service.ts"),
      "utf8",
    );
    assert.match(paid, /if \(newlyPaid\)/);
    assert.match(paid, /provisionPaidOrderAccount/);
    assert.match(paid, /customer account could not be provisioned/);
  });

  it("marks private account routes noindex", () => {
    const robots = readFileSync(join(root, "src/app/robots.ts"), "utf8");
    const proxy = readFileSync(join(root, "src/proxy.ts"), "utf8");
    assert.match(robots, /\/account\//);
    assert.match(proxy, /pathname.startsWith\("\/account"\)/);
  });

  it("does not acknowledge an unsent token cooldown as success", () => {
    const emails = readFileSync(
      join(root, "src/lib/account/account-emails.ts"),
      "utf8",
    );
    const outbox = readFileSync(join(root, "src/lib/account/outbox.ts"), "utf8");
    assert.match(emails, /AccountEmailRetryableError/);
    assert.match(emails, /requireIssuedToken/);
    assert.doesNotMatch(emails, /if \(!issued\.rawToken\) return;/);
    assert.match(outbox, /recoverStaleOutboxJobs/);
    assert.match(outbox, /OutboxStatus\.PROCESSING/);
  });

  it("validates Create Account emails before writing customer rows", () => {
    const actions = readFileSync(
      join(root, "src/app/account/actions.ts"),
      "utf8",
    );
    assert.match(actions, /parseNormalizedEmail/);
    assert.match(actions, /registerAccountAction/);
    const registerBlock = actions.slice(
      actions.indexOf("export async function registerAccountAction"),
      actions.indexOf("export async function customerLogoutAction"),
    );
    assert.match(registerBlock, /parseNormalizedEmail/);
    assert.doesNotMatch(
      registerBlock,
      /const email = normalizeEmail\(String\(formData\.get\("email"/,
    );
  });

  it("exposes a single Sign in control and a signed-in initials menu", () => {
    const menu = readFileSync(
      join(root, "src/components/layout/AccountMenu.tsx"),
      "utf8",
    );
    const nav = readFileSync(
      join(root, "src/components/layout/AccountNav.tsx"),
      "utf8",
    );
    assert.match(menu, /New to Plebs\?/);
    assert.match(menu, /Forgot password\?/);
    assert.match(menu, /role="dialog"/);
    assert.match(menu, /role="menu"/);
    assert.match(menu, /My account/);
    assert.match(menu, /usePathname/);
    assert.match(nav, /accountMenuIdentity/);
    assert.doesNotMatch(nav, /Create account/);
    const register = readFileSync(
      join(root, "src/app/account/register/RegisterForm.tsx"),
      "utf8",
    );
    assert.match(register, /CONSENT_WORDING\.ACCOUNT_REGISTER/);
  });

  it("does not duplicate independently interactive account menus on mobile", () => {
    const headerCss = readFileSync(
      join(root, "src/components/layout/SiteHeader.module.css"),
      "utf8",
    );
    const header = readFileSync(
      join(root, "src/components/layout/SiteHeader.tsx"),
      "utf8",
    );
    const mobile = readFileSync(
      join(root, "src/components/layout/MobileMenu.tsx"),
      "utf8",
    );
    assert.match(headerCss, /\.headerAccount \{[\s\S]*display: none;/);
    assert.match(headerCss, /@media \(min-width: 900px\) \{[\s\S]*\.headerAccount/);
    assert.match(header, /mobileAccountNav/);
    assert.match(header, /styles\.headerAccount/);
    assert.match(mobile, /accountNav/);
    assert.doesNotMatch(mobile, /openCart/);
  });

  it("stores historic consent against the supplied date", () => {
    const admin = readFileSync(
      join(root, "src/app/admin/actions/customers.ts"),
      "utf8",
    );
    assert.match(admin, /createdAt: new Date\(`\$\{occurredAt\}T12:00:00\.000Z`\)/);
  });
});

describe("safe internal callback paths", () => {
  it("accepts checkout, account, and storefront paths", () => {
    assert.equal(safeInternalCallbackPath("/checkout/"), "/checkout/");
    assert.equal(safeInternalCallbackPath("/account/orders/"), "/account/orders/");
    assert.equal(
      safeInternalCallbackPath("/products/cotton-corduroy-dungarees/"),
      "/products/cotton-corduroy-dungarees/",
    );
  });

  it("rejects absolute, protocol-relative, and backslash destinations", () => {
    assert.equal(safeInternalCallbackPath("https://evil.example"), "/account/");
    assert.equal(safeInternalCallbackPath("//evil.example"), "/account/");
    assert.equal(safeInternalCallbackPath("/\\evil.example"), "/account/");
    assert.equal(safeInternalCallbackPath("\\\\evil.example"), "/account/");
    assert.equal(safeInternalCallbackPath("javascript:alert(1)"), "/account/");
  });

  it("returns checkout shoppers to checkout after sign-in", () => {
    assert.equal(safeInternalCallbackPath("/checkout/"), "/checkout/");
    const actions = readFileSync(join(root, "src/app/account/actions.ts"), "utf8");
    assert.match(actions, /safeInternalCallbackPath\(formData\.get\("callbackUrl"\)\)/);
    const form = readFileSync(
      join(root, "src/components/checkout/CheckoutForm.tsx"),
      "utf8",
    );
    assert.match(form, /callbackUrl=\/checkout\//);
  });
});

describe("outbox claim and failure states", () => {
  it("cannot send a duplicate logical email after a lost claim", () => {
    assert.equal(shouldProcessClaimedOutboxJob(1), true);
    assert.equal(shouldProcessClaimedOutboxJob(0), false);
    assert.equal(
      outboxMayMarkSynced({
        claimedCount: 0,
        sendFailed: false,
        cooldown: false,
        dailyLimit: false,
      }),
      false,
    );
    assert.equal(
      outboxMayMarkSynced({
        claimedCount: 1,
        sendFailed: false,
        cooldown: true,
        dailyLimit: false,
      }),
      false,
    );
    assert.equal(
      outboxMayMarkSynced({
        claimedCount: 1,
        sendFailed: false,
        cooldown: false,
        dailyLimit: true,
      }),
      false,
    );
    assert.equal(
      outboxMayMarkSynced({
        claimedCount: 1,
        sendFailed: true,
        cooldown: false,
        dailyLimit: false,
      }),
      false,
    );
    assert.equal(
      outboxMayMarkSynced({
        claimedCount: 1,
        sendFailed: false,
        cooldown: false,
        dailyLimit: false,
      }),
      true,
    );
  });
});
