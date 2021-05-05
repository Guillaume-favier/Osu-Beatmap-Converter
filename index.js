var fs = require('fs');
const archiver = require('archiver');
var ProgressBar = require('progress');

if (process.argv.length <= 3) {
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
function zipDirectory(source, out, name) {
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
            name()
        });
        archive.finalize();
    });
}

fs.readdir(path, function(err, items) {
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