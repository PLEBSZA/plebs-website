import { timingSafeEqual } from "node:crypto";

export type CronAuthResult = "ok" | "unconfigured" | "unauthorized";

export function secretsMatch(expected: string, provided: string | null) {
  if (!provided) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(provided);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function configuredCronSecrets(
  env: NodeJS.Dict<string | undefined>,
  keys: readonly string[],
) {
  return [
    ...new Set(
      keys
        .map((key) => env[key]?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ];
}

export function authorizeCronSecrets(input: {
  env: NodeJS.Dict<string | undefined>;
  envKeys: readonly string[];
  bearer: string | null;
  headerSecret: string | null;
}): CronAuthResult {
  const expected = configuredCronSecrets(input.env, [
    "CRON_SECRET",
    ...input.envKeys,
  ]);
  if (expected.length === 0) return "unconfigured";
  const provided = [input.bearer, input.headerSecret];
  if (
    expected.some((secret) =>
      provided.some((value) => secretsMatch(secret, value)),
    )
  ) {
    return "ok";
  }
  return "unauthorized";
}

export function bearerFromAuthorization(header: string | null) {
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}
