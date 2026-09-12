import React, { useState, useEffect, useMemo } from 'react';
import {
  Product,
  Store,
  CategoryItem,
  CategoryType,
  DepartmentCategory,
  TagGroup,
  ProductTagSelection,
  NomenclatorItem,
} from '../../types';
import {
  PRESET_PRODUCT_IMAGES,
  INITIAL_DEPARTMENT_CATALOG,
  INITIAL_TAGS_CATALOG,
  INITIAL_PRODUCT_TYPES_CATALOG,
} from '../../data/initialData';
import { formatCurrency, calculateCUP } from '../../lib/utils';
import { ThemeImage } from '../common/ThemeImage';
import { ImageGalleryUploader } from '../common/ImageGalleryUploader';
import { SearchableSelect } from '../common/SearchableSelect';
import { NomenclatorIcon } from '../common/NomenclatorIcon';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Search,
  Sparkles,
  Image as ImageIcon,
  Store as StoreIcon,
  Tag,
  Loader2,
  Check,
  Upload,
  FolderTree,
  ChevronLeft,
  ChevronRight,
  Package,
  Truck,
  Briefcase,
} from 'lucide-react';

interface ProductManagerProps {
  products: Product[];
  stores: Store[];
  categories: CategoryItem[];
  departmentsCatalog?: DepartmentCategory[];
  tagsCatalog?: TagGroup[];
  productTypesCatalog?: NomenclatorItem[];
  paymentMethodsCatalog?: NomenclatorItem[];
  deliveryMethodsCatalog?: NomenclatorItem[];
  onAddProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'info' | 'error') => void;
}

const ITEMS_PER_PAGE = 10;

export const ProductManager: React.FC<ProductManagerProps> = ({
  products,
  stores,
  categories,
  departmentsCatalog,
  tagsCatalog,
  productTypesCatalog,
  paymentMethodsCatalog,
  deliveryMethodsCatalog,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onShowToast,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showPresets, setShowPresets] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Form State
  const [storeId, setStoreId] = useState(stores[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceUSD, setPriceUSD] = useState<number>(45);
  const [category, setCategory] = useState<CategoryType>('Alimentos y Combos');
  const [subcategory, setSubcategory] = useState<string>('Carnes y Embutidos');
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isService, setIsService] = useState(false);
  const [productTypeId, setProductTypeId] = useState<string>('pt-producto');
  const [selectedTagSelections, setSelectedTagSelections] = useState<ProductTagSelection[]>([]);
  const [selectedSupertagComboId, setSelectedSupertagComboId] = useState<string>('');

  const catalogToUse =
    departmentsCatalog && departmentsCatalog.length > 0
      ? departmentsCatalog
      : INITIAL_DEPARTMENT_CATALOG;
  const effectiveTagsCatalog =
    tagsCatalog && tagsCatalog.length > 0 ? tagsCatalog : INITIAL_TAGS_CATALOG;
  const effectiveProductTypesCatalog =
    productTypesCatalog && productTypesCatalog.length > 0
      ? productTypesCatalog
      : INITIAL_PRODUCT_TYPES_CATALOG;
  const currentDept =
    catalogToUse.find((d) => d.name === category || d.id === category) || catalogToUse[0];
  const availableSubcats = currentDept?.subcategories || [];

  const selectedStore = stores.find((s) => s.id === storeId) || stores[0];
  const storeRate = selectedStore?.usdToCupRate || 330;
  const cupEquivalent = calculateCUP(priceUSD || 0, storeRate);

  // Reset page when filtering
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const openNewModal = () => {
    setEditingProduct(null);
    setStoreId(stores[0]?.id || '');
    setTitle('');
    setDescription('');
    setPriceUSD(45);
    const initialCategory = (catalogToUse[0]?.name || 'Alimentos y Combos') as CategoryType;
    setCategory(initialCategory);
    setSubcategory(catalogToUse[0]?.subcategories[0]?.name || '');
    const defaultImg = PRESET_PRODUCT_IMAGES[0].url;
    setImageUrl(defaultImg);
    setImages([defaultImg]);
    setNewImageUrl('');
    setIsAvailable(true);
    setIsService(false);
    setProductTypeId('pt-producto');
    setSelectedTagSelections([]);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setStoreId(product.storeId);
    setTitle(product.title);
    setDescription(product.description);
    setPriceUSD(product.priceUSD);
    setCategory(product.category);
    setSubcategory(product.subcategory || '');
    const mainImg = product.imageUrl || 'local:product';
    const initialGallery = product.images && product.images.length > 0 ? product.images : [mainImg];
    setImageUrl(mainImg);
    setImages(initialGallery);
    setNewImageUrl('');
    setIsAvailable(product.isAvailable ?? true);
    setIsService(product.isService || false);
    const matchedPt =
      effectiveProductTypesCatalog.find(
        (pt) => pt.id === product.productTypeId || pt.name === product.productType
      ) ||
      (product.isService
        ? effectiveProductTypesCatalog.find((pt) => pt.id === 'pt-servicio')
        : effectiveProductTypesCatalog[0]);
    setProductTypeId(matchedPt?.id || 'pt-producto');
    setSelectedTagSelections(product.tagSelections || []);
    setIsModalOpen(true);
  };

  const handleUploadProductImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      onShowToast('Imagen muy grande', 'El tamaño máximo permitido es 3MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setImages((prev) => [...prev, result]);
        if (!imageUrl || imageUrl === 'local:product') {
          setImageUrl(result);
        }
        onShowToast('Imagen Agregada', 'Se añadió la foto a la galería de la publicación');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;
    setImages((prev) => [...prev, newImageUrl.trim()]);
    if (!imageUrl || imageUrl === 'local:product') {
      setImageUrl(newImageUrl.trim());
    }
    setNewImageUrl('');
    onShowToast('Imagen Agregada', 'Se añadió la URL a la galería de fotos');
  };

  const handleRemoveImage = (imgToRemove: string) => {
    const updated = images.filter((i) => i !== imgToRemove);
    setImages(updated);
    if (imageUrl === imgToRemove) {
      setImageUrl(updated[0] || 'local:product');
    }
  };

  const handleSetMainImage = (mainImg: string) => {
    setImageUrl(mainImg);
    onShowToast('Imagen Principal', 'Se definió la portada principal de la oferta');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !storeId) {
      onShowToast('Datos incompletos', 'Asigna una tienda y título del producto', 'error');
      return;
    }

    const tagSelections: ProductTagSelection[] = selectedTagSelections.map((ts) => {
      const gName = ts.groupName || ts.group || '';
      const tName = ts.tagName || ts.value || '';
      return {
        group: gName,
        value: tName,
        groupId: ts.groupId || gName,
        groupName: gName,
        tagId: ts.tagId || tName,
        tagName: tName,
      };
    });

    const twoTierTagNames = selectedTagSelections
      .map((ts) => (ts.tagName || ts.value || '').toLowerCase())
      .filter(Boolean);

    const tags = Array.from(new Set(twoTierTagNames));
    const finalMainImage = imageUrl || images[0] || 'local:product';
    const finalGallery = images.length > 0 ? images : [finalMainImage];

    const chosenPt =
      effectiveProductTypesCatalog.find((pt) => pt.id === productTypeId) ||
      effectiveProductTypesCatalog[0];
    const finalIsService =
      isService ||
      chosenPt?.id === 'pt-servicio' ||
      (chosenPt?.name || '').toLowerCase().includes('servicio');
    const finalProductTypeId = chosenPt?.id || productTypeId;
    const finalProductTypeName = chosenPt?.name;

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        storeId,
        title,
        description,
        priceUSD: Number(priceUSD) || 0,
        category,
        subcategory: subcategory.trim() || undefined,
        imageUrl: finalMainImage,
        images: finalGallery,
        isAvailable,
        isService: finalIsService,
        productTypeId: finalProductTypeId,
        productType: finalProductTypeName,
        tags,
        tagSelections,
      });
      onShowToast('Publicación actualizada', `Se guardaron los cambios de "${title}"`);
    } else {
      onAddProduct({
        storeId,
        title,
        description,
        priceUSD: Number(priceUSD) || 0,
        category,
        subcategory: subcategory.trim() || undefined,
        imageUrl: finalMainImage,
        images: finalGallery,
        isAvailable,
        isService: finalIsService,
        productTypeId: finalProductTypeId,
        productType: finalProductTypeName,
        featured: true,
        tags,
        tagSelections,
      });
      onShowToast('¡Publicación creada!', `"${title}" está disponible en el catálogo`);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (product: Product) => {
    if (window.confirm(`¿Seguro de eliminar la publicación "${product.title}"?`)) {
      onDeleteProduct(product.id);
      onShowToast('Eliminado', `"${product.title}" fue borrado del catálogo`);
    }
  };

  // AI Assistant using Gemini API endpoint
  const handleEnhanceWithAI = async () => {
    if (!title.trim() && !description.trim()) {
      onShowToast('Escribe un título', 'Escribe primero algo sobre tu producto para que la IA lo mejore', 'info');
      return;
    }

    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/enhance-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          priceUSD,
          storeName: selectedStore?.name || 'Tienda Cuba',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTitle(data.enhancedTitle || title);
        setDescription(data.enhancedDescription || description);
        onShowToast(
          '✨ Optimizado con IA',
          data.note || 'Título y descripción mejorados para venta en Cuba'
        );
      } else {
        onShowToast('No se pudo generar', data.error || 'Revisa tu conexión', 'error');
      }
    } catch (error) {
      onShowToast('Error IA', 'Hubo un problema comunicando con Gemini IA', 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      const storeName = stores.find((s) => s.id === p.storeId)?.name.toLowerCase() || '';
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
        storeName.includes(q)
      );
    });
  }, [products, stores, searchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const currentProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const startItem = filteredProducts.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length);

  return (
    <div className="space-y-6">
      {/* Top action bar - EXACT SAME DESIGN AS STORE MANAGER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900">
            Catálogo de Productos y Servicios
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Gestiona ofertas, tiendas asignadas, precios y disponibilidad con edición en línea.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo</span>
        </button>
      </div>

      {/* Search / Filter Bar - EXACT SAME DESIGN AS STORE MANAGER */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, tienda, departamento, subdepartamento o descripción..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-emerald-500 outline-none"
          />
        </div>
        <span className="text-xs text-gray-500 font-semibold shrink-0">
          Mostrando {filteredProducts.length} de {products.length} ofertas
        </span>
      </div>

      {/* Products list table - EXACT SAME DESIGN & INLINE EDITING AS STORE MANAGER */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-600">
                <th className="py-3.5 px-4">Producto</th>
                <th className="py-3.5 px-4">Clasificación</th>
                <th className="py-3.5 px-4">Precio</th>
                <th className="py-3.5 px-4">Activo en Marketplace</th>
                <th className="py-3.5 px-4">Tipo</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {currentProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500 text-sm italic">
                    No se encontraron productos o servicios que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                currentProducts.map((p) => {
                  const productStore = stores.find((s) => s.id === p.storeId);
                  const currentDeptObj =
                    catalogToUse.find((d) => d.name === p.category || d.id === p.category) ||
                    catalogToUse[0];
                  const deptSubcats = currentDeptObj?.subcategories || [];

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Tienda & Título del Producto - Inline Combo & Input */}
                      <td className="py-3 px-4 min-w-[240px]">
                        <div className="flex items-center gap-3">
                          <ThemeImage
                            src={p.imageUrl}
                            alt={p.title}
                            fallbackType="product"
                            className="w-10 h-10 rounded-xl object-cover border border-gray-200 shrink-0 bg-white"
                          />
                          <div className="flex-1 space-y-1">
                            {/* Combo de Tienda */}
                            <div className="flex items-center gap-1">
                              <StoreIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <select
                                value={p.storeId}
                                onChange={(e) =>
                                  onUpdateProduct({ ...p, storeId: e.target.value })
                                }
                                className="w-full px-1.5 py-0.5 rounded-md border border-slate-200 bg-slate-50 text-xs font-extrabold text-indigo-900 focus:border-indigo-500 outline-none cursor-pointer"
                              >
                                {stores.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Título editable */}
                            <input
                              type="text"
                              value={p.title}
                              onChange={(e) =>
                                onUpdateProduct({ ...p, title: e.target.value })
                              }
                              className="font-bold text-gray-900 bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-emerald-500 rounded-md px-2 py-0.5 border border-transparent focus:border-emerald-400 text-sm outline-none w-full transition-all"
                              title="Toca para editar el título del producto"
                            />
                          </div>
                        </div>
                      </td>

                      {/* Clasificación (Departamento & Subdepartamento Combos) */}
                      <td className="py-3 px-4 min-w-[200px]">
                        <div className="space-y-1">
                          {/* Combo 1er Escalón: Departamento */}
                          <div className="flex items-center gap-1">
                            <FolderTree className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <select
                              value={p.category}
                              onChange={(e) => {
                                const newCat = e.target.value as CategoryType;
                                const dObj = catalogToUse.find((d) => d.name === newCat || d.id === newCat);
                                const firstSub = dObj?.subcategories[0]?.name || '';
                                onUpdateProduct({ ...p, category: newCat, subcategory: firstSub });
                              }}
                              className="w-full px-2 py-1 rounded-lg border border-slate-300 bg-white text-xs font-bold text-indigo-900 focus:border-indigo-500 outline-none cursor-pointer"
                            >
                              {(catalogToUse.length > 0
                                ? catalogToUse.map((d) => ({ id: d.name, name: d.name }))
                                : categories
                              ).map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Combo 2do Escalón: Subdepartamento */}
                          <div className="pl-4 flex items-center gap-1">
                            <Tag className="w-3 h-3 text-emerald-600 shrink-0" />
                            {deptSubcats.length > 0 ? (
                              <select
                                value={p.subcategory || ''}
                                onChange={(e) =>
                                  onUpdateProduct({ ...p, subcategory: e.target.value })
                                }
                                className="w-full px-2 py-0.5 rounded-lg border border-slate-200 bg-emerald-50 text-[11px] font-semibold text-emerald-900 focus:border-emerald-500 outline-none cursor-pointer"
                              >
                                <option value="">-- Sin Subdepartamento --</option>
                                {deptSubcats.map((sub) => (
                                  <option key={sub.id} value={sub.name}>
                                    {sub.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={p.subcategory || ''}
                                onChange={(e) =>
                                  onUpdateProduct({ ...p, subcategory: e.target.value })
                                }
                                placeholder="Subdepartamento..."
                                className="w-full px-2 py-0.5 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-gray-800 outline-none"
                              />
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Precio (USD $) - Inline Numeric Input */}
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200">
                          <span className="text-xs font-bold text-gray-700">$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={p.priceUSD || 0}
                            onChange={(e) =>
                              onUpdateProduct({
                                ...p,
                                priceUSD: Number(e.target.value) || 0,
                              })
                            }
                            className="w-16 px-1.5 py-0.5 rounded-lg border border-gray-300 bg-white text-center font-black text-xs text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                            title="Toca para cambiar precio USD"
                          />
                          <span className="text-[11px] font-bold text-gray-500">USD</span>
                        </div>
                      </td>

                      {/* Activo en Marketplace - Toggle Switch Interruptor */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              checked={!!p.isAvailable}
                              onChange={() =>
                                onUpdateProduct({
                                  ...p,
                                  isAvailable: !p.isAvailable,
                                })
                              }
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                          </label>
                          <span
                            className={`text-xs font-bold ${
                              p.isAvailable ? 'text-emerald-800' : 'text-slate-400'
                            }`}
                          >
                            {p.isAvailable ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </td>

                      {/* Tipo Oferta (Producto / Servicio / Nomenclador Dinámico) */}
                      <td className="py-3 px-4">
                        {(() => {
                          const matchedType = effectiveProductTypesCatalog.find(
                            (pt) => pt.id === p.productTypeId || pt.name === p.productType
                          ) || (p.isService ? effectiveProductTypesCatalog.find((pt) => pt.id === 'pt-servicio') : effectiveProductTypesCatalog[0]);

                          return (
                            <div className="flex items-center gap-2">
                              <label className="relative inline-flex items-center cursor-pointer shrink-0" title="Alternar entre Producto y Servicio">
                                <input
                                  type="checkbox"
                                  checked={!!p.isService}
                                  onChange={() => {
                                    const nextIsService = !p.isService;
                                    const targetPt = nextIsService
                                      ? effectiveProductTypesCatalog.find((pt) => pt.id === 'pt-servicio') || effectiveProductTypesCatalog[1]
                                      : effectiveProductTypesCatalog.find((pt) => pt.id === 'pt-producto') || effectiveProductTypesCatalog[0];
                                    onUpdateProduct({
                                      ...p,
                                      isService: nextIsService,
                                      productTypeId: targetPt?.id,
                                      productType: targetPt?.name,
                                    });
                                  }}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                              </label>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold border ${
                                  p.isService
                                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                                    : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                }`}
                              >
                                <NomenclatorIcon
                                  name={matchedType?.iconName || (p.isService ? 'Briefcase' : 'ShoppingBag')}
                                  className="w-3.5 h-3.5"
                                />
                                <span>{matchedType?.name || (p.isService ? 'Servicio' : 'Producto')}</span>
                              </span>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 transition-colors cursor-pointer"
                            title="Editar en modal completo"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-rose-50 text-gray-600 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Eliminar publicación"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer - EXACT SAME DESIGN AS STORE MANAGER */}
        {filteredProducts.length > 0 && (
          <div className="bg-gray-50/80 px-4 py-3.5 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-gray-600">
            <div>
              Mostrando <span className="font-bold text-gray-900">{startItem}</span> - <span className="font-bold text-gray-900">{endItem}</span> de <span className="font-bold text-gray-900">{filteredProducts.length}</span> ofertas (Página <span className="font-bold text-emerald-700">{currentPage}</span> de {totalPages})
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((pg) => Math.max(1, pg - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg font-bold transition-all cursor-pointer ${
                    currentPage === page
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((pg) => Math.min(totalPages, pg + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-gray-100 p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black text-gray-900">
                {editingProduct ? 'Editar Publicación' : 'Nueva Publicación para MercadoCuba'}
              </h3>
            </div>

            {/* AI Optimizer Banner Button */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-emerald-900 text-xs sm:text-sm">
                    Asistente Inteligente Gemini IA
                  </h5>
                  <p className="text-xs text-emerald-700">
                    Mejora tu título, redacta una descripción comercial persuasiva y añade palabras clave para el buscador
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleEnhanceWithAI}
                disabled={isAiLoading}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                {isAiLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Optimizando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Mejorar con IA</span>
                  </>
                )}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Store Selector (Shows Exchange Rate!) */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Tienda o Proveedor del Producto
                </label>
                <SearchableSelect
                  options={stores.map((s) => ({
                    value: s.id,
                    label: s.name,
                    sublabel: `Tasa: 1 USD = ${s.usdToCupRate} CUP`,
                  }))}
                  value={storeId}
                  onChange={(val) => setStoreId(val || '')}
                  searchPlaceholder="Buscar tienda..."
                />
                <p className="text-[11px] text-emerald-700 mt-1">
                  * El producto usará la tasa de cambio de la tienda seleccionada para calcular su precio en CUP.
                </p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Título del Producto / Servicio
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Combo Familiar de Cárnicos #1..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-emerald-500 outline-none"
                  required
                />
              </div>

              {/* 2-TIER CLASSIFICATION */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold uppercase text-indigo-900 mb-1 flex items-center gap-1.5">
                    <FolderTree className="w-3.5 h-3.5 text-indigo-600" />
                    <span>1er Escalón: Departamento</span>
                  </label>
                  <SearchableSelect
                    options={(catalogToUse.length > 0
                      ? catalogToUse.map((d) => ({ value: d.name, label: d.name }))
                      : categories.map((c) => ({ value: c.id, label: c.name }))
                    )}
                    value={category}
                    onChange={(val) => {
                      const newCat = (val || '') as CategoryType;
                      setCategory(newCat);
                      const dept = catalogToUse.find((d) => d.name === newCat || d.id === newCat);
                      setSubcategory(dept?.subcategories[0]?.name || '');
                    }}
                    searchPlaceholder="Buscar departamento..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-emerald-900 mb-1 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>2do Escalón: Subdepartamento</span>
                  </label>
                  {availableSubcats.length > 0 ? (
                    <SearchableSelect
                      options={availableSubcats.map((s) => ({
                        value: s.name,
                        label: s.name,
                      }))}
                      value={subcategory}
                      onChange={(val) => setSubcategory(val || '')}
                      searchPlaceholder="Buscar subdepartamento..."
                    />
                  ) : (
                    <input
                      type="text"
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                      placeholder="Ej. Plomería, Herramientas, Carnes..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:border-emerald-500 outline-none"
                    />
                  )}
                </div>
              </div>

              {/* Price USD & Real-time CUP equivalent preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                    Precio Base (USD $)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={priceUSD}
                    onChange={(e) => setPriceUSD(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-base font-extrabold text-gray-900 focus:border-emerald-500 outline-none"
                    required
                  />
                  <span className="text-[10px] text-gray-400">
                    Ingresa el precio en dólares
                  </span>
                </div>

                <div className="flex flex-col justify-center">
                  <span className="text-xs font-bold uppercase text-emerald-800">
                    Equivalente en Pesos Cubanos:
                  </span>
                  <div className="text-2xl font-black text-emerald-700 mt-0.5">
                    {formatCurrency(cupEquivalent, 'CUP')}
                  </div>
                  <span className="text-[10px] text-gray-500">
                    Calculado con la tasa {storeRate} CUP/$ de la tienda
                  </span>
                </div>
              </div>

              {/* Image Gallery Uploader */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <ImageGalleryUploader
                  images={images}
                  mainImage={imageUrl}
                  onImagesChange={(newImgs, newMain) => {
                    setImages(newImgs);
                    setImageUrl(newMain);
                  }}
                  label="Galería de Fotos del Producto / Servicio"
                  description="Sube una o varias imágenes locales. La primera o la seleccionada como principal se mostrará en la tarjeta."
                  fallbackType="product"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Descripción Detallada
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Detalla lo que incluye, peso, marca, garantía..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-emerald-500 outline-none"
                  required
                />
              </div>

              {/* Multi-Tag Selection (Combo Superetiquetas -> Checkboxes Etiquetas -> List of Selected Tags) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    <span>Etiquetado de Producto (Superetiquetas y Etiquetas)</span>
                  </label>
                  {selectedTagSelections.length > 0 && (
                    <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      {selectedTagSelections.length} seleccionadas
                    </span>
                  )}
                </div>

                {/* 1. Combo con Superetiquetas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-slate-600 mb-1">
                      1. Selecciona Superetiqueta
                    </label>
                    <SearchableSelect
                      options={effectiveTagsCatalog.map((group) => ({
                        value: group.id,
                        label: group.name,
                        sublabel: `${group.tags.length} etiquetas`,
                      }))}
                      value={selectedSupertagComboId || effectiveTagsCatalog[0]?.id || ''}
                      onChange={(val) => setSelectedSupertagComboId(val || '')}
                      searchPlaceholder="Buscar superetiqueta..."
                    />
                  </div>

                  {/* 2. Lista de Etiquetas con Checkboxes */}
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-slate-600 mb-1">
                      2. Selecciona Etiquetas (Checkboxes)
                    </label>
                    {(() => {
                      const activeGroup =
                        effectiveTagsCatalog.find((g) => g.id === selectedSupertagComboId) ||
                        effectiveTagsCatalog[0];

                      if (!activeGroup || activeGroup.tags.length === 0) {
                        return (
                          <div className="p-2 text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                            No hay etiquetas en esta superetiqueta
                          </div>
                        );
                      }

                      return (
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 max-h-36 overflow-y-auto space-y-1.5">
                          {activeGroup.tags.map((tagItem) => {
                            const isChecked = selectedTagSelections.some(
                              (ts) =>
                                (ts.groupName === activeGroup.name ||
                                  ts.group === activeGroup.name ||
                                  ts.groupId === activeGroup.id) &&
                                (ts.tagName === tagItem.name ||
                                  ts.value === tagItem.name ||
                                  ts.tagId === tagItem.id)
                            );

                            return (
                              <label
                                key={tagItem.id}
                                className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-50 cursor-pointer text-xs font-semibold text-slate-700"
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedTagSelections((prev) => [
                                        ...prev,
                                        {
                                          group: activeGroup.name,
                                          groupName: activeGroup.name,
                                          groupId: activeGroup.id,
                                          value: tagItem.name,
                                          tagName: tagItem.name,
                                          tagId: tagItem.id,
                                        },
                                      ]);
                                    } else {
                                      setSelectedTagSelections((prev) =>
                                        prev.filter(
                                          (ts) =>
                                            !(
                                              (ts.groupName === activeGroup.name ||
                                                ts.group === activeGroup.name ||
                                                ts.groupId === activeGroup.id) &&
                                              (ts.tagName === tagItem.name ||
                                                ts.value === tagItem.name ||
                                                ts.tagId === tagItem.id)
                                            )
                                        )
                                      );
                                    }
                                  }}
                                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                                <span>{tagItem.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* 3. Listado de etiquetas seleccionadas por cada producto */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="block text-[11px] font-extrabold uppercase text-slate-600 mb-2">
                    Etiquetas Seleccionadas para esta Oferta:
                  </label>
                  {selectedTagSelections.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No se han seleccionado etiquetas aún.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTagSelections.map((ts, idx) => {
                        const gName = ts.groupName || ts.group || 'Etiqueta';
                        const vName = ts.tagName || ts.value || '';
                        return (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-xs"
                          >
                            <span className="opacity-75">{gName}:</span>
                            <span>{vName}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedTagSelections((prev) => prev.filter((_, i) => i !== idx))
                              }
                              className="p-0.5 rounded-full hover:bg-white/20 text-white cursor-pointer ml-0.5"
                              title="Quitar etiqueta"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Nomenclador de Tipo de Oferta & Opciones de Disponibilidad */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                    Tipo de Oferta (Nomenclador de Negocio)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {effectiveProductTypesCatalog.map((pt) => {
                      const isSelected = productTypeId === pt.id;
                      return (
                        <button
                          key={pt.id}
                          type="button"
                          onClick={() => {
                            setProductTypeId(pt.id);
                            setIsService(
                              pt.id === 'pt-servicio' ||
                              (pt.name || '').toLowerCase().includes('servicio')
                            );
                          }}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-300'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div
                            className={`p-1.5 rounded-lg shrink-0 ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <NomenclatorIcon name={pt.iconName} className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-black truncate">{pt.name}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-900">
                      <input
                        type="checkbox"
                        checked={isAvailable}
                        onChange={(e) => setIsAvailable(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      <span>Activo en el marketplace</span>
                    </label>
                    <p className="text-[11px] text-slate-500 mt-1 pl-6">
                      *(Si está desactivado o si la tienda proveedora está inactiva, la oferta no se mostrará en el mercado)*
                    </p>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-800 shrink-0">
                    <input
                      type="checkbox"
                      checked={isService}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsService(checked);
                        if (checked) {
                          setProductTypeId('pt-servicio');
                        } else if (productTypeId === 'pt-servicio') {
                          setProductTypeId('pt-producto');
                        }
                      }}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Es un Servicio Profesional</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md cursor-pointer"
                >
                  {editingProduct ? 'Guardar Cambios' : 'Publicar en MercadoCuba'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
