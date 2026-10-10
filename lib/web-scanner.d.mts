export function createWebScanner(options: {
 video: HTMLVideoElement; getStream:()=>Promise<MediaStream>;
 decode:(video:HTMLVideoElement)=>Promise<string|null>;
 onState:(state:'idle'|'starting'|'running',message:string)=>void;
 onCode:(code:string)=>void;
}):{start:()=>Promise<void>;stop:(message?:string,notify?:boolean)=>void};
