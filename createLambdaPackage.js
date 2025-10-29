const fs = require('fs')
const archiver = require('archiver')
const FS = require('fs-extra')
const path = require('path')

// select the directory
let lambdaDirectory = 'translation'

async function pckg() {
    if (fs.existsSync('lambda.zip')) {
        fs.unlinkSync('lambda.zip')
    }

    const foldersToExcludeFromLambda = [
        // `${lambdaDirectory}/node_modules`,
        // `${lambdaDirectory}/dependencies`
    ]

    for (const folder of foldersToExcludeFromLambda) {
        await FS.remove(path.basename(folder))
        await FS.move(folder, path.basename(folder))
    }
    const output = fs.createWriteStream('lambda.zip')
    const archive = archiver('zip')
    archive.pipe(output)

    archive.directory(`${lambdaDirectory}/`, '');
    await archive.finalize()

    for (const folder of foldersToExcludeFromLambda) {
        await FS.move(path.basename(folder), folder)
    }
    console.log('lambda.zip is ready')
}


pckg().catch(console.error)
