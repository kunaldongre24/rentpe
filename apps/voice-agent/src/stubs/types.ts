/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
export const voiceToolRequestSchema: any = { parse: (x: any) => x };
export const voiceToolResponseSchema: any = {
  parse: (x: any) => x,
  safeParse: (x: any) => ({ success: true, data: x }),
};
export const locationResolveSchema: any = { parse: (x: any) => x };
export const propertySearchQuerySchema: any = { parse: (x: any) => x };
export const requirementBatchUpdateSchema: any = { parse: (x: any) => x };
export type VoiceToolRequest = any;
export type VoiceToolResponse = any;
export type HealthResponse = any;
export type LocationResolve = any;
export type PropertySearchQuery = any;
export type RequirementBatchUpdate = any;
