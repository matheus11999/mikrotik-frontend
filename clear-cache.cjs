#!/usr/bin/env node

/**
 * Script para limpar cache do Vite/frontend
 * Usage: node clear-cache.js
 */

const fs = require('fs');
const path = require('path');

function deleteFolderRecursive(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dirPath);
  }
}

function clearCache() {
  console.log('🧹 Limpando cache do frontend...');
  
  const foldersToDelete = [
    'node_modules/.vite',
    'node_modules/.cache',
    'dist',
    '.vite',
    '.cache'
  ];
  
  const filesToDelete = [
    'tsconfig.tsbuildinfo',
    'vite.config.js.timestamp-*'
  ];
  
  // Remover pastas
  foldersToDelete.forEach(folder => {
    const fullPath = path.join(__dirname, folder);
    if (fs.existsSync(fullPath)) {
      console.log(`🗑️  Removendo pasta ${folder}`);
      deleteFolderRecursive(fullPath);
    }
  });
  
  // Remover arquivos específicos
  filesToDelete.forEach(filePattern => {
    const fullPath = path.join(__dirname, filePattern);
    if (fs.existsSync(fullPath)) {
      console.log(`🗑️  Removendo arquivo ${filePattern}`);
      fs.unlinkSync(fullPath);
    }
  });
  
  // Limpar cache do sistema (se Windows)
  if (process.platform === 'win32') {
    const { exec } = require('child_process');
    exec('taskkill /f /im node.exe 2>nul', () => {
      console.log('💀 Processos Node.js anteriores finalizados');
    });
  }
  
  console.log('✅ Cache limpo com sucesso!');
  console.log('💡 Para deploy, use: npm run build:deploy');
  console.log('💡 Para dev, use: npm run dev:fresh');
}

clearCache();