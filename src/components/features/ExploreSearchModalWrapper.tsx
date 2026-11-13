'use client';

import { useState } from 'react';
import { ExploreSearchBar } from '@/components/features/ExploreSearchBar';
import { SearchModal } from '@/components/features/SearchModal';

interface ExploreSearchModalWrapperProps {
  // vents: VentureItem[]; // reserved for future search filtering
}

export function ExploreSearchModalWrapper({ }: ExploreSearchModalWrapperProps) {
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  return (
    <>
      {/* Search Bar - Airbnb style */}
      <ExploreSearchBar
        onOpenChange={setSearchModalOpen}
      />

      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSearch={() => {}}
      />
    </>
  );
}