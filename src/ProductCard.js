import React, { useState, useEffect } from 'react';

const ProductCard = ({ index, product, liked, handleWishlist, setshowWebView, setwebViewUrl }) => {    

    const productSource = (product.itemLink) ? product.itemLink.includes('myntra')
        ? 'myntra.png'
        : product.itemLink.includes('amazon')
        ? 'amazon.jpg'
        : product.itemLink.includes('flipkart')
        ? 'flipkart.png'
        : product.itemLink.includes('ajio')
        ? 'ajio.webp'
        : 'Other'
    : ''
    ;

    // console.log(product.imageUrl)

    return (
    <div className="border mt-0 rounded-lg shadow-lg overflow-hidden relative group">
      {/* <div
        className="h-48 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${product.imageUrl})` }}
      > */}
      <div className='relative'>
        <img className='w-full h-auto' src={product.imageUrl} />
        <div className='absolute top-0 left-0 w-full h-full bg-white opacity-0 group-hover:opacity-80'></div>
        <div className="absolute top-2 left-2 text-gray-900 font-semibold p-2 rounded-full  text-shadow-md transition-all duration-300 opacity-0 group-hover:opacity-100">
          {index + 1}
        </div>
        <button
          onClick={() => handleWishlist(product)} // Function to add the product to wishlist
          className="absolute top-2 right-2 p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100" // Visibility on hover
        >
          { (!liked) ? <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
          viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" 
          stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
          </svg> : 
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart-off"><line x1="2" y1="2" x2="22" y2="22"/><path d="M16.5 16.5 12 21l-7-7c-1.5-1.45-3-3.2-3-5.5a5.5 5.5 0 0 1 2.14-4.35"/><path d="M8.76 3.1c1.15.22 2.13.78 3.24 1.9 1.5-1.5 2.74-2 4.5-2A5.5 5.5 0 0 1 22 8.5c0 2.12-1.3 3.78-2.67 5.17"/></svg>}
        </button>
        <button
          onClick={() => {setwebViewUrl(product.itemLink); setshowWebView(true)}} // Function to add the product to wishlist
          className="absolute bottom-2 right-2 left-2 p-2 font-semibold text-sm bg-transparent rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100" // Visibility on hover
        >VIEW PAGE</button>

      </div>
      <div className="p-4 grid place-content-between min-h-68">
        <div className=''>
            
            {product.brand ? <h2 className="text-xs text-gray-500 font-semibold mb-0 [overflow-wrap:anywhere]">{product.brand}</h2>
            : ''}
        </div>
        <div className=''>
            <a
            href={product.itemLink}
            className=""
            target="_blank"  // Opens the link in a new tab
            rel="noopener noreferrer"  // Security measure for external links
            >
            {product.productTitle ? <h2 className="text-base font-semibold mb-2 [overflow-wrap:anywhere]">{product.productTitle}</h2>
            : <span className='text-xs text-gray-600'>Sponsored</span>}</a>
        </div>
        <div className=''>
            <p className="text-sm text-gray-600 font-semibold mb-2">
            {parseFloat(product.discountedPrice) != 0 && (
            <span className='mr-3'>Rs. {product.discountedPrice}</span>
            )}
            {parseFloat(product.price) != 0 && (
                <span className='font-light'><s>Rs. {product.price}</s></span>
            )}
            </p>
            {parseFloat(product.rating) != 0 && (
            <p className="text-xs font-bold mb-2 [overflow-wrap:anywhere]">{product.rating} <span className='text-yellow-400'>⭐</span> {parseFloat(product.ratingCount) != 0 ? `(${product.ratingCount})` : ''}</p>
            )}
            {/* <p className="text-gray-700 font-bold mb-2">{productSource}</p> Display product source */}
        </div>
        <div className="mt-3">
          <img src={`${process.env.PUBLIC_URL}/images/logos/${productSource}`} class="h-10 w-10" />
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
