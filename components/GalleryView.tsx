
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Project } from '../types';
import { Search, X, ZoomIn, Image as ImageIcon } from 'lucide-react';

interface GalleryViewProps {
    projects: Project[];
}

export const GalleryView: React.FC<GalleryViewProps> = ({ projects }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Flatten all proofing images from all projects
    const allImages = projects.flatMap(project =>
        (project.proofing || []).flatMap(round =>
            round.images.map(img => ({
                src: img,
                projectTitle: project.name,
                projectId: project.id,
                roundTitle: round.title,
                date: round.date
            }))
        )
    );

    const filteredImages = allImages.filter(img =>
        img.projectTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        img.roundTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-enter pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white">設計藝廊</h2>
                    <p className="text-slate-400 dark:text-zinc-500 mt-2 text-sm font-medium">瀏覽所有專案的校稿圖片</p>
                </div>

                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 group-focus-within:text-lime-500 dark:group-focus-within:text-lime-400 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="搜尋專案..."
                        className="pl-12 pr-4 py-3 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-white w-full md:w-64 focus:border-lime-500 outline-none shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {filteredImages.length > 0 ? (
                <div className="columns-1 md:columns-3 lg:columns-4 gap-6 space-y-6">
                    {filteredImages.map((img, idx) => (
                        <div key={idx} className="break-inside-avoid relative group rounded-2xl overflow-hidden cursor-zoom-in border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] shadow-sm hover:shadow-lg dark:hover:shadow-lime-400/10 transition-all" onClick={() => setPreviewImage(img.src)}>
                            <img src={img.src} alt={img.roundTitle} className="w-full h-auto object-cover" />

                            {/* Overlay Info */}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                <h4 className="text-white font-bold text-sm truncate">{img.projectTitle}</h4>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-slate-300 text-xs truncate max-w-[70%]">{img.roundTitle}</span>
                                    <span className="text-slate-400 text-[10px]">{new Date(img.date).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Icon */}
                            <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                <ZoomIn size={16} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 dark:text-zinc-600">
                    <div className="w-24 h-24 bg-slate-100 dark:bg-zinc-800 rounded-3xl flex items-center justify-center mb-6 text-slate-300 dark:text-zinc-600">
                        <ImageIcon size={40} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-500 dark:text-zinc-500">沒有找到圖片</h3>
                    <p className="text-sm">試試看不同的關鍵字</p>
                </div>
            )}

            {/* Lightbox */}
            {previewImage && createPortal(
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-enter" onClick={() => setPreviewImage(null)}>
                    <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2 bg-white/10 rounded-full">
                        <X size={24} />
                    </button>
                    <img
                        src={previewImage}
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>,
                document.body
            )}
        </div>
    );
};
