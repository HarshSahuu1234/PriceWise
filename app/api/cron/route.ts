import Product from "@/lib/models/product.model"
import { connectToDB } from "@/lib/mongoose"
import { generateEmailBody, sendEmail } from "@/lib/nodemailer"
import { scrapeAmazonProduct } from "@/lib/scraper"
import { getLowestPrice, getAveragePrice, getHighestPrice, getEmailNotifType } from "@/lib/utils"
import { NextRequest, NextResponse } from "next/server"
export async function GET() {
    try {
        connectToDB()

        const products = await Product.find({})

        if(!products) throw new Error("No Products found")

        // 1.Scrape Latest product details and update DB
        const updatedProducts = await Promise.all(
            products.map(async (currentProduct) => {
                const scrapedProduct = await scrapeAmazonProduct(currentProduct.url);
                if(!scrapedProduct) throw new Error("No Product found")

                const updatedPriceHistory = [
                    ...currentProduct.priceHistory,
                    {price: scrapedProduct.currentPrice}
                ]
                const product = {
                    ...scrapedProduct,
                    priceHistory: updatedPriceHistory,
                    lowestPrice: getLowestPrice(updatedPriceHistory),
                    highestPrice: getHighestPrice(updatedPriceHistory),
                    averagePrice: getAveragePrice(updatedPriceHistory),
                }
                const updatedProduct = await Product.findOneAndUpdate(
                    { url: scrapedProduct.url },
                    product,
                );

                //2. Check each product status and send email accordingly

                const emailNotifyType = getEmailNotifType(scrapedProduct, currentProduct)
                if(emailNotifyType && updatedProduct.users.length > 0) {
                    const ProductInfo = {
                        title: updatedProduct.title,
                        url: updatedProduct.url,
                    }
                    const emailContent = await generateEmailBody(ProductInfo, emailNotifyType);

                    const userEmails = updatedProduct.users.map((user: any) => user.email)

                    await sendEmail(emailContent, userEmails);
                }
                return updatedProduct
            })
        )
        return NextResponse.json({
            message: 'Ok',
            data: updatedProducts
        })
    } catch (error) {
        throw new Error(`Error in GET: ${error}`)
    }
}