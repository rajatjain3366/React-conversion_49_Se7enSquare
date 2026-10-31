import React from 'react';

/**
 * Banner image preview and file upload button.
 * Preserves separate backgroundColor and backgroundImage to avoid shorthand override.
 */
export default function BannerUpload({ banner, onUpload }) {
  return (
    <div className="banner-upload">
      <div
        className="current-banner"
        style={{
          // Gradient (from the Create wizard) is used as-is; an uploaded image
          // URL is wrapped in url(). url(linear-gradient(...)) rendered blank.
          backgroundImage: !banner ? 'none' : banner.includes('gradient(') ? banner : `url(${banner})`,
          backgroundColor: banner ? 'transparent' : 'rgba(255,255,255,0.05)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          height: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          color: '#aaa',
        }}
      >
        {!banner && 'No Banner Uploaded'}
      </div>
      <label
        className="btn btn-muted"
        style={{ cursor: 'pointer', marginTop: '8px', display: 'inline-block' }}
      >
        Upload Banner
        <input
          type="file"
          accept=".png,.jpg,.jpeg,.webp"
          hidden
          onChange={onUpload}
        />
      </label>
    </div>
  );
}
