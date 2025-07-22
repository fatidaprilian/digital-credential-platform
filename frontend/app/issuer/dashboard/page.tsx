"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Tipe data untuk User & Template
// --- PERUBAHAN 1: Tambahkan 'dynamicFields' ke tipe data Template ---
type DynamicField = { name: string; x: number; y: number };
type UserProfile = { id: number; email: string; userType: string };
type Template = { id: number; name: string; description: string | null; ipfsTemplateHash: string | null; dynamicFields: DynamicField[] | null };

// --- Komponen Form Penerbitan Kredensial ---
function MintCredentialForm({ templates }: { templates: Template[] }) {
  const [recipient, setRecipient] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- PERUBAHAN 2: State baru untuk menyimpan nilai field dinamis ---
  const [dynamicFieldValues, setDynamicFieldValues] = useState<{ [key: string]: string }>({});
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Fungsi yang berjalan saat pengguna memilih template dari dropdown
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === parseInt(templateId, 10)) || null;
    setSelectedTemplate(template);
    // Kosongkan nilai field dinamis setiap kali template baru dipilih
    setDynamicFieldValues({});
  };
  
  // Fungsi untuk mengubah nilai di input field dinamis
  const handleDynamicFieldChange = (fieldName: string, value: string) => {
    setDynamicFieldValues(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    // --- PERUBAHAN 3: Kirim data field dinamis ke backend ---
    const issueData = { 
      templateId: parseInt(selectedTemplateId, 10),
      recipientAddress: recipient,
      dynamicData: dynamicFieldValues, // Data yang diisi pengguna
    };

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:3001/credentials/issue', {
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
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg w-full max-w-2xl">
      <h3 className="text-xl font-semibold mb-4 text-white">Terbitkan Kredensial Baru</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="template" className="block text-sm font-medium text-zinc-400 mb-2">Pilih Template</label>
          <select id="template" value={selectedTemplateId} onChange={e => handleTemplateChange(e.target.value)} required className="block w-full rounded-md bg-zinc-800 border-zinc-700 p-2 text-white">
            <option value="" disabled>Pilih sebuah template</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        
        {/* --- PERUBAHAN 4: Tampilkan input dinamis jika template dipilih --- */}
        {selectedTemplate && selectedTemplate.dynamicFields && selectedTemplate.dynamicFields.map(field => (
          <div key={field.name}>
            <label htmlFor={field.name} className="block text-sm font-medium text-zinc-400 mb-2">{field.name}</label>
            <input
              id={field.name}
              type="text"
              value={dynamicFieldValues[field.name] || ''}
              onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
              required
              className="block w-full rounded-md bg-zinc-800 border-zinc-700 p-2 text-white"
            />
          </div>
        ))}

        <div>
          <label htmlFor="recipient" className="block text-sm font-medium text-zinc-400 mb-2">Alamat Wallet Penerima</label>
          <input id="recipient" type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)} required className="block w-full rounded-md bg-zinc-800 border-zinc-700 p-2 text-white" />
        </div>
        {message && <p className={`text-sm ${message.startsWith('Error') ? 'text-red-500' : 'text-green-500'}`}>{message}</p>}
        <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">
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
  const [fields, setFields] = useState<{ name: string; x: string; y: string }[]>([
    { name: '', x: '100', y: '200' },
  ]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFile(e.target.files[0]);
  };

  const handleFieldChange = (index: number, key: 'name' | 'x' | 'y', value: string) => {
    const newFields = [...fields];
    newFields[index][key] = value;
    setFields(newFields);
  };

  const addField = () => {
    setFields([...fields, { name: '', x: '100', y: (200 + fields.length * 50).toString() }]);
  };

  const removeField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    setFields(newFields);
  };

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
      const response = await fetch('http://localhost:3001/templates', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) { const data = await response.json(); throw new Error(data.message || 'Gagal membuat template'); }
      
      setName('');
      setDescription('');
      setFile(null);
      setFields([{ name: '', x: '100', y: '200' }]);
      (e.target as HTMLFormElement).reset();
      onTemplateCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg w-full max-w-2xl">
      <h3 className="text-xl font-semibold mb-4 text-white">Buat Template Baru</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name-create" className="block text-sm font-medium text-zinc-400 mb-2">Nama Template</label>
          <input id="name-create" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="block w-full rounded-md bg-zinc-800 border-zinc-700 p-2 text-white" />
        </div>
        <div>
          <label htmlFor="description-create" className="block text-sm font-medium text-zinc-400 mb-2">Deskripsi</label>
          <input id="description-create" type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="block w-full rounded-md bg-zinc-800 border-zinc-700 p-2 text-white" />
        </div>
        <div>
          <label htmlFor="file-create" className="block text-sm font-medium text-zinc-400 mb-2">Gambar Latar Template</label>
          <input id="file-create" type="file" onChange={handleFileChange} required accept="image/png, image/jpeg" className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700" />
        </div>
        <hr className="border-zinc-700"/>
        <div>
           <label className="block text-sm font-medium text-zinc-400 mb-2">Field Dinamis (Nama dan Posisi)</label>
           <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-6">
                  <input type="text" placeholder="Nama Field" value={field.name} onChange={(e) => handleFieldChange(index, 'name', e.target.value)} required className="block w-full rounded-md bg-zinc-800 border-zinc-700 p-2 text-white text-sm" />
                </div>
                <div className="col-span-2">
                  <input type="number" placeholder="X" value={field.x} onChange={(e) => handleFieldChange(index, 'x', e.target.value)} required className="block w-full rounded-md bg-zinc-800 border-zinc-700 p-2 text-white text-sm" />
                </div>
                <div className="col-span-2">
                  <input type="number" placeholder="Y" value={field.y} onChange={(e) => handleFieldChange(index, 'y', e.target.value)} required className="block w-full rounded-md bg-zinc-800 border-zinc-700 p-2 text-white text-sm" />
                </div>
                <div className="col-span-2 flex justify-end">
                  {fields.length > 1 && ( <button type="button" onClick={() => removeField(index)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-md">X</button> )}
                </div>
              </div>
            ))}
           </div>
           <button type="button" onClick={addField} className="mt-2 text-sm text-blue-400 hover:text-blue-300">
            + Tambah field lain
           </button>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">
          {isLoading ? 'Membuat...' : 'Buat Template'}
        </button>
      </form>
    </div>
  );
}

// --- Komponen Halaman Dasbor Utama ---
export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchData = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.push('/issuer/login'); return; }
    try {
      const [profileRes, templatesRes] = await Promise.all([
        fetch('http://localhost:3001/auth/profile', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://localhost:3001/templates', { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);
      if (!profileRes.ok || !templatesRes.ok) { localStorage.removeItem('access_token'); throw new Error('Sesi berakhir atau gagal mengambil data.'); }
      const profileData: UserProfile = await profileRes.json();
      const templatesData: Template[] = await templatesRes.json();
      setUser(profileData);
      setTemplates(templatesData);
    } catch (error) { console.error(error); router.push('/issuer/login'); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, [router]);

  const handleLogout = () => { localStorage.removeItem('access_token'); router.push('/issuer/login'); };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen text-white"><p>Memuat dasbor...</p></div>;
  }

  return (
    <div className="bg-black min-h-screen text-zinc-300">
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Dasbor Issuer</h1>
          <button onClick={handleLogout} className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 px-4 rounded-md">
            Keluar
          </button>
        </header>
        
        {user && <p className="text-lg text-zinc-400 mb-8">Selamat datang, <strong className="text-zinc-200">{user.email}</strong>!</p>}
        
        <div className="space-y-12">
          <MintCredentialForm templates={templates} />

          <div>
            <h2 className="text-2xl font-bold mt-12 mb-6 text-white">Template Saya</h2>
            {templates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map(template => (
                  <div key={template.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
                    <strong className="text-white">{template.name}</strong>
                    <p className="text-sm text-zinc-400 mt-2">{template.description}</p>
                    <p className="text-xs text-zinc-500 mt-4 break-all">IPFS: {template.ipfsTemplateHash}</p>
                  </div>
                ))}
              </div>
            ) : ( <p className="text-zinc-500">Anda belum memiliki template.</p> )}
            
            <div className="mt-8">
              <CreateTemplateForm onTemplateCreated={fetchData} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
