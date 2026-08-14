import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  CRON_MAX_DURATION_SECONDS,
  CRON_PATH,
  CRON_SCHEDULE,
  OUTBOX_CRON_BATCH,
  RESERVATION_CRON_BATCH,
} from "./config";
import { authorizeCronSecrets, bearerFromAuthorization } from "./secrets";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("Hobby cron constants", () => {
  it("uses a once-daily 02:00 UTC schedule, 60s duration, and 15/25 batches", () => {
    assert.equal(CRON_SCHEDULE, "0 2 * * *");
    assert.equal(CRON_MAX_DURATION_SECONDS, 60);
    assert.equal(OUTBOX_CRON_BATCH, 15);
    assert.equal(RESERVATION_CRON_BATCH, 25);
    assert.equal(CRON_PATH, "/api/cron/integration-outbox/");

    const vercel = JSON.parse(read("vercel.json")) as {
      crons: Array<{ path: string; schedule: string }>;
      functions: Record<string, { maxDuration: number }>;
    };
    assert.equal(vercel.crons.length, 1);
    assert.equal(vercel.crons[0]?.path, CRON_PATH);
    assert.equal(vercel.crons[0]?.schedule, CRON_SCHEDULE);
    assert.equal(
      vercel.functions["src/app/api/cron/integration-outbox/route.ts"]
        ?.maxDuration,
      CRON_MAX_DURATION_SECONDS,
    );
    assert.equal(
      vercel.crons.some((cron) => cron.path.includes("expire-reservations")),
      false,
    );

    const route = read("src/app/api/cron/integration-outbox/route.ts");
    assert.match(route, /export const maxDuration = 60;/);
  });
});

describe("cron secret authentication", () => {
  const secret = "a".repeat(32);
  const other = "b".repeat(32);

  it("returns unconfigured when no permitted secret is set", () => {
    assert.equal(
      authorizeCronSecrets({
        env: {},
        envKeys: ["INTEGRATION_OUTBOX_CRON_SECRET"],
        bearer: secret,
        headerSecret: null,
      }),
      "unconfigured",
    );
  });

  it("rejects a missing or invalid submitted secret", () => {
    const env = { CRON_SECRET: secret };
    assert.equal(
      authorizeCronSecrets({
        env,
        envKeys: [],
        bearer: null,
        headerSecret: null,
      }),
      "unauthorized",
    );
    assert.equal(
      authorizeCronSecrets({
        env,
        envKeys: [],
        bearer: other,
        headerSecret: null,
      }),
      "unauthorized",
    );
  });

  it("accepts Authorization Bearer CRON_SECRET and named manual secrets", () => {
    assert.equal(
      authorizeCronSecrets({
        env: { CRON_SECRET: secret },
        envKeys: ["INTEGRATION_OUTBOX_CRON_SECRET"],
        bearer: bearerFromAuthorization(`Bearer ${secret}`),
        headerSecret: null,
      }),
      "ok",
    );
    assert.equal(
      authorizeCronSecrets({
        env: { INTEGRATION_OUTBOX_CRON_SECRET: other },
        envKeys: ["INTEGRATION_OUTBOX_CRON_SECRET"],
        bearer: other,
        headerSecret: null,
      }),
      "ok",
    );
  });
});
