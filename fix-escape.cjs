const fs = require('fs');

const files = [
  'public/js/admin.js',
  'public/js/builder.js',
  'public/js/form.js',
  'public/js/login.js'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  
  // Fix the double-encoded HTML entities in escapeHtml function
  const oldPattern = "return String(str).replace(/[&<>\"']/g, c => ({'&': '&', '<': '<', '>': '>', '\"': '\"', \"'\": '''}[c]));";
  const newPattern = "return String(str).replace(/[&<>\"']/g, c => ({'&': '&', '<': '<', '>': '>', '\"': '\"', \"'\": '''}[c]));";
  
  if (content.includes("return String(str).replace(/[&<>\"']/g, c => ({'&': '&', '<': '<', '>': '>', '\"': '\"', \"'\": '''}[c]));")) {
    content = content.replace(
      "return String(str).replace(/[&<>\"']/g, c => ({'&': '&', '<': '<', '>': '>', '\"': '\"', \"'\": '''}[c]));",
      "return String(str).replace(/[&<>\"']/g, c => ({'&': '&', '<': '<', '>': '>', '\"': '\"', \"'\": '''}[c]));"
    );
    fs.writeFileSync(f, content);
    console.log('Fixed:', f);
  } else {
    console.log('Already fixed or pattern not found:', f);
  }
});

console.log('Done!');