'use client';

import { useState, useMemo, ChangeEvent, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSpreadsheet, Upload, Loader2, CheckCircle, AlertTriangle, Info, Search, Image as ImageIcon, X, Download, ChevronsRight, ArrowLeft } from 'lucide-react';
import Papa from 'papaparse';
import { Template } from '../types';

interface StagedData extends Record<string, any> {
  _rowId: number; 
}

interface ImageFileState {
  [rowId: number]: {
    [fieldName: string]: File | null;
  };
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export function BatchIssueForm({ templates, showAlert, onBatchComplete }: {
    templates: Template[];
    showAlert: (msg: string, type: 'success' | 'error') => void;
    onBatchComplete: () => void;
}) {
  const [step, setStep] = useState(1); // 1: Select Template, 2: Upload CSV, 3: Stage & Submit
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [stagedData, setStagedData] = useState<StagedData[]>([]);
  const [imageFiles, setImageFiles] = useState<ImageFileState>({});
  
  const [status, setStatus] = useState<'idle' | 'parsing' | 'processing' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const selectedTemplate = useMemo(() => 
    templates.find(t => t.id === parseInt(selectedTemplateId, 10)) || null,
    [selectedTemplateId, templates]
  );
  
  const imageFields = useMemo(() => 
    selectedTemplate?.dynamicFields?.filter(f => f.type === 'image-placeholder') || [],
    [selectedTemplate]
  );

  const textFields = useMemo(() =>
    selectedTemplate?.dynamicFields?.filter(f => f.type !== 'image-placeholder') || [],
    [selectedTemplate]
  );
  
  const resetState = () => {
    setStep(1);
    setFile(null);
    setStagedData([]);
    setImageFiles({});
    setStatus('idle');
    setError('');
    setSelectedTemplateId('');
    setSearchTerm('');
    setCurrentPage(1);
  };
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setStatus('parsing');
    setError('');

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: 'greedy',
      delimiter: ",",
      transformHeader: header => header.trim(),
      transform: value => value.trim(),
      complete: (results) => {
        if (results.errors.length) {
          setError(`Gagal parsing CSV: ${results.errors[0].message}. Periksa baris ${results.errors[0].row}.`);
          setStatus('error');
          setFile(null);
          return;
        }
        
        let data = (results.data as any[]).filter(row => Object.values(row).some(val => val !== ''));
        
        if (data.length === 0 || !results.meta.fields?.includes('recipientAddress')) {
          setError("Format CSV tidak valid. Pastikan ada kolom 'recipientAddress' dan file tidak kosong.");
          setStatus('error');
          setFile(null);
          return;
        }

        const dataWithIds: StagedData[] = data.map((row, index) => ({ ...row, _rowId: index }));
        setStagedData(dataWithIds);
        setStep(3); // Move to staging area
        setStatus('idle');
      },
      error: (err) => {
        setError(`Terjadi kesalahan: ${err.message}`);
        setStatus('error');
        setFile(null);
      },
    });
  };
  
  const handleImageFileChange = (rowId: number, fieldName: string, selectedFile: File | null) => {
      if (selectedFile && selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        showAlert('Ukuran file gambar tidak boleh melebihi 5MB.', 'error');
        return;
      }
      setImageFiles(prev => ({
          ...prev, [rowId]: { ...prev[rowId], [fieldName]: selectedFile }
      }));
  };

  const filteredData = useMemo(() => stagedData.filter(row =>
      Object.values(row).some(value => String(value).toLowerCase().includes(searchTerm.toLowerCase()))
  ), [stagedData, searchTerm]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);
  
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  const isReadyToSubmit = useMemo(() => {
      if (stagedData.length === 0) return false;
      return stagedData.every(row => 
        imageFields.every(field => field.isRequired ? !!imageFiles[row._rowId]?.[field.name] : true)
      );
  }, [stagedData, imageFiles, imageFields]);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (step !== 3) return;
    if (!isReadyToSubmit) {
      showAlert('Mohon unggah semua gambar yang wajib diisi untuk setiap baris.', 'error');
      return;
    }
    
    setStatus('processing');
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      const batchPayload = await Promise.all(stagedData.map(async (row) => {
          const dynamicData: Record<string, string> = {};
          textFields.forEach(field => {
              if (row[field.name]) dynamicData[field.name] = row[field.name];
          });
          for (const field of imageFields) {
              const file = imageFiles[row._rowId]?.[field.name];
              if (file) dynamicData[field.name] = await fileToBase64(file);
          }
          return {
              templateId: parseInt(selectedTemplateId, 10),
              recipientAddress: row.recipientAddress,
              dynamicData,
          };
      }));

      const response = await fetch(`${apiUrl}/credentials/issue-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ batch: batchPayload }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Gagal memulai proses batch.');
      
      setStatus('success');
      onBatchComplete();

    } catch (err: any) {
      setStatus('error');
      setError(err.message);
    }
  };

  const handleDownloadSampleCsv = () => {
    if (!selectedTemplate) return;
    const headers = ['recipientAddress', ...textFields.map(f => f.name)];
    const exampleRow: {[key: string]: string} = { recipientAddress: '0x123...' };
    textFields.forEach(field => { exampleRow[field.name] = field.placeholder || `Isi ${field.label}`; });
    const csv = Papa.unparse({ fields: headers, data: [exampleRow] });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.setAttribute('download', `contoh_${selectedTemplate.name.replace(/[^a-z0-9]/gi, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const renderContent = () => {
    // Final Status Screens
    if (status === 'processing') return <div className="flex flex-col items-center justify-center h-96"><Loader2 className="w-16 h-16 text-[#00ADB5] animate-spin"/><p className="mt-6 text-xl text-white">Memproses {stagedData.length} kredensial...</p></div>;
    if (status === 'success') return <div className="flex flex-col items-center justify-center text-center h-96"><CheckCircle className="w-20 h-20 text-green-400 mb-4" /><h3 className="text-3xl font-bold text-white">Batch Berhasil Diproses!</h3><p className="mt-2 text-[#EEEEEE]/70 max-w-md">{stagedData.length} kredensial telah dikirim untuk diterbitkan dan akan muncul di riwayat dalam beberapa saat.</p><button onClick={resetState} className="mt-8 bg-[#00ADB5] text-white py-2.5 px-8 rounded-lg font-semibold hover:scale-105 transition-transform">Terbitkan Lagi</button></div>;
    if (status === 'error' && error) return <div className="flex flex-col items-center justify-center text-center h-96"><AlertTriangle className="w-20 h-20 text-red-400 mb-4" /><h3 className="text-3xl font-bold text-white">Terjadi Kesalahan</h3><p className="text-red-300 bg-red-500/10 p-4 rounded-lg mt-4 max-w-md">{error}</p><button onClick={() => { setError(''); setStatus('idle'); }} className="mt-8 bg-[#00ADB5] text-white py-2.5 px-8 rounded-lg font-semibold hover:scale-105 transition-transform">Coba Lagi</button></div>;

    // Step-by-step UI
    if (step === 1) return (
      <div className="text-center">
        <label className="block text-lg font-medium text-white mb-3">Langkah 1: Pilih Template</label>
        <p className="text-sm text-[#EEEEEE]/60 mb-6">Pilih template yang akan digunakan untuk penerbitan batch.</p>
        <select value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)} required className="block w-full max-w-lg mx-auto rounded-xl border-2 border-[#EEEEEE]/10 bg-[#393E46]/50 p-3.5 text-[#EEEEEE] focus:border-[#00ADB5] focus:ring-0">
          <option value="" disabled>Pilih sebuah template...</option>
          {templates.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
        </select>
        <button onClick={() => setStep(2)} disabled={!selectedTemplateId} className="mt-6 bg-[#00ADB5] text-white font-semibold py-3 px-8 rounded-xl disabled:opacity-50 transition-all flex items-center gap-2 mx-auto">
          Lanjut <ChevronsRight className="w-5 h-5"/>
        </button>
      </div>
    );

    if (step === 2) return (
        <div>
            <button onClick={() => setStep(1)} className="flex items-center gap-2 text-sm text-[#00ADB5] hover:underline mb-4"><ArrowLeft className="w-4 h-4"/> Kembali</button>
            <div className="mt-4 bg-black/20 border border-white/10 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-white flex items-center"><Info className="w-5 h-5 mr-2 text-[#00ADB5]" /> Panduan Format CSV</h4>
                    <button type="button" onClick={handleDownloadSampleCsv} className="flex items-center gap-2 text-xs font-semibold bg-[#00ADB5]/20 text-[#00ADB5] hover:bg-[#00ADB5]/40 px-3 py-1.5 rounded-md transition-colors"><Download className="w-3.5 h-3.5"/>Unduh Contoh</button>
                </div>
                <div className="bg-[#222831]/70 rounded-lg p-3 text-sm font-mono text-[#EEEEEE]/80">
                    <p className="text-white/90 break-words">Header: {['recipientAddress', ...textFields.map(f => f.name)].join(', ')}</p>
                </div>
            </div>
            <div className="mt-6">
                <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-[#EEEEEE]/20 border-dashed rounded-xl cursor-pointer bg-white/5 hover:bg-white/10 transition-colors`}>
                  <div className="flex flex-col items-center justify-center text-center text-[#EEEEEE]/60">
                    {status === 'parsing' ? <Loader2 className="w-10 h-10 animate-spin text-[#00ADB5]" /> : <Upload className="w-10 h-10 mb-2" />}
                    <p className="text-lg font-semibold">{status === 'parsing' ? 'Memeriksa file...' : 'Klik atau seret file CSV'}</p>
                    <p className="text-xs">Pastikan format sesuai dengan panduan di atas</p>
                  </div>
                  <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} disabled={status === 'parsing'} />
                </label>
            </div>
        </div>
    );

    if (step === 3) return (
      <div className="space-y-6">
          <div className="flex items-center justify-between">
              <div>
                  <h3 className="text-2xl font-bold text-white">Langkah 3: Pratinjau & Unggah Gambar</h3>
                  <p className="text-sm text-[#EEEEEE]/70">Data dari <strong>{file?.name}</strong>. Unggah gambar yang diperlukan.</p>
              </div>
               <button onClick={resetState} className="bg-red-500/20 text-red-300 font-semibold py-2 px-4 rounded-lg hover:bg-red-500/30 transition-colors">Batal</button>
          </div>
          <div className="relative w-full md:w-1/2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#EEEEEE]/50" />
              <input type="text" placeholder="Cari data..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#EEEEEE]/30 bg-[#222831]/50 text-[#EEEEEE] focus:border-[#00ADB5] focus:ring-1 focus:ring-[#00ADB5]/50"/>
          </div>
          <div className="overflow-x-auto rounded-lg border border-[#EEEEEE]/20 bg-black/10">
              <table className="min-w-full divide-y divide-[#EEEEEE]/20">
                  <thead className="bg-black/20">
                      <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#EEEEEE]/70 uppercase tracking-wider">Penerima</th>
                          {textFields.map(header => <th key={header.name} className="px-6 py-3 text-left text-xs font-medium text-[#EEEEEE]/70 uppercase tracking-wider">{header.label}</th>)}
                          {imageFields.map(field => <th key={field.name} className="px-6 py-3 text-left text-xs font-medium text-[#EEEEEE]/70 uppercase tracking-wider">{field.label} {field.isRequired && <span className="text-red-400">*</span>}</th>)}
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEEEEE]/10">
                      {paginatedData.map((row) => (
                          <tr key={row._rowId} className="hover:bg-black/20 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-mono max-w-[150px] truncate" title={row.recipientAddress}>{row.recipientAddress}</td>
                              {textFields.map(field => <td key={field.name} className="px-6 py-4 whitespace-nowrap text-sm text-white max-w-[150px] truncate" title={row[field.name]}>{row[field.name]}</td>)}
                              {imageFields.map(field => (
                                  <td key={field.name} className="px-6 py-4 whitespace-nowrap text-sm">
                                      {imageFiles[row._rowId]?.[field.name] ? (
                                          <div className="flex items-center gap-2">
                                              <img src={URL.createObjectURL(imageFiles[row._rowId][field.name]!)} alt="preview" className="w-10 h-10 rounded object-cover border border-white/20" />
                                              <div className="text-xs text-green-300 truncate max-w-28" title={imageFiles[row._rowId][field.name]!.name}>{imageFiles[row._rowId][field.name]!.name}</div>
                                              <button onClick={() => handleImageFileChange(row._rowId, field.name, null)} className="text-red-400 hover:text-red-300"><X className="w-4 h-4"/></button>
                                          </div>
                                      ) : (
                                          <label className="cursor-pointer bg-[#00ADB5]/20 hover:bg-[#00ADB5]/40 text-[#00ADB5] px-3 py-1.5 rounded-md text-xs font-semibold transition-colors">Unggah <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={(e) => handleImageFileChange(row._rowId, field.name, e.target.files ? e.target.files[0] : null)} /></label>
                                      )}
                                  </td>
                              ))}
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
          {totalPages > 1 && (
              <div className="flex justify-between items-center text-sm">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-lg bg-black/20 hover:bg-white/10 disabled:opacity-50">Sebelumnya</button>
                  <span>Halaman {currentPage} dari {totalPages}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 rounded-lg bg-black/20 hover:bg-white/10 disabled:opacity-50">Berikutnya</button>
              </div>
          )}
          <div className="pt-4 border-t border-white/10">
            <button onClick={handleSubmit} type="button" disabled={!isReadyToSubmit} className="w-full bg-gradient-to-r from-[#00ADB5] to-[#009da3] text-white py-3.5 px-6 rounded-xl font-bold text-lg flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#00ADB5]/30 transform hover:scale-[1.02]">
                {!isReadyToSubmit ? 'Lengkapi Gambar Wajib' : `Proses & Terbitkan ${stagedData.length} Kredensial`}
            </button>
          </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#EEEEEE]/10 to-[#EEEEEE]/5 backdrop-blur-sm border border-[#EEEEEE]/20 rounded-2xl p-6 sm:p-8">
      <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-4">
        <FileSpreadsheet className="w-8 h-8 text-[#00ADB5]" />
        Terbitkan Kredensial via CSV
      </h2>
       <p className="text-md text-[#EEEEEE]/70 mb-8">Gunakan file CSV untuk menerbitkan banyak kredensial sekaligus.</p>
      
      <AnimatePresence mode="wait">
        <motion.div key={step + status} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: "easeInOut" }}>
            {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}