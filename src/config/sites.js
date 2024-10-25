const sites = {
  AMZN: {
    name: 'Amazon',
    scrape: true,
    image: 'amazon.jpg',
    loading: false,
    distance: 0,
    maxtime: 0,
    maxpages: 1,
    lazy: false,
    infinite: false
  },
  FLPKT: {
    name: 'Flipkart',
    scrape: false,
    image: 'flipkart.png',
    loading: false,
    distance: 0,
    maxtime: 0,
    maxpages: 1,
    lazy: false,
    infinite: false
  },
  MTRA: {
    name: 'Myntra',
    scrape: false,
    image: 'myntra.png',
    loading: false,
    distance: 500,
    maxtime: 10000,
    maxpages: 1,
    lazy: true,
    infinite: false
  },
  AJIO: {
    name: 'AJIO',
    scrape: false,
    image: 'ajio.webp',
    loading: false,
    distance: 500,
    maxtime: 10000,
    maxpages: 1,
    lazy: true,
    infinite: true
  }
}

export default sites