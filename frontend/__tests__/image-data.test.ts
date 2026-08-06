import { imageAssetToDataUrl } from '@/src/utils/image-data';

describe('imageAssetToDataUrl', () => {
  it('uses picker base64 data without reading a local URI', async () => {
    await expect(imageAssetToDataUrl({
      uri: 'file:///temporary/image.jpg',
      base64: 'ZmFrZQ==',
      mimeType: 'image/jpeg',
    })).resolves.toBe('data:image/jpeg;base64,ZmFrZQ==');
  });

  it('converts a readable image response to a data URL', async () => {
    const originalFetch = global.fetch;
    const originalFileReader = global.FileReader;
    const readAsDataURL = jest.fn(function (this: {
      result: string | null;
      onloadend?: () => void;
    }) {
      this.result = 'data:image/png;base64,ZmFrZQ==';
      this.onloadend?.();
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      blob: jest.fn().mockResolvedValue(new Blob(['fake image'], { type: 'image/png' })),
    }) as unknown as typeof fetch;
    global.FileReader = jest.fn(() => ({
      result: null,
      onloadend: undefined,
      onerror: undefined,
      readAsDataURL,
    })) as unknown as typeof FileReader;

    await expect(imageAssetToDataUrl({ uri: 'https://cdn.example/image.png' }))
      .resolves.toBe('data:image/png;base64,ZmFrZQ==');

    global.fetch = originalFetch;
    global.FileReader = originalFileReader;
  });

  it('rejects when the selected image cannot be read', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;
    await expect(imageAssetToDataUrl({ uri: 'file:///missing.jpg' }))
      .rejects.toThrow('Unable to read the selected image.');
  });
});