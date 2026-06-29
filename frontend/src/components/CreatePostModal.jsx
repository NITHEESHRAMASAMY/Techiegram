import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createPost, clearPostErrors } from '../store/slices/postSlice';
import { X, Upload, Image, Video, Terminal, AlertTriangle } from 'lucide-react';

export default function CreatePostModal({ isOpen, onClose }) {
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [fileType, setFileType] = useState('');
  const [localError, setLocalError] = useState('');

  const fileInputRef = useRef(null);
  const dispatch = useDispatch();
  const { uploading, error } = useSelector((state) => state.posts);

  useEffect(() => {
    dispatch(clearPostErrors());
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [dispatch, previewUrl]);

  const handleFileChange = (e) => {
    setLocalError('');
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Check size limit: 100MB
    if (selectedFile.size > 100 * 1024 * 1024) {
      setLocalError('Media file must be less than 100MB');
      return;
    }

    const type = selectedFile.type.startsWith('video/') ? 'video' : 'image';
    setFileType(type);
    setFile(selectedFile);

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const extractHashtags = (text) => {
    return (text.match(/#\w+/g) || []).map((tag) => tag.toLowerCase());
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!file) {
      setLocalError('Please choose an image or video to upload');
      return;
    }

    const formData = new FormData();
    formData.append('media', file);
    formData.append('caption', caption);

    const result = await dispatch(createPost(formData));
    if (createPost.fulfilled.match(result)) {
      setCaption('');
      setFile(null);
      setPreviewUrl('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-cyber-bg/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="glass-card w-full max-w-lg relative z-10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up border-cyber-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyber-border/60 bg-cyber-card bg-opacity-50">
          <div className="flex items-center gap-2 text-cyber-accent">
            <Terminal size={18} />
            <span className="font-bold text-white text-sm uppercase tracking-wider">
              Publish Code & Visuals
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-cyber-gray hover:text-white hover:bg-cyber-hover transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handlePublish} className="flex-1 overflow-y-auto p-6 space-y-6">
          {(error || localError) && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-sm flex items-start gap-3">
              <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={16} />
              <span>{localError || error}</span>
            </div>
          )}

          {/* Media Upload Area */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-cyber-gray">
              Technical Media (Image/Video)
            </label>

            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-cyber-border hover:border-cyber-accent rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-cyber-hover/30 transition-all duration-300 group"
              >
                <div className="p-3.5 rounded-xl bg-cyber-card text-cyber-gray group-hover:text-cyber-accent group-hover:scale-110 transition-all duration-300">
                  <Upload size={24} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">Drag & drop or browse files</p>
                  <p className="text-xs text-cyber-gray mt-1">Supports PNG, JPG, WEBP, MP4 (Max 100MB)</p>
                </div>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-cyber-border bg-cyber-bg max-h-64 flex items-center justify-center">
                {fileType === 'video' ? (
                  <video src={previewUrl} controls className="w-full max-h-64 object-contain" />
                ) : (
                  <img src={previewUrl} alt="Preview" className="w-full max-h-64 object-contain" />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl('');
                  }}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-cyber-bg/85 border border-cyber-border text-red-400 hover:text-red-300 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,video/*"
              className="hidden"
            />
          </div>

          {/* Caption / Explainer Area */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-cyber-gray">
              Post Explanation & Code Snippets
            </label>
            <textarea
              required
              rows={4}
              placeholder="Explain the technical concepts, architecture, or insert your code block! Use hashtags like #react #systemdesign #cleanarchitecture..."
              className="w-full resize-none font-mono text-sm leading-relaxed"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>

          {/* Live Tags Preview */}
          {caption.includes('#') && (
            <div className="space-y-1.5">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-cyber-accent">
                Detected Hashtags:
              </span>
              <div className="flex flex-wrap gap-2">
                {extractHashtags(caption).map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 text-xs font-mono font-semibold rounded-md bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </form>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-cyber-border/60 bg-cyber-card bg-opacity-50 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary py-2 px-4 text-xs font-bold">
            Cancel
          </button>
          <button
            onClick={handlePublish}
            disabled={uploading}
            className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-cyber-bg border-t-transparent rounded-full animate-spin" />
                <span>Deploying...</span>
              </>
            ) : (
              'Publish to Feed'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
