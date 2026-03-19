# Zillow API Integration for LandlordBot

## Overview

LandlordBot now integrates with Zillow's APIs to provide real-time market insights, rent estimates, and comparable rental data. This integration helps landlords make data-driven decisions about pricing and market positioning.

## API Options

### 1. Bridge Interactive API (Recommended)
- **Best for**: Rental market data and property information
- **Free tier**: 1,000 API calls/month
- **Sign up**: https://www.bridgeinteractive.com/
- **Features**: 
  - Real-time rental listings
  - Property details
  - Market trends
  - Comparable rentals

### 2. Zillow Data API
- **Best for**: Property valuations and Zestimates
- **Free tier**: Limited, requires approval
- **Sign up**: https://www.zillow.com/howto/api/APIOverview.htm
- **Features**:
  - Zestimate values
  - Property details
  - Historical data

## Environment Variables

Add these to your `.env` file:

```bash
# Zillow Bridge Interactive API (Recommended)
VITE_ZILLOW_BRIDGE_API_KEY=your_bridge_api_key_here

# Zillow Data API (Alternative)
VITE_ZILLOW_DATA_API_KEY=your_zillow_api_key_here
```

## Getting Your API Keys

### Bridge Interactive API

1. Visit https://www.bridgeinteractive.com/
2. Click "Get Started" or "Sign Up"
3. Create an account with your business email
4. Complete the application form:
   - Company: Your property management company name
   - Use case: "Property management and rental market analysis"
   - Expected volume: "1,000 calls/month or less"
5. Wait for approval (typically 1-2 business days)
6. Once approved, copy your API key from the dashboard
7. Add to your `.env` file as `VITE_ZILLOW_BRIDGE_API_KEY`

### Zillow Data API

1. Visit https://www.zillow.com/howto/api/APIOverview.htm
2. Click "Sign up for the Zillow API"
3. Create a Zillow account or sign in
4. Fill out the API access request form:
   - Describe your use case
   - Explain how you'll use the data
   - Provide your website/app information
5. Wait for approval (can take several days)
6. Once approved, generate your ZWS-ID
7. Add to your `.env` file as `VITE_ZILLOW_DATA_API_KEY`

## Features

### 1. Rent Estimator (`RentEstimator` component)
- Input property address, beds, baths
- Get instant rent estimate with confidence level
- Compare your rent vs market rate
- See potential annual income increase
- View comparable properties

### 2. Comparable Rentals (`ComparableRentals` component)
- Display nearby rentals from Zillow
- Filter by rent range, beds, baths, distance
- Sort by distance, rent, or days on market
- See market comparison indicators
- Map view (coming soon)

### 3. Market Trends
- Real-time market data by zip code
- Historical trends (1mo, 3mo, 6mo, 12mo)
- Vacancy rates
- Days on market averages
- Market forecasts

### 4. Rent Gap Analysis
- "Am I charging market rate?" feature
- Compare current rent to market median
- Calculate potential annual increase
- Get personalized recommendations

## API Usage & Caching

### Rate Limits
- **Free tier**: 1,000 calls/month (sufficient for MVP)
- **Paid tier**: Available for higher volume

### Caching Strategy
The service implements intelligent caching to minimize API calls:
- **Cache duration**: 24 hours
- **Cache keys**: Based on address + parameters
- **Cache storage**: In-memory (resets on page reload)

### Estimated Usage
For a typical landlord with 5 units:
- Initial load: 5 API calls (one per unit)
- Daily refresh: 5 API calls
- Monthly total: ~150 calls
- Well within free tier limits!

## Fallback Behavior

If no API keys are configured, the service uses:
- **NYC market data**: Pre-loaded rent data by zip code
- **Estimated values**: Based on neighborhood and bedroom count
- **Mock comparables**: Generated from market averages

This ensures the app remains functional even without API keys.

## NYC-Specific Considerations

Zillow data may not be 100% accurate for NYC due to:
- Co-op vs condo pricing differences
- Rent-stabilized units
- Unique NYC building types
- Limited data in outer boroughs

**Recommendation**: Use Zillow data as a reference point, not absolute truth. Cross-reference with:
- StreetEasy
- RentHop
- Local market knowledge
- Recent comparable leases

## Testing

### Test the Integration

1. Add your API key to `.env`
2. Restart the development server
3. Navigate to Market Insights
4. Check the data source indicator (should show "Live market data")

### Test Without API Keys

1. Remove API keys from `.env`
2. Restart the development server
3. Navigate to Market Insights
4. Check the data source indicator (should show "Using estimated data")

## Troubleshooting

### "API Key Invalid" Error
- Verify the key is copied correctly
- Check for extra spaces
- Ensure you're using the right key (Bridge vs Data API)

### "Rate Limit Exceeded" Error
- Wait for the rate limit to reset
- Check your usage in the API dashboard
- Consider upgrading to paid tier

### No Data Showing
- Check browser console for errors
- Verify address format (should include zip code)
- Try a different address

### Cache Issues
- Clear browser cache
- Or use `clearZillowCache()` in console

## Security Notes

- **Never commit API keys** to version control
- Use `.env.local` for local development
- Use environment variables in production
- Rotate keys periodically
- Monitor usage for unexpected spikes

## Support

For API issues:
- Bridge Interactive: support@bridgeinteractive.com
- Zillow API: https://www.zillow.com/howto/api/APIOverview.htm

For LandlordBot integration issues:
- Check the GitHub issues
- Review this documentation
- Contact the development team

## Future Enhancements

Planned improvements:
- [ ] Map view for comparables
- [ ] Historical rent tracking
- [ ] Automated rent adjustment suggestions
- [ ] Integration with more data sources (Rentometer, etc.)
- [ ] Market alert notifications
- [ ] Export data to CSV

## Changelog

### v1.0.0 (2026-03-14)
- Initial Zillow API integration
- Rent Estimator component
- Comparable Rentals component
- Market Trends page
- Rent Gap Analysis feature
- 24-hour caching system
