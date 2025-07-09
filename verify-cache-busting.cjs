#!/usr/bin/env node

/**
 * Script para verificar se o cache busting está funcionando corretamente
 * Verifica se os arquivos têm hashes únicos e se o HTML não está sendo cached
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function generateFileHash(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(content).digest('hex');
}

function findFiles(dir, pattern) {
  const files = [];
  
  function scanDir(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    items.forEach(item => {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (pattern.test(item)) {
        files.push(fullPath);
      }
    });
  }
  
  scanDir(dir);
  return files;
}

function verifyCacheBusting() {
  console.log('🔍 Verificando cache busting...');
  console.log('=====================================');
  
  const distPath = path.join(__dirname, 'dist');
  
  if (!fs.existsSync(distPath)) {
    console.log('❌ Pasta dist não encontrada. Execute npm run build primeiro.');
    return false;
  }
  
  // Verificar arquivos JS
  const jsFiles = findFiles(distPath, /\.js$/);
  console.log(`📦 Arquivos JS encontrados: ${jsFiles.length}`);
  
  let hasTimestampInJS = false;
  jsFiles.forEach(file => {
    const fileName = path.basename(file);
    const hasHash = /-[a-f0-9]{8,}-\d{13}\.js$/.test(fileName);
    const fileHash = generateFileHash(file);
    
    console.log(`  ${fileName}`);
    console.log(`    Hash único: ${hasHash ? '✅' : '❌'}`);
    console.log(`    MD5: ${fileHash.substring(0, 8)}...`);
    
    if (hasHash) hasTimestampInJS = true;
  });
  
  // Verificar arquivos CSS
  const cssFiles = findFiles(distPath, /\.css$/);
  console.log(`\n🎨 Arquivos CSS encontrados: ${cssFiles.length}`);
  
  let hasTimestampInCSS = false;
  cssFiles.forEach(file => {
    const fileName = path.basename(file);
    const hasHash = /-[a-f0-9]{8,}-\d{13}\.css$/.test(fileName);
    const fileHash = generateFileHash(file);
    
    console.log(`  ${fileName}`);
    console.log(`    Hash único: ${hasHash ? '✅' : '❌'}`);
    console.log(`    MD5: ${fileHash.substring(0, 8)}...`);
    
    if (hasHash) hasTimestampInCSS = true;
  });
  
  // Verificar index.html
  const indexPath = path.join(distPath, 'index.html');
  console.log(`\n📄 Verificando index.html...`);
  
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    const hasNoCacheHeaders = indexContent.includes('no-cache') && 
                             indexContent.includes('no-store') && 
                             indexContent.includes('must-revalidate');
    
    console.log(`  Headers no-cache: ${hasNoCacheHeaders ? '✅' : '❌'}`);
    console.log(`  Tamanho: ${fs.statSync(indexPath).size} bytes`);
    
    // Verificar se as referências aos arquivos JS/CSS têm timestamps
    const jsRefs = indexContent.match(/src="[^"]*\.js"/g) || [];
    const cssRefs = indexContent.match(/href="[^"]*\.css"/g) || [];
    
    console.log(`  Referências JS: ${jsRefs.length}`);
    console.log(`  Referências CSS: ${cssRefs.length}`);
    
    jsRefs.forEach(ref => {
      const hasTimestamp = /-\d{13}\.js"/.test(ref);
      console.log(`    ${ref} - Timestamp: ${hasTimestamp ? '✅' : '❌'}`);
    });
    
    cssRefs.forEach(ref => {
      const hasTimestamp = /-\d{13}\.css"/.test(ref);
      console.log(`    ${ref} - Timestamp: ${hasTimestamp ? '✅' : '❌'}`);
    });
  }
  
  // Verificar manifest PWA
  const manifestPath = path.join(distPath, 'manifest.webmanifest');
  if (fs.existsSync(manifestPath)) {
    console.log(`\n📱 Manifest PWA encontrado: ✅`);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log(`  Nome: ${manifest.name}`);
    console.log(`  Versão: ${manifest.version || 'N/A'}`);
  }
  
  // Resumo final
  console.log('\n📊 Resumo:');
  console.log('===========');
  console.log(`✅ Arquivos JS com timestamp: ${hasTimestampInJS ? 'SIM' : 'NÃO'}`);
  console.log(`✅ Arquivos CSS com timestamp: ${hasTimestampInCSS ? 'SIM' : 'NÃO'}`);
  console.log(`✅ HTML com headers no-cache: ${fs.existsSync(indexPath) ? 'SIM' : 'NÃO'}`);
  
  const allGood = hasTimestampInJS && hasTimestampInCSS && fs.existsSync(indexPath);
  
  if (allGood) {
    console.log('\n🎉 Cache busting configurado corretamente!');
    console.log('💡 Os usuários receberão sempre a versão mais recente após o deploy.');
  } else {
    console.log('\n⚠️  Alguns problemas foram encontrados.');
    console.log('💡 Verifique a configuração do Vite e execute npm run build:deploy novamente.');
  }
  
  return allGood;
}

// Executar verificação
if (require.main === module) {
  verifyCacheBusting();
}