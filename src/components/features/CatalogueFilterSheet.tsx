'use client';

import { ExploreFilterModal } from '@/components/features/ExploreFilterModal';
import { useExploreFilters } from '@/components/features/ExploreFiltersProvider';

export interface CatalogueFilterSheetProps {
  open: boolean;
  onClose: () => void;
  /**
   * Live result count for the primary CTA. Defaults to the count the catalogue
   * publishes to ExploreFiltersContext, so callers normally omit it.
   */
  resultCount?: number;
}

/**
 * The one filter sheet used by every catalogue surface (homepage,
 * /explore, legacy catalogue). It reads the shared filter state itself and
 * renders the shared ExploreFilterModal, so callers only own the open state:
 *
 *   const [open, setOpen] = useState(false);
 *   <CatalogueFilterSheet open={open} onClose={() => setOpen(false)} />
 *
 * "Clear all" is defined here once, so every surface resets the same fields.
 */
export function CatalogueFilterSheet({ open, onClose, resultCount }: CatalogueFilterSheetProps) {
  const {
    transferIncluded,
    setTransferIncluded,
    selfDriveOnly,
    setSelfDriveOnly,
    bestSellerOnly,
    setBestSellerOnly,
    freeCancellationOnly,
    setFreeCancellationOnly,
    instantConfirmationOnly,
    setInstantConfirmationOnly,
    durationBucket,
    setDurationBucket,
    maxPriceIdr,
    setMaxPriceIdr,
    minRating,
    setMinRating,
    selectedCategory,
    setSelectedCategory,
    setSortBy,
    resultCount: liveResultCount,
  } = useExploreFilters();

  return (
    <ExploreFilterModal
      open={open}
      onClose={onClose}
      transferIncluded={transferIncluded}
      onTransferIncludedChange={setTransferIncluded}
      selfDriveOnly={selfDriveOnly}
      onSelfDriveChange={setSelfDriveOnly}
      bestSeller={bestSellerOnly}
      onBestSellerChange={setBestSellerOnly}
      freeCancellationOnly={freeCancellationOnly}
      onFreeCancellationChange={setFreeCancellationOnly}
      instantConfirmationOnly={instantConfirmationOnly}
      onInstantConfirmationChange={setInstantConfirmationOnly}
      durationBucket={durationBucket}
      onDurationBucketChange={setDurationBucket}
      maxPriceIdr={maxPriceIdr}
      onMaxPriceChange={setMaxPriceIdr}
      minRating={minRating}
      onMinRatingChange={setMinRating}
      selectedCategory={selectedCategory}
      onCategorySelect={setSelectedCategory}
      resultCount={resultCount ?? liveResultCount}
      onClearAll={() => {
        setTransferIncluded(false);
        setSelfDriveOnly(false);
        setBestSellerOnly(false);
        setFreeCancellationOnly(false);
        setInstantConfirmationOnly(false);
        setDurationBucket('any');
        setMaxPriceIdr(null);
        setMinRating(null);
        setSelectedCategory(null);
        setSortBy('recommended');
      }}
    />
  );
}
