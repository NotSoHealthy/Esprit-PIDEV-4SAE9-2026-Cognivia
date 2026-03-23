export function getSeverityRank(patient: any): number {
  const severity = patient?.severity;
  if (severity === 'LOW') return 1;
  if (severity === 'MEDIUM') return 2;
  if (severity === 'HIGH') return 3;
  if (severity === 'EXTREME') return 4;
  return 99;
}

export function getSeverityColor(severity: string | null): string {
  if (!severity) return 'default';
  if (severity === 'LOW') return 'success';
  if (severity === 'MEDIUM') return 'warning';
  if (severity === 'HIGH') return 'error';
  return 'purple';
}

export function getStatusColor(status: string | null): string {
  if (!status) return 'default';
  if (status === 'SCHEDULED') return 'processing';
  if (status === 'MISSED') return 'error';
  if (status === 'COMPLETE') return 'success';
  return 'blue';
}
