import {randomBytes,scryptSync} from 'node:crypto';
import {existsSync,readFileSync,appendFileSync} from 'node:fs';
const file='.env.local';const existing=existsSync(file)?readFileSync(file,'utf8'):'';
if(existing.includes('ADMIN_PASSWORD_HASH=')){console.log('Local admin is already configured. Credentials were not changed.');process.exit(0)}
const password=randomBytes(9).toString('base64url')+'!Pz9';const salt=randomBytes(16).toString('hex');const hash=scryptSync(password,salt,64).toString('hex');
appendFileSync(file,`\nLOCAL_ADMIN_ENABLED=true\nADMIN_EMAIL=admin@petzo.local\nADMIN_PASSWORD_HASH=${salt}:${hash}\nADMIN_SESSION_SECRET=${randomBytes(32).toString('hex')}\n`);
console.log('Local admin configured. Email: admin@petzo.local');console.log('Initial password: '+password);console.log('Keep this password private. Access: http://localhost:3000/admin');
