// ZIP distribution is retired. Installation will use the published Store listing.
export function GET(){
 return Response.json({error:'The extension ZIP is no longer distributed here. Use the Chrome Web Store listing when it is published.'},{status:410,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
