export function shouldProcessClaimedOutboxJob(claimedCount: number) {
  return claimedCount === 1;
}

export function outboxStatusAfterSendFailure(
  kind: "cooldown" | "daily-limit" | "provider",
): "FAILED" {
  void kind;
  return "FAILED";
}

export function outboxMayMarkSynced(input: {
  claimedCount: number;
  sendFailed: boolean;
  cooldown: boolean;
  dailyLimit: boolean;
}) {
  if (!shouldProcessClaimedOutboxJob(input.claimedCount)) return false;
  if (input.sendFailed || input.cooldown || input.dailyLimit) return false;
  return true;
}
