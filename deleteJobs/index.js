const {getDb, switchDb} = require("./config/db");
const {bucketNameConverted, region} = require("./config/config");
const { S3Client, DeleteObjectsCommand } = require("@aws-sdk/client-s3");
const s3Client = new S3Client();

module.exports.handler = async (req, res) => {
    try {
        // database connect
        let date = new Date();
        let now_utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(),
          date.getUTCDate(), date.getUTCHours(),
          date.getUTCMinutes(), date.getUTCSeconds());
        const db = await getDb()
        const premiumCustomers = await db.collection('Customers').find({Tier: 'premium', IsDeleted: false, IsActive: true}).toArray()
        if(premiumCustomers){
            await runDeleteJob(db, now_utc)
            await runDeleteJob(db, now_utc, 'EmailUploads', 'EmailService')
            for(let customerPre of premiumCustomers){
                const premData = await switchDb(customerPre.DomainName)
                await runDeleteJob(premData, now_utc)
                await runDeleteJob(premData, now_utc, 'EmailUploads', 'EmailService')
            }
        } else {
            await runDeleteJob(db, now_utc)
            await runDeleteJob(db, now_utc, 'EmailUploads', 'EmailService')
        }
    } catch (error) {
        console.error(error)
    }
}

const runDeleteJob = async (db, now_utc, collection, ServiceName) => {
    //fetch customers with their customized document deletion date it should also contain customer tier to identify db
    const jobListCollection = db.collection('JobLists')
    const jobListData = await jobListCollection.find({IsActive: true, IsDeleted: false
          ,FileRetainPeriod: {$ne: 8}
      }
    )
      .project({FileRetainPeriod: 1, CustomerID: 1})
      .toArray()
    // now need to form a match query that match customer id in the public uploads and having timestamp older than projected date
    const matchQueryFilter = []
    await jobListData && jobListData.forEach(job => {
        if(job.FileRetainPeriod){
            matchQueryFilter.push({
                JobExpired: false,
                CreatedAt: {$lte: new Date(new Date(now_utc).getTime() - ((24*job.FileRetainPeriod) * 60 * 60 * 1000))},
                CustomerID: job.CustomerID
            })
        }}
    )
    // group by customer id and generate the route for object and push it to an array
    for(let query of matchQueryFilter) {
        const publicUploadsCollection = collection ? db.collection(collection) : db.collection('PublicUploads')
        const pubUpData = await publicUploadsCollection.find(query).toArray()
        const pubUpDataMap = []
        if(pubUpData.length > 0) {
            await pubUpData.map(uploadData => pubUpDataMap.push(uploadData._id) )
            pubUpDataMap ? await publicUploadsCollection.updateMany({_id: {$in: pubUpDataMap}}, {$set: {JobExpired: true}}) : []
            if(pubUpData){
                const basePath = collection ? `${ServiceName}/${query.CustomerID}/` : `PublicUploads/${query.CustomerID}/`
                let fileToBeDeleted = []
                fileToBeDeleted = await findFiles(pubUpData, basePath, collection)
                //once the array is formed containing items to be deleted we can then move along to s3 bucket delete API
                //s3 bucket deletion logic will work as follows
                //divide the single array  into sub arrays each with thousands path
                const finalArr =  chunks(fileToBeDeleted)
                for (let uploadKeys of finalArr) {
                    const params = {
                        Bucket: bucketNameConverted,
                        Delete: {
                            Objects: uploadKeys,
                            Quiet: false
                        }
                    };
                    const command = new DeleteObjectsCommand(params);
                    await s3Client.send(command);
                }
            }
        }
    }
}

const findFiles = async (record, basePath, collection) => {
    let pathsArray = []
    let promiseFiles = []
    await record.forEach(upload => {
        console.log(upload);
        if (collection) {
            promiseFiles.push(
              upload.FilesMetaData.forEach((storedFile) => {
                  pathsArray.push({Key: `${basePath}${storedFile.FileName}`})
              }))
        } else {
            promiseFiles.push(
              upload.IsProcessedFileName.forEach((storedFile) => {
                  pathsArray.push({Key: `${basePath}${storedFile.FileName}`})
              }))
        }
    })
    return await Promise.all(promiseFiles).then(() => {
        console.log('pathsArray: ',pathsArray);
        return pathsArray
    }).catch(err => {
        console.log('error***',err);
        throw new Error(err)
    })
}

let  chunks = (arr) => {
    const chunkSize = 900;
    let subArrays = []
    for (let i = 0; i < arr.length; i += chunkSize) {
        const chunk = arr.slice(i, i + chunkSize);
        subArrays.push(chunk)
    }
    return subArrays
}