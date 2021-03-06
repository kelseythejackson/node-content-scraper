const fs = require('fs'),
  scrapeIt = require('scrape-it'),
  chalk = require('chalk'),
  json2csv = require('json2csv');

const checkForDirectory = (directory) => { // If the data folder does not exist, create one
  try {
    fs.statSync(directory)
  } catch (error) {
    fs.mkdirSync(directory);
  }
}

checkForDirectory('./data/');

scrapeIt('http://www.shirts4mike.com/shirts.php', { // Scrapes the initial entry point and grabs the urls and ids of the shirts

  shirts: {
    listItem: "ul.products li",
    name: "shirts",
    data: {
      title: {
        selector: "img",
        attr: "alt"
      },
      url: {
        selector: "a",
        attr: "href"
      }
    }
  }

}, (err, shirtCollection) => {
  if (err) { // if an error occurs it logs it to the console and appends it to the scraper-error.log file with a timestamp
    const errorMessage = `There appears to ba an issue connecting to ${err.hostname}, please try again a little later, thanks. (errorCode: ${err.code})\r\n`;
    console.error(errorMessage);
    fs.appendFileSync('scraper-error.log', `[${Date()}] ${errorMessage}`);
  }


  if (shirtCollection) {
    const shirts = shirtCollection.shirts // gets the url for the pages
    urls = []; // site array

    for (const shirt of shirts) { // iterates over the pages array, and pushes the full url and id onto the urls Array
      const urlArray = [];
      urlArray.push(`http://www.shirts4mike.com/${shirt.url}`, shirt.url);

      urls.push(urlArray);
    }
    const buildCsvData = (siteArray) => { // cyles over the array, build the csv file, and saves it out to the data folder
      const csvData = [];
      for (const index of siteArray) {

        scrapeIt(index[0], {
          data: {
            listItem: "#content",
            name: 'h1',
            data: {
              title: {
                selector: '.shirt-picture span img',
                attr: 'alt'
              },
              price: 'span',
              imageUrl: {
                selector: '.shirt-picture span img',
                attr: 'src'
              }
            }
          }
        }, (err, page) => {
          if (err) {
            console.error(err)
          }
          const shirt = page.data[0]; // shirt array
          var fields = ['title', 'price', 'imageUrl', 'url', 'time'];
          shirt.url = index[0];
          shirt.imageUrl = `http://www.shirts4mike.com/${shirt.imageUrl}`;
          shirt.time = (new Date()).toJSON();
          csvData.push(shirt);
          const csv = json2csv({
            data: csvData,
            fields: fields
          });
          const date = new Date();
          fs.writeFile(`./data/${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}.csv`, csv, function (err) {
            if (err) throw err;
          });
        });
      }
      let files = fs.readdirSync('./data')
      if (files.length) {
        console.log(chalk.green.inverse('CSV created successfully'))
      }
    }

    buildCsvData(urls); // creates the CSV data
  }
});