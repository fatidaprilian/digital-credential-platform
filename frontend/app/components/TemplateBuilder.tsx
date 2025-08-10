'use client';

import React from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDrag, useDrop } from 'react-dnd';
import { Type, Rss, Image as ImageIcon, Building, PenSquare, QrCode, X, Palette, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation'; // Import useRouter

// Interfaces and sub-components (DraggableComponent, etc.) remain the same.
// They are correct based on your initial code.

interface TemplateComponent {
  id: string;
  type: 'static-text' | 'dynamic-field' | 'image-placeholder' | 'logo' | 'signature' | 'qr-code';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  fieldName?: string;
  label?: string;
  placeholder?: string;
  isRequired?: boolean;
  style?: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    fontWeight?: string;
    textAlign?: 'left' | 'center' | 'right';
    backgroundColor?: string;
    borderWidth?: number;
    borderColor?: string;
    borderRadius?: number;
  };
}

// The onSave prop is replaced with onSaveComplete for redirection or closing a modal
interface TemplateBuilderProps {
  onSaveComplete: () => void; 
  existingTemplate?: any;
}

const DraggableComponent = ({ component, onUpdate, onSelect, isSelected, onDelete, canvasBounds }: {
  component: TemplateComponent;
  onUpdate: (id: string, updates: Partial<TemplateComponent>) => void;
  onSelect: (id: string) => void;
  isSelected: boolean;
  onDelete: (id: string) => void;
  canvasBounds: { width: number; height: number };
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(component.id);

    const target = e.target as HTMLElement;
    const isResizeHandle = target.hasAttribute('data-resize-handle');

    if (isResizeHandle) {
        setIsResizing(true);
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = component.width;
        const startHeight = component.height;

        const doResize = (moveEvent: MouseEvent) => {
            const newWidth = Math.max(20, Math.min(startWidth + (moveEvent.clientX - startX), canvasBounds.width - component.x));
            const newHeight = Math.max(20, Math.min(startHeight + (moveEvent.clientY - startY), canvasBounds.height - component.y));
            onUpdate(component.id, { width: newWidth, height: newHeight });
        };

        const stopResize = () => {
            document.removeEventListener('mousemove', doResize);
            document.removeEventListener('mouseup', stopResize);
            setIsResizing(false);
        };

        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);

    } else {
        setIsDragging(true);
        const startX = e.clientX;
        const startY = e.clientY;

        const doDrag = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;
            const newX = Math.max(0, Math.min(component.x + deltaX, canvasBounds.width - component.width));
            const newY = Math.max(0, Math.min(component.y + deltaY, canvasBounds.height - component.height));
            onUpdate(component.id, { x: newX, y: newY });
        };

        const stopDrag = () => {
            document.removeEventListener('mousemove', doDrag);
            document.removeEventListener('mouseup', stopDrag);
            setIsDragging(false);
        };

        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
    }
  }, [component, onUpdate, onSelect, canvasBounds]);

  const renderComponentContent = () => {
    const customStyle = component.style || {};

    const placeholderBaseStyle = "w-full h-full flex items-center justify-center text-xs rounded-lg shadow-sm p-2 text-center overflow-hidden";
    const placeholderSelectedBorderStyle = isSelected ? 'border-2 border-[#00ADB5]' : 'border-2 border-dashed border-[#EEEEEE]/30';
    
    const textBaseStyle = "w-full h-full text-xs overflow-hidden transition-all duration-150 rounded-md";
    const selectionClasses = isSelected
        ? 'bg-[#00ADB5]/20 ring-2 ring-[#00ADB5]'
        : 'hover:bg-white/10';

    switch (component.type) {
      case 'static-text':
        return (
          <div
            style={{
              ...customStyle,
              fontSize: customStyle.fontSize ? `${customStyle.fontSize}px` : '12px',
              color: customStyle.color || '#EEEEEE',
              fontWeight: customStyle.fontWeight || 'normal',
              textAlign: customStyle.textAlign || 'left'
            }}
            className={`${textBaseStyle} ${selectionClasses} cursor-pointer`}
          >
            {component.content || 'Teks Statis'}
          </div>
        );
      
      case 'dynamic-field':
        return (
            <div
              style={{
                ...customStyle,
                fontSize: customStyle.fontSize ? `${customStyle.fontSize}px` : '12px',
                color: customStyle.color || '#00ADB5',
                fontWeight: customStyle.fontWeight || 'normal',
                textAlign: customStyle.textAlign || 'left'
              }}
              className={`${textBaseStyle} ${selectionClasses} cursor-pointer`}
            >
              <div className="font-semibold">{component.label || 'Field Dinamis'}</div>
              <div className="text-xs opacity-60">({component.fieldName || 'nama_field'})</div>
            </div>
        );

      case 'logo':
      case 'signature':
        if (component.content) {
          return (
            <img
              src={component.content}
              alt={component.type}
              className={`w-full h-full object-contain ${placeholderSelectedBorderStyle} rounded-lg`}
              draggable={false}
            />
          );
        }
        return (
          <div className={`${placeholderBaseStyle} bg-[#EEEEEE]/10 ${placeholderSelectedBorderStyle} text-[#EEEEEE]/80 flex-col`}>
            {component.type === 'logo' ? <Building className="w-6 h-6 mb-1"/> : <PenSquare className="w-6 h-6 mb-1"/>}
            <span className="font-semibold text-xs">{component.type === 'logo' ? 'Logo' : 'Tanda Tangan'}</span>
          </div>
        );
      case 'image-placeholder':
      case 'qr-code':
        let icon, title;
        if (component.type === 'image-placeholder'){
            icon = <ImageIcon className="w-6 h-6 mb-1"/>;
            title = component.label || 'Field Gambar';
        } else {
            icon = <QrCode className="w-6 h-6 mb-1"/>;
            title = 'Kode QR';
        }
        return (
          <div className={`${placeholderBaseStyle} bg-[#00ADB5]/10 ${placeholderSelectedBorderStyle} text-[#00ADB5] flex-col`}>
            {icon}
            <div className="font-semibold text-xs">{title}</div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={ref}
      onMouseDown={handleMouseDown}
      className={`absolute select-none group transition-all duration-150 ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{
        left: component.x,
        top: component.y,
        width: component.width,
        height: component.height
      }}
    >
      {renderComponentContent()}
      {isSelected && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(component.id);
            }}
            className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg z-30 hover:bg-red-600 transition-colors border-2 border-white"
          >
            <X className="w-4 h-4" />
          </button>

          <div
            data-resize-handle="true"
            className="absolute -bottom-3 -right-3 w-6 h-6 bg-[#00ADB5] rounded-full cursor-se-resize z-30 hover:scale-110 transition-transform border-2 border-white shadow-lg"
          />
        </>
      )}
    </div>
  );
};


const DropCanvas = ({
  width,
  height,
  backgroundImage,
  children,
  onDrop,
  onCanvasClick
}: {
  width: number;
  height: number;
  backgroundImage: string;
  children: React.ReactNode;
  onDrop: (item: any, offset: { x: number; y: number }) => void;
  onCanvasClick: (e: React.MouseEvent) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isOver }, drop] = useDrop({
    accept: 'toolbox-item',
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
      const canvasRect = ref.current?.getBoundingClientRect();
      if (offset && canvasRect) {
        onDrop(item, {
          x: Math.max(0, offset.x - canvasRect.left),
          y: Math.max(0, offset.y - canvasRect.top)
        });
      }
    },
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  });

  drop(ref);

  return (
    <div
      ref={ref}
      data-canvas="true"
      onClick={onCanvasClick}
      className={`relative bg-no-repeat bg-center bg-cover shadow-xl border-2 transition-all duration-200 ${
        isOver
          ? 'border-[#00ADB5] shadow-[#00ADB5]/30'
          : 'border-[#EEEEEE]/20'
      }`}
      style={{
        width,
        height,
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover'
      }}
    >
      {children}
      {isOver && (
        <div className="absolute inset-0 bg-[#00ADB5]/10 border-2 border-dashed border-[#00ADB5] flex items-center justify-center">
          <div className="bg-[#00ADB5] text-white px-4 py-2 rounded-lg font-semibold">
            Lepas untuk menambahkan komponen
          </div>
        </div>
      )}
    </div>
  );
};

const ToolboxItem = ({ type, label, icon: Icon, description }: {
  type: string;
  label: string;
  icon: React.ElementType;
  description: string;
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'toolbox-item',
    item: { type },
    collect: (monitor) => ({ isDragging: monitor.isDragging() })
  });

  return (
    <div
      ref={drag}
      className={`flex items-center p-3 bg-[#EEEEEE]/5 backdrop-blur-sm border border-[#EEEEEE]/20 rounded-lg cursor-grab hover:border-[#00ADB5]/80 transition-all duration-200 ${
        isDragging ? 'opacity-50 scale-95 cursor-grabbing' : 'opacity-100'
      }`}
    >
      <div className="bg-gradient-to-r from-[#00ADB5] to-[#393E46] p-3 rounded-lg mr-4">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <span className="font-semibold text-sm text-[#EEEEEE]">{label}</span>
        <p className="text-xs text-[#EEEEEE]/60">{description}</p>
      </div>
    </div>
  );
};

export default function TemplateBuilder({ onSaveComplete, existingTemplate }: TemplateBuilderProps) {
  const [components, setComponents] = useState<TemplateComponent[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number } | null>(null);
  const [templateName, setTemplateName] = useState<string>('');
  const [templateDescription, setTemplateDescription] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingText, setEditingText] = useState('');
  
  // **State untuk mengelola proses penyimpanan**
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter(); // Initialize router

    useEffect(() => {
        if (existingTemplate) {
            setTemplateName(existingTemplate.name || '');
            setTemplateDescription(existingTemplate.description || '');

            // The 'backgroundImage' property now lives on the template object itself
            if(existingTemplate.backgroundImage) {
                handleBackgroundImageLoad(existingTemplate.backgroundImage);
            }
            if(existingTemplate.canvasWidth && existingTemplate.canvasHeight) {
                setCanvasDimensions({width: existingTemplate.canvasWidth, height: existingTemplate.canvasHeight});
            }
            if (Array.isArray(existingTemplate.components)) {
                setComponents(existingTemplate.components);
            }
        }
    }, [existingTemplate]);

  const handleBackgroundImageLoad = (imageUrl: string) => {
    const img = new Image();
    img.onload = () => {
      setBackgroundImage(imageUrl);
      setCanvasDimensions({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      alert('Gagal memuat gambar latar. Pastikan URL atau file valid.');
      setCanvasDimensions(null);
      setBackgroundImage('');
    };
    img.src = imageUrl;
  };

  const handleBackgroundFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // Maks 10MB
        alert('Ukuran file terlalu besar. Maksimal 10MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        handleBackgroundImageLoad(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
    
  const handleDrop = useCallback((item: any, offset: { x: number; y: number }) => {
    if (!canvasDimensions) return;

    const isLarge = ['logo', 'signature', 'image-placeholder', 'qr-code'].includes(item.type);
    const isDynamic = ['dynamic-field', 'image-placeholder'].includes(item.type);

    const defaultWidth = isLarge ? 120 : 180;
    const defaultHeight = isLarge ? 120 : 20;

    const maxX = canvasDimensions.width - defaultWidth;
    const maxY = canvasDimensions.height - defaultHeight;

    const newComponent: TemplateComponent = {
      id: `${item.type}-${Date.now()}`,
      type: item.type,
      x: Math.min(Math.max(0, Math.round(offset.x)), maxX),
      y: Math.min(Math.max(0, Math.round(offset.y)), maxY),
      width: defaultWidth,
      height: defaultHeight,
      content: item.type === 'static-text' ? 'Ubah isi teks melalui properti komponen' : undefined,
      fieldName: isDynamic ? `${item.type.replace('-', '_')}_${Date.now()}` : undefined,
      label: isDynamic ? `${item.type === 'dynamic-field' ? 'Field Teks' : 'Field Gambar'}` : undefined,
      placeholder: isDynamic ? `Masukkan ${item.type === 'dynamic-field' ? 'teks' : 'gambar'}...` : undefined,
      isRequired: isDynamic ? true : undefined,
      style: {
        fontSize: 14,
        fontFamily: 'Arial',
        color: '#000000ff',
        fontWeight: 'normal',
        textAlign: 'left',
        backgroundColor: 'transparent',
      }
    };

    setComponents(prev => [...prev, newComponent]);
    setSelectedComponentId(newComponent.id);
  }, [canvasDimensions]);

  const updateComponent = useCallback((id: string, updates: Partial<TemplateComponent>) => {
    setComponents(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const deleteComponent = (id: string) => {
    setComponents(prev => prev.filter(c => c.id !== id));
    if (selectedComponentId === id) {
      setSelectedComponentId(null);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.hasAttribute('data-canvas')) {
      setSelectedComponentId(null);
    }
  };

  const handleStaticImageUpload = (e: React.ChangeEvent<HTMLInputElement>, componentId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => updateComponent(componentId, { content: event.target?.result as string });
    reader.readAsDataURL(file);
  };

  const resetTemplate = () => {
    if (confirm('Apakah Anda yakin ingin mengatur ulang template? Semua perubahan akan hilang.')) {
      setComponents([]);
      setSelectedComponentId(null);
      setBackgroundImage('');
      setCanvasDimensions(null);
      setTemplateName('');
      setTemplateDescription('');
    }
  };

  const handleTextSave = () => {
    if (selectedComponentId) {
      updateComponent(selectedComponentId, { content: editingText });
    }
    setIsEditing(false);
    setEditingText('');
  };

  /**
   * ===================================================================
   * FUNGSI SIMPAN TERINTEGRASI
   * ===================================================================
   */
  const handleSave = async () => {
    if (!templateName.trim() || !backgroundImage || !canvasDimensions) {
      alert('Nama template dan gambar latar wajib diisi.');
      return;
    }

    setIsSaving(true);
    
    // 1. Siapkan payload `components`. Ini adalah array bersih dari objek komponen visual.
    const finalComponentsPayload = components.map(c => ({
      ...c,
      x: Math.round(c.x),
      y: Math.round(c.y),
      width: Math.round(c.width),
      height: Math.round(c.height)
    }));
    
    // 2. Siapkan payload `dynamicFields`.
    const dynamicFieldsPayload = components
      .filter(c => c.type === 'dynamic-field' || c.type === 'image-placeholder')
      .map(c => ({
        name: c.fieldName!,
        label: c.label!,
        type: c.type,
        x: Math.round(c.x),
        y: Math.round(c.y),
        width: Math.round(c.width),
        height: Math.round(c.height),
        isRequired: c.isRequired
      }));

    // 3. Buat payload akhir yang cocok dengan CreateDragDropTemplateDto di backend.
    const payload = {
      name: templateName,
      description: templateDescription,
      backgroundImage: backgroundImage,          // URL gambar latar (Base64)
      canvasWidth: canvasDimensions.width,       // Lebar kanvas
      canvasHeight: canvasDimensions.height,     // Tinggi kanvas
      components: finalComponentsPayload,        // Array komponen visual
      dynamicFields: dynamicFieldsPayload,       // Array field dinamis
    };
    
    try {
        // Ganti dengan cara Anda mendapatkan token (misal: dari context, cookie, dll.)
        const token = localStorage.getItem('access_token'); 
        if (!token) {
            alert('Sesi tidak valid. Silakan login kembali.');
            setIsSaving(false);
            return;
        }

        // Ganti dengan URL API Anda dari environment variables
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        
        const response = await fetch(`${apiUrl}/template-builder`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Sertakan token autentikasi
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            // Backend mungkin mengembalikan array pesan error
            const errorMessage = errorData.message ? (Array.isArray(errorData.message) ? errorData.message.join(', ') : errorData.message) : 'Gagal menyimpan template.';
            throw new Error(errorMessage);
        }
        onSaveComplete(); // Panggil callback setelah berhasil

    } catch (error: any) {
      console.error('Gagal menyimpan template:', error);
      alert(`Terjadi kesalahan: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  const selectedComp = components.find(c => c.id === selectedComponentId);
  const inputStyle = "w-full px-3 py-2 bg-[#222831]/60 border border-[#EEEEEE]/20 rounded-md text-sm text-[#EEEEEE] focus:ring-2 focus:ring-[#00ADB5] focus:border-transparent transition";
  const labelStyle = "block text-sm font-medium mb-1 text-[#EEEEEE]/80";

  const availableComponents = [
    { type: 'static-text', label: 'Teks Statis', icon: Type, description: 'Teks yang tidak akan berubah' },
    { type: 'dynamic-field', label: 'Teks Dinamis', icon: Rss, description: 'Teks yang diisi saat penerbitan' },
    { type: 'logo', label: 'Logo Institusi', icon: Building, description: 'Unggah logo institusi Anda' },
    { type: 'signature', label: 'Tanda Tangan', icon: PenSquare, description: 'Unggah gambar tanda tangan' },
    { type: 'image-placeholder', label: 'Gambar Dinamis', icon: ImageIcon, description: 'Gambar diunggah saat penerbitan' },
    { type: 'qr-code', label: 'Kode QR', icon: QrCode, description: 'QR verifikasi dibuat otomatis' },
  ];

  // Sisa dari JSX tidak berubah
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex w-full h-full bg-[#222831] text-[#EEEEEE] font-sans">
        {/* Panel Kiri (Toolbox & Properties) */}
        <div className="w-96 bg-transparent p-6 overflow-y-auto space-y-6 border-r border-[#EEEEEE]/10 shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-white">Desain Template</h3>
            <button
              onClick={resetTemplate}
              className="p-2 text-[#EEEEEE]/60 hover:text-[#EEEEEE] hover:bg-[#EEEEEE]/10 rounded-lg transition-colors"
              title="Atur Ulang Template"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelStyle}>Nama Template *</label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className={inputStyle}
                placeholder="cth., Sertifikat Kelulusan"
                required
              />
            </div>
            <div>
              <label className={labelStyle}>Deskripsi</label>
              <textarea
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                className={inputStyle}
                rows={2}
                placeholder="Deskripsi singkat template ini"
              />
            </div>
            <div>
              <label className={labelStyle}>Gambar Latar *</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleBackgroundFileChange}
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#00ADB5]/20 file:text-[#00ADB5] hover:file:bg-[#00ADB5]/40"
              />
              {backgroundImage && (
                <button
                  onClick={() => {
                    setBackgroundImage('');
                    setCanvasDimensions(null);
                    setComponents([]);
                    setSelectedComponentId(null);
                  }}
                  className="mt-2 text-sm text-red-500 hover:underline"
                >
                  Hapus Latar & Reset
                </button>
              )}
            </div>
          </div>

          <div className="border-t border-[#EEEEEE]/10 pt-6">
            <h4 className="font-semibold mb-3 text-white flex items-center">
              <Palette className="w-5 h-5 mr-2" />
              Komponen ({components.length})
            </h4>
            <div className="space-y-3">
              {availableComponents.map((c) => (
                <ToolboxItem key={c.type} {...c} />
              ))}
            </div>
          </div>

          {selectedComp && (
            <div className="border-t border-[#EEEEEE]/10 pt-6 space-y-4">
              <h4 className="font-semibold text-white flex items-center">
                <span className="w-3 h-3 bg-[#00ADB5] rounded-full mr-2"></span>
                Properti: {selectedComp.type.replace('-', ' ')}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelStyle}>Posisi X</label>
                  <input
                    type="number"
                    value={Math.round(selectedComp.x)}
                    onChange={e => updateComponent(selectedComp.id, { x: +e.target.value })}
                    className={inputStyle}
                    min="0"
                    max={canvasDimensions?.width || 1000}
                  />
                </div>
                <div>
                  <label className={labelStyle}>Posisi Y</label>
                  <input
                    type="number"
                    value={Math.round(selectedComp.y)}
                    onChange={e => updateComponent(selectedComp.id, { y: +e.target.value })}
                    className={inputStyle}
                    min="0"
                    max={canvasDimensions?.height || 1000}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelStyle}>Lebar</label>
                  <input
                    type="number"
                    value={Math.round(selectedComp.width)}
                    onChange={e => updateComponent(selectedComp.id, { width: +e.target.value })}
                    className={inputStyle}
                    min="20"
                  />
                </div>
                <div>
                  <label className={labelStyle}>Tinggi</label>
                  <input
                    type="number"
                    value={Math.round(selectedComp.height)}
                    onChange={e => updateComponent(selectedComp.id, { height: +e.target.value })}
                    className={inputStyle}
                    min="20"
                  />
                </div>
              </div>

              {selectedComp.type === 'static-text' && (
                <div>
                  <label className={labelStyle}>Isi Teks</label>
                  <textarea
                    value={selectedComp.content || ''}
                    onChange={e => updateComponent(selectedComp.id, { content: e.target.value })}
                    className={inputStyle}
                    rows={3}
                    placeholder="Masukkan teks Anda..."
                  />
                </div>
              )}

              {(selectedComp.type === 'logo' || selectedComp.type === 'signature') && (
                <div>
                  <label className={labelStyle}>
                    Unggah {selectedComp.type === 'logo' ? 'Logo' : 'Tanda Tangan'} *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleStaticImageUpload(e, selectedComp.id)}
                    className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#00ADB5]/20 file:text-[#00ADB5] hover:file:bg-[#00ADB5]/40"
                  />
                </div>
              )}

              {(selectedComp.type === 'dynamic-field' || selectedComp.type === 'image-placeholder') && (
                <div className="space-y-3">
                  <div>
                    <label className={labelStyle}>Nama Field (ID Internal)</label>
                    <input
                      type="text"
                      value={selectedComp.fieldName || ''}
                      onChange={e => updateComponent(selectedComp.id, { fieldName: e.target.value })}
                      className={inputStyle}
                      placeholder="cth., nama_mahasiswa, foto_profil"
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Label Tampilan</label>
                    <input
                      type="text"
                      value={selectedComp.label || ''}
                      onChange={e => updateComponent(selectedComp.id, { label: e.target.value })}
                      className={inputStyle}
                      placeholder="cth., Nama Mahasiswa, Foto Profil"
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Teks Placeholder</label>
                    <input
                      type="text"
                      value={selectedComp.placeholder || ''}
                      onChange={e => updateComponent(selectedComp.id, { placeholder: e.target.value })}
                      className={inputStyle}
                      placeholder="Teks bantuan untuk pengguna"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="required"
                      checked={selectedComp.isRequired || false}
                      onChange={e => updateComponent(selectedComp.id, { isRequired: e.target.checked })}
                      className="rounded border-[#EEEEEE]/20 bg-[#222831]/60 text-[#00ADB5] focus:ring-[#00ADB5] focus:ring-offset-0"
                    />
                    <label htmlFor="required" className="text-sm text-[#EEEEEE]/80">
                      Wajib diisi
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Panel Kanan (Canvas) */}
        <div className="flex-1 p-6 flex flex-col items-center justify-start overflow-auto bg-[#393E46]/20">
          <div className="mb-4 w-full flex justify-between items-center sticky top-0 bg-[#222831] py-2 z-30 border-b border-[#EEEEEE]/10">
            <div>
              <h2 className="text-xl font-semibold text-white">Pratinjau Kanvas</h2>
              <p className="text-sm text-[#EEEEEE]/60">
                {canvasDimensions
                  ? `Ukuran: ${canvasDimensions.width} × ${canvasDimensions.height} px`
                  : 'Unggah gambar latar untuk memulai'
                }
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving || !canvasDimensions || !templateName.trim()}
              className="px-8 py-3 bg-[#00ADB5] text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-[#00ADB5]/40 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:scale-100"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Template'}
            </button>
          </div>

          <div className="w-full h-full flex items-center justify-center p-4">
            {!canvasDimensions ? (
              <div className="text-center text-gray-500 p-10 border-2 border-dashed border-gray-600 rounded-lg bg-[#393E46]/20">
                <ImageIcon size={48} className="mx-auto mb-4" />
                <h3 className="font-semibold text-lg">Tidak Ada Gambar Latar</h3>
                <p>Silakan unggah gambar latar di panel kiri untuk memulai.</p>
              </div>
            ) : (
              <div className="relative">
                <DropCanvas
                  width={canvasDimensions.width}
                  height={canvasDimensions.height}
                  backgroundImage={backgroundImage}
                  onDrop={handleDrop}
                  onCanvasClick={handleCanvasClick}
                >
                  {components.map((component) => (
                    <DraggableComponent
                      key={component.id}
                      component={component}
                      onUpdate={updateComponent}
                      onSelect={setSelectedComponentId}
                      onDelete={deleteComponent}
                      isSelected={selectedComponentId === component.id}
                      canvasBounds={canvasDimensions}
                    />
                  ))}
                </DropCanvas>
              </div>
            )}
          </div>
        </div>
        {/* Modal Editing Teks */}
        {isEditing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#222831] p-6 rounded-lg w-96 space-y-4 border border-[#EEEEEE]/20">
              <h3 className="text-lg font-semibold text-white">Ubah Teks</h3>
              <textarea
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                className={inputStyle}
                rows={4}
                placeholder="Masukkan teks Anda..."
                autoFocus
              />
              <div className="flex space-x-3">
                <button
                  onClick={handleTextSave}
                  className="flex-1 bg-[#00ADB5] text-white py-2 px-4 rounded-md hover:bg-[#00ADB5]/80 transition-colors"
                >
                  Simpan
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditingText('');
                  }}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
}