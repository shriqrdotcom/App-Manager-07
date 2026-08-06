import { menuApi } from '@/src/api/menu';
import { apiFetch } from '@/src/api/client';

jest.mock('@/src/api/client', () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

describe('menuApi', () => {
  beforeEach(() => {
    mockApiFetch.mockResolvedValue({} as never);
  });

  it('loads the versioned menu with the permanent restaurant UID', async () => {
    await menuApi.getMenu('1234567890', {
      page: 2,
      limit: 25,
      search: 'naan',
      includeArchived: true,
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/mobile/v1/menu?operation=getMenu&restaurantUid=1234567890&page=2&limit=25&search=naan&includeArchived=true',
    );
  });

  it('persists availability through the production operation', async () => {
    await menuApi.setAvailability(
      '1234567890',
      '8f7d7d7d-7d7d-4d7d-8d7d-7d7d7d7d7d7d',
      false,
    );

    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/mobile/v1/menu?operation=setAvailability&itemId=8f7d7d7d-7d7d-4d7d-8d7d-7d7d7d7d7d7d',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          restaurantUid: '1234567890',
          available: false,
        }),
      }),
    );
  });

  it('uses the item endpoint for updates without trusting a client restaurant UUID', async () => {
    await menuApi.updateItem(
      '1234567890',
      '8f7d7d7d-7d7d-4d7d-8d7d-7d7d7d7d7d7d',
      { name: 'Garlic Naan', price: 120 },
    );

    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/mobile/v1/menu?operation=updateItem&itemId=8f7d7d7d-7d7d-4d7d-8d7d-7d7d7d7d7d7d',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          restaurantUid: '1234567890',
          item: { name: 'Garlic Naan', price: 120 },
        }),
      }),
    );
  });
});