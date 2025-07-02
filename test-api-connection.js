// Script para testar a conexão com a API backend
const API_URL = 'https://api.mikropix.online';

async function testAPIConnection() {
  console.log('🧪 Testando conexão com a API backend...');
  console.log('URL:', API_URL);
  
  try {
    // Teste básico de health check
    console.log('\n1. Testando health check...');
    const healthResponse = await fetch(`${API_URL}/health`);
    console.log('Status:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.text();
      console.log('✅ Health check OK:', healthData);
    } else {
      console.log('❌ Health check falhou:', healthResponse.statusText);
    }

    // Teste de endpoint de subscription
    console.log('\n2. Testando endpoint de subscription...');
    const subscriptionResponse = await fetch(`${API_URL}/api/subscription/plans`);
    console.log('Status:', subscriptionResponse.status);
    
    if (subscriptionResponse.ok) {
      const subscriptionData = await subscriptionResponse.json();
      console.log('✅ Subscription endpoint OK:', subscriptionData);
    } else {
      console.log('❌ Subscription endpoint falhou:', subscriptionResponse.statusText);
    }

    // Teste básico de conectividade
    console.log('\n3. Testando conectividade básica...');
    const basicResponse = await fetch(API_URL);
    console.log('Status:', basicResponse.status);
    console.log('Headers:', Object.fromEntries(basicResponse.headers.entries()));

  } catch (error) {
    console.error('❌ Erro ao conectar com a API:', error.message);
    
    // Verificar se é problema de CORS ou conectividade
    if (error.message.includes('CORS')) {
      console.log('💡 Parece ser um problema de CORS. Verifique as configurações do servidor.');
    } else if (error.message.includes('fetch')) {
      console.log('💡 Problema de conectividade. Verifique se o servidor está rodando.');
    }
  }
}

// Executar o teste
testAPIConnection().then(() => {
  console.log('\n🏁 Teste finalizado!');
}).catch(console.error); 