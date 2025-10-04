import axios from "axios";
import * as cheerio from 'cheerio';
import { extractPrice , extractCurrency, extractDescription } from "../utils";
export async function scrapeAmazonProduct(url: string){
    if(!url) return;
    // BrightData proxy configuration

    // curl -i --proxy brd.superproxy.io:33335 --proxy-user brd-customer-hl_e5f6fe69-zone-pricewise:yx67j0ufh851 -k "https://geo.brdtest.com/welcome.txt?product=resi&method=native"

    const username = String(process.env.BRIGHT_DATA_USERNAME);
    const password = String(process.env.BRIGHT_DATA_PASSWORD);
    const port = 33335;
    const session_id = (1000000 * Math.random()) | 0;
    const options = {
        auth: {
            username: `${username}-session-${session_id}`,
            password,
        },
        host: 'brd.superproxy.io',
        port,
        rejectUnauthorized: false
    }

    try {
        // Fetch the product page
        const response  = await axios.get(url, options);

        const $ = cheerio.load(response.data);

        //Extract the product title

        const title = $('#productTitle').text().trim();
        const currentPrice = extractPrice(
            $('.priceToPay span.a-price-whole'),
            $('a.size.base.a-color-price'),
            $('.a-button-selected .a-color-base'),
        );
        const originalPrice = extractPrice(
            $('#priceblock_ourprice'),
            $('.a-price.a-text-price span.a-offscreen'),
            $('#listPrice'),
            $('#priceblock_dealprice'),
            $('.a-size-base.a-color-price'),
        )
        const outOfStock = $('#availability span').text().trim().toLowerCase().includes('currently unavailable');
        const images = 
            $('#imgBlkFront').attr('data-a-dynamic-image') || 
            $('#landingImage').attr('data-a-dynamic-image') || 
            '{}';
        const imageUrls = Object.keys(JSON.parse(images));
        const currency = extractCurrency($('.a-price-symbol'));
        const discountRate = $('.savingsPercentage').text().replace(/[-%]/g, "");
        const totalStars = $('#averageCustomerReviews span.a-color-base').text().trim().match(/(\d+(\.\d+)?)/);
        const starRating = totalStars ? parseFloat(totalStars[1]) : null;
        const totalReviews = $('#averageCustomerReviews span.a-size-base').text().trim().match(/(\d{1,3}(?:,\d{3})*)\s+ratings/i);
        const ratingsCount = totalReviews ? parseInt(totalReviews[1].replace(/,/g, ""), 10) : null;
        const brand = $('.po-brand span.po-break-word').text().trim()
        const description = extractDescription($)
        //Cosntruct data object with scraped information
        const data = {
            url,
            currency: currency || '$',
            image: imageUrls[0],
            title,
            currentPrice: Number(currentPrice) || Number(originalPrice),
            originalPrice: Number(originalPrice) || Number(currentPrice),
            priceHistory: [],
            discountRate: Number(discountRate),
            BrandName: brand,
            reviewsCount: ratingsCount,
            stars: starRating,
            isOutOfStock: outOfStock,
            description,
            lowestPrice: Number(currentPrice) || Number(originalPrice),
            highestPrice: Number(originalPrice) || Number(currentPrice),
            averagePrice: Number(currentPrice) || Number(originalPrice),
        }
        return data;
    } catch (error: any) {
        throw new Error(`Failed to scrape Product: ${error.message}`)
    }
}
// 7c7773eb4986c83adaf5bd14cb54678020b350f7333720bd5bb51a7c1540d4af