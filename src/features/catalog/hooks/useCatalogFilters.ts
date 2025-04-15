import { useState, useMemo } from 'react';
import type { Configuration } from '../../../types';

export function useCatalogFilters(configurations: Configuration[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCatalogOnly, setShowCatalogOnly] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'price'>('date');

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    configurations.forEach(config => {
      config.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [configurations]);

  const filteredConfigurations = useMemo(() =>
    configurations
      .filter((config) => {
        const matchesSearch = !searchTerm || 
                            config.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            config.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCatalog = !showCatalogOnly || config.is_catalog;
        const matchesTags = selectedTags.length === 0 || 
                           selectedTags.every(tag => config.tags?.includes(tag));
        return matchesSearch && matchesCatalog && matchesTags;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'date':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'size':
            if (!b.dimensions && !a.dimensions) return 0;
            if (!b.dimensions) return 1;
            if (!a.dimensions) return -1;
            const bVolume = b.dimensions.outer_height * b.dimensions.outer_width * b.dimensions.outer_depth;
            const aVolume = a.dimensions.outer_height * a.dimensions.outer_width * a.dimensions.outer_depth;
            return bVolume - aVolume;
          case 'price':
            if (!b.sell_price && !a.sell_price) return 0;
            if (!b.sell_price) return 1;
            if (!a.sell_price) return -1;
            return b.sell_price - a.sell_price;
          default:
            return 0;
        }
      }),
    [searchTerm, showCatalogOnly, selectedTags, sortBy, configurations]
  );

  return {
    searchTerm,
    setSearchTerm,
    showCatalogOnly,
    setShowCatalogOnly,
    selectedTags,
    setSelectedTags,
    sortBy,
    setSortBy,
    allTags,
    filteredConfigurations
  };
}