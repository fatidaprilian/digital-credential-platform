'use client';

import { useState } from 'react';
import { Send, Upload, ImageIcon, X, Loader2 } from 'lucide-react';
import { Template, DynamicField } from '../types';
import { motion } from 'framer-motion';

interface MintCredentialFormProps {
  templates: Template[];
  showAlert: (msg: string, type: 'success' | 'error') => void;
}

export function MintCredentialForm({ templates, showAlert }: MintCredentialFormProps) {
  const [recipient, setRecipient] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dynamicFieldValues, setDynamicFieldValues] = useState<{ [key: string]: string | File }>({});
  
  const selectedTemplate = templates.find(t => t.id === parseInt(selectedTemplateId, 10)) || null;

  const commonInputClass = "block w-full rounded-xl border-2 border-[#EEEEEE]/10 bg-[#393E46]/50 p-3.5 text-[#EEEEEE] placeholder-[#EEEEEE]/50 transition-all duration-300 focus:outline-none focus:ring-0 focus:border-[#00ADB5] focus:bg-[#393E46]/70 focus:shadow-lg focus:shadow-[#00ADB5]/10";

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setDynamicFieldValues({});
  };

  const handleDynamicFieldChange = (fieldName: string, value: string | File | null) => {
    if (value === null) {
      const newValues = { ...dynamicFieldValues };
      delete newValues[fieldName];
      setDynamicFieldValues(newValues);
    } else {
      setDynamicFieldValues(prev => ({ ...prev, [fieldName]: value }));
    }
  };
  
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateId || !recipient) {
      showAlert('Mohon pilih template dan isi alamat penerima.', 'error');
      return;
    }
    
    // Validasi field yang wajib diisi
    const requiredFields = selectedTemplate?.dynamicFields?.filter(f => f.isRequired) || [];
    for (const field of requiredFields) {
        if (!dynamicFieldValues[field.name]) {
            showAlert(`Kolom "${field.label}" wajib diisi.`, 'error');
            return;
        }
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

      const dynamicData: { [key: string]: string } = {};

      for (const [fieldName, value] of Object.entries(dynamicFieldValues)) {
        if (value instanceof File) {
          dynamicData[fieldName] = await fileToBase64(value);
        } else if (value && typeof value === 'string' && value.trim()) {
          dynamicData[fieldName] = value.trim();
        }
      }

      const payload = {
        templateId: parseInt(selectedTemplateId, 10),
        recipientAddress: recipient.trim(),
        dynamicData,
      };

      const response = await fetch(`${apiUrl}/credentials/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Gagal menerbitkan kredensial.`);
      }

      showAlert(`Kredensial berhasil diterbitkan! Hash: ${data.transactionHash.substring(0,10)}...`, 'success');
      setRecipient('');
      setSelectedTemplateId('');
      setDynamicFieldValues({});

    } catch (err: any) {
      showAlert(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const renderDynamicField = (field: DynamicField) => {
    const value = dynamicFieldValues[field.name];

    if (field.type === 'image-placeholder') {
      return (
        <div key={field.name}>
          {value instanceof File ? (
            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="relative group">
              <img src={URL.createObjectURL(value)} alt="Preview" className="w-full h-32 object-cover rounded-xl border-2 border-[#00ADB5]/50"/>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                 <button type="button" onClick={() => handleDynamicFieldChange(field.name, null)} className="p-2 bg-red-500/80 rounded-full text-white hover:bg-red-500">
                    <X className="w-5 h-5"/>
                 </button>
              </div>
            </motion.div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-[#EEEEEE]/20 border-dashed rounded-xl cursor-pointer bg-[#393E46]/30 hover:bg-[#393E46]/60 hover:border-[#00ADB5]/50 transition-all">
              <div className="flex flex-col items-center justify-center text-[#EEEEEE]/60">
                <Upload className="w-8 h-8 mb-2" />
                <p className="text-sm font-semibold">Unggah Gambar</p>
                <p className="text-xs">PNG atau JPG (Maks 5MB)</p>
              </div>
              <input
                type="file" className="hidden" accept="image/png, image/jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      showAlert('Ukuran file tidak boleh lebih dari 5MB.', 'error');
                      return;
                    }
                    handleDynamicFieldChange(field.name, file);
                  }
                }}
              />
            </label>
          )}
        </div>
      );
    }

    return (
      <div key={field.name}>
        <input
          type="text"
          value={(value as string) || ''}
          onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
          className={commonInputClass}
          placeholder={field.placeholder || `Masukkan ${field.label.toLowerCase()}`}
        />
      </div>
    );
  };
  
  return (
    <div className="bg-gradient-to-br from-[#EEEEEE]/10 to-[#EEEEEE]/5 backdrop-blur-sm border border-[#EEEEEE]/20 rounded-2xl p-6 sm:p-8">
      <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-4">
        <Send className="w-8 h-8 text-[#00ADB5]" />
        Terbitkan Kredensial Satuan
      </h2>
      <p className="text-md text-[#EEEEEE]/70 mb-8">Isi form untuk menerbitkan satu kredensial secara individual.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="template" className="block text-sm font-medium text-[#EEEEEE]/80 mb-2">
                Pilih Template <span className="text-red-400">*</span>
              </label>
              <select id="template" value={selectedTemplateId} onChange={e => handleTemplateChange(e.target.value)} required className={commonInputClass}>
                <option value="" disabled>Pilih sebuah template...</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
             <div>
              <label htmlFor="recipient" className="block text-sm font-medium text-[#EEEEEE]/80 mb-2">
                Alamat Wallet Penerima <span className="text-red-400">*</span>
              </label>
              <input
                type="text" id="recipient" value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                required className={commonInputClass} placeholder="cth: 0x123..."
              />
            </div>
        </div>

        {selectedTemplate?.dynamicFields && selectedTemplate.dynamicFields.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-6 p-6 bg-black/20 rounded-xl border border-white/10"
          >
            <h3 className="text-xl font-semibold text-white border-b border-white/10 pb-3">
              Isi Detail Kredensial
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {selectedTemplate.dynamicFields.map((field: DynamicField) => (
                <div key={field.name} className="space-y-2">
                  <label className="block text-sm font-medium text-[#EEEEEE]/80">
                    {field.label} {field.isRequired && <span className="text-red-400">*</span>}
                    <span className="text-xs text-[#EEEEEE]/50 ml-2">
                      ({field.type === 'image-placeholder' ? 'Gambar' : 'Teks'})
                    </span>
                  </label>
                  {renderDynamicField(field)}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="pt-4 border-t border-white/10">
            <button
              type="submit"
              disabled={isLoading || !selectedTemplateId || !recipient}
              className="w-full bg-gradient-to-r from-[#00ADB5] to-[#009da3] text-white py-3.5 px-6 rounded-xl font-bold text-lg flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#00ADB5]/30 transform hover:scale-[1.02]"
            >
              {isLoading ? (
                  <>
                      <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                      <span>Memproses...</span>
                  </>
              ) : (
                  <>
                      <Send className="w-5 h-5 mr-2" />
                      <span>Terbitkan Sekarang</span>
                  </>
              )}
            </button>
        </div>
      </form>
    </div>
  );
}