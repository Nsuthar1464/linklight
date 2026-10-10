export type RiskResult={tone:'low'|'medium'|'high'|'unknown';label:string;score:number|null;summary:string;notes:string[];evidence:string};
export function normalize(raw:unknown):string;
export function assess(url:string,attributes:unknown,now?:number):RiskResult;
export function lookup(url:string,fetcher?:typeof fetch):Promise<unknown>;
