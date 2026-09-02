const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const zipPath = path.join(rootDir, 'WasteWatch_Complete_Project.zip');
const tempDir = path.join(rootDir, 'WasteWatch_Export');

if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });

fs.mkdirSync(tempDir, { recursive: true });

function copyFiltered(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    const base = path.basename(src);
    if (base === 'node_modules' || base === '.git' || base === 'dist' || base === 'WasteWatch_Export') {
      return;
    }
    fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
      copyFiltered(path.join(src, file), path.join(dest, file));
    }
  } else {
    if (src.endsWith('.zip')) return;
    fs.copyFileSync(src, dest);
  }
}

console.log('📦 Collecting project files...');
copyFiltered(rootDir, tempDir);

console.log('🗜️ Creating ZIP archive...');
try {
  execSync(`powershell.exe -NoProfile -Command "Compress-Archive -Path '${tempDir}\\*' -DestinationPath '${zipPath}' -Force"`, { stdio: 'inherit' });
  console.log('✨ ZIP created successfully at:', zipPath);
} finally {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

const stats = fs.statSync(zipPath);
console.log(`📊 Final ZIP Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
