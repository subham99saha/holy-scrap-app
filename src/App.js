import React, { useState, useEffect, useRef } from 'react';
import Modal from 'react-modal';
// import axios from "axios";
import ProductCard from './ProductCard';
import Notif from './components/Notif';
import { Link } from 'react-router-dom';

import sites_config from './config/sites';

const { ipcRenderer } = window.require('electron');
Modal.setAppElement('#root'); // This is required by react-modal

const App = () => {
  const [notifications, setnotifications] = useState([]);
  useEffect(() => {
    // Listen for messages from the backend
    ipcRenderer.on('message-from-backend', (event, message) => {
      // setMessages(prevMessages => [...prevMessages, message]);
      setnotifications((prevNotifications) => [
        ...prevNotifications,
        { id: Date.now(), ...message },
      ]);
    });
    
    console.log({wishList})

    // Cleanup listener when component unmounts
    return () => {
      ipcRenderer.removeAllListeners('message-from-backend');
    };

  }, []);
  const handleRemoveNotification = (id,cancel) => {
    let notifs = [...notifications]
    if (cancel) {
      notifs.splice(id,1)
    } else {
      notifs.splice(0,1)
    }  
    // notifs.splice(notifs.indexOf(id),1)    
    setnotifications(notifs)
  };

  const [sites, setsites] = useState(JSON.parse(localStorage.getItem('sites-config')) || sites_config)
  const [currTab,setcurrTab] = useState('search')
  const [modalIsOpen, setModalIsOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [products, setproducts] = useState(JSON.parse(localStorage.getItem('products')) || []); // Start with null to indicate loading
  const [wishList, setwishList] = useState(JSON.parse(localStorage.getItem('wishlist')) || []);
  const [filter, setfilter] = useState({
    site: ''
  });
  const [loading,setloading] = useState(false)

  const [showWebView,setshowWebView] = useState(false)
  const [webViewUrl,setwebViewUrl] = useState('')

  const processProducts = (data) => {
    setloading(false)
    setproducts((prevProducts) => [...prevProducts, ...data]);
    let prodLocal = JSON.parse(localStorage.getItem('products'))
    localStorage.setItem('products', JSON.stringify([...prodLocal, ...data]));
    // console.log({products})
  };

  const handleSearch = async (searchTerm) => {
    setproducts([])
    localStorage.setItem('products', JSON.stringify([]));
    setcurrTab('search')
    setloading(true)
    console.log('Search started')

    const promises = [];

    if (sites.AMZN.scrape) {
      handleSitesBool('AMZN','loading');
      const amazonScrape = ipcRenderer.invoke('start-scrape', {
        query: searchTerm,
        site: "AMZN",
        distance: sites.AMZN.distance,
        maxtime: sites.AMZN.maxtime,
        maxpages: sites.AMZN.maxpages,
      }).then(result => {
        console.log({amazon: result.message});
        console.log('Amazon scraped');
        handleSitesBool('AMZN','loading');
        processProducts(result.message);
      }).catch(e => {
        console.log({e});
      });
      promises.push(amazonScrape);
    }

    if (sites.FLPKT.scrape) {
      handleSitesBool('FLPKT','loading');
      const flipkartScrape = ipcRenderer.invoke('start-scrape', {
        query: searchTerm,
        site: "FLPKT",
        distance: sites.FLPKT.distance,
        maxtime: sites.FLPKT.maxtime,
        maxpages: sites.FLPKT.maxpages,
      }).then(result => {
        console.log({flipkart: result.message});
        console.log('Flipkart scraped');
        handleSitesBool('FLPKT','loading');
        processProducts(result.message);
      }).catch(e => {
        console.log({e});
      });
      promises.push(flipkartScrape);
    }

    if (sites.MTRA.scrape) {
      handleSitesBool('MTRA','loading');
      const myntraScrape = ipcRenderer.invoke('start-scrape', {
        query: searchTerm,
        site: "MTRA",
        distance: sites.MTRA.distance,
        maxtime: sites.MTRA.maxtime,
        maxpages: sites.MTRA.maxpages,
      }).then(result => {
        console.log({myntra: result.message});
        console.log('Myntra scraped');
        handleSitesBool('MTRA','loading');
        processProducts(result.message);
      }).catch(e => {
        console.log({e});
      });
      promises.push(myntraScrape);
    }

    if (sites.AJIO.scrape) {
      handleSitesBool('AJIO','loading');
      const ajioScrape = ipcRenderer.invoke('start-scrape', {
        query: searchTerm,
        site: "AJIO",
        distance: sites.AJIO.distance,
        maxtime: sites.AJIO.maxtime,
        maxpages: sites.AMZN.maxpages,
      }).then(result => {
        console.log({ajio: result.message});
        console.log('AJIO scraped');
        handleSitesBool('AJIO','loading');
        processProducts(result.message);
      }).catch(e => {
        console.log({e});
      });
      promises.push(ajioScrape);
    }

    // Wait for all scraping promises to resolve
    try {
      await Promise.all(promises);
      console.log('All scraping completed');
    } catch (error) {
      console.log('Error occurred in scraping:', error);
    }


  };

  const handleSort = (by) => {
    let sortedProducts = []
    if (by === 'price') {      
      sortedProducts = [...products].sort((a, b) => parseFloat(a.discountedPrice) - parseFloat(b.discountedPrice));
    } else if (by === 'rating') {
      sortedProducts = [...products].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
    }  else if (by === 'ratingCount') {
      sortedProducts = [...products].sort((a, b) => parseFloat(b.ratingCount) - parseFloat(a.ratingCount));
    } 
    console.log({sortedProducts})
    setproducts(sortedProducts)
  }

  const handleSitesBool = (site,prop) => {
    let newsites = {...sites}
    newsites[site][prop] = !newsites[site][prop]
    setsites(newsites)
  }
  const handleSitesVal = (site,prop,val) => {
    let newsites = {...sites}
    newsites[site][prop] = val
    setsites(newsites)
  }
  
  const showModal = (bl) => {
    setModalIsOpen(bl);
  };

  const handleWishlist = (product) => {
    // Get the current wishlist from localStorage or initialize as an empty array
    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    
    // Check if the product is already in the wishlist
    let check = wishlist.find((o) => o.itemLink === product.itemLink);
  
    if (check !== undefined) {
      // If the product is found, remove it from the wishlist
      wishlist = wishlist.filter((item) => item.itemLink !== product.itemLink);
      setnotifications((prevNotifications) => [
        ...prevNotifications,
        { id: Date.now(), site: product.site, text: `Product removed from wishlist` },
      ]);
      // alert(`${product.productTitle} removed from wishlist!`);
    } else {
      // If the product is not in the wishlist, add it to the wishlist
      wishlist.push(product);
      setnotifications((prevNotifications) => [
        ...prevNotifications,
        { id: Date.now(), site: product.site, text: `Product added to wishlist` },
      ]);
      // alert(`${product.productTitle} added to wishlist!`);
      // Notif({
      //   message: { image: sites[product.site].image, text: `${product.productTitle} added to wishlist!`, head: sites[product.site].name },
      //   onClose: () => handleRemoveNotification(Date.now())
      // })
    }
  
    // Update the localStorage with the new wishlist array
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    
    // Update the state with the new wishlist
    setwishList(wishlist);
  };


  return (<>

    <div className="fixed top-0 right-5 z-50 space-y-4 py-40">
      {notifications.map((notif,idx) => {
        // console.log({notif})
        return <Notif
          key={idx}
          message={{ image: sites[notif.site].image, text: notif.text, head: sites[notif.site].name }}
          // onClose={() => handleRemoveNotification(notif.id)}
          onTimeout={() => handleRemoveNotification(idx,false)}
          onCancel={() => handleRemoveNotification(idx,true)}
        />
      })}
    </div>
    
    <Modal
      isOpen={modalIsOpen}
      // isOpen={true}
      onRequestClose={() => {
        showModal(false);
        localStorage.setItem('sites-config', JSON.stringify(sites));
      }}
      className="outline-none bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl mx-auto mt-20"
      overlayClassName="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center"
      contentLabel="Scrape Settings Modal"
    >
      <div className="mb-4 grid grid-cols-2 place-content-between ">
        <div className="text-lg font-semibold text-gray-700">
          Settings
        </div>
        <div className='grid justify-items-end'>
          <div className="flex">
            {/* <div onClick={() => {console.log({sites_config}); setsites(sites_config)}} className="flex items-center mr-5 text-sm font-semibold text-gray-500 cursor-pointer">
              Clear Cache <svg className="ml-1" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rotate-cw"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
            </div> */}
            <div onClick={() => {console.log({sites_config}); setsites(sites_config)}} className="flex items-center text-sm font-semibold text-gray-500 cursor-pointer">
              <svg className="ml-1" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rotate-cw"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
            </div>
          </div>
        </div>
      </div>
      <div
        className="flex items-center mb-1 space-x-4 font-semibold text-xs"
      >
            {/* Column 1: Image */}
            <div className="flex-1/2 mx-8"></div>
            <div className="flex-1">Scroll stride (pixels)</div>
            <div className="flex-1">Total scroll time (sec)</div>
            <div className="flex-1">Pages</div>
      </div>
      {/* Iterate over the siteData object and render rows */}
      {Object.keys(sites).map((site) => {
        let scrapeClass = sites[site].scrape ? 'shadow shadow-gray-900' : 'grayscale';
        return (
          <div
            key={site}
            className="flex items-center mb-4 space-x-4"
          >
            {/* Column 1: Image */}
            <div className="flex-1/2">
              <div
                key={site}
                onClick={() => handleSitesBool(site,'scrape')}
                className={`cursor-pointer overflow-hidden p-1 mx-3 ${scrapeClass} border rounded-full `}
              >
                <img src={`${process.env.PUBLIC_URL}/images/logos/${sites[site].image}`} alt={site} className="h-7 w-7" />
              </div>
            </div>

            {/* Column 2: Input box */}
            <div className="flex-1">
              <input
                type="number"
                value={sites[site].distance}
                onChange={(e) => handleSitesVal(site,'distance',e.target.value)}
                className="disabled:opacity-25 text-gray-500 text-sm w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!sites[site].lazy}
              />
            </div>

            {/* Column 3: Input box */}
            <div className="flex-1">
              <input
                type="number"
                value={sites[site].maxtime / 1000}
                onChange={(e) => handleSitesVal(site,'maxtime',Number(e.target.value) * 1000)}
                className="disabled:opacity-25 text-gray-500 text-sm w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!sites[site].lazy}
              />
            </div>

            {/* Column 4: Input box */}
            <div className="flex-1">
              <input
                type="number"
                value={sites[site].maxpages}
                onChange={(e) => handleSitesVal(site,'maxpages',e.target.value)}
                className="disabled:opacity-25 text-gray-500 text-sm w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={sites[site].infinite}
              />
            </div>
          </div>
        );
      })}
      <p className="p-3 text-xs text-gray-400">
        Scroll stride indicates distance covered per scroll. Each page will be scrolled until the total scroll time or the end of the page, whichever is reached first.
      </p>

      {/* <button
        onClick={() => showModal(false)}
        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 mt-4"
      >
        Close
      </button> */}
    </Modal>
    <nav className="shadow-xl bg-white border-gray-200 dark:bg-gray-900 fixed top-0 left-0 right-0 z-50">
      {/* Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between p-4 px-10">
        {/* Logo Section */}
        {/* <a href="https://flowbite.com/" className="flex items-center space-x-3 rtl:space-x-reverse">
          <img src="https://flowbite.com/docs/images/logo.svg" className="h-8" alt="Flowbite Logo" />
          <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">
            Flowbite
          </span>
        </a> */}
        <div className="flex md:order-1 w-1/2">
          {/* Main Search Input */}
          <div className="relative hidden md:block w-full">
            <input
              type="text"
              id="search-navbar"
              className="block w-full p-2 ps-3 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Search for an item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div onClick={() => handleSearch(searchTerm)} className="absolute mr-3 right-0 inset-y-0 flex items-center ps-3 cursor-pointer">
              <svg
                className="w-4 h-4 text-gray-500 dark:text-gray-400"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                />
              </svg>
              {/* <span className="sr-only">Search icon</span> */}
            </div>
          </div>
        </div>
        {/* Search Input for larger screens */}
        <div className="md:order-2 w-1/2 grid justify-items-end">          
          <div>            
            <button onClick={() => setcurrTab('search')} className="ml-2 bg-transparent hover:bg-gray-900 text-white font-semibold py-2 px-4 border border-gray-900 hover:border-transparent rounded">
              Home
            </button>

            <button onClick={() => {setwishList(JSON.parse(localStorage.getItem('wishlist'))); setcurrTab('wishlist')}} className="ml-2 bg-transparent hover:bg-gray-900 text-white font-semibold py-2 px-4 border border-gray-900 hover:border-transparent rounded relative">
              Wishlist ({wishList?.length || 0})
              {/* <span className="absolute top-0 right-0 bg-red-600 text-white text-xs h-6 w-6 font-semibold p-1 rounded-full ">{wishList.length}</span> */}
            </button>

          </div>
        </div>
      </div>

      {/* Bottom Sort and Action Buttons */}
      <div className="bg-white grid grid-cols-1 px-10">

        {/* Site Logos and Actions */}
        <div className="flex bg-white justify-center items-center py-2">
          {Object.keys(sites).map((site) => {
            let scrapeClass = sites[site].scrape ? 'shadow shadow-gray-900' : 'grayscale';
            let loadingClass = sites[site].loading ? 'animate-pulse' : '';

            return (
              <div
                key={site}
                onClick={() => handleSitesBool(site, 'scrape')}
                className={`cursor-pointer overflow-hidden border rounded-full p-1 mx-3 ${scrapeClass} ${loadingClass}`}
              >
                <img src={`${process.env.PUBLIC_URL}/images/logos/${sites[site].image}`} alt={site} className="h-6 w-6" />
              </div>
            );
          })}
          <div className="cursor-pointer mx-3 text-gray-500" onClick={() => showModal(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          </div>
        </div>
      </div>
    </nav>

    <div className={`container mx-auto p-4 py-36 flex ${(showWebView) ? '' : ''}`}>
    {/* <div className={`container mx-auto p-4 py-40 grid grid-cols-2`}> */}
      {/* <h1 className="text-3xl font-bold mb-4 text-center">Product Search</h1> */}
      
      
      {(showWebView) ? <div className='col-span-5 pr-5 h-screen sticky top-40 relative w-5/6'>
        <webview 
          src={webViewUrl} 
          className='web-view border rounded-lg shadow-xl overflow-hidden h-3/4'
        >        
        </webview>
        <div onClick={() => setshowWebView(false)} className="cursor-pointer absolute top-1/3 right-10 bg-gray-500 border rounded-full text-white p-1 shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </div>
      </div> : 
      <div className="mr-5 w-1/6">
        <div className="w-full sticky top-40 rounded-lg shadow-xl py-10 px-5">
          <div>
            <p className="text-xs font-semibold text-gray-500">SORT BY</p>
            <p onClick={() => handleSort('price')} className="flex items-center cursor-pointer text-sm font-semibold text-gray-800 py-2">
              Price: Low to High
            </p>
            <p onClick={() => handleSort('rating')} className="flex items-center cursor-pointer text-sm font-semibold text-gray-800 py-2">
              Rating: High to Low
            </p>
            <p onClick={() => handleSort('ratingCount')} className="flex cursor-pointer text-sm font-semibold text-gray-800 py-2">
              Rating Count: High to Low
            </p>
          </div>
          <div className="mt-5">
            <p className="text-xs font-semibold text-gray-500">FILTERS</p>
            <select onChange={(e) => setfilter({...filter, site: e.target.value})} className="outline-none cursor-pointer text-sm font-semibold text-gray-800 py-2">
              <option value="">All</option>
              {Object.keys(sites).map((site) => {
                return <option value={site}>{sites[site].name}</option>
              })}
            </select>
          </div>
        </div>
      </div>
      }

      <div className={`grid gap-5 relative ${(showWebView) 
        ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-1 w-1/6' 
        : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 w-5/6'
      }`}>
        {(currTab === 'search') ? <>
          <p className="text-gray-400 h-7 ps-2 mb-0 font-semibold text-sm col-span-full">{products.filter(product => product.imageUrl != null && product.site.includes(filter.site)).length} products fetched</p>
          {!loading ? products.filter(product => 
            product.imageUrl != null &&
            product.site.includes(filter.site) 
          ).map((product, index) => (
            <ProductCard key={index} index={index} liked={false} product={product} handleWishlist={handleWishlist} setshowWebView={setshowWebView} setwebViewUrl={setwebViewUrl} />
          )) : 
          <div className="absolute bottom-0 left-1/2 col-span-full flex justify-center">
            <span className="animate-ping h-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-loader"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>
            </span>
          </div>
          }
        </>
        : ''}

        {(currTab === 'wishlist') ? <>
          <p className="text-gray-400 h-7 ps-2 mb-0 font-semibold text-sm col-span-full">{wishList?.filter(product => product.imageUrl != null).length || 0} liked products</p> 
          {!loading ? wishList?.filter(product => product.imageUrl != null).map((product, index) => (
            <ProductCard key={index} index={index} liked={true} product={product} handleWishlist={handleWishlist} setshowWebView={setshowWebView} setwebViewUrl={setwebViewUrl} />
          )) : 
          <div className="absolute top-1/3 left-1/2 bg-red-200 col-span-full flex justify-center">
            <span className="animate-ping h-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-loader"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>
            </span>
          </div>
          }
        </>        
        : ''}
      </div> 


    </div>
  </>
  );
};

export default App;
