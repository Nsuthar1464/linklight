'use client';
import {useState} from 'react';
import {Download} from 'lucide-react';

export default function ExtensionDownload(){
 const [requested,setRequested]=useState(false);
 return <div className="extension-download">
  <a className="button bright" href="/api/download" download="Linklight.zip" onClick={()=>setRequested(true)}><Download size={18}/>Download for Chrome</a>
  {requested&&<p role="status" className="download-feedback">Download requested. Check Chrome’s Downloads for Linklight.zip. If nothing appears, <a href="/Linklight.zip" download="Linklight.zip">try the ZIP directly</a>. After downloading, unzip the file and follow the Install step.</p>}
 </div>;
}
