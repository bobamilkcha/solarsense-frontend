export const queryKeys = {
  projects: ['projects'] as const,
  sites: ['sites'] as const,
  unpairedDevices: ['devices', 'unpaired'] as const,
  users: ['users'] as const,
  invitations: ['invitations'] as const,
  readings: (siteId: string) => ['sites', siteId, 'readings'] as const,
  benchmark: (siteId: string, month: number) => ['sites', siteId, 'benchmark', month] as const,
  bills: (siteId: string) => ['sites', siteId, 'bills'] as const,
  visits: (siteId: string) => ['sites', siteId, 'visits'] as const,
  visit: (visitId: string) => ['visits', visitId] as const,
  feasibility: (siteId: string, params: object) => ['sites', siteId, 'feasibility', params] as const,
}
