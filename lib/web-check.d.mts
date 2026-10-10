import type {RiskResult} from '../extension/core.mjs';
export function checkWebsite(raw:string,fetcher?:typeof fetch,signal?:AbortSignal):Promise<RiskResult & {url:string}>;
