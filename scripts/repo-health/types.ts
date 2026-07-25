export type HealthCheckResult = {
  name: string;
  ok: boolean;
  detail: string;
};

export type HealthCheck = () => Promise<HealthCheckResult> | HealthCheckResult;

export type HealthCheckEntry = {
  name: string;
  description: string;
  run: HealthCheck;
};
