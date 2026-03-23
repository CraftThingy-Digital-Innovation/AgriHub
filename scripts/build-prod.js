const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function deleteFolderRecursive(directoryPath) {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file) => {
      const curPath = path.join(directoryPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(directoryPath);
  }
}

function copyFolderRecursiveSync(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const files = fs.readdirSync(source);
  files.forEach((file) => {
    const curSource = path.join(source, file);
    const curTarget = path.join(target, file);
    if (fs.lstatSync(curSource).isDirectory()) {
      copyFolderRecursiveSync(curSource, curTarget);
    } else {
      fs.copyFileSync(curSource, curTarget);
    }
  });
}

function buildProd() {
  try {
    const rootDir = path.resolve(__dirname, '..');
    const frontendDir = path.join(rootDir, 'apps', 'frontend');
    const backendDir = path.join(rootDir, 'apps', 'backend');
    const frontendDist = path.join(frontendDir, 'dist');
    const backendDist = path.join(backendDir, 'dist');
    const backendPublic = path.join(backendDir, 'public');

    console.log('🚀 Starting Unified Production Build...');

    // 0. Clean old dists
    if (fs.existsSync(backendDist)) {
      console.log('🧹 Cleaning old backend dist...');
      deleteFolderRecursive(backendDist);
    }

    // 1. Build Frontend
    console.log('📦 Step 1: Building Frontend (Vite)...');
    execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });

    // 2. Build Backend
    console.log('📦 Step 2: Building Backend (TSC)...');
    execSync('npm run build', { cwd: backendDir, stdio: 'inherit' });

    // 3. Sync Frontend Dist to Backend Public
    console.log('🏗️  Step 3: Bundling Frontend into Backend public folder...');
    
    // Clean and recreate public folder
    if (fs.existsSync(backendPublic)) {
      console.log('🧹 Cleaning old public assets...');
      deleteFolderRecursive(backendPublic);
    }
    fs.mkdirSync(backendPublic, { recursive: true });

    // Copy dist to public
    console.log(`📂 Copying from ${frontendDist} to ${backendPublic}...`);
    copyFolderRecursiveSync(frontendDist, backendPublic);

    console.log('✨ All Done! Unified build ready in /apps/backend/public');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildProd();
