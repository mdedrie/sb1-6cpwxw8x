import { useState, useMemo } from 'react';
import type { Configuration } from '../../../types';

type SortKey = 'name' | 'date' | 'size' | 'price';

export function useCatalogFilters(configurations: Configuration[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCatalogOnly, setShowCatalogOnly] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>('date');

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    configurations.forEach(config => {
      config.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [configurations]);

  const filteredConfigurations = useMemo(() => {
    const filtered = configurations.filter((config) => {
      const search = searchTerm.trim().toLowerCase();
      const name = config.name ?? '';
      const desc = config.description ?? '';

      const matchesSearch =
        !search || name.toLowerCase().includes(search) || desc.toLowerCase().includes(search);

      const matchesCatalog = !showCatalogOnly || config.is_catalog;
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every(tag => config.tags?.includes(tag));

      return matchesSearch && matchesCatalog && matchesTags;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name': {
          const nameA = a.name ?? '';
          const nameB = b.name ?? '';
          return nameA.localeCompare(nameB);
        }

        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

        case 'size': {
          const volume = (conf: Configuration) =>
            conf.dimensions?.outer_height && conf.dimensions?.outer_width && conf.dimensions?.outer_depth
              ? conf.dimensions.outer_height * conf.dimensions.outer_width * conf.dimensions.outer_depth
              : 0;
          return volume(b) - volume(a);
        }

        case 'price':
          return (b.sell_price ?? 0) - (a.sell_price ?? 0);

        default:
          return 0;
      }
    });

    return sorted;
  }, [searchTerm, showCatalogOnly, selectedTags, sortBy, configurations]);

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
    filteredConfigurations,
  };
}
