'use client';

import { useState } from 'react';
import { Send, Upload, ImageIcon, X } from 'lucide-react';
import { Template, DynamicField } from '../types';

interface MintCredentialFormProps {
  templates: Template[];
  showAlert: (msg: string, type: 'success' | 'error') => void;
}

export function MintCredentialForm({ templates, showAlert }: MintCredentialFormProps) {
  const [recipient, setRecipient] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dynamicFieldValues, setDynamicFieldValues] = useState<{ [key: string]: string | File }>({});
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const commonInputClass = "block w-full rounded-lg border border-[#EEEEEE]/30 bg-[#222831]/50 p-3 text-[#EEEEEE] placeholder-[#EEEEEE]/50 transition-colors focus:border-[#00ADB5] focus:ring-2 focus:ring-[#00ADB5]/50";

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === parseInt(templateId, 10)) || null;
    setSelectedTemplate(template);
    setDynamicFieldValues({});
  };

  const handleDynamicFieldChange = (fieldName: string, value: string | File) => {
    setDynamicFieldValues(prev => ({ ...prev, [fieldName]: value }));
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
    if (!selectedTemplateId.trim() || !recipient.trim()) {
      showAlert('Mohon lengkapi semua field yang wajib diisi.', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

      const dynamicData: { [key: string]: string } = {};

      for (const [fieldName, value] of Object.entries(dynamicFieldValues)) {
        if (value instanceof File) {
          dynamicData[fieldName] = await fileToBase64(value);
        } else if (value && typeof value === 'string') {
          dynamicData[fieldName] = value.trim();
        }
      }

      const payload = {
        templateId: parseInt(selectedTemplateId, 10),
        recipientAddress: recipient.trim(),
        dynamicData: dynamicData,
      };

      const response = await fetch(`${apiUrl}/credentials/issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: Gagal menerbitkan kredensial`);
      }

      showAlert(`Berhasil! Hash Transaksi: ${data.transactionHash || 'N/A'}`, 'success');
      setRecipient('');
      setSelectedTemplateId('');
      setSelectedTemplate(null);
      setDynamicFieldValues({});

    } catch (err: any) {
      console.error('Issuance error:', err);
      showAlert(`Error: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const renderDynamicField = (field: DynamicField) => {
    const value = dynamicFieldValues[field.name];

    switch (field.type) {
      case 'dynamic-field':
        return (
          <div key={field.name}>
            <input
              type="text"
              value={(value as string) || ''}
              onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
              className={commonInputClass}
              placeholder={field.placeholder || `Masukkan ${field.label.toLowerCase()}`}
              required={field.isRequired}
            />
          </div>
        );

      case 'image-placeholder':
        return (
          <div key={field.name} className="space-y-2">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-[#EEEEEE]/40 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-[#EEEEEE]/60">
                <Upload className="w-8 h-8 mb-3" />
                <p className="text-sm">
                  <span className="font-semibold">Klik untuk mengunggah</span>
                </p>
                <p className="text-xs">PNG, JPG (MAX. 5MB)</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      alert('Ukuran file harus kurang dari 5MB');
                      return;
                    }
                    handleDynamicFieldChange(field.name, file);
                  }
                }}
                required={field.isRequired}
              />
            </label>
            {value instanceof File && (
              <div className="flex items-center p-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-200">
                <ImageIcon className="w-5 h-5 mr-2"/>
                <p className="text-sm font-medium truncate flex-1">{value.name}</p>
                <button
                  type="button"
                  onClick={() => handleDynamicFieldChange(field.name, '')}
                  className="ml-2"
                >
                  <X className="w-4 h-4"/>
                </button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#EEEEEE]/10 to-[#EEEEEE]/5 backdrop-blur-sm border border-[#EEEEEE]/20 rounded-2xl p-6 sm:p-8">
      <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
        <Send className="w-8 h-8 mr-4 text-[#00ADB5]" />
        Terbitkan Kredensial Baru
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="template" className="block text-sm font-medium text-[#EEEEEE]/80 mb-2">
            Pilih Template *
          </label>
          <select
            id="template"
            value={selectedTemplateId}
            onChange={e => handleTemplateChange(e.target.value)}
            required
            className={commonInputClass}
          >
            <option value="" disabled>Pilih sebuah template...</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} {t.dynamicFields ? `(${t.dynamicFields.length} fields)` : '(0 fields)'}
              </option>
            ))}
          </select>
        </div>

        {selectedTemplate?.dynamicFields && selectedTemplate.dynamicFields.length > 0 && (
          <div className="space-y-6 p-6 bg-black/20 rounded-xl border border-white/10">
            <h3 className="text-xl font-semibold text-white border-b border-white/10 pb-3">
              Isi Informasi Kredensial
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
          </div>
        )}

        <div>
          <label htmlFor="recipient" className="block text-sm font-medium text-[#EEEEEE]/80 mb-2">
            Alamat Wallet Penerima *
          </label>
          <input
            type="text"
            id="recipient"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            required
            className={commonInputClass}
            placeholder="0x..."
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !selectedTemplateId || !recipient}
          className="w-full bg-[#00ADB5] hover:shadow-lg hover:shadow-[#00ADB5]/40 text-[#EEEEEE] py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? 'Memproses...' : 'Terbitkan Kredensial'}
        </button>
      </form>
    </div>
  );
}