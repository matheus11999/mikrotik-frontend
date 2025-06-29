-- MikroPix Database Schema for Supabase
-- Execute this in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types/enums
CREATE TYPE transacao_tipo AS ENUM ('credito', 'debito');
CREATE TYPE saque_status AS ENUM ('pendente', 'aprovado', 'rejeitado');
CREATE TYPE mac_status AS ENUM ('ativo', 'inativo', 'bloqueado');
CREATE TYPE user_role AS ENUM ('admin', 'user');

-- 1. Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    nome TEXT NOT NULL,
    role user_role DEFAULT 'user' NOT NULL,
    saldo DECIMAL(10,2) DEFAULT 0.00 NOT NULL CHECK (saldo >= 0),
    telefone TEXT,
    cpf TEXT UNIQUE,
    pix_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Mikrotiks table
CREATE TABLE IF NOT EXISTS public.mikrotiks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    porcentagem DECIMAL(5,2) NOT NULL CHECK (porcentagem >= 0 AND porcentagem <= 100),
    ip_address INET,
    porta INTEGER DEFAULT 8728 CHECK (porta > 0 AND porta <= 65535),
    usuario TEXT,
    senha TEXT,
    ativo BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. Vendas table
CREATE TABLE IF NOT EXISTS public.vendas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    mikrotik_id UUID NOT NULL REFERENCES public.mikrotiks(id) ON DELETE CASCADE,
    valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),
    plano_nome TEXT NOT NULL,
    plano_valor DECIMAL(10,2) NOT NULL CHECK (plano_valor > 0),
    plano_minutos INTEGER NOT NULL CHECK (plano_minutos > 0),
    mac_address TEXT NOT NULL,
    comissao_valor DECIMAL(10,2) NOT NULL CHECK (comissao_valor >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. Transacoes table
CREATE TABLE IF NOT EXISTS public.transacoes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tipo transacao_tipo NOT NULL,
    motivo TEXT NOT NULL,
    valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),
    referencia_id UUID, -- Can reference vendas, saques, or other transaction types
    referencia_tipo TEXT, -- 'venda', 'saque', 'ajuste', etc.
    saldo_anterior DECIMAL(10,2) NOT NULL,
    saldo_atual DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5. MACs table
CREATE TABLE IF NOT EXISTS public.macs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    mac_address TEXT NOT NULL UNIQUE,
    mikrotik_id UUID NOT NULL REFERENCES public.mikrotiks(id) ON DELETE CASCADE,
    data_primeiro_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    total_compras INTEGER DEFAULT 0 NOT NULL CHECK (total_compras >= 0),
    valor_total_compras DECIMAL(10,2) DEFAULT 0.00 NOT NULL CHECK (valor_total_compras >= 0),
    status mac_status DEFAULT 'ativo' NOT NULL,
    ultima_compra TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 6. Saques table
CREATE TABLE IF NOT EXISTS public.saques (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),
    status saque_status DEFAULT 'pendente' NOT NULL,
    pix_key TEXT NOT NULL,
    observacoes TEXT,
    data_solicitacao TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    data_aprovacao TIMESTAMP WITH TIME ZONE,
    aprovado_por UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

CREATE INDEX IF NOT EXISTS idx_mikrotiks_user_id ON public.mikrotiks(user_id);
CREATE INDEX IF NOT EXISTS idx_mikrotiks_ativo ON public.mikrotiks(ativo);
CREATE INDEX IF NOT EXISTS idx_mikrotiks_created_at ON public.mikrotiks(created_at);

CREATE INDEX IF NOT EXISTS idx_vendas_user_id ON public.vendas(user_id);
CREATE INDEX IF NOT EXISTS idx_vendas_mikrotik_id ON public.vendas(mikrotik_id);
CREATE INDEX IF NOT EXISTS idx_vendas_created_at ON public.vendas(created_at);
CREATE INDEX IF NOT EXISTS idx_vendas_mac_address ON public.vendas(mac_address);

CREATE INDEX IF NOT EXISTS idx_transacoes_user_id ON public.transacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_tipo ON public.transacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_transacoes_created_at ON public.transacoes(created_at);
CREATE INDEX IF NOT EXISTS idx_transacoes_referencia ON public.transacoes(referencia_id, referencia_tipo);

CREATE INDEX IF NOT EXISTS idx_macs_mac_address ON public.macs(mac_address);
CREATE INDEX IF NOT EXISTS idx_macs_mikrotik_id ON public.macs(mikrotik_id);
CREATE INDEX IF NOT EXISTS idx_macs_status ON public.macs(status);
CREATE INDEX IF NOT EXISTS idx_macs_data_primeiro_registro ON public.macs(data_primeiro_registro);

CREATE INDEX IF NOT EXISTS idx_saques_user_id ON public.saques(user_id);
CREATE INDEX IF NOT EXISTS idx_saques_status ON public.saques(status);
CREATE INDEX IF NOT EXISTS idx_saques_data_solicitacao ON public.saques(data_solicitacao);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mikrotiks_updated_at BEFORE UPDATE ON public.mikrotiks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_macs_updated_at BEFORE UPDATE ON public.macs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saques_updated_at BEFORE UPDATE ON public.saques 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update MAC stats when a sale is made
CREATE OR REPLACE FUNCTION update_mac_stats_on_sale()
RETURNS TRIGGER AS $$
BEGIN
    -- Update MAC statistics
    INSERT INTO public.macs (mac_address, mikrotik_id, total_compras, valor_total_compras, ultima_compra)
    VALUES (NEW.mac_address, NEW.mikrotik_id, 1, NEW.valor, NEW.created_at)
    ON CONFLICT (mac_address) 
    DO UPDATE SET 
        total_compras = macs.total_compras + 1,
        valor_total_compras = macs.valor_total_compras + NEW.valor,
        ultima_compra = NEW.created_at,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update MAC stats on new sale
CREATE TRIGGER update_mac_stats_trigger 
    AFTER INSERT ON public.vendas 
    FOR EACH ROW EXECUTE FUNCTION update_mac_stats_on_sale();

-- Function to automatically create transaction records
CREATE OR REPLACE FUNCTION create_transaction_on_sale()
RETURNS TRIGGER AS $$
BEGIN
    -- Create credit transaction for the sale commission
    INSERT INTO public.transacoes (
        user_id, 
        tipo, 
        motivo, 
        valor, 
        referencia_id, 
        referencia_tipo,
        saldo_anterior,
        saldo_atual
    ) VALUES (
        NEW.user_id,
        'credito',
        'Comissão de venda - ' || NEW.plano_nome,
        NEW.comissao_valor,
        NEW.id,
        'venda',
        (SELECT saldo FROM public.users WHERE id = NEW.user_id),
        (SELECT saldo FROM public.users WHERE id = NEW.user_id) + NEW.comissao_valor
    );
    
    -- Update user balance
    UPDATE public.users 
    SET saldo = saldo + NEW.comissao_valor,
        updated_at = NOW()
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create transaction and update balance on new sale
CREATE TRIGGER create_transaction_on_sale_trigger 
    AFTER INSERT ON public.vendas 
    FOR EACH ROW EXECUTE FUNCTION create_transaction_on_sale();

-- Function to handle withdrawal transactions
CREATE OR REPLACE FUNCTION handle_withdrawal_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process when status changes to 'aprovado'
    IF NEW.status = 'aprovado' AND OLD.status != 'aprovado' THEN
        -- Create debit transaction
        INSERT INTO public.transacoes (
            user_id, 
            tipo, 
            motivo, 
            valor, 
            referencia_id, 
            referencia_tipo,
            saldo_anterior,
            saldo_atual
        ) VALUES (
            NEW.user_id,
            'debito',
            'Saque aprovado',
            NEW.valor,
            NEW.id,
            'saque',
            (SELECT saldo FROM public.users WHERE id = NEW.user_id),
            (SELECT saldo FROM public.users WHERE id = NEW.user_id) - NEW.valor
        );
        
        -- Update user balance
        UPDATE public.users 
        SET saldo = saldo - NEW.valor,
            updated_at = NOW()
        WHERE id = NEW.user_id;
        
        -- Set approval date
        NEW.data_aprovacao = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to handle withdrawal approval
CREATE TRIGGER handle_withdrawal_approval_trigger 
    BEFORE UPDATE ON public.saques 
    FOR EACH ROW EXECUTE FUNCTION handle_withdrawal_approval();

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mikrotiks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.macs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saques ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can see and update their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Admins can see all users
CREATE POLICY "Admins can view all users" ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Users can only see their own mikrotiks
CREATE POLICY "Users can manage own mikrotiks" ON public.mikrotiks
    FOR ALL USING (auth.uid() = user_id);

-- Users can only see their own sales
CREATE POLICY "Users can view own sales" ON public.vendas
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own transactions
CREATE POLICY "Users can view own transactions" ON public.transacoes
    FOR SELECT USING (auth.uid() = user_id);

-- Users can see MACs from their mikrotiks
CREATE POLICY "Users can view macs from own mikrotiks" ON public.macs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.mikrotiks 
            WHERE id = macs.mikrotik_id AND user_id = auth.uid()
        )
    );

-- Users can manage their own withdrawals
CREATE POLICY "Users can manage own withdrawals" ON public.saques
    FOR ALL USING (auth.uid() = user_id);

-- Admins can approve withdrawals
CREATE POLICY "Admins can approve withdrawals" ON public.saques
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create initial admin user function (call after creating your first user)
CREATE OR REPLACE FUNCTION create_initial_admin(user_email TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.users 
    SET role = 'admin' 
    WHERE email = user_email;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User with email % not found', user_email;
    END IF;
END;
$$ language 'plpgsql';

-- Insert trigger to create user profile when auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, nome)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)));
    RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.users IS 'Extended user profiles with business logic';
COMMENT ON TABLE public.mikrotiks IS 'MikroTik router configurations for hotspot management';
COMMENT ON TABLE public.vendas IS 'Sales records with commission tracking';
COMMENT ON TABLE public.transacoes IS 'Financial transaction history';
COMMENT ON TABLE public.macs IS 'MAC address tracking and statistics';
COMMENT ON TABLE public.saques IS 'Withdrawal requests and approvals';

COMMENT ON COLUMN public.users.saldo IS 'Current user balance in currency';
COMMENT ON COLUMN public.mikrotiks.porcentagem IS 'Commission percentage for this MikroTik (0-100)';
COMMENT ON COLUMN public.vendas.comissao_valor IS 'Calculated commission amount for this sale';
COMMENT ON COLUMN public.transacoes.referencia_id IS 'Reference to related record (sale, withdrawal, etc.)';
COMMENT ON COLUMN public.macs.total_compras IS 'Total number of purchases from this MAC';
COMMENT ON COLUMN public.saques.pix_key IS 'PIX key for withdrawal payment';