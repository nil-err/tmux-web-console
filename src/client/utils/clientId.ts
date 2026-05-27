export interface ClientIdEnvironment {
  crypto?: {
    randomUUID?: () => string;
  };
  now?: () => number;
  random?: () => number;
}

export function createClientId(environment: ClientIdEnvironment = globalThis): string {
  const cryptoId = environment.crypto?.randomUUID?.();
  if (cryptoId) {
    return cryptoId;
  }

  const now = environment.now?.() ?? Date.now();
  const random = environment.random?.() ?? Math.random();
  return `tab-${now.toString(36)}-${random.toString(36).slice(2, 8)}`;
}
