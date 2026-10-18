const fs = require('fs');
let content = fs.readFileSync('D:/jotforms/public/js/app.js', 'utf8');
// Find and replace the escapeHtml function (last function in file)
const newEscapeHtml = "function escapeHtml(str) { return String(str).replace(/\"/g, '\"').replace(/'/g, \"'\"); }";
content = content.replace(/function escapeHtml\(str\) \{[\s\S]*?\}$/, newEscapeHtml);
fs.writeFileSync('D:/jotforms/public/js/app.js', content, 'utf8');
console.log('Fixed escapeHtml function');