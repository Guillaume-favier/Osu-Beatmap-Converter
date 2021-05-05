var fs = require('fs');
const archiver = require('archiver');
var ProgressBar = require('progress');

if (process.argv.length <= 3 || process.argv[2] == "-h") {
    console.log("Usage: " + __filename + " path/to/Songs/ path/to/output");
    process.exit(-1);
}
 
var path = process.argv[2];
let ouputdir = process.argv[3];

/**
 * @param {String} source
 * @param {String} out
 * @returns {Promise}
 */
function zipDirectory(source, out, cb) {
    const archive = archiver('zip', { zlib: { level: 9 }});
    const stream = fs.createWriteStream(out);

    return new Promise((resolve, reject) => {
        archive
            .directory(source, false)
            .on('error', err => reject(err))
            .pipe(stream)
        ;

        stream.on('close', () => {
            resolve()
            cb()
        });
        archive.finalize();
    });
}

fs.readdir(path, (err, items) => {
    // console.log(items);
 
    for (var i=0; i<items.length; i++) {
        const lul = items[i]
        var bar = new ProgressBar('archiving [:bar] :rate/bps :percent :etas :token1', {
            complete: '=',
            incomplete: ' ',
            head: ">",
            width: 20,
            total: items.length
        });
        zipDirectory(path+items[i],ouputdir+items[i]+".osz",()=>{
            bar.tick(1,{
                "token1": lul
            });
        })
    }
    console.log(`There is ${items.length} items in the directory`)
});