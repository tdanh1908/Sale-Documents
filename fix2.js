const fs = require('fs');
let c = fs.readFileSync('Sale-Documents/src/app/admin/documents/page.tsx', 'utf8');

c = c.replace(/className=\{`\$\{subjectInfo\.colorClass\}`} text-xs px-2 py-1 rounded\}/g, 'className={`\\${subjectInfo.colorClass} text-xs px-2 py-1 rounded`}');
c = c.replace(/className=\{`inline-block text-xs font-bold px-2 py-1 rounded-full `\}/g, 'className={`\\${statusBadge} inline-block text-xs font-bold px-2 py-1 rounded-full`}');
c = c.replace(/className=\{`\$\{statusBadge\}`} inline-block text-xs font-bold px-2 py-1 rounded-full\}/g, 'className={`\\${statusBadge} inline-block text-xs font-bold px-2 py-1 rounded-full`}');

fs.writeFileSync('Sale-Documents/src/app/admin/documents/page.tsx', c);
