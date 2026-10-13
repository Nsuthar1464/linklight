import type {Metadata} from 'next';
import Link from 'next/link';

export const metadata:Metadata={title:'Privacy Policy | Linklight',description:'What Linklight sends, stores and never collects.'};

const wrap={maxWidth:720,margin:'0 auto',padding:'72px 24px 96px',lineHeight:1.7,color:'#c9ccd6'} as const;
const h2={fontSize:22,fontWeight:550,letterSpacing:'-0.5px',color:'#f5f5f8',margin:'40px 0 10px'} as const;

export default function Privacy(){
 return <main style={wrap}>
  <Link href="/" style={{color:'#94aaff',fontSize:14}}>← Linklight</Link>
  <h1 style={{fontSize:'clamp(36px,6vw,52px)',letterSpacing:'-2px',lineHeight:1.1,fontWeight:550,color:'#f5f5f8',margin:'24px 0 8px'}}>Privacy Policy</h1>
  <p style={{color:'#858995',margin:0}}>Last updated: October 12, 2026</p>

  <p style={{marginTop:28}}>Linklight checks whether a link or QR code destination shows signs of being unsafe. This policy covers the Linklight website (linklightns.vercel.app) and the Linklight Chrome extension.</p>

  <h2 style={h2}>What we collect</h2>
  <p>When you press Check, the URL you choose is sent to the Linklight service so it can return a result. We do not ask for an account, name, email address or password, and we do not use advertising trackers.</p>

  <h2 style={h2}>Website analytics</h2>
  <p>We use Vercel Web Analytics to understand aggregate visitor counts, page views, referrers, device types and approximate locations. It does not use cookies to identify visitors. We strip query parameters and fragments from page URLs before sending analytics, and do not send checked links, QR contents or check results as analytics events. Learn more in <a href="https://vercel.com/docs/analytics/privacy-policy" style={{color:'#94aaff'}}>Vercel’s analytics privacy documentation</a>. This analytics integration applies to the website, not the Chrome extension.</p>

  <h2 style={h2}>Who receives the link</h2>
  <p>To produce a rating, the Linklight service forwards the URL to external security services: Google Safe Browsing, VirusTotal, URLhaus and, as a backup, IPQualityScore. Each of these services handles the URL under its own privacy policy. Do not check links that contain passwords, private documents or sign-in tokens.</p>

  <h2 style={h2}>What we store</h2>
  <p>Linklight keeps short-lived results and usage counters so repeated checks are fast and the free security services are not overloaded. Stored results are not linked to you, and cache keys are hashed. We do not build a history of the links you check. Our hosting provider (Vercel) may keep standard request logs, such as IP address and time, for security and operation of the service.</p>

  <h2 style={h2}>Camera and QR codes</h2>
  <p>The QR scanner reads the camera on your own device. Camera frames and uploaded QR images are processed locally in your browser and are never uploaded, recorded or stored. Only the link decoded from the QR code is sent, and only when you choose to check it. The extension never requests microphone access.</p>

  <h2 style={h2}>Extension permissions</h2>
  <p>The extension uses the <em>storage</em> permission to keep local settings in your browser, and a host permission for linklightns.vercel.app so it can send the link you check and receive the result. It does not read the pages you browse, and it does not run remote code.</p>

  <h2 style={h2}>What we do not do</h2>
  <p>We do not sell or share personal data, use it for advertising, or use it for any purpose other than returning a result to you.</p>

  <h2 style={h2}>Limits of the results</h2>
  <p>Automated checks can miss threats or flag harmless links. A Low Risk rating does not guarantee a link is safe.</p>

  <h2 style={h2}>Contact</h2>
  <p>Questions or requests: open an issue at <a href="https://github.com/Nsuthar1464/linklight/issues" style={{color:'#94aaff'}}>github.com/Nsuthar1464/linklight/issues</a>. We will update this page if our practices change and revise the date above.</p>
 </main>;
}
