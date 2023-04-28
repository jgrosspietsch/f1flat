import { z } from 'zod';

export const circuitSchema = z.object({
  id: z.coerce.number().int(),
  ref: z.string(),
  name: z.string(),
  location: z.string(),
  country: z.string(),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  alt: z.coerce.number().nullable(),
  url: z.string(),
});

export type Circuit = z.infer<typeof circuitSchema>;

export const constructorSchema = z.object({
  id: z.coerce.number().int(),
  ref: z.string(),
  name: z.string(),
  nationality: z.string(),
  url: z.string(),
});

export type Constructor = z.infer<typeof constructorSchema>;

export const driverSchema = z.object({
  id: z.coerce.number().int(),
  ref: z.string(),
  number: z.coerce.number().int().nullable(),
  code: z.string().nullable(),
  forename: z.string(),
  surname: z.string(),
  dob: z.string(),
  nationality: z.string(),
  url: z.string(),
});

export type Driver = z.infer<typeof driverSchema>;

export const seasonSchema = z.object({
  year: z.coerce.number().int().gte(1950),
  url: z.string(),
});

export type Season = z.infer<typeof seasonSchema>;

export const raceSchema = z.object({
  id: z.coerce.number().int(),
  year: z.coerce.number().int().gte(1950),
  round: z.coerce.number().int().gte(1),
  circuit: z.coerce.number(),
  name: z.string(),
  date: z.string(),
  time: z.string().nullable(),
  url: z.string(),
  fp1_date: z.string().nullable(),
  fp1_time: z.string().nullable(),
  fp2_date: z.string().nullable(),
  fp2_time: z.string().nullable(),
  fp3_date: z.string().nullable(),
  fp3_time: z.string().nullable(),
  quali_date: z.string().nullable(),
  quali_time: z.string().nullable(),
  sprint_date: z.string().nullable(),
  sprint_time: z.string().nullable(),
});

export type Race = z.infer<typeof raceSchema>;

export const statusSchema = z.object({
  id: z.coerce.number().int(),
  status: z.string(),
});

export type Status = z.infer<typeof statusSchema>;

export const constructorResultSchema = z.object({
  id: z.coerce.number().int(),
  race: z.coerce.number().int(),
  constructor: z.coerce.number(),
  points: z.coerce.number(),
  status: z.string().nullable(),
});

export type ConstructorResult = z.infer<typeof constructorResultSchema>;

export const constructorStandingSchema = z.object({
  id: z.coerce.number(),
  race: z.coerce.number().int(),
  constructor: z.coerce.number().int(),
  points: z.coerce.number(),
  position: z.coerce.number().int(),
  position_text: z.string(),
  wins: z.coerce.number().int(),
});

export type ConstructorStanding = z.infer<typeof constructorStandingSchema>;

export const driverStandingSchema = z.object({
  id: z.coerce.number().int(),
  race: z.coerce.number().int(),
  driver: z.coerce.number().int(),
  points: z.coerce.number(),
  position: z.coerce.number(),
  position_text: z.string(),
  wins: z.coerce.number().int(),
});

export type DriverStanding = z.infer<typeof driverStandingSchema>;

export const pitStopSchema = z.object({
  race: z.coerce.number().int(),
  driver: z.coerce.number().int(),
  stop: z.coerce.number().int(),
  lap: z.coerce.number().int(),
  time: z.string(),
  duration: z.string(),
  milliseconds: z.coerce.number(),
});

export type PitStop = z.infer<typeof pitStopSchema>;

export const qualifyingSessionSchema = z.object({
  id: z.coerce.number().int(),
  race: z.coerce.number().int(),
  driver: z.coerce.number().int(),
  constructor: z.coerce.number().int(),
  number: z.coerce.number().int(),
  position: z.coerce.number().int(),
  q1: z.string().nullable(),
  q2: z.string().nullable(),
  q3: z.string().nullable(),
});

export type QualifyingSession = z.infer<typeof qualifyingSessionSchema>;

export const raceResultSchema = z.object({
  id: z.coerce.number().int(),
  race: z.coerce.number().int(),
  driver: z.coerce.number().int(),
  constructor: z.coerce.number().int(),
  number: z.coerce.number().int().nullable(),
  grid: z.coerce.number().int(),
  position: z.coerce.number().int().nullable(),
  position_text: z.string(),
  position_order: z.coerce.number().int(),
  points: z.coerce.number(),
  laps: z.coerce.number().int(),
  time: z.string().nullable(),
  milliseconds: z.coerce.number().int().nullable(),
  fastest_lap: z.coerce.number().int().nullable(),
  rank: z.coerce.number().int().nullable(),
  fastest_lap_time: z.string().nullable(),
  fastest_lap_speed: z.coerce.number().nullable(),
  status: z.string(),
});

export type RaceResult = z.infer<typeof raceResultSchema>;

export const sprintResultSchema = z.object({
  id: z.coerce.number().int(),
  race: z.coerce.number().int(),
  driver: z.coerce.number().int(),
  constructor: z.coerce.number().int(),
  number: z.coerce.number().int(),
  grid: z.coerce.number().int(),
  position: z.coerce.number().int().nullable(),
  position_text: z.string(),
  position_order: z.coerce.number().int(),
  points: z.coerce.number(),
  laps: z.coerce.number().int(),
  time: z.string().nullable(),
  milliseconds: z.coerce.number().int().nullable(),
  fastest_lap: z.coerce.number().int().nullable(),
  fastest_lap_time: z.string().nullable(),
  status: z.coerce.number().int(),
});

export type SprintResult = z.infer<typeof sprintResultSchema>;

export const lapTimeSchema = z.object({
  race: z.coerce.number().int(),
  driver: z.coerce.number().int(),
  lap: z.coerce.number().int(),
  position: z.coerce.number().int(),
  time: z.string(),
  milliseconds: z.coerce.number().int(),
});

export type LapTime = z.infer<typeof lapTimeSchema>;
