import fs from 'fs';

export const renderFile = filePath => {
    return  fs.createReadStream('./views/' + filePath);
};
