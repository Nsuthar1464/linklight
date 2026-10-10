export function normalize(raw) {
 const text=String(raw).trim();
 if (!text || text.length>8192 || /[\s\u0000-\u001f\u007f]/u.test(text)) throw Error('Enter a complete web address without spaces.');
 let u; try { u=new URL(/^https?:\/\//i.test(text)?text: /^[a-z][a-z0-9+.-]*:/i.test(text)?text:'https://'+text); } catch { throw Error('This does not look like a valid web address.'); }
 if (!['http:','https:'].includes(u.protocol)) throw Error('Only http:// and https:// web links can be checked.');
 if(u.username||u.password) throw Error('This link contains sign-in information. Remove it before checking.');
 const h=u.hostname.replace(/\.$/,'');
 if(h==='localhost'||h.endsWith('.localhost')||h.endsWith('.local')||!h.includes('.')||h.includes(':')||/^(127\.|10\.|192\.168\.|169\.254\.|0\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h)) throw Error('Use a public website address, not a local or private network link.');
 u.hash=''; return u.href;
}
export function assess(url,a,now=Date.now()) {
 const u=new URL(url), notes=[]; let local=0;
 if(u.protocol==='http:'){local+=20;notes.push('This link uses HTTP, which does not encrypt the connection.');}
 if(u.hostname.includes('xn--')){local+=20;notes.push('This domain contains international characters. Check for look-alike letters.');}
 if(/^\d+\.\d+\.\d+\.\d+$/.test(u.hostname)){local+=20;notes.push('The destination uses an IP address instead of a website name.');}
 if(['bit.ly','tinyurl.com','t.co','is.gd','rebrand.ly','ow.ly'].includes(u.hostname)){local+=20;notes.push('This is a shortened link. Its final destination is not verified here.');}
 const s=a?.last_analysis_stats;
 const valid=s&&['malicious','suspicious','harmless','undetected'].every(k=>Number.isInteger(s[k])&&s[k]>=0);
 const total=valid?s.malicious+s.suspicious+s.harmless+s.undetected:0;
 const date=Number(a?.last_analysis_date)*1000;
 const stale=!Number.isFinite(date)||date>now+300000||now-date>7*86400000;
 if(!valid||!total) return {label:'Unknown',tone:'unknown',score:null,summary:'There is not enough security data to rate this link.',notes,evidence:'No usable security report. The destination has not been verified.'};
 const flagged=s.malicious+s.suspicious;
 let score=Math.min(100,local+(s.malicious?Math.min(95,70+5*(s.malicious-1)):s.suspicious?45:5));
 if(stale&&!flagged) return {label:'Unknown',tone:'unknown',score:null,summary:'The available report is too old to rate this link.',notes,evidence:'Report date: '+(Number.isFinite(date)?new Date(date).toLocaleString():'date unavailable')};
 if(flagged) notes.unshift(`${s.malicious} security engines reported malicious activity; ${s.suspicious} reported suspicious activity.`);
 if(stale) notes.push('These detections come from an older report and may no longer reflect this page.');
 const tone=score>=70?'high':score>=20?'medium':'low';
 return {label:{high:'High Risk',medium:'Medium Risk',low:'Low Risk'}[tone],tone,score,summary:{high:'Do not open this link. Security engines detected warning signs.',medium:'Pause before opening. Review the warning signs below.',low:'No major warning signs found in the available report.'}[tone],notes,evidence:`${flagged} of ${total} engines flagged this link. Report: ${Number.isFinite(date)?new Date(date).toLocaleString():"date unavailable"}. Redirect destinations are not independently checked.`};
}
export async function lookup(url,fetcher=fetch) {
 let r; try {r=await fetcher("https://linklight-check.alivecod8.chatgpt.site/api/check",{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url}),signal:AbortSignal.timeout(20000),credentials:'omit',redirect:'error',cache:'no-store'});}catch{throw Error('Could not reach Linklight. Check your connection and try again.');}
 let payload;try{payload=await r.json();}catch{throw Error('Linklight is temporarily unavailable. Try again later.');}
 if(!r.ok)throw Error(typeof payload.error==='string'?payload.error:'Could not complete this security check.');
 return payload.attributes??null;
}
