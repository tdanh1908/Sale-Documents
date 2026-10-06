const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/app/chi-tiet-tai-lieu/[id]/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (line.match(/<(button|Link|a\b|div\b[^>]*onClick)/)) {
        if (!line.includes('cursor-pointer')) {
            if (line.includes('className="')) {
                lines[i] = line.replace(/className="/, 'className="cursor-pointer ');
            } else if (line.includes("className={`")) {
                lines[i] = line.replace(/className=\{`/, 'className={`cursor-pointer ');
            } else if (line.includes("className='")) {
                lines[i] = line.replace(/className='/, "className='cursor-pointer ");
            } else {
                lines[i] = line.replace(/<(button|Link|a)/, '<$1 className="cursor-pointer"');
            }
        }
    }
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Fixed cursor-pointer!');
