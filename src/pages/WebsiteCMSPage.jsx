import { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { pmsService } from '../services/pmsService';
import { api } from '../services/api';
import { Plus, Edit2, Trash2, Check, X, Upload, Globe, Ticket, Image as ImageIcon, MapPin, Eye, FileText, ToggleLeft, ToggleRight } from 'lucide-react';

export default function WebsiteCMSPage() {
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState('tickets');
  const [loading, setLoading] = useState(false);

  // Data lists
  const [tickets, setTickets] = useState([]);
  const [slides, setSlides] = useState([]);
  const [attractions, setAttractions] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [pages, setPages] = useState([]);

  // Modals / Forms
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'create' or 'edit'
  const [selectedItem, setSelectedItem] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [ticketForm, setTicketForm] = useState({ title: '', slug: '', description: '', price: 0, category: 'Individual', features: [], stock: 100, is_bestseller: false, is_active: true });
  const [slideForm, setSlideForm] = useState({ title: '', subtitle: '', image_url: '', cta_url: '', cta_label: '', sort_order: 1, is_active: true });
  const [attractionForm, setAttractionForm] = useState({ title: '', description: '', image_url: '', category: 'Fun', sort_order: 1, is_active: true });
  const [galleryForm, setGalleryForm] = useState({ title: '', description: '', image_url: '', category: 'General', is_active: true });
  const [pageForm, setPageForm] = useState({ title: '', content: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'tickets') {
        const res = await pmsService.getAdminTickets();
        if (res.success) setTickets(res.data?.items || []);
      } else if (activeTab === 'slides') {
        const res = await pmsService.getHeroSlides();
        if (res.success) setSlides(res.data || []);
      } else if (activeTab === 'attractions') {
        const res = await pmsService.getAttractions();
        if (res.success) setAttractions(res.data || []);
      } else if (activeTab === 'gallery') {
        const res = await pmsService.getGallery();
        if (res.success) setGallery(res.data || []);
      } else if (activeTab === 'pages') {
        const res = await pmsService.getContentPages();
        if (res.success) setPages(res.data || []);
      }
    } catch (e) {
      showToast(e.message || 'Failed to load CMS data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleImageUpload = async (e, setFormUrl) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const res = await api.upload(file);
      if (res.success) {
        setFormUrl(res.data.url);
        showToast('Image uploaded successfully to Cloudflare R2!');
      }
    } catch (err) {
      showToast(err.message || 'Image upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    setModalType('edit');
    if (activeTab === 'tickets') {
      setTicketForm({
        title: item.title,
        slug: item.slug,
        description: item.description,
        price: item.price / 100, // paisa to rupees
        category: item.category,
        features: item.features ? JSON.parse(JSON.stringify(item.features)) : [],
        stock: item.stock,
        is_bestseller: item.is_bestseller,
        is_active: item.is_active,
      });
    } else if (activeTab === 'slides') {
      setSlideForm({ ...item });
    } else if (activeTab === 'attractions') {
      setAttractionForm({ ...item });
    } else if (activeTab === 'gallery') {
      setGalleryForm({ ...item });
    } else if (activeTab === 'pages') {
      setPageForm({ title: item.title, content: item.content });
    }
    setShowModal(true);
  };

  const handleOpenCreate = () => {
    setSelectedItem(null);
    setModalType('create');
    if (activeTab === 'tickets') {
      setTicketForm({ title: '', slug: '', description: '', price: 0, category: 'Individual', features: [], stock: 100, is_bestseller: false, is_active: true });
    } else if (activeTab === 'slides') {
      setSlideForm({ title: '', subtitle: '', image_url: '', cta_url: '/tickets', cta_label: 'Book Tickets', sort_order: 1, is_active: true });
    } else if (activeTab === 'attractions') {
      setAttractionForm({ title: '', description: '', image_url: '', category: 'Fun', sort_order: 1, is_active: true });
    } else if (activeTab === 'gallery') {
      setGalleryForm({ title: '', description: '', image_url: '', category: 'General', is_active: true });
    }
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      let res;
      if (activeTab === 'tickets') {
        res = await pmsService.deleteTicket(id);
      } else if (activeTab === 'slides') {
        res = await pmsService.deleteHeroSlide(id);
      } else if (activeTab === 'attractions') {
        res = await pmsService.deleteAttraction(id);
      } else if (activeTab === 'gallery') {
        res = await pmsService.deleteGalleryItem(id);
      }
      if (res.success) {
        showToast('Deleted successfully');
        fetchData();
      }
    } catch (e) {
      showToast(e.message || 'Delete failed', 'error');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      if (activeTab === 'tickets') {
        const res = await pmsService.toggleTicketStatus(id);
        if (res.success) {
          showToast('Ticket status updated');
          fetchData();
        }
      }
    } catch (e) {
      showToast(e.message || 'Toggle status failed', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (activeTab === 'tickets') {
        const payload = {
          ...ticketForm,
          price: Math.round(parseFloat(ticketForm.price) * 100), // rupees to paisa
          features: ticketForm.features,
        };
        if (modalType === 'create') {
          res = await pmsService.createTicket(payload);
        } else {
          res = await pmsService.updateTicket(selectedItem.id, payload);
        }
      } else if (activeTab === 'slides') {
        const payload = { ...slideForm, sort_order: parseInt(slideForm.sort_order) };
        if (modalType === 'create') {
          res = await pmsService.createHeroSlide(payload);
        } else {
          res = await pmsService.updateHeroSlide(selectedItem.id, payload);
        }
      } else if (activeTab === 'attractions') {
        const payload = { ...attractionForm, sort_order: parseInt(attractionForm.sort_order) };
        if (modalType === 'create') {
          res = await pmsService.createAttraction(payload);
        } else {
          res = await pmsService.updateAttraction(selectedItem.id, payload);
        }
      } else if (activeTab === 'gallery') {
        const payload = { ...galleryForm };
        if (modalType === 'create') {
          res = await pmsService.createGalleryItem(payload);
        } else {
          res = await pmsService.updateGalleryItem(selectedItem.id, payload);
        }
      } else if (activeTab === 'pages') {
        res = await pmsService.updateContentPage(selectedItem.slug, pageForm);
      }

      if (res.success) {
        showToast('Saved successfully');
        setShowModal(false);
        fetchData();
      }
    } catch (e) {
      showToast(e.message || 'Save failed', 'error');
    }
  };

  const renderTabs = () => (
    <div className="flex border-b border-slate-200 bg-white px-6 pt-2">
      {[
        { id: 'tickets', label: 'Tickets & Pricing', icon: Ticket },
        { id: 'slides', label: 'Hero Slides', icon: Globe },
        { id: 'attractions', label: 'Attractions & Rides', icon: MapPin },
        { id: 'gallery', label: 'Gallery Photos', icon: ImageIcon },
        { id: 'pages', label: 'Content Pages', icon: FileText },
      ].map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-xs transition-all ${isActive ? 'border-emerald-500 text-emerald-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <Icon size={14} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      <div className="p-6 border-b border-slate-200 bg-white flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Website CMS</h1>
          <p className="text-xs text-slate-500">Manage titles, pricing, rides and page contents on the main website</p>
        </div>
        {activeTab !== 'pages' && (
          <button onClick={handleOpenCreate} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors">
            <Plus size={14} /> Add New {activeTab === 'tickets' ? 'Ticket' : activeTab === 'slides' ? 'Slide' : activeTab === 'attractions' ? 'Attraction' : 'Photo'}
          </button>
        )}
      </div>

      {renderTabs()}

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {activeTab === 'tickets' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Ticket Info</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Bestseller</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tickets.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50">
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{t.title}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 max-w-sm truncate">{t.description}</div>
                      </td>
                      <td className="p-4"><span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">{t.category}</span></td>
                      <td className="p-4 font-bold text-slate-800">₹{t.price / 100}</td>
                      <td className="p-4 text-slate-500 font-semibold">{t.stock}</td>
                      <td className="p-4">
                        {t.is_bestseller ? <span className="text-[9px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">Bestseller</span> : <span className="text-slate-300">-</span>}
                      </td>
                      <td className="p-4">
                        <button onClick={() => handleToggleStatus(t.id)} className="focus:outline-none">
                          {t.is_active ? (
                            <span className="flex items-center gap-1 text-emerald-600 font-bold"><Check size={14} /> Active</span>
                          ) : (
                            <span className="flex items-center gap-1 text-slate-400"><X size={14} /> Inactive</span>
                          )}
                        </button>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => handleOpenEdit(t)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600"><Edit2 size={13} /></button>
                        <button onClick={() => handleDelete(t.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 size={13} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'slides' && (
              <div className="grid grid-cols-2 gap-6 p-6">
                {slides.map(s => (
                  <div key={s.id} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col justify-between">
                    <img src={s.image_url} className="h-44 w-full object-cover border-b border-slate-200" alt={s.title} />
                    <div className="p-4 space-y-2 flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-800 text-sm leading-snug">{s.title}</h4>
                        <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-full">Order: {s.sort_order}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">{s.subtitle}</p>
                      <div className="flex gap-2 items-center text-[10px] text-emerald-600 font-semibold bg-emerald-50 w-fit px-2.5 py-1 rounded-lg">
                        <Globe size={11} /> {s.cta_label || 'View'} &rarr; {s.cta_url}
                      </div>
                    </div>
                    <div className="border-t border-slate-200 px-4 py-3 bg-white flex justify-between items-center text-xs">
                      <span className={`font-semibold ${s.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {s.is_active ? '● Live' : '○ Paused'}
                      </span>
                      <div className="space-x-1">
                        <button onClick={() => handleOpenEdit(s)} className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold">Edit</button>
                        <button onClick={() => handleDelete(s.id)} className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'attractions' && (
              <div className="grid grid-cols-3 gap-4 p-6">
                {attractions.map(a => (
                  <div key={a.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white flex flex-col justify-between hover:shadow-md transition-shadow">
                    <img src={a.image_url} className="h-40 w-full object-cover" alt={a.title} />
                    <div className="p-4 space-y-2 flex-1">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-slate-800 text-xs truncate">{a.title}</h4>
                        <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">{a.category}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal line-clamp-3">{a.description}</p>
                    </div>
                    <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50 flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-semibold">Order: {a.sort_order}</span>
                      <div className="space-x-1">
                        <button onClick={() => handleOpenEdit(a)} className="text-blue-600 font-bold hover:underline">Edit</button>
                        <button onClick={() => handleDelete(a.id)} className="text-red-500 font-bold hover:underline">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'gallery' && (
              <div className="grid grid-cols-4 gap-4 p-6">
                {gallery.map(g => (
                  <div key={g.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white flex flex-col group relative">
                    <img src={g.image_url} className="h-44 w-full object-cover" alt={g.title} />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3 text-white">
                      <div>
                        <div className="text-xs font-bold">{g.title}</div>
                        <div className="text-[9px] text-slate-300 mt-1">{g.description}</div>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="bg-white/20 px-2 py-0.5 rounded-full">{g.category}</span>
                        <div className="space-x-2">
                          <button onClick={() => handleOpenEdit(g)} className="hover:underline font-bold text-white">Edit</button>
                          <button onClick={() => handleDelete(g.id)} className="hover:underline font-bold text-red-300">Delete</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'pages' && (
              <div className="divide-y divide-slate-100">
                {pages.map(p => (
                  <div key={p.slug} className="p-5 flex items-center justify-between hover:bg-slate-50/50">
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 text-xs">{p.title}</h4>
                      <p className="text-[10px] text-slate-400">Slug: <code>{p.slug}</code> · Last Updated: {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <button onClick={() => handleOpenEdit(p)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-colors">
                      <Edit2 size={11} /> Edit Page Content
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-xl w-full flex flex-col overflow-hidden max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                {modalType === 'create' ? 'Create' : 'Edit'} {activeTab.slice(0, -1)}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Form Ticket fields */}
              {activeTab === 'tickets' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Ticket Title</label>
                      <input type="text" value={ticketForm.title} onChange={e => setTicketForm({ ...ticketForm, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })} required
                        className="w-full border border-slate-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Slug</label>
                      <input type="text" value={ticketForm.slug} onChange={e => setTicketForm({ ...ticketForm, slug: e.target.value })} required
                        className="w-full border border-slate-200 p-2 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Description</label>
                    <textarea value={ticketForm.description} onChange={e => setTicketForm({ ...ticketForm, description: e.target.value })} required rows="2"
                      className="w-full border border-slate-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Price (INR)</label>
                      <input type="number" step="0.01" value={ticketForm.price} onChange={e => setTicketForm({ ...ticketForm, price: e.target.value })} required
                        className="w-full border border-slate-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Stock Count</label>
                      <input type="number" value={ticketForm.stock} onChange={e => setTicketForm({ ...ticketForm, stock: parseInt(e.target.value) || 0 })} required
                        className="w-full border border-slate-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Category</label>
                      <select value={ticketForm.category} onChange={e => setTicketForm({ ...ticketForm, category: e.target.value })}
                        className="w-full border border-slate-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                        <option>Individual</option>
                        <option>Group</option>
                        <option>Premium</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-6 items-center pt-2">
                    <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                      <input type="checkbox" checked={ticketForm.is_bestseller} onChange={e => setTicketForm({ ...ticketForm, is_bestseller: e.target.checked })} />
                      Is Bestseller Pack
                    </label>
                    <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                      <input type="checkbox" checked={ticketForm.is_active} onChange={e => setTicketForm({ ...ticketForm, is_active: e.target.checked })} />
                      Active / Enable Online Sales
                    </label>
                  </div>
                </div>
              )}

              {/* Form Hero Slide fields */}
              {activeTab === 'slides' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Slide Title</label>
                    <input type="text" value={slideForm.title} onChange={e => setSlideForm({ ...slideForm, title: e.target.value })} required
                      className="w-full border border-slate-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Subtitle</label>
                    <input type="text" value={slideForm.subtitle} onChange={e => setSlideForm({ ...slideForm, subtitle: e.target.value })} required
                      className="w-full border border-slate-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Image URL</label>
                      <input type="text" value={slideForm.image_url} onChange={e => setSlideForm({ ...slideForm, image_url: e.target.value })} required
                        className="w-full border border-slate-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Upload File (R2)</label>
                      <label className="border border-slate-200 hover:bg-slate-50 border-dashed rounded-lg p-2 flex flex-col items-center justify-center cursor-pointer h-[34px] text-[10px] text-slate-500">
                        <Upload size={12} className="mb-0.5" />
                        <span>{uploading ? 'Uploading...' : 'Choose Image'}</span>
                        <input type="file" onChange={e => handleImageUpload(e, (url) => setSlideForm({ ...slideForm, image_url: url }))} className="hidden" accept="image/*" />
                      </label>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">CTA Label</label>
                      <input type="text" value={slideForm.cta_label} onChange={e => setSlideForm({ ...slideForm, cta_label: e.target.value })} placeholder="Book Tickets"
                        className="w-full border border-slate-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">CTA URL</label>
                      <input type="text" value={slideForm.cta_url} onChange={e => setSlideForm({ ...slideForm, cta_url: e.target.value })} placeholder="/tickets"
                        className="w-full border border-slate-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Sort Order</label>
                      <input type="number" value={slideForm.sort_order} onChange={e => setSlideForm({ ...slideForm, sort_order: parseInt(e.target.value) || 1 })} required
                        className="w-full border border-slate-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer pt-1">
                    <input type="checkbox" checked={slideForm.is_active} onChange={e => setSlideForm({ ...slideForm, is_active: e.target.checked })} />
                    Slide Live & Active
                  </label>
                </div>
              )}

              {/* Form Attraction fields */}
              {activeTab === 'attractions' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Ride / Attraction Title</label>
                    <input type="text" value={attractionForm.title} onChange={e => setAttractionForm({ ...attractionForm, title: e.target.value })} required
                      className="w-full border border-slate-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Description</label>
                    <textarea value={attractionForm.description} onChange={e => setAttractionForm({ ...attractionForm, description: e.target.value })} required rows="3"
                      className="w-full border border-slate-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Image URL</label>
                      <input type="text" value={attractionForm.image_url} onChange={e => setAttractionForm({ ...attractionForm, image_url: e.target.value })} required
                        className="w-full border border-slate-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Upload File (R2)</label>
                      <label className="border border-slate-200 hover:bg-slate-50 border-dashed rounded-lg p-2 flex flex-col items-center justify-center cursor-pointer h-[34px] text-[10px] text-slate-500">
                        <Upload size={12} className="mb-0.5" />
                        <span>{uploading ? 'Uploading...' : 'Choose Image'}</span>
                        <input type="file" onChange={e => handleImageUpload(e, (url) => setAttractionForm({ ...attractionForm, image_url: url }))} className="hidden" accept="image/*" />
                      </label>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Category / Tag</label>
                      <select value={attractionForm.category} onChange={e => setAttractionForm({ ...attractionForm, category: e.target.value })}
                        className="w-full border border-slate-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                        <option>Thrills</option>
                        <option>Relax</option>
                        <option>Fun</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Sort Order</label>
                      <input type="number" value={attractionForm.sort_order} onChange={e => setAttractionForm({ ...attractionForm, sort_order: parseInt(e.target.value) || 1 })} required
                        className="w-full border border-slate-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                  </div>
                </div>
              )}

              {/* Form Gallery fields */}
              {activeTab === 'gallery' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Photo Title</label>
                    <input type="text" value={galleryForm.title} onChange={e => setGalleryForm({ ...galleryForm, title: e.target.value })} required
                      className="w-full border border-slate-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Description / Subtitle</label>
                    <input type="text" value={galleryForm.description} onChange={e => setGalleryForm({ ...galleryForm, description: e.target.value })}
                      className="w-full border border-slate-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Image URL</label>
                      <input type="text" value={galleryForm.image_url} onChange={e => setGalleryForm({ ...galleryForm, image_url: e.target.value })} required
                        className="w-full border border-slate-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Upload File (R2)</label>
                      <label className="border border-slate-200 hover:bg-slate-50 border-dashed rounded-lg p-2 flex flex-col items-center justify-center cursor-pointer h-[34px] text-[10px] text-slate-500">
                        <Upload size={12} className="mb-0.5" />
                        <span>{uploading ? 'Uploading...' : 'Choose Image'}</span>
                        <input type="file" onChange={e => handleImageUpload(e, (url) => setGalleryForm({ ...galleryForm, image_url: url }))} className="hidden" accept="image/*" />
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Category</label>
                    <select value={galleryForm.category} onChange={e => setGalleryForm({ ...galleryForm, category: e.target.value })}
                      className="w-full border border-slate-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                      <option>General</option>
                      <option>Rides</option>
                      <option>Resort</option>
                      <option>Restaurant</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Form Content Page fields */}
              {activeTab === 'pages' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Page Title</label>
                    <input type="text" value={pageForm.title} onChange={e => setPageForm({ ...pageForm, title: e.target.value })} required
                      className="w-full border border-slate-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Markdown Content</label>
                    <textarea value={pageForm.content} onChange={e => setPageForm({ ...pageForm, content: e.target.value })} required rows="14"
                      className="w-full border border-slate-200 p-2 rounded-lg font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 text-xs">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-lg font-bold text-slate-700 transition-colors">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-colors">Save Changes</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
