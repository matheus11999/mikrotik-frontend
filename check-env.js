// Script para verificar as variáveis de ambiente
import { readFileSync } from 'fs';
import { resolve } from 'path';

console.log('🔍 Verificando configuração de ambiente...\n');

// Verificar arquivos de ambiente
const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];

envFiles.forEach(file => {
  try {
    const content = readFileSync(resolve(file), 'utf-8');
    console.log(`✅ ${file}:`);
    console.log(content);
    console.log('---');
  } catch (error) {
    console.log(`❌ ${file}: não encontrado`);
  }
});

// Verificar variáveis de ambiente do processo
console.log('\n🌍 Variáveis de ambiente:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('VITE_API_URL:', process.env.VITE_API_URL);

// Simular importação do Vite
console.log('\n⚡ Simulando import.meta.env:');
console.log('MODE:', process.env.NODE_ENV || 'development');
console.log('VITE_API_URL:', process.env.VITE_API_URL);

// Verificar configuração da API
console.log('\n🔧 Configuração da API esperada:');
const expectedApiUrl = process.env.VITE_API_URL || 
  (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://api.mikropix.online');

console.log('API URL:', expectedApiUrl);
console.log('Use External API:', expectedApiUrl && expectedApiUrl.startsWith('http')); 