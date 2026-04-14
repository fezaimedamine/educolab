import './ImagePreviewModal.css';

export default function ImagePreviewModal({ url, fileName, onClose }) {
  return (
    <div className="image-preview-backdrop" onClick={onClose}>
      <div className="image-preview-modal" onClick={e => e.stopPropagation()}>
        <div className="image-preview-header">
          <span className="image-preview-title">{fileName}</span>
          <button className="image-preview-close" onClick={onClose}>✕</button>
        </div>
        <div className="image-preview-body">
          <img src={url} alt={fileName} />
        </div>
      </div>
    </div>
  );
}