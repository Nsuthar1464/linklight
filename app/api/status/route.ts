import {config} from '../../../lib/security';
export const dynamic='force-dynamic';
export function GET(){const c=config();return Response.json({ready:c.SCANNING_ENABLED==='true'&&!!c.GOOGLE_SAFE_BROWSING_API_KEY},{headers:{'Cache-Control':'no-store','Access-Control-Allow-Origin':'*'}});}
