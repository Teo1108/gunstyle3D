import { useState } from 'react';

export function useProductGallery(images = []) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectedImage = images[selectedIndex] || null;

  const selectImage = (index) => {
    if (index >= 0 && index < images.length) setSelectedIndex(index);
  };

  return { selectedIndex, selectedImage, selectImage, total: images.length };
}
