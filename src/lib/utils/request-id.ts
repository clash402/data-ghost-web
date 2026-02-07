function randomSuffix() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().split("-")[0];
  }

  return Math.random().toString(36).slice(2, 10);
}

export function createRequestId(action: string) {
  return `${action}-${Date.now()}-${randomSuffix()}`;
}
