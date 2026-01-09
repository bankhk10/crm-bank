/**
 * Dev-Only Module
 *
 * Re-export ทุก dev-only utilities จากที่เดียว
 * ทำให้ง่ายต่อการ import และ manage
 *
 * Usage:
 * import { devFeatures, DevOnlyWrapper } from '@/lib/dev-only'
 */

export * from "./config";
export { DevOnlyWrapper } from "@/components/dev-only/wrapper";
