'use client';

import { useState, useMemo, ChangeEvent, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSpreadsheet, Upload, Loader, CheckCircle, AlertTriangle, Info, Search, Image as ImageIcon, X, Download } from 'lucide-react';
import Papa from 'papaparse';
import { Template } from '../types';

// --- Tipe data baru untuk Staging ---
interface StagedData extends Record<string, any> {
  _rowId: number; 
}

interface ImageFileState {
  [rowId: number]: {
    [fieldName: string]: File | null;
  };
}

// --- Komponen Helper ---
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// --- Komponen Utama ---
export function BatchIssueForm({ templates, showAlert, onBatchComplete }: {
    templates: Template[];
    showAlert: (msg: string, type: 'success' | 'error') => void;
    onBatchComplete: () => void;
}) {
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [stagedData, setStagedData] = useState<StagedData[]>([]);
  const [imageFiles, setImageFiles] = useState<ImageFileState>({});
  
  const [status, setStatus] = useState<'idle' | 'parsing' | 'staging' | 'processing' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

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
  
  const resetForm = () => {
    setFile(null);
    setStagedData([]);
    setImageFiles({});
    setStatus('idle');
    setError('');
    setSelectedTemplateId('');
    setSearchTerm('');
    setCurrentPage(1);
  };
  
  const handleTemplateChange = (id: string) => {
    resetForm();
    setSelectedTemplateId(id);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setStatus('parsing');
    setError('');

    // --- *** PERUBAHAN UTAMA DI SINI *** ---
    // Konfigurasi parser dibuat lebih kuat untuk menangani berbagai format CSV
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      delimiter: ",", // Eksplisit tentukan koma sebagai pemisah
      transformHeader: header => header.trim(), // Membersihkan spasi di header
      transform: value => value.trim(), // Membersihkan spasi di nilai
      complete: (results) => {
        if (results.errors.length) {
          setError(`Gagal mem-parsing CSV: ${results.errors[0].message}. Pastikan format CSV benar.`);
          setStatus('error');
          return;
        }
        
        let data = results.data as any[];

        // Membersihkan kolom dummy "catatan" jika ada
        data = data.map(row => {
            delete row.catatan; // Hapus kolom 'catatan' dari setiap baris
            // Hapus juga kolom kosong yang mungkin tercipta dari koma di akhir
            delete row['']; 
            return row;
        });

        if (data.length === 0 || !data[0].recipientAddress) {
          setError("Format CSV tidak valid. Pastikan ada kolom 'recipientAddress'.");
          setStatus('error');
          return;
        }

        const dataWithIds: StagedData[] = data.map((row, index) => ({
          ...row,
          _rowId: index,
        }));
        setStagedData(dataWithIds);
        setStatus('staging');
      },
      error: (err) => {
        setError(err.message);
        setStatus('error');
      },
    });
    // --- *** AKHIR PERUBAHAN *** ---
  };
  
  const handleImageFileChange = (rowId: number, fieldName: string, selectedFile: File | null) => {
      if (selectedFile && selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        showAlert('Ukuran file gambar tidak boleh melebihi 5MB.', 'error');
        return;
      }
      setImageFiles(prev => ({
          ...prev,
          [rowId]: {
              ...prev[rowId],
              [fieldName]: selectedFile
          }
      }));
  };

  const filteredData = useMemo(() => {
    return stagedData.filter(row =>
      Object.values(row).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [stagedData, searchTerm]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);
  
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  const isReadyToSubmit = useMemo(() => {
      if (stagedData.length === 0) return false;
      return stagedData.every(row => {
          return imageFields.every(field => {
              if (field.isRequired) {
                  return !!imageFiles[row._rowId]?.[field.name];
              }
              return true;
          });
      });
  }, [stagedData, imageFiles, imageFields]);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status !== 'staging' || !selectedTemplateId) {
      showAlert('Sesi tidak valid, silakan mulai dari awal.', 'error');
      return;
    }
    if (!isReadyToSubmit) {
      showAlert('Mohon unggah semua gambar yang wajib diisi.', 'error');
      return;
    }
    
    setStatus('processing');
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      const batchPayloadPromises = stagedData.map(async (row) => {
          const dynamicData: Record<string, string> = {};
          textFields.forEach(field => {
              if (row[field.name]) dynamicData[field.name] = row[field.name];
          });
          for (const field of imageFields) {
              const file = imageFiles[row._rowId]?.[field.name];
              if (file) {
                  dynamicData[field.name] = await fileToBase64(file);
              }
          }
          return {
              templateId: parseInt(selectedTemplateId, 10),
              recipientAddress: row.recipientAddress,
              dynamicData,
          };
      });
      
      const batchPayload = await Promise.all(batchPayloadPromises);

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
    
    const exampleRow: {[key: string]: string} = {
      recipientAddress: '0x1234567890123456789012345678901234567890'
    };
    textFields.forEach(field => {
        exampleRow[field.name] = field.placeholder || `Isi ${field.label}`;
    });

    const csv = Papa.unparse({
      fields: headers,
      data: [exampleRow]
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const safeFileName = selectedTemplate.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.setAttribute('download', `contoh_${safeFileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const CsvFormatGuide = () => {
    if (!selectedTemplate) return null;

    const headers = ['recipientAddress', ...textFields.map(f => f.name)];
    
    return (
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 bg-black/20 border border-white/10 rounded-xl p-4">
        <div className="flex justify-between items-center mb-3">
            <h4 className="text-md font-semibold text-white flex items-center">
              <Info className="w-5 h-5 mr-2 text-[#00ADB5]" /> Panduan Format CSV
            </h4>
            <button
                type="button"
                onClick={handleDownloadSampleCsv}
                className="flex items-center gap-2 text-xs font-semibold bg-[#00ADB5]/20 text-[#00ADB5] hover:bg-[#00ADB5]/40 px-3 py-1.5 rounded-md transition-colors"
            >
                <Download className="w-3.5 h-3.5"/>
                Unduh Contoh
            </button>
        </div>
        <div className="bg-[#222831]/70 rounded-lg p-3 text-sm font-mono text-[#EEEEEE]/80">
          <p className="text-white/90">// Header CSV harus berisi: {headers.join(', ')}</p>
        </div>
        <p className="text-xs text-[#EEEEEE]/60 mt-2">
            Kolom untuk gambar tidak perlu disertakan. Gambar akan diunggah di langkah berikutnya.
        </p>
      </motion.div>
    );
  };
  
  const StagingArea = () => (
    <div className="space-y-6">
        <div className="p-4 bg-black/20 rounded-lg border border-white/10">
            <h3 className="text-xl font-bold text-white mb-2">Langkah 2: Pratinjau & Unggah Gambar</h3>
            <p className="text-sm text-[#EEEEEE]/70">
                Data dari <strong>{file?.name}</strong> berhasil dimuat. Unggah file gambar yang diperlukan untuk setiap baris.
            </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-1/2 lg:w-1/3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#EEEEEE]/50" />
                <input
                    type="text"
                    placeholder="Cari data..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#EEEEEE]/30 bg-[#222831]/50 text-[#EEEEEE] focus:border-[#00ADB5] focus:ring-1 focus:ring-[#00ADB5]/50"
                />
            </div>
            <div className="text-sm text-[#EEEEEE]/80">
                Menampilkan {paginatedData.length} dari {filteredData.length} baris.
            </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#EEEEEE]/20">
            <table className="min-w-full divide-y divide-[#EEEEEE]/20">
                <thead className="bg-black/20">
                    <tr>
                        {Object.keys(stagedData[0] || {}).filter(key => key !== '_rowId').map(header => (
                            <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#EEEEEE]/70 uppercase tracking-wider">{header.replace(/_/g, ' ')}</th>
                        ))}
                        {imageFields.map(field => (
                            <th key={field.name} scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#EEEEEE]/70 uppercase tracking-wider">
                                {field.label} {field.isRequired && <span className="text-red-400">*</span>}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#EEEEEE]/10 bg-black/5">
                    {paginatedData.map((row) => (
                        <tr key={row._rowId} className="hover:bg-black/20">
                            {Object.entries(row).filter(([key]) => key !== '_rowId').map(([key, value]) => (
                                <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-white font-mono max-w-xs truncate" title={String(value)}>{String(value)}</td>
                            ))}
                            {imageFields.map(field => (
                                <td key={field.name} className="px-6 py-4 whitespace-nowrap text-sm">
                                    {imageFiles[row._rowId]?.[field.name] ? (
                                        <div className="flex items-center gap-2">
                                            <img src={URL.createObjectURL(imageFiles[row._rowId][field.name]!)} alt="preview" className="w-10 h-10 rounded object-cover" />
                                            <div className="text-xs text-green-300 truncate max-w-28" title={imageFiles[row._rowId][field.name]!.name}>
                                                {imageFiles[row._rowId][field.name]!.name}
                                            </div>
                                            <button onClick={() => handleImageFileChange(row._rowId, field.name, null)} className="text-red-400 hover:text-red-300">
                                                <X className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer bg-[#00ADB5]/20 hover:bg-[#00ADB5]/40 text-[#00ADB5] px-3 py-1.5 rounded-md text-xs font-semibold">
                                            Unggah
                                            <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={(e) => handleImageFileChange(row._rowId, field.name, e.target.files ? e.target.files[0] : null)} />
                                        </label>
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {totalPages > 1 && (
            <div className="flex justify-between items-center">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 text-sm rounded-lg bg-black/20 hover:bg-white/10 disabled:opacity-50">Sebelumnya</button>
                <span>Halaman {currentPage} dari {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 text-sm rounded-lg bg-black/20 hover:bg-white/10 disabled:opacity-50">Berikutnya</button>
            </div>
        )}
        
        <div className="flex gap-4 pt-4 border-t border-white/10">
            <button onClick={resetForm} type="button" className="w-1/3 bg-transparent border-2 border-[#EEEEEE]/40 hover:bg-white/10 text-white py-3 rounded-xl font-semibold transition-all">
                Batal
            </button>
            <button onClick={handleSubmit} type="button" disabled={!isReadyToSubmit} className="w-2/3 bg-[#00ADB5] hover:shadow-lg hover:shadow-[#00ADB5]/40 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {!isReadyToSubmit ? 'Lengkapi Gambar Wajib' : `Proses & Terbitkan ${stagedData.length} Kredensial`}
            </button>
        </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-[#EEEEEE]/10 to-[#EEEEEE]/5 backdrop-blur-sm border border-[#EEEEEE]/20 rounded-2xl p-6 sm:p-8">
      <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
        <FileSpreadsheet className="w-8 h-8 mr-4 text-[#00ADB5]" />
        Terbitkan Kredensial Batch
      </h2>
      
      <AnimatePresence mode="wait">
        <motion.div key={status} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          
          {status === 'processing' && <div className="flex flex-col items-center justify-center h-64"><Loader className="w-12 h-12 text-[#00ADB5] animate-spin"/><p className="mt-4 text-lg">Memproses Batch...</p></div>}
          {status === 'success' && <div className="flex flex-col items-center justify-center text-center h-64"><CheckCircle className="w-16 h-16 text-green-400 mb-4" /><h3 className="text-2xl font-bold">Batch Berhasil Diproses!</h3><p className="mt-2 text-[#EEEEEE]/70">{stagedData.length} kredensial telah dikirim untuk diterbitkan.</p><button onClick={resetForm} className="mt-6 bg-[#00ADB5] text-white py-2 px-6 rounded-lg font-semibold">Terbitkan Lagi</button></div>}
          {status === 'error' && <div className="flex flex-col items-center justify-center text-center h-64"><AlertTriangle className="w-16 h-16 text-red-400 mb-4" /><h3 className="text-2xl font-bold">Terjadi Kesalahan</h3><p className="text-red-300 bg-red-500/10 p-3 rounded-lg mt-2">{error}</p><button onClick={resetForm} className="mt-6 bg-[#00ADB5] text-white py-2 px-6 rounded-lg font-semibold">Coba Lagi</button></div>}

          {status === 'idle' || status === 'parsing' ? (
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#EEEEEE]/80 mb-2">Langkah 1: Pilih Template & Unggah CSV</label>
                <select value={selectedTemplateId} onChange={e => handleTemplateChange(e.target.value)} required className="block w-full rounded-lg border border-[#EEEEEE]/30 bg-[#222831]/50 p-3 text-[#EEEEEE] focus:border-[#00ADB5] focus:ring-2 focus:ring-[#00ADB5]/50">
                  <option value="" disabled>Pilih sebuah template...</option>
                  {templates.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
                </select>
                <AnimatePresence>{selectedTemplate && <CsvFormatGuide />}</AnimatePresence>
              </div>
              <div>
                <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-[#EEEEEE]/40 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors ${!selectedTemplateId && 'opacity-50 cursor-not-allowed'}`}>
                  <div className="flex flex-col items-center justify-center text-center text-[#EEEEEE]/60">
                    {status === 'parsing' ? <Loader className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8 mb-2" />}
                    <p className="text-sm font-semibold">{status === 'parsing' ? 'Memeriksa file...' : 'Klik atau seret file CSV ke sini'}</p>
                  </div>
                  <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} disabled={status === 'parsing' || !selectedTemplateId} />
                </label>
              </div>
            </form>
          ) : null}

          {status === 'staging' && <StagingArea />}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}