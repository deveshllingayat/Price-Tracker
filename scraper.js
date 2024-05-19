const cheerio = require("cheerio");
const axios = require("axios");
const puppeteer = require("puppeteer");

async function getGemProduct(url) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const productName = $("div[id='title']>h1")
      .contents()
      .filter(function () {
        return this.nodeType === 3; // Filter out non-text nodes (nodeType 3 represents text nodes)
      })
      .text()
      .trim();
     
    const imageUrl = $("img[alt='" + productName + "']");
    let images = [];
    imageUrl.each(function () {
      images.push($(this).attr("src"));
    });

    const productPrice = $("span .m-w").first().text().trim();
    const discount = $(".discount_gola").first().text().trim();
    const priceFor = $(".pdp-qty-message label:nth-child(2)").text();
    const availability = $(".pdp-availability strong")
      .text()
      .trim()
      .split(" ")
      .join("")
      .split("\n")
      .join(" ");
    const minQty = $(".min_qty_msg span").text();
    const originCountry = $(".origin_country span").text();
    const miiPercentage = $(".mii_percentage span").text();
    const productDetails = {
      productName,
      productPrice,
      images,
      discount,
      priceFor,
      availability,
      minQty,
      originCountry,
      miiPercentage,
    };

    let specifications = {};
    $(".param-container ").each(function () {
      let title = $(this).find(".key_name").text().trim();
      let value = $(this).find(".key_value").text().trim();
      specifications[title] = value;
    });

    const webProducts = await getWebProducts(productName);

    const allWebProducts = { productDetails:productDetails, specifications:specifications, webProducts:webProducts };

    return allWebProducts;
  } catch (error) {
    console.error("Something went wrong!\n", error);
  }
}
async function getWebProducts(title) {
  try {
    let browser;
    let url_google =
      "https://www.google.com/search?tbm=shop&hl=en&psb=1&ved=0CAAQvOkFahcKEwiwwpLo0_eCAxUAAAAAHQAAAAAQBw&q=" +
      title.split(" ").join("+") +
      "cm&oq&gs_lcp=Cgtwcm9kdWN0cy1jYxABGAAyBwgjEOoCECcyBwgjEOoCECcyBwgjEOoCECcyBwgjEOoCECcyBwgjEOoCECdQAFgAYMESaAFwAHgAgAEAiAEAkgEAmAEAsAEF&sclient=products-cc";

    browser = await puppeteer.launch({
      headless: "true",
    });
    const page = await browser.newPage();
    await page.goto(url_google,headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
  });

    let imageUrls = await page.$$eval(
      ".sh-dgr__content .VOo31e .FM6uVc .ArOc1c>img",
      (images) => {
        return images.map((img) => img.getAttribute("src"));
      }
    );

    let productTitles = await page.$$eval(
      ".sh-dgr__content .C7Lkve h3.tAxDx",
      (titles) => {
        return titles.map((title) => title.innerText);
      }
    );

    let prices = await page.$$eval(
      ".sh-dgr__content .zLPF4b .a8Pemb.OFFNJ",
      (prices) => {
        return prices.map((price) => price.innerText);
      }
    );

    let productUrls = await page.$$eval(
      ".sh-dgr__content .zLPF4b .mnIHsc a:nth-child(2)",
      (productUrls) => {
        return productUrls.map((url) => url.getAttribute("href"));
      }
    );

    let emarketplaces = await page.$$eval(
      ".sh-dgr__content .zLPF4b .mnIHsc .aULzUe.IuHnof",
      (companies) => {
        return companies.map((name) => name.innerText);
      }
    );

    let deliveryCharges = await page.$$eval(
      ".sh-dgr__content .zLPF4b .mnIHsc .vEjMR",
      (el) => {
        return el.map((item) => item.innerText);
      }
    );

    prices = prices.slice(0, 12);
    imageUrls = imageUrls.slice(0, 12);
    productTitles = productTitles.slice(0, 12);
    productUrls = productUrls.slice(0, 12);
    productUrls = productUrls.map((url) => url.substring(url.indexOf("=") + 1));
    emarketplaces = emarketplaces.slice(0, 12);
    deliveryCharges = deliveryCharges.slice(0, 12);

    const allProducts = prices.map((price, index) => {
      return {
        price: price,
        imageUrl: imageUrls[index],
        productTitle: productTitles[index],
        productUrl: productUrls[index],
        emarketplace: emarketplaces[index],
        deliveryCharge: deliveryCharges[index],
      };
    });

    await browser.close();
    return allProducts;
  } catch (error) {
    console.error("Something went wrong!\n", error);
  }
}
module.exports = { getGemProduct };
