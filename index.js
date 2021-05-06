var fs = require('fs');
const archiver = require('archiver');
const ProgressBar = require('progress');
const JSZip = require('jszip');

let dontcare
process.on('unhandledRejection', (reason, p) => {
   dontcare = reason+p
});

const createFolder = (folderName, cbe) => {
    try {
        if (!fs.existsSync(folderName)) {
            fs.mkdirSync(folderName)
            return
        }
    } catch (err) {
        
        return cbe(err)
    }
}

if (process.argv.length <= 4 || process.argv[2] == "-h") {
    console.log("Usage: [ -e path/to/Songs/ path/to/output] [-d path/to/EncodedSongs path/to/output]");
    process.exit(-1);
}

let m=0;

if (process.argv[2] === "-e"){
    m=1;
}else if (process.argv[2] === "-d") {
    m=2;
}else{
    process.exit(-1);
}

var path = process.argv[3];
let ouputdir = process.argv[4];

/**
 * @param {String} source
 * @param {String} out
 * @returns {Promise}
 */
let unZipDirectory, zipDirectory
if (m===1){
    zipDirectory = (source, out, cb) => {
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
}else if (m===2){
    unZipDirectory = (source, out, n, cb) => {
        const narr = n.split('.osz')
        const tname = narr.slice(0,narr.length-1).join("")
        createFolder(out+tname, function(err) {
            throw err
        })
        
        fs.readFile(source+n, function(err, data) {
            if (!err) {
                var zip = new JSZip();
                zip.loadAsync(data).then(function(contents) {
                    let num = Object.keys(contents.files).length
                    let goal = 0
                    Object.keys(contents.files).forEach(filename => {
                        zip.file(filename).async('nodebuffer').then(function(content) {
                            var dest = out + tname +"\\"+ filename;
                            fs.writeFileSync(dest, content);
                            goal++
                            if (num == goal) {
                                cb()
                            }
                        });
                    });
                });
            }
        });
    }
}
fs.readdir(path, (err, items) => {
    // console.log(items);
 
    for (var i=0; i<items.length; i++) {
        const lul = items[i]
        var bar = new ProgressBar(' :type [:bar] :rate/bps :percent :current/:total :etas :token1', {
            complete: '=',
            incomplete: ' ',
            head: ">",
            width: 20,
            total: items.length
        });
        if (m===1){
            zipDirectory(path+items[i],ouputdir+items[i]+".osz",()=>{
                bar.tick(1,{
                    "type": "archiving",
                    "token1": lul
                });
            })
        }else {
            unZipDirectory(path,ouputdir,items[i],()=>{
                bar.tick(1,{
                    "type": "unarchiving",
                    "token1": lul
                });
            })
            
        }
    }
    console.log(`There is ${items.length} items in the directory`)
});