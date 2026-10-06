const fs = require('fs');

const files = [
    'src/app/dang-nhap/page.tsx',
    'src/app/dang-ky/page.tsx',
    'src/app/quen-mat-khau/page.tsx',
    'src/app/dat-lai-mat-khau/page.tsx'
];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');

    // First undo previous peer stuff
    content = content.replace(/ peer"/g, '"');
    content = content.replace(/ peer-checked:bg-primary peer-checked:border-primary peer-checked:dark:bg-primary"/g, '"');
    content = content.replace(/ peer-checked:block"/g, '"');

    // Make sure 'checked' is 'defaultChecked'
    content = content.replace(/<input type="checkbox" className="hidden" checked \/>/g, '<input type="checkbox" className="hidden" defaultChecked />');

    // The label already has "group". 
    // We can use group-has-[:checked]:bg-primary on the div 
    // and group-has-[:checked]:block on the svg.
    
    // Add to div
    content = content.replace(/<div className="([^"]*?border-2[^"]*?bg-white[^"]*?transition[^"]*?)"/g, (match, p1) => {
        if (!p1.includes('group-has-[:checked]')) {
            return `<div className="${p1} group-has-[:checked]:bg-primary group-has-[:checked]:border-primary group-has-[:checked]:dark:bg-primary"`;
        }
        return match;
    });

    // Add to svg
    content = content.replace(/<svg className="([^"]*?text-white hidden[^"]*?)"/g, (match, p1) => {
        if (!p1.includes('group-has-[:checked]')) {
            return `<svg className="${p1} group-has-[:checked]:block"`;
        }
        return match;
    });

    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed with group-has-[:checked]', file);
});
