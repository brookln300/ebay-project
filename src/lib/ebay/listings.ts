import { getEbayClient } from './client';

interface CreateListingParams {
  title: string;
  description_html: string;
  listing_type: 'auction' | 'buy_it_now';
  start_price?: number;
  buy_it_now_price?: number;
  shipping_cost: number;
  category_id: string;
  condition_id: number;
  image_url?: string;
  duration?: string;
  best_offer?: boolean;
}

export async function publishToEbay(params: CreateListingParams): Promise<string | null> {
  const ebay = getEbayClient();

  const listingFormat = params.listing_type === 'auction' ? 'Chinese' : 'FixedPriceItem';
  const duration = params.listing_type === 'auction'
    ? `Days_${params.duration || '7'}`
    : 'GTC';

  const price = params.listing_type === 'auction'
    ? params.start_price || 0.99
    : params.buy_it_now_price || 4.99;

  const item: Record<string, unknown> = {
    Title: params.title,
    Description: `<![CDATA[${params.description_html}]]>`,
    PrimaryCategory: { CategoryID: params.category_id },
    StartPrice: price,
    ConditionID: params.condition_id,
    Country: 'US',
    Currency: 'USD',
    DispatchTimeMax: 3,
    ListingDuration: duration,
    ListingType: listingFormat,
    PaymentMethods: 'PayPal',
    PostalCode: '75001',
    Quantity: 1,
    ShippingDetails: {
      ShippingType: 'Flat',
      ShippingServiceOptions: {
        ShippingServiceCost: params.shipping_cost,
        ShippingService: 'USPSFirstClass',
      },
    },
    ReturnPolicy: {
      ReturnsAcceptedOption: 'ReturnsAccepted',
      ReturnsWithinOption: 'Days_30',
      RefundOption: 'MoneyBack',
      ShippingCostPaidByOption: 'Buyer',
    },
  };

  if (params.image_url) {
    item.PictureDetails = { PictureURL: [params.image_url] };
  }

  if (params.listing_type === 'buy_it_now' && params.best_offer) {
    item.BestOfferDetails = { BestOfferEnabled: true };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await ebay.trading.AddItem({ Item: item } as any);
    return (response as unknown as Record<string, string>)?.ItemID || null;
  } catch (err) {
    console.error('eBay AddItem failed:', err);
    return null;
  }
}
