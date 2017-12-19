const fs = require('fs'),
    scrapeIt = require('scrape-it'),
    http = require('http'),
    json2csv = require('json2csv');

function checkForDirectory(directory) {
    try {
        fs.statSync(directory)
    } catch (error) {
        fs.mkdirSync(directory);
    }
}

checkForDirectory('./data/');

scrapeIt('http://www.shirts4mike.com/shirts.php', {

    pages: {
        listItem: "ul.products li"
        , name: "pages"
        , data: {
            title: {
                selector: "img",
                attr: "alt"
            }
            , url: {
                selector: "a"
                , attr: "href"
            }
        }
    }

}, (err, page) => {
    if (err) {
        const errorMessage = `${Date()} There appears to ba an issue connecting to ${err.hostname}, please try again a little later, thanks. (errorCode: ${err.code})\r\n`;
        console.error(errorMessage);
        fs.appendFileSync('scraper-error.log', errorMessage);
    }


    if (page) {
        const pages = page.pages,
            urls = []; // site array

        for (const page of pages) {
            const urlArray = [];
            urlArray.push(`http://www.shirts4mike.com/${page.url}`, page.url);

            urls.push(urlArray);
        }

        buildCsvData(urls);

        function buildCsvData(siteArray) {
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
                    const shirt = page.data[0]; // shirt array
                    var fields = ['title', 'price', 'imageUrl', 'url', 'time'];
                    shirt.url = index[0];
                    shirt.imageUrl = `http://www.shirts4mike.com/${shirt.imageUrl}`;
                    shirt.time = (new Date()).toJSON();

                    csvData.push(shirt);
                    const csv = json2csv({ data: csvData, fields: fields });
                    const date = new Date();
                    fs.writeFile(`./data/${date.getFullYear()}-${date.getMonth()}-${date.getDate()}.csv`, csv, function (err) {
                        if (err) throw err;
                    });
                });
            }
            setTimeout(() => {
                if (csvData.length !== 0) {
                    console.log('CSV file succesfully created');
                }
            }, 150);
        }
    }
});