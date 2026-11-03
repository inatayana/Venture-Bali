import {
  aspectCropWarning,
  planDimensions,
  PRODUCT_MAX_BYTES,
  qualityLadder,
  shrinkEdges,
} from './compressImage';

describe('planDimensions', () => {
  it('scales down to the max edge and keeps the aspect ratio', () => {
    expect(planDimensions(3000, 2000, 1600)).toEqual({ width: 1600, height: 1067 });
    expect(planDimensions(2000, 3000, 1600)).toEqual({ width: 1067, height: 1600 });
  });

  it('never upscales a smaller photo', () => {
    expect(planDimensions(900, 600, 1600)).toEqual({ width: 900, height: 600 });
  });

  it('keeps dimensions at least 1px', () => {
    expect(planDimensions(1, 1, 1600)).toEqual({ width: 1, height: 1 });
  });
});

describe('qualityLadder', () => {
  it('descends in 0.10 steps and ends at the minimum', () => {
    expect(qualityLadder()).toEqual([0.82, 0.72, 0.62, 0.52, 0.45]);
  });

  it('honours custom bounds', () => {
    expect(qualityLadder(0.9, 0.6)).toEqual([0.9, 0.8, 0.7, 0.6]);
  });
});

describe('shrinkEdges', () => {
  it('shrinks by 15% steps down to the floor', () => {
    expect(shrinkEdges(1600, 800)).toEqual([1600, 1360, 1156, 983, 836, 800]);
  });

  it('returns just the floor when maxEdge equals it', () => {
    expect(shrinkEdges(800, 800)).toEqual([800]);
  });
});

describe('aspectCropWarning', () => {
  it('stays silent for photos close to 3:2', () => {
    expect(aspectCropWarning(1600, 1067)).toBeNull();
    expect(aspectCropWarning(1600, 1200)).toBeNull(); // 4:3 crops only 11%
  });

  it('warns about portrait photos losing the top and bottom', () => {
    expect(aspectCropWarning(1080, 1920)).toMatch(/top and bottom/i);
    expect(aspectCropWarning(1080, 1920)).toMatch(/63%/);
    expect(aspectCropWarning(1080, 1920)).toMatch(/1080×1920/);
  });

  it('warns about extra-wide photos losing the sides', () => {
    expect(aspectCropWarning(1920, 810)).toMatch(/sides/i);
  });

  it('ignores degenerate dimensions', () => {
    expect(aspectCropWarning(0, 0)).toBeNull();
  });
});

describe('product master budget', () => {
  it('keeps the 300 KB master budget from the media architecture memo', () => {
    expect(PRODUCT_MAX_BYTES).toBe(300 * 1024);
  });
});
