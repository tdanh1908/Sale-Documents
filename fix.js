const fs = require('fs');
let c = fs.readFileSync('Sale-Documents/src/app/admin/documents/page.tsx', 'utf8');

c = c.replace(/className=\{([^`'"}]+)\}/g, 'className={`$1`}');
c = c.replace(/src=\{https:\/\/placehold\.co([^}]+)\}/g, 'src={`https://placehold.co$1`}');
c = c.replace(/className=\{`\x0Cont-bold line-clamp-2 `\}/g, 'className={`font-bold line-clamp-2`}');

// also replace doc.view_price ? ${...}
c = c.replace(/\{doc\.view_price \? \$\{([^}]+)\}([^\:]+)\: '0đ'\}/g, '{doc.view_price ? `${$1}$2` : \'0đ\'}');
c = c.replace(/\{doc\.download_price \? \$\{([^}]+)\}([^\:]+)\: '0đ'\}/g, '{doc.download_price ? `${$1}$2` : \'0đ\'}');

fs.writeFileSync('Sale-Documents/src/app/admin/documents/page.tsx', c);
