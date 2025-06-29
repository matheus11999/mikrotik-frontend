import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import * as Dialog from '@radix-ui/react-dialog';
import { Plus, Edit, Trash2, User, Shield } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import type { User as UserType } from '../types';

interface UserForm {
  id?: string;
  nome: string;
  email: string;
  role: 'admin' | 'user';
  saldo: number;
}

export default function UsuariosList() {
  const { user } = useAuthContext();
  const [usuarios, setUsuarios] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<UserForm>({ nome: '', email: '', role: 'user', saldo: 0 });
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') fetchUsuarios();
  }, [user]);

  const fetchUsuarios = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (!error && data) setUsuarios(data);
    setLoading(false);
  };

  const handleOpenModal = (editUser?: UserType) => {
    setError('');
    if (editUser) {
      setEditMode(true);
      setForm({
        id: editUser.id,
        nome: editUser.nome,
        email: editUser.email,
        role: editUser.role,
        saldo: editUser.saldo,
      });
    } else {
      setEditMode(false);
      setForm({ nome: '', email: '', role: 'user', saldo: 0 });
    }
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este usuário?')) return;
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (!error) fetchUsuarios();
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!form.nome || !form.email || !form.role) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    if (editMode && form.id) {
      // Update
      const { error } = await supabase.from('users').update({
        nome: form.nome,
        email: form.email,
        role: form.role,
        saldo: Number(form.saldo),
      }).eq('id', form.id);
      if (error) setError(error.message);
      else {
        setModalOpen(false);
        fetchUsuarios();
      }
    } else {
      // Create
      const { error } = await supabase.from('users').insert({
        nome: form.nome,
        email: form.email,
        role: form.role,
        saldo: Number(form.saldo),
      });
      if (error) setError(error.message);
      else {
        setModalOpen(false);
        fetchUsuarios();
      }
    }
  };

  const filteredUsuarios = usuarios.filter(u =>
    u.nome.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Acesso restrito</h2>
          <p className="text-gray-400">Apenas administradores podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="border-b border-gray-800 bg-black">
        <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-white">Usuários</h1>
              <p className="text-gray-400 text-sm sm:text-base">Gerencie todos os usuários do sistema</p>
            </div>
            <Button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" /> Novo Usuário
            </Button>
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-md bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 rounded-xl text-base"
          />
        </div>
        {loading ? (
          <div className="text-gray-400">Carregando usuários...</div>
        ) : filteredUsuarios.length === 0 ? (
          <div className="text-gray-400">Nenhum usuário encontrado.</div>
        ) : (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredUsuarios.map((u) => (
              <div key={u.id} className="bg-black border border-gray-800 rounded-xl p-4 sm:p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 rounded-lg bg-gray-900 border border-gray-800">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-white truncate">{u.nome}</h3>
                      <p className="text-gray-400 text-sm truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-300">{u.role}</span>
                    <span className="text-xs px-2 py-1 rounded bg-green-800 text-green-300">Saldo: R$ {u.saldo.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex space-x-2 mt-4 sm:mt-6">
                  <Button size="sm" variant="outline" className="border-gray-800 text-gray-300 hover:text-white hover:border-blue-500 hover:bg-blue-500/10 flex-1" onClick={() => handleOpenModal(u)}>
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="border-red-600/50 text-red-400 hover:text-red-300 hover:border-red-500 hover:bg-red-500/10 flex-1" onClick={() => handleDelete(u.id)}>
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md h-[calc(100vh-2rem)] max-h-[600px] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-neutral-900 p-6 sm:p-8 shadow-2xl border border-neutral-700 overflow-y-auto">
            <Dialog.Title className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">{editMode ? 'Editar Usuário' : 'Novo Usuário'}</Dialog.Title>
            <form onSubmit={handleFormSubmit} className="space-y-4 sm:space-y-6">
              {error && <div className="p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Nome</label>
                <Input
                  name="nome"
                  value={form.nome}
                  onChange={handleFormChange}
                  className="w-full bg-gray-900 border border-gray-800 text-white text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Email</label>
                <Input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleFormChange}
                  className="w-full bg-gray-900 border border-gray-800 text-white text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Função</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleFormChange}
                  className="w-full p-3 bg-gray-900 border border-gray-800 text-white rounded-lg text-base"
                  required
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Saldo</label>
                <Input
                  name="saldo"
                  type="number"
                  step="0.01"
                  value={form.saldo}
                  onChange={handleFormChange}
                  className="w-full bg-gray-900 border border-gray-800 text-white text-base"
                  required
                />
              </div>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="flex-1 border-gray-800 text-gray-300 hover:text-white py-3">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3">
                  {editMode ? 'Salvar Alterações' : 'Criar Usuário'}
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
} 