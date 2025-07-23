'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

// --- Tipe Data ---
interface DynamicField {
  name: string;
  x: number;
  y: number;
}

interface Template {
  id: number;
  name: string;
  description: string | null;
  ipfsTemplateHash: string | null;
  dynamicFields: DynamicField[] | null;
}

interface UserProfile {
  sub: number;
  email: string;
  userType: string;
}

// --- Komponen Form Penerbitan Kredensial ---
function MintCredentialForm({ templates }: { templates: Template[] }) {
  const [recipient, setRecipient] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dynamicFieldValues, setDynamicFieldValues] = useState<{ [key: string]: string }>({});
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === parseInt(templateId, 10)) || null;
    setSelectedTemplate(template);
    setDynamicFieldValues({});
  };

  const handleDynamicFieldChange = (fieldName: string, value: string) => {
    setDynamicFieldValues(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    const issueData = {
      templateId: parseInt(selectedTemplateId, 10),
      recipientAddress: recipient,
      dynamicData: dynamicFieldValues,
    };

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/credentials/issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(issueData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Gagal menerbitkan kredensial');

      setMessage(`Sukses! Hash Transaksi: ${data.transactionHash}`);
      setRecipient('');
      setSelectedTemplateId('');
      setSelectedTemplate(null);
      setDynamicFieldValues({});
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Terbitkan Kredensial Baru</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="template" className="block text-sm font-medium text-gray-600 mb-1">Pilih Template</label>
          <select id="template" value={selectedTemplateId} onChange={e => handleTemplateChange(e.target.value)} required className="block w-full rounded-md border-gray-300 shadow-sm p-2 text-gray-800">
            <option value="" disabled>Pilih sebuah template</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        
        {selectedTemplate?.dynamicFields?.map(field => (
          <div key={field.name}>
            <label htmlFor={field.name} className="block text-sm font-medium text-gray-600 mb-1">{field.name}</label>
            <input
              id={field.name}
              type="text"
              value={dynamicFieldValues[field.name] || ''}
              onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
              required
              className="block w-full rounded-md border-gray-300 shadow-sm p-2 text-gray-800"
            />
          </div>
        ))}

        <div>
          <label htmlFor="recipient" className="block text-sm font-medium text-gray-600 mb-1">Alamat Wallet Penerima</label>
          <input id="recipient" type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)} required className="block w-full rounded-md border-gray-300 shadow-sm p-2 text-gray-800" />
        </div>
        {message && <p className={`text-sm ${message.startsWith('Error') ? 'text-red-500' : 'text-green-500'}`}>{message}</p>}
        <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50">
          {isLoading ? 'Menerbitkan...' : 'Terbitkan Kredensial'}
        </button>
      </form>
    </div>
  );
}

// --- Komponen Form Pembuatan Template ---
function CreateTemplateForm({ onTemplateCreated }: { onTemplateCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fields, setFields] = useState<{ name: string; x: string; y: string }[]>([{ name: '', x: '100', y: '200' }]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFieldChange = (index: number, key: 'name' | 'x' | 'y', value: string) => {
    const newFields = [...fields];
    newFields[index][key] = value;
    setFields(newFields);
  };

  const addField = () => setFields([...fields, { name: '', x: '100', y: (200 + fields.length * 50).toString() }]);
  const removeField = (index: number) => setFields(fields.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError('Mohon pilih file untuk diunggah.'); return; }
    setIsLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('file', file);
    
    const fieldsToSubmit = fields
      .filter(f => f.name.trim() !== '')
      .map(f => ({ name: f.name, x: parseInt(f.x, 10) || 0, y: parseInt(f.y, 10) || 0 }));
    formData.append('dynamicFields', JSON.stringify(fieldsToSubmit));

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/templates`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) { const data = await response.json(); throw new Error(data.message || 'Gagal membuat template'); }
      
      (e.target as HTMLFormElement).reset();
      setName(''); setDescription(''); setFile(null); setFields([{ name: '', x: '100', y: '200' }]);
      onTemplateCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4 text-gray-700">Buat Template Baru</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Nama Template" className="block w-full rounded-md border-gray-300 p-2 text-gray-800" />
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Deskripsi" className="block w-full rounded-md border-gray-300 p-2 text-gray-800" />
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Gambar Latar Template</label>
          <input type="file" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} required accept="image/png, image/jpeg" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100" />
        </div>
        <hr/>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Field Dinamis (Nama & Posisi)</label>
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center">
                <input type="text" placeholder="Nama Field" value={field.name} onChange={(e) => handleFieldChange(index, 'name', e.target.value)} required className="col-span-6 block w-full rounded-md border-gray-300 p-2 text-sm text-gray-800" />
                <input type="number" placeholder="X" value={field.x} onChange={(e) => handleFieldChange(index, 'x', e.target.value)} required className="col-span-2 block w-full rounded-md border-gray-300 p-2 text-sm text-gray-800" />
                <input type="number" placeholder="Y" value={field.y} onChange={(e) => handleFieldChange(index, 'y', e.target.value)} required className="col-span-2 block w-full rounded-md border-gray-300 p-2 text-sm text-gray-800" />
                {fields.length > 1 && <button type="button" onClick={() => removeField(index)} className="col-span-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded-md">X</button>}
              </div>
            ))}
          </div>
          <button type="button" onClick={addField} className="mt-2 text-sm text-indigo-600 hover:text-indigo-500">+ Tambah field</button>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50">
          {isLoading ? 'Membuat...' : 'Buat Template'}
        </button>
      </form>
    </div>
  );
}

// --- Komponen Halaman Dasbor Utama ---
export default function IssuerDashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchData = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/issuer/login');
      return;
    }
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const [profileRes, templatesRes] = await Promise.all([
        fetch(`${apiUrl}/auth/profile`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiUrl}/templates`, { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);
      if (!profileRes.ok || !templatesRes.ok) {
        localStorage.removeItem('access_token');
        throw new Error('Sesi berakhir atau gagal mengambil data.');
      }
      const profileData: UserProfile = await profileRes.json();
      const templatesData: Template[] = await templatesRes.json();
      setProfile(profileData);
      setTemplates(templatesData);
    } catch (error) {
      console.error(error);
      router.push('/issuer/login');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    router.push('/issuer/login');
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><p>Memuat dasbor...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard Institusi</h1>
            {profile && <p className="text-gray-600">Selamat datang, {profile.email}</p>}
          </div>
          <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md">
            Keluar
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <MintCredentialForm templates={templates} />
          
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Template Saya</h2>
              {templates.length > 0 ? (
                <div className="space-y-4">
                  {templates.map(template => (
                    <div key={template.id} className="bg-white p-4 rounded-lg shadow">
                      <strong className="text-gray-800">{template.name}</strong>
                      <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                      <p className="text-xs text-gray-400 mt-3 break-all">IPFS: {template.ipfsTemplateHash}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 bg-white p-4 rounded-lg shadow">Anda belum memiliki template.</p>
              )}
            </div>
            <CreateTemplateForm onTemplateCreated={fetchData} />
          </div>
        </div>
      </div>
    </div>
  );
}
