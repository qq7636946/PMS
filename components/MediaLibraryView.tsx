
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Member } from '../types';
import { Search, X, ZoomIn, Upload, Loader2, Image as ImageIcon, Folder } from 'lucide-react';
import { storage, db } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

interface MediaItem {
    id: string;
    url: string;
    uploadedBy: string;
    uploadedAt: string;
    team: string;
    fileName: string;
}

interface MediaLibraryViewProps {
    currentUser: Member | null;
    teams: string[];
}

export const MediaLibraryView: React.FC<MediaLibraryViewProps> = ({ currentUser, teams }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTeam, setSelectedTeam] = useState('');
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadTeam, setUploadTeam] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);

    const canUpload = currentUser && ['Admin', 'Manager', 'SeniorMember'].includes(currentUser.accessLevel);

    // Load media items from Firestore
    useEffect(() => {
        const q = query(collection(db, 'media'), orderBy('uploadedAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as MediaItem));
            setMediaItems(items);
        });

        return () => unsubscribe();
    }, []);

    // Set default upload team
    useEffect(() => {
        if (currentUser?.team) {
            setUploadTeam(currentUser.team);
        }
    }, [currentUser]);

    const filteredMedia = mediaItems.filter(item => {
        const matchesSearch = item.fileName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTeam = selectedTeam === '' || item.team === selectedTeam;
        return matchesSearch && matchesTeam;
    });

    const handleFileSelect = (files: FileList | null) => {
        if (!files) return;
        const validFiles = Array.from(files).filter(file => {
            if (!file.type.startsWith('image/')) {
                alert(`${file.name} 不是圖片檔案`);
                return false;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert(`${file.name} 超過 5MB 限制`);
                return false;
            }
            return true;
        });
        setSelectedFiles(validFiles);
        if (validFiles.length > 0) {
            setShowUploadModal(true);
        }
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0 || !currentUser || !uploadTeam) return;

        setIsUploading(true);
        setUploadProgress(0);

        try {
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                const timestamp = Date.now();
                const fileName = `media/${uploadTeam}/${timestamp}_${file.name}`;
                const storageRef = ref(storage, fileName);

                await uploadBytes(storageRef, file);
                const url = await getDownloadURL(storageRef);

                // Add to Firestore
                await addDoc(collection(db, 'media'), {
                    url,
                    uploadedBy: currentUser.id,
                    uploadedAt: new Date().toISOString(),
                    team: uploadTeam,
                    fileName: file.name
                });

                setUploadProgress(((i + 1) / selectedFiles.length) * 100);
            }

            // Reset and close
            setShowUploadModal(false);
            setSelectedFiles([]);
            setUploadProgress(0);

            alert('上傳成功！');
        } catch (error) {
            console.error('Upload error:', error);
            alert('上傳失敗，請稍後再試');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (canUpload) {
            handleFileSelect(e.dataTransfer.files);
        }
    };

    return (
        <div
            className="space-y-8 animate-enter pb-10 relative"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Drag overlay */}
            {isDragging && canUpload && (
                <div className="fixed inset-0 z-50 bg-lime-400/20 backdrop-blur-sm flex items-center justify-center pointer-events-none">
                    <div className="bg-white dark:bg-zinc-900 p-12 rounded-3xl border-4 border-dashed border-lime-400 shadow-2xl">
                        <Upload size={64} className="text-lime-500 mx-auto mb-4" />
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">放開以上傳圖片</p>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white">媒體庫</h2>
                    <p className="text-slate-400 dark:text-zinc-500 mt-2 text-sm font-medium">集中管理所有團隊的圖片資源</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Team Filter */}
                    <select
                        value={selectedTeam}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                        className="px-4 py-3 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-white focus:border-lime-500 outline-none shadow-sm"
                    >
                        <option value="">全部團隊</option>
                        {teams.map(team => (
                            <option key={team} value={team}>{team}</option>
                        ))}
                    </select>

                    {/* Search */}
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 group-focus-within:text-lime-500 dark:group-focus-within:text-lime-400 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="搜尋檔名..."
                            className="pl-12 pr-4 py-3 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-white w-full md:w-64 focus:border-lime-500 outline-none shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Upload Button */}
                    {canUpload && (
                        <label className="px-5 py-3 bg-lime-400 text-black rounded-2xl text-sm font-bold hover:bg-lime-500 transition-all cursor-pointer flex items-center gap-2 shadow-sm">
                            <Upload size={18} />
                            上傳圖片
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileSelect(e.target.files)}
                            />
                        </label>
                    )}
                </div>
            </div>

            {filteredMedia.length > 0 ? (
                <div className="columns-1 md:columns-3 lg:columns-4 gap-6 space-y-6">
                    {filteredMedia.map((item) => (
                        <div key={item.id} className="break-inside-avoid relative group rounded-2xl overflow-hidden cursor-zoom-in border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] shadow-sm hover:shadow-lg dark:hover:shadow-lime-400/10 transition-all" onClick={() => setPreviewImage(item.url)}>
                            <img src={item.url} alt={item.fileName} className="w-full h-auto object-cover" />

                            {/* Overlay Info */}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                <h4 className="text-white font-bold text-sm truncate">{item.fileName}</h4>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-slate-300 text-xs truncate max-w-[70%]">{item.team}</span>
                                    <span className="text-slate-400 text-[10px]">{new Date(item.uploadedAt).toLocaleDateString()}</span>
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
                        <Folder size={40} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-500 dark:text-zinc-500">沒有找到圖片</h3>
                    <p className="text-sm">試試看不同的關鍵字或團隊篩選</p>
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && createPortal(
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => !isUploading && setShowUploadModal(false)}>
                    <div className="bg-white dark:bg-[#18181b] rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">上傳圖片到媒體庫</h3>
                            {!isUploading && (
                                <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            )}
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Image Previews */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-3">預覽圖片 ({selectedFiles.length})</label>
                                <div className="grid grid-cols-3 gap-4">
                                    {selectedFiles.map((file, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-800">
                                            <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Team Selection */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2">選擇團隊 *</label>
                                <select
                                    value={uploadTeam}
                                    onChange={(e) => setUploadTeam(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-2 ring-lime-400"
                                    disabled={isUploading}
                                >
                                    <option value="">請選擇團隊</option>
                                    {teams.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Progress */}
                            {isUploading && (
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-zinc-400 mb-2">
                                        <span>上傳中...</span>
                                        <span>{Math.round(uploadProgress)}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-lime-400 transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-slate-200 dark:border-zinc-800 flex gap-3">
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="flex-1 px-6 py-3 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-white rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                                disabled={isUploading}
                            >
                                取消
                            </button>
                            <button
                                onClick={handleUpload}
                                className="flex-1 px-6 py-3 bg-lime-400 text-black rounded-xl font-bold hover:bg-lime-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                disabled={isUploading || !uploadTeam || selectedFiles.length === 0}
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        上傳中...
                                    </>
                                ) : (
                                    <>
                                        <Upload size={18} />
                                        上傳 {selectedFiles.length} 張圖片
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
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
