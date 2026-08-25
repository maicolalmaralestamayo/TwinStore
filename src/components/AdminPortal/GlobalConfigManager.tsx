import React, { useState } from 'react';
import {
  MarketplaceConfig,
  GeoProvince,
  GeoMunicipality,
  GeoReparto,
  DepartmentCategory,
  SubcategoryItem,
  TagGroup,
  TagItem,
} from '../../types';
import { INITIAL_GEO_CATALOG, INITIAL_DEPARTMENT_CATALOG, INITIAL_TAGS_CATALOG } from '../../data/initialData';
import { ThemeImage } from '../common/ThemeImage';
import { ImageGalleryUploader } from '../common/ImageGalleryUploader';
import {
  Globe,
  Image as ImageIcon,
  Upload,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  RefreshCw,
  Palette,
  AlertCircle,
  Share2,
  MessageCircle,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Send,
  Sparkles,
  Layers,
  FolderTree,
  Tag,
  ShoppingBag,
  Wrench,
  Tv,
  Shirt,
  Zap,
  Smartphone,
  Briefcase,
} from 'lucide-react';

interface GlobalConfigManagerProps {
  config: MarketplaceConfig;
  onUpdateConfig: (newConfig: MarketplaceConfig) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'info' | 'error') => void;
}

export const GlobalConfigManager: React.FC<GlobalConfigManagerProps> = ({
  config,
  onUpdateConfig,
  onShowToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'identity' | 'geography' | 'taxonomy' | 'tags'>('identity');

  // Taxonomy catalog state (2 escalones: Departamentos -> Subcategorías)
  const [departmentsCatalog, setDepartmentsCatalog] = useState<DepartmentCategory[]>(
    config.departmentsCatalog && config.departmentsCatalog.length > 0
      ? config.departmentsCatalog
      : INITIAL_DEPARTMENT_CATALOG
  );

  const [selectedDeptId, setSelectedDeptId] = useState<string>(
    config.departmentsCatalog?.[0]?.id || INITIAL_DEPARTMENT_CATALOG[0]?.id || ''
  );

  // New item input states for Taxonomy
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');
  const [newSubcatName, setNewSubcatName] = useState('');

  // Editing item states for Taxonomy
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [editingDeptNameText, setEditingDeptNameText] = useState('');
  const [editingDeptDescText, setEditingDeptDescText] = useState('');

  const [editingSubcatId, setEditingSubcatId] = useState<string | null>(null);
  const [editingSubcatText, setEditingSubcatText] = useState('');

  const selectedDept =
    departmentsCatalog.find((d) => d.id === selectedDeptId) || departmentsCatalog[0];

  // --- 2-LEVEL TAGS CATALOG STATE (GRUPOS -> ETIQUETAS) ---
  const [tagsCatalog, setTagsCatalog] = useState<TagGroup[]>(
    config.tagsCatalog && config.tagsCatalog.length > 0
      ? config.tagsCatalog
      : INITIAL_TAGS_CATALOG
  );

  const [selectedTagGroupId, setSelectedTagGroupId] = useState<string>(
    config.tagsCatalog?.[0]?.id || INITIAL_TAGS_CATALOG[0]?.id || ''
  );

  const [newTagGroupName, setNewTagGroupName] = useState('');
  const [newTagGroupDesc, setNewTagGroupDesc] = useState('');
  const [newTagItemName, setNewTagItemName] = useState('');

  const [editingTagGroupId, setEditingTagGroupId] = useState<string | null>(null);
  const [editingTagGroupNameText, setEditingTagGroupNameText] = useState('');
  const [editingTagGroupDescText, setEditingTagGroupDescText] = useState('');

  const [editingTagItemId, setEditingTagItemId] = useState<string | null>(null);
  const [editingTagItemText, setEditingTagItemText] = useState('');

  const selectedTagGroup =
    tagsCatalog.find((g) => g.id === selectedTagGroupId) || tagsCatalog[0];

  // Local editable identity state
  const [name, setName] = useState(config.name || 'MercadoCuba');
  const [slogan, setSlogan] = useState(config.slogan || '');
  const [bannerTitle, setBannerTitle] = useState(
    config.bannerTitle || 'Compra directo a tiendas por WhatsApp'
  );
  const [bannerSubtitle, setBannerSubtitle] = useState(
    config.bannerSubtitle ||
      'Sin pasarelas de pago ni intermediarios. Explora productos y servicios de múltiples proveedores, compara precios con la tasa de cambio USD/CUP de cada tienda y coordina tu compra con un solo clic.'
  );
  const [logoUrl, setLogoUrl] = useState(config.logoUrl || '');
  const [bannerUrl, setBannerUrl] = useState(
    config.bannerUrl ||
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80'
  );
  const [defaultStoreLogoUrl, setDefaultStoreLogoUrl] = useState(
    config.defaultStoreLogoUrl ||
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80'
  );
  const [defaultProductImageUrl, setDefaultProductImageUrl] = useState(
    config.defaultProductImageUrl ||
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'
  );
  const [primaryColor, setPrimaryColor] = useState(config.primaryColor || '#4f46e5');
  const [secondaryColor, setSecondaryColor] = useState(config.secondaryColor || '#0284c7');
  const [accentColor, setAccentColor] = useState(config.accentColor || '#10b981');

  // Optional social links
  const [whatsapp, setWhatsapp] = useState(config.socialLinks?.whatsapp || '');
  const [telegram, setTelegram] = useState(config.socialLinks?.telegram || '');
  const [instagram, setInstagram] = useState(config.socialLinks?.instagram || '');
  const [facebook, setFacebook] = useState(config.socialLinks?.facebook || '');
  const [twitter, setTwitter] = useState(config.socialLinks?.twitter || '');
  const [linkedin, setLinkedin] = useState(config.socialLinks?.linkedin || '');

  // Geo catalog state
  const [geoCatalog, setGeoCatalog] = useState<GeoProvince[]>(
    config.geoCatalog && config.geoCatalog.length > 0 ? config.geoCatalog : INITIAL_GEO_CATALOG
  );

  const [selectedProvId, setSelectedProvId] = useState<string>(
    config.geoCatalog?.[0]?.id || INITIAL_GEO_CATALOG[0]?.id || ''
  );
  const [selectedMunId, setSelectedMunId] = useState<string>(
    config.geoCatalog?.[0]?.municipalities?.[0]?.id ||
      INITIAL_GEO_CATALOG[0]?.municipalities?.[0]?.id ||
      ''
  );

  // New item input states
  const [newProvName, setNewProvName] = useState('');
  const [newMunName, setNewMunName] = useState('');
  const [newRepName, setNewRepName] = useState('');

  // Edit item states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  const selectedProvince = geoCatalog.find((p) => p.id === selectedProvId) || geoCatalog[0];
  const selectedMunicipality =
    selectedProvince?.municipalities.find((m) => m.id === selectedMunId) ||
    selectedProvince?.municipalities[0];

  // Save Identity and Theme settings
  const handleSaveIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: MarketplaceConfig = {
      ...config,
      name: name.trim() || 'MercadoCuba',
      slogan: slogan.trim(),
      bannerTitle: bannerTitle.trim(),
      bannerSubtitle: bannerSubtitle.trim(),
      logoUrl: logoUrl.trim() || 'local:logo',
      bannerUrl: bannerUrl.trim() || 'local:banner',
      defaultStoreLogoUrl: defaultStoreLogoUrl.trim() || 'local:store',
      defaultProductImageUrl: defaultProductImageUrl.trim() || 'local:product',
      primaryColor,
      secondaryColor,
      accentColor,
      socialLinks: {
        whatsapp: whatsapp.trim(),
        telegram: telegram.trim(),
        instagram: instagram.trim(),
        facebook: facebook.trim(),
        twitter: twitter.trim(),
        linkedin: linkedin.trim(),
      },
      geoCatalog,
    };
    onUpdateConfig(updated);
    onShowToast(
      'Configuración Global Guardada',
      'Se actualizó la identidad del marketplace, colores, imágenes y redes sociales'
    );
  };

  // Helper for uploading local images (converts to base64 data URL)
  const handleUploadImageFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void,
    label: string
  ) => {
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
        setter(result);
        onShowToast('Imagen Cargada', `Se estableció el archivo local para ${label}`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Sync geoCatalog to config
  const saveGeoCatalog = (updatedCatalog: GeoProvince[]) => {
    setGeoCatalog(updatedCatalog);
    onUpdateConfig({
      ...config,
      name,
      slogan,
      bannerTitle,
      bannerSubtitle,
      logoUrl,
      bannerUrl,
      defaultStoreLogoUrl,
      defaultProductImageUrl,
      primaryColor,
      secondaryColor,
      accentColor,
      socialLinks: {
        whatsapp,
        telegram,
        instagram,
        facebook,
        twitter,
        linkedin,
      },
      geoCatalog: updatedCatalog,
    });
  };

  // --- PROVINCE ACTIONS ---
  const handleAddProvince = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProvName.trim()) return;
    const newProv: GeoProvince = {
      id: `prov-${Date.now()}`,
      name: newProvName.trim(),
      municipalities: [],
    };
    const updated = [...geoCatalog, newProv];
    saveGeoCatalog(updated);
    setSelectedProvId(newProv.id);
    setNewProvName('');
    onShowToast('Provincia creada', `Se añadió la provincia "${newProv.name}" al catálogo`);
  };

  const handleDeleteProvince = (id: string, name: string) => {
    if (geoCatalog.length <= 1) {
      onShowToast('No se puede eliminar', 'Debe existir al menos una provincia', 'error');
      return;
    }
    const updated = geoCatalog.filter((p) => p.id !== id);
    saveGeoCatalog(updated);
    if (selectedProvId === id) {
      setSelectedProvId(updated[0]?.id || '');
    }
    onShowToast('Provincia eliminada', `Se eliminó "${name}"`);
  };

  // --- MUNICIPALITY ACTIONS ---
  const handleAddMunicipality = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMunName.trim() || !selectedProvince) return;
    const newMun: GeoMunicipality = {
      id: `mun-${Date.now()}`,
      name: newMunName.trim(),
      repartos: [],
    };
    const updated = geoCatalog.map((p) => {
      if (p.id === selectedProvince.id) {
        return {
          ...p,
          municipalities: [...p.municipalities, newMun],
        };
      }
      return p;
    });
    saveGeoCatalog(updated);
    setSelectedMunId(newMun.id);
    setNewMunName('');
    onShowToast('Municipio creado', `Se añadió "${newMun.name}" a ${selectedProvince.name}`);
  };

  const handleDeleteMunicipality = (munId: string, munName: string) => {
    if (!selectedProvince) return;
    const updated = geoCatalog.map((p) => {
      if (p.id === selectedProvince.id) {
        return {
          ...p,
          municipalities: p.municipalities.filter((m) => m.id !== munId),
        };
      }
      return p;
    });
    saveGeoCatalog(updated);
    onShowToast('Municipio eliminado', `Se eliminó "${munName}"`);
  };

  // --- REPARTO ACTIONS ---
  const handleAddReparto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepName.trim() || !selectedProvince || !selectedMunicipality) return;
    const newRep: GeoReparto = {
      id: `rep-${Date.now()}`,
      name: newRepName.trim(),
    };
    const updated = geoCatalog.map((p) => {
      if (p.id === selectedProvince.id) {
        return {
          ...p,
          municipalities: p.municipalities.map((m) => {
            if (m.id === selectedMunicipality.id) {
              return {
                ...m,
                repartos: [...m.repartos, newRep],
              };
            }
            return m;
          }),
        };
      }
      return p;
    });
    saveGeoCatalog(updated);
    setNewRepName('');
    onShowToast(
      'Reparto creado',
      `Se añadió "${newRep.name}" al municipio ${selectedMunicipality.name}`
    );
  };

  const handleDeleteReparto = (repId: string, repName: string) => {
    if (!selectedProvince || !selectedMunicipality) return;
    const updated = geoCatalog.map((p) => {
      if (p.id === selectedProvince.id) {
        return {
          ...p,
          municipalities: p.municipalities.map((m) => {
            if (m.id === selectedMunicipality.id) {
              return {
                ...m,
                repartos: m.repartos.filter((r) => r.id !== repId),
              };
            }
            return m;
          }),
        };
      }
      return p;
    });
    saveGeoCatalog(updated);
    onShowToast('Reparto eliminado', `Se eliminó "${repName}"`);
  };

  // --- INLINE EDIT TEXT ACTION ---
  const handleStartEditing = (id: string, currentText: string) => {
    setEditingId(id);
    setEditingText(currentText);
  };

  const handleSaveEditing = (type: 'prov' | 'mun' | 'rep') => {
    if (!editingId || !editingText.trim()) {
      setEditingId(null);
      return;
    }

    let updated = [...geoCatalog];

    if (type === 'prov') {
      updated = updated.map((p) =>
        p.id === editingId ? { ...p, name: editingText.trim() } : p
      );
    } else if (type === 'mun') {
      updated = updated.map((p) => {
        if (p.id === selectedProvince?.id) {
          return {
            ...p,
            municipalities: p.municipalities.map((m) =>
              m.id === editingId ? { ...m, name: editingText.trim() } : m
            ),
          };
        }
        return p;
      });
    } else if (type === 'rep') {
      updated = updated.map((p) => {
        if (p.id === selectedProvince?.id) {
          return {
            ...p,
            municipalities: p.municipalities.map((m) => {
              if (m.id === selectedMunicipality?.id) {
                return {
                  ...m,
                  repartos: m.repartos.map((r) =>
                    r.id === editingId ? { ...r, name: editingText.trim() } : r
                  ),
                };
              }
              return m;
            }),
          };
        }
        return p;
      });
    }

    saveGeoCatalog(updated);
    setEditingId(null);
    onShowToast('Nombre actualizado', `Se cambió a "${editingText.trim()}"`);
  };

  // --- TAXONOMY (2 ESCALONES) ACTIONS ---
  const saveDepartmentsCatalog = (updated: DepartmentCategory[]) => {
    setDepartmentsCatalog(updated);
    onUpdateConfig({ ...config, departmentsCatalog: updated });
  };

  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    const newDept: DepartmentCategory = {
      id: `dept-${Date.now()}`,
      name: newDeptName.trim(),
      description: newDeptDesc.trim() || undefined,
      subcategories: [],
    };
    const updated = [...departmentsCatalog, newDept];
    saveDepartmentsCatalog(updated);
    setSelectedDeptId(newDept.id);
    setNewDeptName('');
    setNewDeptDesc('');
    onShowToast('Departamento creado', `Se añadió "${newDept.name}" al 1er escalón`);
  };

  const handleDeleteDepartment = (id: string, name: string) => {
    if (departmentsCatalog.length <= 1) {
      onShowToast('No se puede eliminar', 'Debe existir al menos un departamento principal', 'error');
      return;
    }
    const updated = departmentsCatalog.filter((d) => d.id !== id);
    saveDepartmentsCatalog(updated);
    if (selectedDeptId === id) {
      setSelectedDeptId(updated[0]?.id || '');
    }
    onShowToast('Departamento eliminado', `Se eliminó el departamento "${name}"`);
  };

  const handleStartEditingDept = (dept: DepartmentCategory) => {
    setEditingDeptId(dept.id);
    setEditingDeptNameText(dept.name);
    setEditingDeptDescText(dept.description || '');
  };

  const handleSaveEditingDept = () => {
    if (!editingDeptId || !editingDeptNameText.trim()) {
      setEditingDeptId(null);
      return;
    }
    const updated = departmentsCatalog.map((d) =>
      d.id === editingDeptId
        ? { ...d, name: editingDeptNameText.trim(), description: editingDeptDescText.trim() || undefined }
        : d
    );
    saveDepartmentsCatalog(updated);
    setEditingDeptId(null);
    onShowToast('Departamento actualizado', `Se guardó "${editingDeptNameText.trim()}"`);
  };

  const handleAddSubcategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubcatName.trim() || !selectedDept) return;
    const newSubcat: SubcategoryItem = {
      id: `sub-${Date.now()}`,
      name: newSubcatName.trim(),
    };
    const updated = departmentsCatalog.map((d) => {
      if (d.id === selectedDept.id) {
        return {
          ...d,
          subcategories: [...d.subcategories, newSubcat],
        };
      }
      return d;
    });
    saveDepartmentsCatalog(updated);
    setNewSubcatName('');
    onShowToast('Subcategoría añadida', `Se añadió "${newSubcat.name}" a ${selectedDept.name}`);
  };

  const handleDeleteSubcategory = (subcatId: string, subcatName: string) => {
    if (!selectedDept) return;
    const updated = departmentsCatalog.map((d) => {
      if (d.id === selectedDept.id) {
        return {
          ...d,
          subcategories: d.subcategories.filter((s) => s.id !== subcatId),
        };
      }
      return d;
    });
    saveDepartmentsCatalog(updated);
    onShowToast('Subcategoría eliminada', `Se eliminó "${subcatName}"`);
  };

  const handleStartEditingSubcat = (subcat: SubcategoryItem) => {
    setEditingSubcatId(subcat.id);
    setEditingSubcatText(subcat.name);
  };

  const handleSaveEditingSubcat = () => {
    if (!editingSubcatId || !editingSubcatText.trim() || !selectedDept) {
      setEditingSubcatId(null);
      return;
    }
    const updated = departmentsCatalog.map((d) => {
      if (d.id === selectedDept.id) {
        return {
          ...d,
          subcategories: d.subcategories.map((s) =>
            s.id === editingSubcatId ? { ...s, name: editingSubcatText.trim() } : s
          ),
        };
      }
      return d;
    });
    saveDepartmentsCatalog(updated);
    setEditingSubcatId(null);
    onShowToast('Subcategoría actualizada', `Se cambió a "${editingSubcatText.trim()}"`);
  };

  // --- 2-LEVEL TAG CATALOG ACTIONS ---
  const saveTagsCatalog = (updatedCatalog: TagGroup[]) => {
    setTagsCatalog(updatedCatalog);
    onUpdateConfig({
      ...config,
      name,
      slogan,
      bannerTitle,
      bannerSubtitle,
      logoUrl,
      bannerUrl,
      defaultStoreLogoUrl,
      defaultProductImageUrl,
      primaryColor,
      secondaryColor,
      accentColor,
      socialLinks: {
        whatsapp,
        telegram,
        instagram,
        facebook,
        twitter,
        linkedin,
      },
      geoCatalog,
      departmentsCatalog,
      tagsCatalog: updatedCatalog,
    });
  };

  const handleAddTagGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagGroupName.trim()) return;
    const newGroup: TagGroup = {
      id: `tg-${Date.now()}`,
      name: newTagGroupName.trim(),
      description: newTagGroupDesc.trim() || undefined,
      tags: [],
    };
    const updated = [...tagsCatalog, newGroup];
    saveTagsCatalog(updated);
    setSelectedTagGroupId(newGroup.id);
    setNewTagGroupName('');
    setNewTagGroupDesc('');
    onShowToast('Grupo de etiquetas creado', `Se añadió "${newGroup.name}" (1er Nivel)`);
  };

  const handleDeleteTagGroup = (id: string, groupName: string) => {
    if (tagsCatalog.length <= 1) {
      onShowToast('No se puede eliminar', 'Debe existir al menos un grupo de etiquetas', 'error');
      return;
    }
    const updated = tagsCatalog.filter((g) => g.id !== id);
    saveTagsCatalog(updated);
    if (selectedTagGroupId === id) {
      setSelectedTagGroupId(updated[0]?.id || '');
    }
    onShowToast('Grupo eliminado', `Se eliminó "${groupName}"`);
  };

  const handleStartEditingTagGroup = (group: TagGroup) => {
    setEditingTagGroupId(group.id);
    setEditingTagGroupNameText(group.name);
    setEditingTagGroupDescText(group.description || '');
  };

  const handleSaveEditingTagGroup = () => {
    if (!editingTagGroupId || !editingTagGroupNameText.trim()) {
      setEditingTagGroupId(null);
      return;
    }
    const updated = tagsCatalog.map((g) =>
      g.id === editingTagGroupId
        ? {
            ...g,
            name: editingTagGroupNameText.trim(),
            description: editingTagGroupDescText.trim() || undefined,
          }
        : g
    );
    saveTagsCatalog(updated);
    setEditingTagGroupId(null);
    onShowToast('Grupo actualizado', `Se guardó "${editingTagGroupNameText.trim()}"`);
  };

  const handleAddTagItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagItemName.trim() || !selectedTagGroup) return;
    const newItem: TagItem = {
      id: `tag-${Date.now()}`,
      name: newTagItemName.trim(),
    };
    const updated = tagsCatalog.map((g) => {
      if (g.id === selectedTagGroup.id) {
        return {
          ...g,
          tags: [...g.tags, newItem],
        };
      }
      return g;
    });
    saveTagsCatalog(updated);
    setNewTagItemName('');
    onShowToast('Etiqueta añadida', `Se añadió "${newItem.name}" a ${selectedTagGroup.name}`);
  };

  const handleDeleteTagItem = (tagId: string, tagName: string) => {
    if (!selectedTagGroup) return;
    const updated = tagsCatalog.map((g) => {
      if (g.id === selectedTagGroup.id) {
        return {
          ...g,
          tags: g.tags.filter((t) => t.id !== tagId),
        };
      }
      return g;
    });
    saveTagsCatalog(updated);
    onShowToast('Etiqueta eliminada', `Se eliminó "${tagName}"`);
  };

  const handleStartEditingTagItem = (tagItem: TagItem) => {
    setEditingTagItemId(tagItem.id);
    setEditingTagItemText(tagItem.name);
  };

  const handleSaveEditingTagItem = () => {
    if (!editingTagItemId || !editingTagItemText.trim() || !selectedTagGroup) {
      setEditingTagItemId(null);
      return;
    }
    const updated = tagsCatalog.map((g) => {
      if (g.id === selectedTagGroup.id) {
        return {
          ...g,
          tags: g.tags.map((t) =>
            t.id === editingTagItemId ? { ...t, name: editingTagItemText.trim() } : t
          ),
        };
      }
      return g;
    });
    saveTagsCatalog(updated);
    setEditingTagItemId(null);
    onShowToast('Etiqueta actualizada', `Se cambió a "${editingTagItemText.trim()}"`);
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation tabs inside Global Configuration */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('identity')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'identity'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Identidad</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('geography')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'geography'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Geografía (3 Escalones)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('taxonomy')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'taxonomy'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>Clasificación (Departamentos y Subdepartamentos)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('tags')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'tags'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Etiquetado (Superetiquetas y Etiquetas)</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'taxonomy' ? (
        /* SECTION: 2-TIER PRODUCT TAXONOMY (DEPARTAMENTOS -> SUBDEPARTAMENTOS) */
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-indigo-600" />
              <span>Clasificación de Productos (Departamentos y Subdepartamentos)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Gestiona la jerarquía de clasificación de 2 escalones: 1er Escalón (Departamentos) y 2do Escalón (Subdepartamentos). Esta estructura se utiliza para clasificar cada producto o servicio.
            </p>
          </div>

          {/* 2-COLUMN MASTER-DETAIL EDITOR */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* COLUMN 1: DEPARTAMENTOS (1ER ESCALÓN) */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 flex flex-col h-[480px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black">
                    1
                  </span>
                  <span>Departamentos</span>
                  <span className="text-xs text-slate-400 font-normal">
                    ({departmentsCatalog.length})
                  </span>
                </h4>
              </div>

              {/* Form to add new department */}
              <form onSubmit={handleAddDepartment} className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="Nuevo departamento..."
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs outline-none focus:border-indigo-500 font-medium"
                />
                <button
                  type="submit"
                  disabled={!newDeptName.trim()}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Department list */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {departmentsCatalog.map((dept) => {
                  const isSelected = selectedDeptId === dept.id;
                  const isEditing = editingDeptId === dept.id;

                  return (
                    <div
                      key={dept.id}
                      onClick={() => setSelectedDeptId(dept.id)}
                      className={`group p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-bold'
                          : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      {isEditing ? (
                        <div
                          className="flex items-center gap-1.5 flex-1 mr-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={editingDeptNameText}
                            onChange={(e) => setEditingDeptNameText(e.target.value)}
                            className="w-full px-2 py-1 rounded-lg text-xs text-slate-900 bg-white border border-indigo-400 font-medium outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleSaveEditingDept}
                            className="p-1 rounded-lg bg-green-500 text-white hover:bg-green-600 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs truncate">{dept.name}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {dept.subcategories.length} subdept.
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEditingDept(dept);
                          }}
                          className={`p-1 rounded-lg hover:bg-black/10 transition-colors cursor-pointer ${
                            isSelected ? 'text-white' : 'text-slate-500'
                          }`}
                          title="Renombrar departamento"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDepartment(dept.id, dept.name);
                          }}
                          className={`p-1 rounded-lg hover:bg-rose-500/20 transition-colors cursor-pointer ${
                            isSelected ? 'text-white' : 'text-slate-400 hover:text-rose-600'
                          }`}
                          title="Eliminar departamento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* COLUMN 2: SUBDEPARTAMENTOS (2DO ESCALÓN) */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 flex flex-col h-[480px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black">
                    2
                  </span>
                  <span>Subdepartamentos</span>
                  {selectedDept && (
                    <span className="text-xs font-semibold text-indigo-600 truncate max-w-[140px]">
                      ({selectedDept.name})
                    </span>
                  )}
                </h4>
              </div>

              {selectedDept ? (
                <>
                  {/* Form to add subdepartment */}
                  <form onSubmit={handleAddSubcategory} className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newSubcatName}
                      onChange={(e) => setNewSubcatName(e.target.value)}
                      placeholder={`Nuevo subdepartamento en ${selectedDept.name}...`}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs outline-none focus:border-indigo-500 font-medium"
                    />
                    <button
                      type="submit"
                      disabled={!newSubcatName.trim()}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </form>

                  {/* Subdepartment items list */}
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                    {selectedDept.subcategories.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">
                        No hay subdepartamentos cargados en este departamento
                      </p>
                    ) : (
                      selectedDept.subcategories.map((subcat) => {
                        const isEditingSub = editingSubcatId === subcat.id;

                        return (
                          <div
                            key={subcat.id}
                            className="group p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 transition-all flex items-center justify-between"
                          >
                            {isEditingSub ? (
                              <div className="flex items-center gap-1.5 flex-1 mr-2">
                                <input
                                  type="text"
                                  value={editingSubcatText}
                                  onChange={(e) => setEditingSubcatText(e.target.value)}
                                  className="w-full px-2 py-1 rounded-lg text-xs text-slate-900 bg-white border border-indigo-400 font-medium outline-none"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={handleSaveEditingSubcat}
                                  className="p-1 rounded-lg bg-green-500 text-white hover:bg-green-600 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs font-semibold">{subcat.name}</span>
                            )}

                            <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => handleStartEditingSubcat(subcat)}
                                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
                                title="Renombrar subdepartamento"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSubcategory(subcat.id, subcat.name)}
                                className="p-1 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Eliminar subdepartamento"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-slate-400">
                  Selecciona un departamento primero
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeSubTab === 'geography' ? (
        /* SECTION 1: RELATIONAL GEOGRAPHY CATALOG (PROVINCES -> MUNICIPALITIES -> REPARTOS) */
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-600" />
              <span>Geografía</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              El administrador selecciona esta jerarquía en listas desplegables durante la creación y
              edición de tiendas, garantizando normalización y evitando errores tipográficos.
            </p>
          </div>

          {/* 3-COLUMN MASTER-DETAIL RELATIONAL EDITOR */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* COLUMN 1: PROVINCES */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 flex flex-col h-[480px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black">
                    1
                  </span>
                  <span>Provincias</span>
                  <span className="text-xs text-slate-400 font-normal">
                    ({geoCatalog.length})
                  </span>
                </h4>
              </div>

              {/* Add province form */}
              <form onSubmit={handleAddProvince} className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newProvName}
                  onChange={(e) => setNewProvName(e.target.value)}
                  placeholder="Nueva provincia..."
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs outline-none focus:border-indigo-500 font-medium"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Province list */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {geoCatalog.map((prov) => {
                  const isSelected = prov.id === selectedProvId;
                  const isEditing = editingId === prov.id;

                  return (
                    <div
                      key={prov.id}
                      onClick={() => {
                        setSelectedProvId(prov.id);
                        if (prov.municipalities[0]) {
                          setSelectedMunId(prov.municipalities[0].id);
                        } else {
                          setSelectedMunId('');
                        }
                      }}
                      className={`group p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-bold'
                          : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      {isEditing ? (
                        <div
                          className="flex items-center gap-1.5 flex-1 mr-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="w-full px-2 py-1 rounded-lg text-xs text-slate-900 bg-white border border-indigo-400 font-medium outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEditing('prov')}
                            className="p-1 rounded-lg bg-green-500 text-white hover:bg-green-600 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs truncate">{prov.name}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {prov.municipalities.length} mun
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEditing(prov.id, prov.name);
                          }}
                          className={`p-1 rounded-lg hover:bg-black/10 transition-colors cursor-pointer ${
                            isSelected ? 'text-white' : 'text-slate-500'
                          }`}
                          title="Renombrar provincia"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProvince(prov.id, prov.name);
                          }}
                          className={`p-1 rounded-lg hover:bg-rose-500/20 transition-colors cursor-pointer ${
                            isSelected ? 'text-white' : 'text-slate-400 hover:text-rose-600'
                          }`}
                          title="Eliminar provincia"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* COLUMN 2: MUNICIPALITIES OF SELECTED PROVINCE */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 flex flex-col h-[480px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black">
                    2
                  </span>
                  <span>Municipios</span>
                  {selectedProvince && (
                    <span className="text-xs font-semibold text-indigo-600 truncate max-w-[140px]">
                      ({selectedProvince.name})
                    </span>
                  )}
                </h4>
              </div>

              {selectedProvince ? (
                <>
                  <form onSubmit={handleAddMunicipality} className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newMunName}
                      onChange={(e) => setNewMunName(e.target.value)}
                      placeholder={`Nuevo municipio en ${selectedProvince.name}...`}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs outline-none focus:border-indigo-500 font-medium"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </form>

                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                    {selectedProvince.municipalities.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">
                        No hay municipios en esta provincia
                      </p>
                    ) : (
                      selectedProvince.municipalities.map((mun) => {
                        const isSelected = mun.id === selectedMunId;
                        const isEditing = editingId === mun.id;

                        return (
                          <div
                            key={mun.id}
                            onClick={() => setSelectedMunId(mun.id)}
                            className={`group p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-bold'
                                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                            }`}
                          >
                            {isEditing ? (
                              <div
                                className="flex items-center gap-1.5 flex-1 mr-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="text"
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  className="w-full px-2 py-1 rounded-lg text-xs text-slate-900 bg-white border border-indigo-400 font-medium outline-none"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditing('mun')}
                                  className="p-1 rounded-lg bg-green-500 text-white hover:bg-green-600 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs truncate">{mun.name}</span>
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                                    isSelected
                                      ? 'bg-white/20 text-white'
                                      : 'bg-slate-100 text-slate-500'
                                  }`}
                                >
                                  {mun.repartos.length} rep
                                </span>
                              </div>
                            )}

                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEditing(mun.id, mun.name);
                                }}
                                className={`p-1 rounded-lg hover:bg-black/10 transition-colors cursor-pointer ${
                                  isSelected ? 'text-white' : 'text-slate-500'
                                }`}
                                title="Renombrar municipio"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteMunicipality(mun.id, mun.name);
                                }}
                                className={`p-1 rounded-lg hover:bg-rose-500/20 transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'text-white'
                                    : 'text-slate-400 hover:text-rose-600'
                                }`}
                                title="Eliminar municipio"
                                >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-slate-400">
                  Selecciona una provincia primero
                </div>
              )}
            </div>

            {/* COLUMN 3: REPARTOS OF SELECTED MUNICIPALITY */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 flex flex-col h-[480px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black">
                    3
                  </span>
                  <span>Repartos / Barrios</span>
                  {selectedMunicipality && (
                    <span className="text-xs font-semibold text-indigo-600 truncate max-w-[120px]">
                      ({selectedMunicipality.name})
                    </span>
                  )}
                </h4>
              </div>

              {selectedMunicipality ? (
                <>
                  <form onSubmit={handleAddReparto} className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newRepName}
                      onChange={(e) => setNewRepName(e.target.value)}
                      placeholder={`Nuevo reparto en ${selectedMunicipality.name}...`}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs outline-none focus:border-indigo-500 font-medium"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </form>

                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                    {selectedMunicipality.repartos.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">
                        No hay repartos cargados en este municipio
                      </p>
                    ) : (
                      selectedMunicipality.repartos.map((rep) => {
                        const isEditing = editingId === rep.id;

                        return (
                          <div
                            key={rep.id}
                            className="group p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 transition-all flex items-center justify-between"
                          >
                            {isEditing ? (
                              <div className="flex items-center gap-1.5 flex-1 mr-2">
                                <input
                                  type="text"
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  className="w-full px-2 py-1 rounded-lg text-xs text-slate-900 bg-white border border-indigo-400 font-medium outline-none"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditing('rep')}
                                  className="p-1 rounded-lg bg-green-500 text-white hover:bg-green-600 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs font-semibold">{rep.name}</span>
                            )}

                            <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => handleStartEditing(rep.id, rep.name)}
                                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
                                title="Renombrar reparto"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteReparto(rep.id, rep.name)}
                                className="p-1 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Eliminar reparto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-slate-400">
                  Selecciona un municipio primero
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeSubTab === 'tags' ? (
        /* SECTION: 2-TIER PRODUCT TAGS (SUPERETIQUETAS -> ETIQUETAS) */
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-indigo-600" />
              <span>Sistema de Etiquetado (Superetiquetas y Etiquetas)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Gestiona la jerarquía de etiquetado de 2 niveles: 1er Nivel (Superetiquetas, ej: Color, Estaciones) y 2do Nivel (Etiquetas, ej: Rojo, Azul, Invierno).
            </p>
          </div>

          {/* 2-COLUMN MASTER-DETAIL EDITOR FOR TAGS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* COLUMN 1: SUPERETIQUETAS (1ER NIVEL) */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 flex flex-col h-[480px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black">
                    1
                  </span>
                  <span>Superetiquetas</span>
                  <span className="text-xs text-slate-400 font-normal">
                    ({tagsCatalog.length})
                  </span>
                </h4>
              </div>

              {/* Form to add new Supertag */}
              <form onSubmit={handleAddTagGroup} className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newTagGroupName}
                  onChange={(e) => setNewTagGroupName(e.target.value)}
                  placeholder="Nueva superetiqueta (ej: Color, Estaciones)..."
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs outline-none focus:border-indigo-500 font-medium"
                  required
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Tag Groups list */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {tagsCatalog.map((group) => {
                  const isSelected = group.id === selectedTagGroup?.id;
                  const isEditing = group.id === editingTagGroupId;

                  return (
                    <div
                      key={group.id}
                      onClick={() => {
                        setSelectedTagGroupId(group.id);
                        setEditingTagGroupId(null);
                      }}
                      className={`group p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-bold'
                          : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      {isEditing ? (
                        <div
                          className="flex items-center gap-1.5 flex-1 mr-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={editingTagGroupNameText}
                            onChange={(e) => setEditingTagGroupNameText(e.target.value)}
                            className="w-full px-2 py-1 rounded-lg text-xs text-slate-900 bg-white border border-indigo-400 font-medium outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleSaveEditingTagGroup}
                            className="p-1 rounded-lg bg-green-500 text-white hover:bg-green-600 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs truncate">{group.name}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {group.tags.length} etiq.
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEditingTagGroup(group);
                          }}
                          className={`p-1 rounded-lg hover:bg-black/10 transition-colors cursor-pointer ${
                            isSelected ? 'text-white' : 'text-slate-500'
                          }`}
                          title="Renombrar superetiqueta"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTagGroup(group.id, group.name);
                          }}
                          className={`p-1 rounded-lg hover:bg-rose-500/20 transition-colors cursor-pointer ${
                            isSelected ? 'text-white' : 'text-slate-400 hover:text-rose-600'
                          }`}
                          title="Eliminar superetiqueta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* COLUMN 2: ETIQUETAS (2DO NIVEL) */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 flex flex-col h-[480px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black">
                    2
                  </span>
                  <span>Etiquetas</span>
                  {selectedTagGroup && (
                    <span className="text-xs font-semibold text-indigo-600 truncate max-w-[140px]">
                      ({selectedTagGroup.name})
                    </span>
                  )}
                </h4>
              </div>

              {selectedTagGroup ? (
                <>
                  {/* Form to add new Tag Item */}
                  <form onSubmit={handleAddTagItem} className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newTagItemName}
                      onChange={(e) => setNewTagItemName(e.target.value)}
                      placeholder={`Nueva etiqueta en ${selectedTagGroup.name}...`}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs outline-none focus:border-indigo-500 font-medium"
                      required
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </form>

                  {/* Tag Items list */}
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                    {selectedTagGroup.tags.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">
                        No hay etiquetas cargadas en esta superetiqueta
                      </p>
                    ) : (
                      selectedTagGroup.tags.map((item) => {
                        const isEditing = item.id === editingTagItemId;

                        return (
                          <div
                            key={item.id}
                            className="group p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 transition-all flex items-center justify-between"
                          >
                            {isEditing ? (
                              <div className="flex items-center gap-1.5 flex-1 mr-2">
                                <input
                                  type="text"
                                  value={editingTagItemText}
                                  onChange={(e) => setEditingTagItemText(e.target.value)}
                                  className="w-full px-2 py-1 rounded-lg text-xs text-slate-900 bg-white border border-indigo-400 font-medium outline-none"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={handleSaveEditingTagItem}
                                  className="p-1 rounded-lg bg-green-500 text-white hover:bg-green-600 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs font-semibold">{item.name}</span>
                            )}

                            <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => handleStartEditingTagItem(item)}
                                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
                                title="Renombrar etiqueta"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTagItem(item.id, item.name)}
                                className="p-1 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Eliminar etiqueta"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-slate-400">
                  Selecciona una superetiqueta primero
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* SECTION 2: BRAND IDENTITY, LOGOS, THEME COLORS, AND SOCIAL LINKS */
        <form
          onSubmit={handleSaveIdentity}
          className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-8"
        >
          {/* HEADER */}
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>Identidad</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Personaliza la marca general de MercadoCuba. Puedes elegir imágenes mediante enlace de internet o
              cargándolas directamente desde tu computadora o teléfono.
            </p>
          </div>

          {/* BLOCK 1: PUBLIC NAME AND SLOGAN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-900 focus:border-indigo-500 outline-none"
                  placeholder="ej. MercadoCuba"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">
                  Eslogan
                </label>
                <textarea
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-700 focus:border-indigo-500 outline-none leading-relaxed"
                  placeholder="ej. Conecta directo con tiendas y proveedores en Cuba..."
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">
                  Título del Banner Principal
                </label>
                <input
                  type="text"
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:border-indigo-500 outline-none"
                  placeholder="ej. Compra directo a tiendas por WhatsApp"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">
                  Subtítulo / Texto del Banner
                </label>
                <textarea
                  value={bannerSubtitle}
                  onChange={(e) => setBannerSubtitle(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-700 focus:border-indigo-500 outline-none leading-relaxed"
                  placeholder="ej. Sin pasarelas de pago ni intermediarios..."
                />
              </div>
            </div>

            {/* BLOCK 2: 2 THEME COLORS (PRIMARY & SECONDARY) */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold uppercase text-slate-700 flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-indigo-600" />
                  <span>Colores del Tema</span>
                </label>
              </div>

              {/* Color pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                  <label className="block text-[11px] font-bold text-slate-600">
                    Color Principal
                  </label>
                  <div className="flex items-center gap-2">
                    <label
                      className="relative w-9 h-9 rounded-full border-2 border-slate-200 shadow-xs cursor-pointer shrink-0 overflow-hidden transition-transform hover:scale-105 active:scale-95 flex items-center justify-center"
                      style={{ backgroundColor: primaryColor }}
                      title="Seleccionar Color Principal"
                    >
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      />
                    </label>
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold text-slate-800"
                      placeholder="#4f46e5"
                    />
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                  <label className="block text-[11px] font-bold text-slate-600">
                    Color Secundario
                  </label>
                  <div className="flex items-center gap-2">
                    <label
                      className="relative w-9 h-9 rounded-full border-2 border-slate-200 shadow-xs cursor-pointer shrink-0 overflow-hidden transition-transform hover:scale-105 active:scale-95 flex items-center justify-center"
                      style={{ backgroundColor: secondaryColor }}
                      title="Seleccionar Color Secundario"
                    >
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      />
                    </label>
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold text-slate-800"
                      placeholder="#0284c7"
                    />
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                  <label className="block text-[11px] font-bold text-slate-600">
                    Color de Acento
                  </label>
                  <div className="flex items-center gap-2">
                    <label
                      className="relative w-9 h-9 rounded-full border-2 border-slate-200 shadow-xs cursor-pointer shrink-0 overflow-hidden transition-transform hover:scale-105 active:scale-95 flex items-center justify-center"
                      style={{ backgroundColor: accentColor }}
                      title="Seleccionar Color de Acento"
                    >
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      />
                    </label>
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold text-slate-800"
                      placeholder="#10b981"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BLOCK 3: IMAGES (LOGO, BANNER, DEFAULT STORE LOGO, DEFAULT PRODUCT IMAGE) */}
          <div className="border-t border-slate-100 pt-6 space-y-6">
            <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-600" />
              <span>Imágenes por Defecto del Sistema</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 1. MARKETPLACE LOGO */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <ImageGalleryUploader
                  images={logoUrl && logoUrl !== 'local:logo' ? [logoUrl] : []}
                  mainImage={logoUrl}
                  onImagesChange={(imgs, main) => setLogoUrl(imgs[0] || 'local:logo')}
                  label="Logo Principal del Marketplace"
                  description="Sube una imagen local. Si no subes ninguna, se muestra el logo por defecto."
                  fallbackType="logo"
                  singleMode={true}
                />
              </div>

              {/* 2. MARKETPLACE BANNER / HERO IMAGE */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <ImageGalleryUploader
                  images={bannerUrl && bannerUrl !== 'local:banner' ? [bannerUrl] : []}
                  mainImage={bannerUrl}
                  onImagesChange={(imgs, main) => setBannerUrl(imgs[0] || 'local:banner')}
                  label="Banner / Portada Principal"
                  description="Sube una portada local. Si no se sube ninguna, se usa la ilustración por defecto."
                  fallbackType="banner"
                  singleMode={true}
                />
              </div>

              {/* 3. DEFAULT STORE LOGO */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <ImageGalleryUploader
                  images={defaultStoreLogoUrl && defaultStoreLogoUrl !== 'local:store' ? [defaultStoreLogoUrl] : []}
                  mainImage={defaultStoreLogoUrl}
                  onImagesChange={(imgs, main) => setDefaultStoreLogoUrl(imgs[0] || 'local:store')}
                  label="Imagen por Defecto para Tiendas"
                  description="Cualquier tienda sin foto propia heredará esta imagen."
                  fallbackType="store"
                  singleMode={true}
                />
              </div>

              {/* 4. DEFAULT PRODUCT / SERVICE IMAGE */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <ImageGalleryUploader
                  images={defaultProductImageUrl && defaultProductImageUrl !== 'local:product' ? [defaultProductImageUrl] : []}
                  mainImage={defaultProductImageUrl}
                  onImagesChange={(imgs, main) => setDefaultProductImageUrl(imgs[0] || 'local:product')}
                  label="Imagen por Defecto para Productos"
                  description="Cualquier producto sin foto propia heredará esta imagen."
                  fallbackType="product"
                  singleMode={true}
                />
              </div>
            </div>
          </div>

          {/* BLOCK 4: OPTIONAL SOCIAL NETWORKS (WhatsApp, Telegram, Instagram, Facebook, X, LinkedIn) */}
          <div className="border-t border-slate-100 pt-6">
            <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-indigo-600" />
              <span>Redes Sociales</span>
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Estos enlaces o contactos se mostrarán en la cabecera, pie de página o sección de contacto
              del portal para que proveedores y clientes puedan seguir las novedades del marketplace.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* WhatsApp */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>WhatsApp</span>
                </label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+53 50000000 o enlace"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Telegram */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Telegram</span>
                </label>
                <input
                  type="text"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder="https://t.me/mercadocuba"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Instagram */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Instagram className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Instagram</span>
                </label>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="https://instagram.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Facebook */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Facebook className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Facebook</span>
                </label>
                <input
                  type="text"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="https://facebook.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-indigo-500 outline-none"
                />
              </div>

              {/* X / Twitter */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Twitter className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>X</span>
                </label>
                <input
                  type="text"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="https://x.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-indigo-500 outline-none"
                />
              </div>

              {/* LinkedIn */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Linkedin className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>LinkedIn</span>
                </label>
                <input
                  type="text"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* SAVE BUTTON */}
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-sm transition-all cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Configuración Global</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

