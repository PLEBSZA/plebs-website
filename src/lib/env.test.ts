import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  PRODUCTION_SITE_URL,
  getCanonicalSiteUrl,
  getTransactionalSiteUrl,
  isLoopbackHostname,
  isLoopbackUrl,
  resolveAuthRedirectUrl,
  rewriteLoopbackToPublicUrl,
  sanitizeDeployedAuthEnv,
} from "./env";

const keys = [
  "VERCEL_ENV",
  "VERCEL_URL",
  "NEXT_PUBLIC_SITE_URL",
  "AUTH_URL",
] as const;

const original = Object.fromEntries(
  keys.map((key) => [key, process.env[key]]),
) as Record<(typeof keys)[number], string | undefined>;

afterEach(() => {
  for (const key of keys) {
    const value = original[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("loopback URL detection", () => {
  it("treats localhost and loopback addresses as local-only", () => {
    assert.equal(isLoopbackHostname("localhost"), true);
    assert.equal(isLoopbackHostname("127.0.0.1"), true);
    assert.equal(isLoopbackHostname("::1"), true);
    assert.equal(isLoopbackUrl("http://localhost:3001"), true);
    assert.equal(isLoopbackUrl("http://127.0.0.1:3001/account/"), true);
    assert.equal(isLoopbackUrl("https://www.plebs.co.za"), false);
  });
});

describe("canonical and transactional site URLs", () => {
  it("never uses localhost on a Vercel production deploy", () => {
    process.env.VERCEL_ENV = "production";
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3001";
    assert.equal(getCanonicalSiteUrl(), PRODUCTION_SITE_URL);
    assert.equal(getTransactionalSiteUrl(), PRODUCTION_SITE_URL);
  });

  it("keeps the configured public production host", () => {
    process.env.VERCEL_ENV = "production";
    process.env.NEXT_PUBLIC_SITE_URL = "https://www.plebs.co.za/";
    assert.equal(getCanonicalSiteUrl(), "https://www.plebs.co.za");
  });

  it("does not put localhost in email or payment return links", () => {
    delete process.env.VERCEL_ENV;
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3001";
    assert.equal(getTransactionalSiteUrl(), PRODUCTION_SITE_URL);
  });
});

describe("deployed AUTH_URL sanitization", () => {
  it("removes a loopback AUTH_URL on Vercel production", () => {
    process.env.VERCEL_ENV = "production";
    process.env.AUTH_URL = "http://localhost:3001";
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3001";
    sanitizeDeployedAuthEnv();
    assert.equal(process.env.AUTH_URL, undefined);
    assert.equal(process.env.NEXT_PUBLIC_SITE_URL, PRODUCTION_SITE_URL);
  });

  it("leaves a local AUTH_URL alone when not on Vercel", () => {
    delete process.env.VERCEL_ENV;
    process.env.AUTH_URL = "http://localhost:3001";
    sanitizeDeployedAuthEnv();
    assert.equal(process.env.AUTH_URL, "http://localhost:3001");
  });
});

describe("auth redirect rewriting", () => {
  it("rewrites localhost account destinations onto the live host", () => {
    process.env.VERCEL_ENV = "production";
    delete process.env.NEXT_PUBLIC_SITE_URL;
    assert.equal(
      resolveAuthRedirectUrl(
        "http://localhost:3001/account/login/?activated=1",
        "http://localhost:3001",
      ),
      "https://www.plebs.co.za/account/login/?activated=1",
    );
    assert.equal(
      resolveAuthRedirectUrl("/account/", "http://localhost:3001"),
      "https://www.plebs.co.za/account/",
    );
  });

  it("rewrites a loopback request URL onto the public origin", () => {
    const rewritten = rewriteLoopbackToPublicUrl(
      new URL("http://localhost:3001/account/"),
      PRODUCTION_SITE_URL,
    );
    assert.equal(rewritten.origin, PRODUCTION_SITE_URL);
    assert.equal(rewritten.pathname, "/account/");
  });
});
