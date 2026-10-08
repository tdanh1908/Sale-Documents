const fs = require('fs');
let c = fs.readFileSync('Sale-Documents/src/app/admin/documents/page.tsx', 'utf8');

c = c.replace(/<span className=\{`\$\{subjectInfo\.colorClass\}`} text-xs px-2 py-1 rounded}>/g, '<span className={`\\${subjectInfo.colorClass} text-xs px-2 py-1 rounded`}>');

fs.writeFileSync('Sale-Documents/src/app/admin/documents/page.tsx', c);
