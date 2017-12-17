const fs = require('fs');

function checkForDirectory(directory) {
    try {
        fs.statSync(directory)
    } catch (error) {
        fs.mkdirSync(directory);
    }
}

checkForDirectory('./data/');