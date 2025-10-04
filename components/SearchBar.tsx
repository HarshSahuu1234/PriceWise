'use client'
import { scrapeAndStoreProduct } from '@/lib/actions';
import React, { FormEvent } from 'react'
import { useState } from 'react'

const isValidAmazonProductUrl = (url: string) => {
    try{
        const parsedURL = new URL(url);
        const hostname = parsedURL.hostname;

        if(hostname.includes('amazon.com') || hostname.includes('amazon.') || hostname.endsWith('amazon')) {
            return true;
        }
    } catch(error) {
        return false;
    }
    return false
}


const SearchBar = () => {
    const [SearchPrompt, setSearchPrompt] = useState('')
    const [isLoading, setisLoading] = useState(false)

    const handleSubmit = async(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const isValid = isValidAmazonProductUrl(SearchPrompt);

        if(!isValid) return alert('Please provide a valid Amazon Link');

        try {
            setisLoading(true)

            //Scrape the product page
            const product = await scrapeAndStoreProduct(SearchPrompt)
        } catch (error) {
            console.log(error)
        } finally {
            setisLoading(false)
        }
    }

  return (
    <form 
        className='flex flex-wrap gap-4 mt-12' 
        onSubmit={handleSubmit}
    >
        <input 
            type="text" 
            onChange={(e) => setSearchPrompt(e.target.value)}
            placeholder='Enter Product link'
            className='searchbar-input'
        />
        <button 
            type='submit' 
            className='searchbar-btn'
            disabled={SearchPrompt === ''}
        >
            {isLoading ? 'Searching...' : 'Search'}
        </button>
    </form>
  )
}

export default SearchBar
