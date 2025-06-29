-- Migração para adicionar campos de WireGuard na tabela mikrotiks
-- Execute este script no Supabase SQL Editor

-- Adicionar colunas relacionadas ao WireGuard na tabela mikrotiks
ALTER TABLE public.mikrotiks 
ADD COLUMN IF NOT EXISTS wireguard_public_key TEXT,
ADD COLUMN IF NOT EXISTS wireguard_private_key TEXT,
ADD COLUMN IF NOT EXISTS wireguard_preshared_key TEXT,
ADD COLUMN IF NOT EXISTS wireguard_allowed_subnets TEXT,
ADD COLUMN IF NOT EXISTS wireguard_keepalive INTEGER DEFAULT 25,
ADD COLUMN IF NOT EXISTS wireguard_enabled BOOLEAN DEFAULT false;

-- Renomear colunas existentes para padronizar
ALTER TABLE public.mikrotiks 
RENAME COLUMN ip_address TO ip;

ALTER TABLE public.mikrotiks 
RENAME COLUMN porta TO port;

ALTER TABLE public.mikrotiks 
RENAME COLUMN usuario TO username;

ALTER TABLE public.mikrotiks 
RENAME COLUMN senha TO password;

-- Adicionar campos que faltam
ALTER TABLE public.mikrotiks 
ADD COLUMN IF NOT EXISTS token TEXT UNIQUE DEFAULT uuid_generate_v4();

-- Atualizar tokens existentes se necessário
UPDATE public.mikrotiks SET token = uuid_generate_v4() WHERE token IS NULL;

-- Criar índices para melhor performance nas consultas de WireGuard
CREATE INDEX IF NOT EXISTS idx_mikrotiks_wireguard_public_key ON public.mikrotiks(wireguard_public_key);
CREATE INDEX IF NOT EXISTS idx_mikrotiks_wireguard_enabled ON public.mikrotiks(wireguard_enabled);
CREATE INDEX IF NOT EXISTS idx_mikrotiks_token ON public.mikrotiks(token);

-- Comentários para documentação
COMMENT ON COLUMN public.mikrotiks.wireguard_public_key IS 'Chave pública do peer WireGuard';
COMMENT ON COLUMN public.mikrotiks.wireguard_private_key IS 'Chave privada do peer WireGuard';
COMMENT ON COLUMN public.mikrotiks.wireguard_preshared_key IS 'Chave pré-compartilhada do WireGuard';
COMMENT ON COLUMN public.mikrotiks.wireguard_allowed_subnets IS 'Sub-redes permitidas separadas por vírgula';
COMMENT ON COLUMN public.mikrotiks.wireguard_keepalive IS 'Tempo de keepalive em segundos';
COMMENT ON COLUMN public.mikrotiks.wireguard_enabled IS 'Se WireGuard está habilitado para este MikroTik';

-- Opcional: Atualizar registros existentes
-- Descomente se quiser habilitar WireGuard para todos os MikroTiks existentes
-- UPDATE public.mikrotiks SET wireguard_enabled = true WHERE ip IS NOT NULL;

SELECT 'Migração concluída com sucesso! Campos de WireGuard adicionados à tabela mikrotiks.' as status; 