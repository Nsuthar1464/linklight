'use client';
import {ArrowUpRight} from 'lucide-react';
import {chromeWebStoreUrl} from '../lib/extension-store';

export default function ExtensionDownload(){
 return <div className="extension-download">
  {chromeWebStoreUrl
   ?<a className="button bright" href={chromeWebStoreUrl} target="_blank" rel="noopener noreferrer">Get extension<ArrowUpRight size={18}/></a>
   :<><button className="button bright" type="button" disabled>Get extension<ArrowUpRight size={18}/></button><p className="download-feedback" role="status">The Chrome Web Store listing is not published yet. You can check links on the website.</p></>}
 </div>;
}
