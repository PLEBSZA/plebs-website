/** Hobby: one scheduled run per day, 60s function cap. */
export const CRON_MAX_DURATION_SECONDS = 60;
export const OUTBOX_CRON_BATCH = 15;
export const RESERVATION_CRON_BATCH = 25;
export const CRON_SCHEDULE = "0 2 * * *";
export const CRON_PATH = "/api/cron/integration-outbox/";
