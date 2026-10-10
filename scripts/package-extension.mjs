import {execFileSync} from 'node:child_process';
// Private owner upload package only. Chrome Web Store requires manifest at root.
// Explicit runtime allowlist excludes website/backend source and all credentials.
execFileSync('python3',['-c',`import pathlib,zipfile
root=pathlib.Path('extension')
output=pathlib.Path('outputs/Linklight-chrome-store.zip')
output.parent.mkdir(exist_ok=True)
names=['manifest.json','background.js','camera-permission.html','camera-permission.js','camera.mjs','core.mjs','icon.png','popup.html','popup.js','styles.css']
files=[root/name for name in names]+list((root/'vendor').rglob('*'))
with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED) as z:
 for p in files:
  if p.is_file(): z.write(p,str(p.relative_to(root)))
print('Private Chrome Web Store upload package: '+str(output))
`],{stdio:'inherit'});
