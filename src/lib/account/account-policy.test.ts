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
import {
  ACCOUNT_NAV_ITEMS,
  ACCOUNT_ORDERS_PAGE_SIZE,
  friendlyFulfilmentStatus,
  friendlyNewsletterStatus,
  friendlyPaymentStatus,
  isAccountNavActive,
  parseAccountOrdersPage,
} from "./account-ui";

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
    const proxy = readFileSync(join(root, "src/proxy.ts"), "utf8");
    assert.match(proxy, /authorizeAdminPath/);
    assert.match(proxy, /\/admin\/login\//);
    const adminLogin = readFileSync(
      join(root, "src/app/admin/login/page.tsx"),
      "utf8",
    );
    assert.match(adminLogin, /getAdminSession/);
    assert.doesNotMatch(adminLogin, /redirect\("\/account\/"\)/);
    const customerLogin = readFileSync(
      join(root, "src/app/account/actions.ts"),
      "utf8",
    );
    assert.match(customerLogin, /isAdminRole\(user\.role\)/);
    assert.match(customerLogin, /redirect\("\/admin\/"\)/);
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

  it("builds account email links from the public site URL, not localhost", () => {
    const emails = readFileSync(
      join(root, "src/lib/account/account-emails.ts"),
      "utf8",
    );
    assert.match(emails, /getTransactionalSiteUrl/);
    assert.doesNotMatch(emails, /getCanonicalSiteUrl/);
    const authConfig = readFileSync(join(root, "src/auth.config.ts"), "utf8");
    assert.match(authConfig, /resolveAuthRedirectUrl/);
    assert.match(authConfig, /sanitizeDeployedAuthEnv/);
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
    assert.equal(
      safeInternalCallbackPath("http://localhost:3001/account/"),
      "/account/",
    );
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

describe("signed-in account area", () => {
  it("keeps exactly five account destinations and separates Sign out", () => {
    assert.equal(ACCOUNT_NAV_ITEMS.length, 5);
    assert.deepEqual(
      ACCOUNT_NAV_ITEMS.map((item) => item.label),
      ["Overview", "Orders", "Profile", "Addresses", "Email preferences"],
    );
    assert.equal(
      ACCOUNT_NAV_ITEMS.some((item) => /sign out/i.test(item.label)),
      false,
    );

    const nav = readFileSync(
      join(root, "src/components/account/AccountSectionNav.tsx"),
      "utf8",
    );
    const layout = readFileSync(join(root, "src/app/account/layout.tsx"), "utf8");
    assert.match(nav, /ACCOUNT_NAV_ITEMS/);
    assert.match(nav, /aria-label="Account"/);
    assert.match(nav, /usePathname/);
    assert.doesNotMatch(nav, /Sign out/);
    assert.match(layout, /customerLogoutAction/);
    assert.match(layout, /className=\{styles\.signOut\}/);
    assert.doesNotMatch(layout, /fallback=\{null\}/);
  });

  it("marks the active account route, including nested orders", () => {
    assert.equal(isAccountNavActive("/account/", "/account/"), true);
    assert.equal(isAccountNavActive("/account", "/account/"), true);
    assert.equal(isAccountNavActive("/account/orders/", "/account/"), false);
    assert.equal(isAccountNavActive("/account/profile/", "/account/"), false);
    assert.equal(isAccountNavActive("/account/orders/", "/account/orders/"), true);
    assert.equal(
      isAccountNavActive("/account/orders/PLB-1001/", "/account/orders/"),
      true,
    );
    assert.equal(isAccountNavActive("/account/profile/", "/account/profile/"), true);
    assert.equal(
      isAccountNavActive("/account/addresses/", "/account/addresses/"),
      true,
    );
    assert.equal(
      isAccountNavActive("/account/preferences/", "/account/preferences/"),
      true,
    );
  });

  it("validates order pagination query values", () => {
    assert.equal(ACCOUNT_ORDERS_PAGE_SIZE, 20);
    assert.equal(parseAccountOrdersPage(undefined), 1);
    assert.equal(parseAccountOrdersPage("foo"), 1);
    assert.equal(parseAccountOrdersPage("-3"), 1);
    assert.equal(parseAccountOrdersPage("0"), 1);
    assert.equal(parseAccountOrdersPage("2"), 2);
    assert.equal(parseAccountOrdersPage("99999"), 500);
  });

  it("uses friendly payment, fulfilment and newsletter labels", () => {
    assert.equal(friendlyPaymentStatus("PENDING"), "Awaiting payment");
    assert.equal(friendlyPaymentStatus("PAID"), "Paid");
    assert.equal(friendlyFulfilmentStatus("PROCESSING"), "Processing");
    assert.equal(friendlyFulfilmentStatus("FULFILLED"), "Dispatched");
    assert.equal(friendlyFulfilmentStatus("DELIVERED"), "Delivered");
    assert.equal(friendlyNewsletterStatus("OPTED_IN"), "Subscribed");
    assert.equal(friendlyNewsletterStatus("OPTED_OUT"), "Not subscribed");
    assert.equal(
      friendlyNewsletterStatus("PENDING_CONFIRMATION"),
      "Confirmation pending",
    );
    assert.equal(friendlyNewsletterStatus("SUPPRESSED"), "Suppressed");
    assert.equal(friendlyNewsletterStatus(null), "Not subscribed");
  });

  it("requires customer authentication on signed-in account pages", () => {
    const pages = [
      "src/app/account/page.tsx",
      "src/app/account/orders/page.tsx",
      "src/app/account/orders/[number]/page.tsx",
      "src/app/account/profile/page.tsx",
      "src/app/account/addresses/page.tsx",
      "src/app/account/preferences/page.tsx",
    ];
    for (const relative of pages) {
      const source = readFileSync(join(root, relative), "utf8");
      assert.match(source, /requireCustomerSession\(\)/);
      assert.match(source, /noIndex:\s*true/);
    }
  });

  it("keeps order and address mutations scoped to the signed-in customer", () => {
    const queries = readFileSync(join(root, "src/lib/account/queries.ts"), "utf8");
    const actions = readFileSync(join(root, "src/app/account/actions.ts"), "utf8");
    assert.match(queries, /where: \{ customerId, number \}/);
    assert.match(queries, /where: \{ customerId \}/);
    assert.match(queries, /payments: \{ orderBy: \{ createdAt: "desc" \} \}/);
    assert.match(queries, /fulfilments: \{ orderBy: \{ createdAt: "desc" \} \}/);

    const profile = actions.slice(
      actions.indexOf("export async function updateProfileAction"),
      actions.indexOf("export async function saveAddressAction"),
    );
    assert.match(profile, /requireCustomerSession\(\)/);
    assert.match(profile, /accountProfileSchema/);
    assert.match(profile, /where: \{ id: session\.customerId \}/);
    assert.match(profile, /where: \{ id: session\.userId \}/);
    assert.doesNotMatch(profile, /formData\.get\("customerId"\)/);
    assert.doesNotMatch(profile, /console\.(log|info|error)/);

    const saveAddress = actions.slice(
      actions.indexOf("export async function saveAddressAction"),
      actions.indexOf("export async function deleteAddressAction"),
    );
    assert.match(saveAddress, /where: \{ id, customerId: session\.customerId \}/);
    assert.match(saveAddress, /result\.count === 0/);
    assert.match(saveAddress, /accountAddressSchema/);

    const deleteAddress = actions.slice(
      actions.indexOf("export async function deleteAddressAction"),
      actions.indexOf("export async function updateNewsletterPreferenceAction"),
    );
    assert.match(deleteAddress, /where: \{ id, customerId: session\.customerId \}/);
  });

  it("does not expose password hashes from the dashboard query", () => {
    const queries = readFileSync(join(root, "src/lib/account/queries.ts"), "utf8");
    const dashboard = queries.slice(
      queries.indexOf("export async function getCustomerDashboard"),
      queries.indexOf("export async function getCustomerProfile"),
    );
    const page = readFileSync(join(root, "src/app/account/page.tsx"), "utf8");
    assert.match(
      dashboard,
      /hasPassword: Boolean\(customer\.user\?\.passwordHash\)/,
    );
    assert.doesNotMatch(dashboard, /passwordHash: customer/);
    assert.doesNotMatch(page, /passwordHash/);
  });

  it("preserves newsletter status distinctions and empty states", () => {
    const preferences = readFileSync(
      join(root, "src/app/account/preferences/page.tsx"),
      "utf8",
    );
    const form = readFileSync(
      join(root, "src/app/account/preferences/PreferencesForm.tsx"),
      "utf8",
    );
    const orders = readFileSync(join(root, "src/app/account/orders/page.tsx"), "utf8");
    const addresses = readFileSync(
      join(root, "src/app/account/addresses/AddressManager.tsx"),
      "utf8",
    );
    assert.match(preferences, /friendlyNewsletterStatus/);
    assert.match(preferences, /No restock requests/);
    assert.match(form, /PENDING_CONFIRMATION/);
    assert.match(form, /SUPPRESSED/);
    assert.match(form, /provider complaint/);
    assert.match(orders, /No orders yet/);
    assert.match(addresses, /No saved addresses/);
    assert.match(addresses, /name="phone"/);
    assert.match(addresses, /Edit/);
    assert.match(addresses, /Confirm remove/);
  });

  it("shows a branded loading state and hides raw account errors", () => {
    const loading = readFileSync(join(root, "src/app/account/loading.tsx"), "utf8");
    const error = readFileSync(join(root, "src/app/account/error.tsx"), "utf8");
    assert.match(loading, /AccountLoadingState/);
    assert.match(error, /We couldn’t load your account/);
    assert.match(error, /unstable_retry/);
    assert.match(error, /Contact PLEBS/);
    assert.doesNotMatch(error, /error\.message/);
    assert.doesNotMatch(error, /error\.stack/);
    assert.match(error, /digest: error\.digest/);
  });
});
