const fs = require('fs');

function htmlToJsx(html) {
    let jsx = html.replace(/<script[\s\S]*?<\/script>/gi, '');
    jsx = jsx.replace(/class=/g, 'className=');
    jsx = jsx.replace(/<!--[\s\S]*?-->/g, ''); // remove comments
    jsx = jsx.replace(/<img(.*?)>/g, (match, p1) => {
        if (p1.endsWith('/')) return match;
        return `<img${p1} />`;
    });
    jsx = jsx.replace(/<input(.*?)>/g, (match, p1) => {
        if (p1.endsWith('/')) return match;
        return `<input${p1} />`;
    });
    jsx = jsx.replace(/<br>/g, '<br />');
    jsx = jsx.replace(/<hr>/g, '<hr />');
    jsx = jsx.replace(/onClick="[^"]*"/gi, '');
    jsx = jsx.replace(/onSubmit="[^"]*"/gi, '');
    jsx = jsx.replace(/onInput="[^"]*"/gi, '');
    jsx = jsx.replace(/readonly/g, 'readOnly');
    jsx = jsx.replace(/for=/g, 'htmlFor=');
    jsx = jsx.replace(/style="([^"]*)"/g, ''); // strip inline styles for simplicity or convert them, let's strip to avoid error
    jsx = jsx.replace(/href="javascript:void\(0\)"/g, 'href="#"');
    
    // Add cursor-pointer to clickable elements
    let lines = jsx.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.match(/<(button|Link|a\b|div\b[^>]*onClick)/)) {
            if (!line.includes('cursor-pointer')) {
                if (line.includes('className="')) {
                    lines[i] = line.replace(/className="/, 'className="cursor-pointer ');
                } else {
                    lines[i] = line.replace(/<(button|Link|a)/, '<$1 className="cursor-pointer"');
                }
            }
        }
    }
    return lines.join('\n');
}

function processFile(inputFile, outputFile, componentName) {
    const html = fs.readFileSync(inputFile, 'utf8');
    const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) || html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    
    let contentToConvert = '';
    let mainAttrs = '';
    if (mainMatch) {
        contentToConvert = mainMatch[1];
        const attrMatch = html.match(/<main([^>]*)>/i) || html.match(/<body([^>]*)>/i);
        if(attrMatch) mainAttrs = attrMatch[1];
    } else {
        contentToConvert = html;
    }
    
    let jsxContent = htmlToJsx(contentToConvert);
    mainAttrs = mainAttrs.replace(/class=/g, 'className=');

    const componentStr = `
"use client";
import React, { useState } from 'react';
import Link from 'next/link';

export default function ${componentName}() {
    return (
        <main ${mainAttrs}>
            ${jsxContent}
        </main>
    );
}
`;

    const dir = outputFile.substring(0, outputFile.lastIndexOf('/'));
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputFile, componentStr, 'utf8');
    console.log("Created", outputFile);
}

processFile('design-reference/dang-nhap.html', 'src/app/dang-nhap/page.tsx', 'LoginPage');
processFile('design-reference/tai-khoan.html', 'src/app/tai-khoan/page.tsx', 'AccountPage');
