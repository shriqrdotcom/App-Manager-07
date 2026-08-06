export type ImageAsset = {
  uri: string;
  base64?: string | null;
  mimeType?: string | null;
};

export async function imageAssetToDataUrl(asset: ImageAsset): Promise<string> {
  if (asset.base64) {
    return `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`;
  }

  const response = await fetch(asset.uri);
  if (!response.ok) {
    throw new Error('Unable to read the selected image.');
  }
  const blob = await response.blob();

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string' && reader.result.startsWith('data:')) {
        resolve(reader.result);
      } else {
        reject(new Error('Unable to prepare the selected image.'));
      }
    };
    reader.onerror = () => reject(new Error('Unable to prepare the selected image.'));
    reader.readAsDataURL(blob);
  });
}