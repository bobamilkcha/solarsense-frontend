import type { components } from './schema'

type Schemas = components['schemas']

export type AuthResponse = Schemas['AuthResponse']
export type User = Schemas['UserResponse']
export type UserRole = Schemas['UserRole']
export type LoginRequest = Schemas['UserLoginRequest']
export type RegisterRequest = Schemas['UserRegisterRequest']
export type InvitationPreview = Schemas['InvitationPreviewResponse']
export type AcceptInvitationRequest = Schemas['AcceptInvitationRequest']
export type Invitation = Schemas['InvitationResponse']
export type InvitationCreated = Schemas['InvitationCreatedResponse']
export type InvitationCreateRequest = Schemas['InvitationCreateRequest']
export type UserUpdateRequest = Schemas['UserUpdateRequest']

export type Project = Schemas['ProjectResponse']
export type ProjectCreateRequest = Schemas['ProjectCreateRequest']
export type Site = Schemas['SiteResponse']
export type SiteCreateRequest = Schemas['SiteCreateRequest']

export type SensorReading = Schemas['SensorReadingResponse']
export type Benchmark = Schemas['BenchmarkResponse']
export type TNBBill = Schemas['TNBBillResponse']
export type FeasibilityReport = Schemas['FeasibilityReport']
export type MonthBreakdown = Schemas['MonthBreakdown']

export type Visit = Schemas['VisitResponse']
export type VisitSummary = Schemas['VisitSummaryResponse']
export type VisitStatus = Schemas['VisitStatus']
export type VisitCreateRequest = Schemas['VisitCreateRequest']
export type VisitUpdateRequest = Schemas['VisitUpdateRequest']
export type ChecklistItem = Schemas['ChecklistItemResponse']
export type ChecklistItemStatus = Schemas['ChecklistItemStatus']
export type ChecklistItemCreateRequest = Schemas['ChecklistItemCreateRequest']
export type ChecklistItemUpdateRequest = Schemas['ChecklistItemUpdateRequest']

export type UnpairedDevice = Schemas['DeviceResponse']

export type DeviceConfig = Schemas['DeviceConfigResponse']
export type DeviceConfigRequest = Schemas['DeviceConfigRequest']
