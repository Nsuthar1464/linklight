import {execFileSync} from 'node:child_process';
// Include runtime assets and user instructions only.
execFileSync('python3',['-c',`import pathlib,zipfile
root=pathlib.Path('extension')
names=['manifest.json','background.js','camera-permission.html','camera-permission.js','camera.mjs','core.mjs','icon.png','popup.html','popup.js','styles.css','README.md']
files=[root/name for name in names]+list((root/'vendor').rglob('*'))
with zipfile.ZipFile('public/Linklight.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in files:
  if p.is_file(): z.write(p,'linklight/'+str(p.relative_to(root)))
`],{stdio:'inherit'});
