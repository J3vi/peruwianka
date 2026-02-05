'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type Banner = {
  id: string;
  title: string | null;
  image_url: string;
  link_url: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
};

type Props = {
  initialBanners: Banner[];
};

export default function BannersClient({ initialBanners }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [banners, setBanners] = useState(initialBanners);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    link_url: '',
    order_index: 0,
    is_active: true,
  });

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get file extension from MIME type
  const getFileExtension = (mimeType: string): string | null => {
    const type = mimeType.toLowerCase();
    if (type === 'image/jpeg' || type === 'image/jpg') return 'jpg';
    if (type === 'image/png') return 'png';
    if (type === 'image/webp') return 'webp';
    return null;
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = getFileExtension(file.type);
    if (!ext) {
      setError('Formato no válido. Usa PNG, JPG o WEBP.');
      return;
    }

    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  };

  // Clear file selection
  const clearFileSelection = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openCreateModal = () => {
    setEditingBanner(null);
    setFormData({ title: '', image_url: '', link_url: '', order_index: 0, is_active: true });
    setSelectedFile(null);
    setImagePreview(null);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || '',
      image_url: banner.image_url,
      link_url: banner.link_url || '',
      order_index: banner.order_index,
      is_active: banner.is_active,
    });
    setSelectedFile(null);
    setImagePreview(null);
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBanner(null);
    setError(null);
    clearFileSelection();
  };

  // Upload file to Supabase Storage via API route (uses service role)
  const uploadBannerImage = async (bannerId: string, file: File): Promise<string> => {
    const ext = getFileExtension(file.type);
    if (!ext) {
      throw new Error('Formato de archivo no válido');
    }

    const formDataObj = new FormData();
    formDataObj.append('file', file);
    formDataObj.append('bannerId', bannerId);
    formDataObj.append('ext', ext);

    const response = await fetch('/api/admin/banners/upload', {
      method: 'POST',
      body: formDataObj,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Error al subir imagen');
    }

    return result.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate: need either file or image_url (if no file)
      const hasFile = selectedFile instanceof File && selectedFile.size > 0;
      const hasImageUrl = formData.image_url.trim().length > 0;

      if (!hasFile && !hasImageUrl) {
        setError('Sube una imagen o ingresa una URL manual');
        setLoading(false);
        return;
      }

      if (editingBanner) {
        // ===== EDITAR BANNER EXISTENTE =====
        let finalImageUrl = formData.image_url;

        // Si hay archivo nuevo, subirlo
        if (hasFile) {
          finalImageUrl = await uploadBannerImage(editingBanner.id, selectedFile);
        }

        // Update existing banner
        const { error: updateError } = await supabase
          .from('banners')
          .update({
            title: formData.title || null,
            image_url: finalImageUrl,
            link_url: formData.link_url || null,
            order_index: formData.order_index,
            is_active: formData.is_active,
          })
          .eq('id', editingBanner.id);

        if (updateError) {
          setError(`Error al actualizar: ${updateError.message}`);
          setLoading(false);
          return;
        }
      } else {
        // ===== CREAR NUEVO BANNER =====
        // Step 1: Create banner record first to get ID
        const { data: newBanner, error: insertError } = await supabase
          .from('banners')
          .insert({
            title: formData.title || null,
            image_url: '', // Will be set after upload
            link_url: formData.link_url || null,
            order_index: formData.order_index,
            is_active: formData.is_active,
          })
          .select('id')
          .single();

        if (insertError) {
          setError(`Error al crear: ${insertError.message}`);
          setLoading(false);
          return;
        }

        const bannerId = newBanner.id;

        // Step 2: Upload file if exists, otherwise use manual URL
        let finalImageUrl = formData.image_url;
        if (hasFile) {
          finalImageUrl = await uploadBannerImage(bannerId, selectedFile);
        }

        // Step 3: Update record with image URL
        const { error: updateError } = await supabase
          .from('banners')
          .update({ image_url: finalImageUrl })
          .eq('id', bannerId);

        if (updateError) {
          setError(`Error al actualizar imagen: ${updateError.message}`);
          setLoading(false);
          return;
        }
      }

      closeModal();
      router.refresh();
      
      // Refetch banners
      const { data: newBanners } = await supabase
        .from('banners')
        .select('id, title, image_url, link_url, order_index, is_active, created_at')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });
      
      setBanners(newBanners || []);
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    const newActive = !banner.is_active;
    
    const { error } = await supabase
      .from('banners')
      .update({ is_active: newActive })
      .eq('id', banner.id);

    if (error) {
      alert(`Error al cambiar estado: ${error.message}`);
      return;
    }

    router.refresh();
    
    // Update local state
    const { data: newBanners } = await supabase
      .from('banners')
      .select('id, title, image_url, link_url, order_index, is_active, created_at')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false });
    
    setBanners(newBanners || []);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este banner?')) {
      return;
    }

    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id);

    if (error) {
      alert(`Error al eliminar: ${error.message}`);
      return;
    }

    router.refresh();
    
    // Update local state
    const { data: newBanners } = await supabase
      .from('banners')
      .select('id, title, image_url, link_url, order_index, is_active, created_at')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false });
    
    setBanners(newBanners || []);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-4xl font-bold">Banners</h1>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-white hover:bg-gray-800"
        >
          + Nuevo banner
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Preview</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Título</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Orden</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Activo</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Link</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {banners.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No hay banners. Crea uno nuevo.
                </td>
              </tr>
            ) : (
              banners.map((banner) => (
                <tr key={banner.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="relative h-[60px] w-[160px] overflow-hidden rounded border border-gray-200">
                      <Image
                        src={banner.image_url}
                        alt={banner.title || 'Banner'}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {banner.title || <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{banner.order_index}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                        banner.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {banner.is_active ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {banner.link_url ? (
                      <a
                        href={banner.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {banner.link_url.length > 30
                          ? `${banner.link_url.substring(0, 30)}...`
                          : banner.link_url}
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(banner)}
                        className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-100"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleActive(banner)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                          banner.is_active
                            ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {banner.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id)}
                        className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">
              {editingBanner ? 'Editar banner' : 'Nuevo banner'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Título */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Título <span className="text-gray-400">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ej: Oferta de verano"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Imagen <span className="text-gray-400">(opcional si usas URL)</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleFileChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">Formatos: PNG, JPG, WEBP</p>
                
                {/* Image Preview */}
                {imagePreview && (
                  <div className="relative mt-2 h-32 w-full overflow-hidden rounded border border-gray-200">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={clearFileSelection}
                      className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white hover:bg-black/90"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Image URL (only show if no file selected) */}
              {!selectedFile && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    URL de imagen <span className="text-red-500">*</span> (si no subes archivo)
                  </label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="/banners/1.png o https://..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {formData.image_url && (
                    <div className="mt-2 h-16 w-32 overflow-hidden rounded border border-gray-200">
                      <Image
                        src={formData.image_url}
                        alt="Preview"
                        width={160}
                        height={60}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Link URL */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Link <span className="text-gray-400">(opcional)</span>
                </label>
                <input
                  type="url"
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Order Index */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Orden</label>
                <input
                  type="number"
                  value={formData.order_index}
                  onChange={(e) =>
                    setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Is Active */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Activo</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

