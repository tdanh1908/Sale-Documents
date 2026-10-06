const fs = require('fs');

const dangNhapPath = 'src/app/dang-nhap/page.tsx';
let content = fs.readFileSync(dangNhapPath, 'utf8');

// Fix SVG attributes in the original content first
content = content.replace(/stroke-linecap/g, 'strokeLinecap');
content = content.replace(/stroke-linejoin/g, 'strokeLinejoin');
content = content.replace(/stroke-width/g, 'strokeWidth');

// Extract common layout parts
const mainStart = content.indexOf('<main');
const beforeFormMatch = content.match(/([\s\S]*?<div className="w-full max-w-md">)/);
const beforeForm = beforeFormMatch[1];
const afterFormMatch = content.match(/(<\/div>\s*<\/div>\s*<\/div>\s*<\/main>\s*\);\s*}\s*)$/);
const afterForm = afterFormMatch[1];

// Extract views
const viewLoginMatch = content.match(/(<div id="view-login"[\s\S]*?<\/div>\s*<!-- view-login end -->|div id="view-login"[\s\S]*?<\/form>\s*<div className="mt-8 text-center[\s\S]*?<\/div>\s*<\/div>)/);
const viewRegisterMatch = content.match(/(<div id="view-register"[\s\S]*?<\/form>\s*<div className="mt-6 text-center[\s\S]*?<\/div>\s*<\/div>)/);
const viewForgotMatch = content.match(/(<div id="view-forgot"[\s\S]*?<\/form>\s*<div className="mt-4 text-center">[\s\S]*?<\/div>\s*<\/div>)/);
const viewResetMatch = content.match(/(<div id="view-reset"[\s\S]*?<\/form>\s*<\/div>)/);

let viewLogin = viewLoginMatch[1];
let viewRegister = viewRegisterMatch[1];
let viewForgot = viewForgotMatch[1];
let viewReset = viewResetMatch[1];

// Replace links in viewLogin
viewLogin = viewLogin.replace(
    /<a href="#"\s*className="cursor-pointer text-xs font-bold text-primary hover:text-primaryHover transition">Quên mật khẩu\?<\/a>/,
    '<Link href="/quen-mat-khau" className="cursor-pointer text-xs font-bold text-primary hover:text-primaryHover transition">Quên mật khẩu?</Link>'
);
viewLogin = viewLogin.replace(
    /<a href="#"\s*className="cursor-pointer text-primary font-bold hover:underline">Đăng ký ngay<\/a>/,
    '<Link href="/dang-ky" className="cursor-pointer text-primary font-bold hover:underline">Đăng ký ngay</Link>'
);

// Fix links in viewRegister
viewRegister = viewRegister.replace(
    /<a href="#"\s*className="cursor-pointer text-primary font-bold hover:underline">Đăng nhập<\/a>/,
    '<Link href="/dang-nhap" className="cursor-pointer text-primary font-bold hover:underline">Đăng nhập</Link>'
);

// Fix links in viewForgot
viewForgot = viewForgot.replace(
    /<button className="cursor-pointer w-11 h-11 flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition mb-2 -ml-2"\s*title="Quay lại">[\s\S]*?<\/button>/,
    '<Link href="/dang-nhap" className="cursor-pointer w-11 h-11 flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition mb-2 -ml-2" title="Quay lại"><i className="fa-solid fa-arrow-left"></i></Link>'
);
viewForgot = viewForgot.replace(
    /<button className="cursor-pointer mt-4 w-full h-11 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition"\s*>/,
    '<Link href="/dang-nhap"><button className="cursor-pointer mt-4 w-full h-11 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition">'
);
viewForgot = viewForgot.replace(
    /Quay lại đăng nhập\s*<\/button>/,
    'Quay lại đăng nhập</button></Link>'
);
viewForgot = viewForgot.replace(
    /<a href="#"\s*className="cursor-pointer text-\[10px\] text-slate-400 hover:underline">\(Dev: Bấm để test form Đặt lại MK\)<\/a>/,
    '<Link href="/dat-lai-mat-khau" className="cursor-pointer text-[10px] text-slate-400 hover:underline">(Dev: Bấm để test form Đặt lại MK)</Link>'
);

// Generate new files
function writePage(path, componentName, viewHtml) {
    const dir = path.substring(0, path.lastIndexOf('/'));
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    let top = beforeForm.replace('export default function LoginPage()', `export default function ${componentName}()`);
    fs.writeFileSync(path, top + '\n' + viewHtml + '\n' + afterForm);
    console.log('Created ' + path);
}

writePage('src/app/dang-nhap/page.tsx', 'LoginPage', viewLogin);
writePage('src/app/dang-ky/page.tsx', 'RegisterPage', viewRegister);
writePage('src/app/quen-mat-khau/page.tsx', 'ForgotPassPage', viewForgot);
writePage('src/app/dat-lai-mat-khau/page.tsx', 'ResetPassPage', viewReset);
