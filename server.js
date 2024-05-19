const express = require('express');
const ejs = require('ejs');
const path = require('path');
const { getGemProduct } = require('./scraper');
const { url } = require('inspector');

const app = express();
app.set('view engine', 'ejs');

app.use("/",express.static("./node_modules/bootstrap/dist/"));

app.use(express.static('public'));

app.get('/',async (req,res)=>{
  try {
    let url_gem = req.query.searchProductUrl;
    if (!url_gem || url_gem.trim() === ''){
      url_gem = 'https://mkp.gem.gov.in/laptop-notebook/hp-250-g9-i7-1255u-16134-wifi-ms/p-5116877-85204777223-cat.html#variant_id=5116877-85204777223';
    }
    const json = await getGemProduct(url_gem);
    res.render('index', { allWebProducts: json });
  } catch (error) {
    res.status(500).send('Internal server error');
  }
})

app.listen(3000, () => {
  console.log('Server is running at http://localhost:3000');
});
