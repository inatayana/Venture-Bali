import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhotoUploader } from './ReviewPhotoUploader';

jest.mock('@/lib/compressImage', () => ({
  compressReviewPhoto: jest.fn(async (file: File) => file),
}));

describe('PhotoUploader', () => {
  it('keeps every photo when several are picked in one go', async () => {
    const onChange = jest.fn();
    const uploadFile = jest
      .fn<Promise<string>, [File]>()
      .mockResolvedValueOnce('https://cdn.test/1.webp')
      .mockResolvedValueOnce('https://cdn.test/2.webp');

    const user = userEvent.setup();
    const { container } = render(
      <PhotoUploader photos={[]} onChange={onChange} uploadFile={uploadFile} />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, [
      new File(['a'], 'a.jpg', { type: 'image/jpeg' }),
      new File(['b'], 'b.jpg', { type: 'image/jpeg' }),
    ]);

    await waitFor(() => expect(uploadFile).toHaveBeenCalledTimes(2));
    expect(onChange).toHaveBeenLastCalledWith([
      'https://cdn.test/1.webp',
      'https://cdn.test/2.webp',
    ]);
  });

  it('reports upload failures and stops the uploading state', async () => {
    const onChange = jest.fn();
    const onUploadingChange = jest.fn();
    const uploadFile = jest
      .fn<Promise<string>, [File]>()
      .mockRejectedValueOnce(new Error('Could not upload the photo.'));

    const user = userEvent.setup();
    const { container } = render(
      <PhotoUploader
        photos={[]}
        onChange={onChange}
        uploadFile={uploadFile}
        onUploadingChange={onUploadingChange}
      />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, new File(['a'], 'a.jpg', { type: 'image/jpeg' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not upload the photo.');
    expect(onChange).not.toHaveBeenCalled();
    expect(onUploadingChange).toHaveBeenLastCalledWith(false);
  });
});
