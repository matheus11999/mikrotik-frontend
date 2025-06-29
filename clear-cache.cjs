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
    'dist',
    '.vite'
  ];
  
  foldersToDelete.forEach(folder => {
    const fullPath = path.join(__dirname, folder);
    if (fs.existsSync(fullPath)) {
      console.log(`🗑️  Removendo ${folder}`);
      deleteFolderRecursive(fullPath);
    }
  });
  
  console.log('✅ Cache limpo com sucesso!');
  console.log('💡 Dica: Reinicie o servidor de desenvolvimento para aplicar as mudanças.');
  console.log('   npm run dev ou yarn dev');
}

clearCache();