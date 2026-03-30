import eBayApi from 'ebay-api';

let ebayClient: InstanceType<typeof eBayApi> | null = null;

export function getEbayClient(): InstanceType<typeof eBayApi> {
  if (!ebayClient) {
    const isSandbox = process.env.EBAY_ENVIRONMENT === 'SANDBOX';

    ebayClient = new eBayApi({
      appId: process.env.EBAY_APP_ID!,
      certId: process.env.EBAY_CERT_ID!,
      devId: process.env.EBAY_DEV_ID!,
      sandbox: isSandbox,
      siteId: eBayApi.SiteId.EBAY_US,
      ruName: process.env.EBAY_REDIRECT_URI!,
    });
  }
  return ebayClient;
}

export function setEbayUserToken(token: string) {
  const client = getEbayClient();
  client.auth.oAuth2.setCredentials(token);
}

export function getEbayAuthUrl(): string {
  const client = getEbayClient();
  return client.auth.oAuth2.generateAuthUrl();
}

export async function exchangeEbayCode(code: string) {
  const client = getEbayClient();
  const token = await client.auth.oAuth2.getToken(code);
  return token;
}
