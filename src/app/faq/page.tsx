export default function FAQPage() {
  const faqs = [
    {
      q: 'How does CardFlow work?',
      a: 'Drop sports card images into your designated scan folder. CardFlow uses AI image recognition to identify the card (player, year, brand, set, parallel, condition), looks up recent eBay sold prices for comparable cards, then auto-generates draft listings with recommended pricing for both auction and buy-it-now formats.',
    },
    {
      q: 'What image formats are supported?',
      a: 'JPG, JPEG, PNG, WebP, and GIF. For best results, use clear, well-lit photos with the full card visible. Front-only images work — back scans improve accuracy for identifying card numbers and parallels.',
    },
    {
      q: 'How does pricing work?',
      a: 'CardFlow searches eBay completed/sold listings for comparable cards. Auction start prices default to 70% of the median sold price. Buy-it-now prices use the median (or +10% if the card is trending up). You can edit prices before publishing.',
    },
    {
      q: 'What happens to my card images after scanning?',
      a: 'Successfully scanned cards that generate draft listings have their source image deleted from the watch folder. Cards that cannot be identified are moved to an "unknown" subfolder for manual review. No images are shared with third parties.',
    },
    {
      q: 'What are the tier limits?',
      a: 'Free: 2 scans/day. Premium ($9.99/mo): 25 scans/day, 200/month. Pro ($29.99/mo): 100 scans/day, 1,000 listings/month. Each scan processes one card image.',
    },
    {
      q: 'Do I need an eBay developer account?',
      a: 'Yes. CardFlow uses the official eBay API to create listings on your behalf. You need to register at developer.ebay.com (free) and connect your seller account through our Settings page. This ensures all listings comply with eBay API policies.',
    },
    {
      q: 'Is my eBay account safe?',
      a: 'CardFlow uses official eBay OAuth 2.0 authentication. We never see your eBay password. You authorize CardFlow through eBay\'s own consent screen, and you can revoke access at any time from your eBay account settings.',
    },
    {
      q: 'Can I edit listings before publishing?',
      a: 'Yes. All listings are created as drafts first. You can edit the title, price, description, and listing type before publishing to eBay.',
    },
    {
      q: 'What sports are supported?',
      a: 'Baseball, basketball, football, hockey, and soccer. The AI can identify cards from major manufacturers including Topps, Panini, Upper Deck, Bowman, and others.',
    },
    {
      q: 'How do I cancel my subscription?',
      a: 'Go to Settings and click "Manage Subscription" to access the Stripe billing portal. You can cancel anytime and retain access until the end of your billing period.',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Frequently Asked Questions</h1>
      <p className="text-slate-500 text-sm mb-8">
        Questions about CardFlow? Find answers below or contact{' '}
        <a href="mailto:aethercoreai@outlook.com" className="text-blue-600 hover:underline">
          aethercoreai@outlook.com
        </a>
      </p>

      <div className="space-y-6">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-white rounded-lg border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-2">{faq.q}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
