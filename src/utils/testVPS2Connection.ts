// Teste de conexão com VPS2
export const testVPS2Connection = async (): Promise<boolean> => {
  try {
    console.log('Testando conectividade VPS2...');
    
    // Usar o endpoint /health que não requer autenticação
    const response = await fetch('http://193.181.208.141:3000/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('VPS2 Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('VPS2 Response:', data);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Erro ao testar VPS2:', error);
    return false;
  }
};

export const testWireGuardEndpoint = async (): Promise<boolean> => {
  try {
    console.log('Testando endpoint WireGuard...');
    
    // Usar o endpoint específico de teste do WG Easy
    const response = await fetch('http://193.181.208.141:3000/test/wg-easy/connection', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('WireGuard Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('WireGuard Response:', data);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('WireGuard endpoint não está respondendo:', error);
    return false;
  }
};