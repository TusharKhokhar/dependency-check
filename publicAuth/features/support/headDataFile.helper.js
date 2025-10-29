/**
 * This helper file contains a copy of the headDataFile function extracted from the upload.controller.js
 * to make it testable independently. In a real-world scenario, it would be better to refactor
 * the original code to make this function exportable.
 */

const { S3Client, HeadObjectCommand } = require("@aws-sdk/client-s3");
// Mock the CustomLogger to avoid external dependencies during testing
const log = {
  info: () => {},
  error: () => {},
  warn: () => {},
  debug: () => {}
};

/**
 * Function to retrieve and process S3 object metadata to update file page count information
 * @param {S3Client} s3 - AWS S3 client instance
 * @param {Object} params - S3 parameters including Bucket and Key
 * @param {Object} file - File object with properties to be updated
 * @returns {Promise<Object>} - Updated file object
 */
exports.headDataFile = (s3, params, file) => {
  return new Promise((resolve, reject) => {
    let unSureFormats  = ['pub', 'htm','html','xps', 'ods', 'odp'];
    s3.send(new HeadObjectCommand(params), (err, data) => {
      if (err) {
        reject(err);
      } else {
        log.info('data==>>>', data);
        const obj = {};
        Object.assign(obj, file);
        if (data.Metadata.pagecount && !isNaN(parseInt(data.Metadata.pagecount)) && parseInt(data.Metadata.pagecount) > 0) {
          let splitFileNameForExt = obj.OriginalFileNameWithExt.split('.');
          if (parseInt(data.Metadata.pagecount) === obj.TotalPagesPerFile) {
            resolve(obj);
          } else if (unSureFormats.includes(splitFileNameForExt[splitFileNameForExt.length - 1])
              && obj.TotalPagesPerFile !== parseInt(data.Metadata.pagecount)) {
            obj.TotalPagesPerFile = parseInt(data.Metadata.pagecount);
            obj.PageRange = `1-${data.Metadata.pagecount}`;
            resolve(obj);
          } else if (obj.UploadedFrom && obj.UploadedFrom.toLowerCase() === 'email') {
            obj.TotalPagesPerFile = parseInt(data.Metadata.pagecount);
            obj.PageRange = `1-${data.Metadata.pagecount}`;
            resolve(obj);
          } else if (!unSureFormats.includes(splitFileNameForExt[splitFileNameForExt.length - 1])) {
            // Handle when S3 shows more pages than recorded
            if(parseInt(data.Metadata.pagecount) > obj.TotalPagesPerFile){
              if(obj.PageRange === '1-1' && 1 <  obj.TotalPagesPerFile){
                obj.TotalPagesPerFile = parseInt(data.Metadata.pagecount);
              } else {
                let splitPageRange = obj.PageRange.split('-');
                if(parseInt(splitPageRange[splitPageRange.length - 1]) === obj.TotalPagesPerFile){
                  obj.PageRange = `${splitPageRange[0]}-${data.Metadata.pagecount}`;
                  obj.TotalPagesPerFile = parseInt(data.Metadata.pagecount);
                }
              }
            }
            // Handle when S3 shows fewer pages than recorded
            else if(parseInt(data.Metadata.pagecount) < obj.TotalPagesPerFile){
              let splitPageRange = obj.PageRange.split('-');
              // If PageRange end is set to the last page as calculated by the Web UI, adjust PageRange
              if(parseInt(splitPageRange[splitPageRange.length - 1]) === obj.TotalPagesPerFile){
                obj.PageRange = `${splitPageRange[0]}-${data.Metadata.pagecount}`;
              }
              obj.TotalPagesPerFile = parseInt(data.Metadata.pagecount);
            }
            resolve(obj);
          }
        }
        resolve(obj);
      }
    });
  });
};