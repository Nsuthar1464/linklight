export function lookupProviders(url:string,keys:{VT_API_KEY:string;GOOGLE_SAFE_BROWSING_API_KEY:string},options:{cache:Cache;fetcher?:typeof fetch;now?:()=>number}):Promise<{attributes:unknown}>;
