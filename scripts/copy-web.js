const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const destDir = path.join(rootDir, 'www');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Copy top-level web files
const files = ['index.html', 'styles.css', 'app.js', 'google_script.js', 'manifest.json', 'sw.js'];
files.forEach(file => {
  const src = path.join(rootDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(destDir, file));
  }
});

// Recursively copy assets directory
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const assetsSrc = path.join(rootDir, 'assets');
if (fs.existsSync(assetsSrc)) {
  copyDir(assetsSrc, path.join(destDir, 'assets'));
}

console.log('Web assets copied to www/ successfully.');
