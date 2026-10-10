import {config} from '../../../lib/security';
export function GET(){const c=config();return Response.json({ready:c.SCANNING_ENABLED==='true'&&!!c.GOOGLE_SAFE_BROWSING_API_KEY&&!!c.DB},{headers:{'Cache-Control':'no-store','Access-Control-Allow-Origin':'*'}});}
