"use strict";
const fs = require('fs');
const path = require('path');
class dataType {
}
dataType.cla = 'class';
dataType.id = 'id';
dataType.data = 'data';
exports.dataType = dataType;
;
class sing {
    constructor() {
        this._class = / class="(.*?)"/g;
        this._id = / id="(.*?)"/g;
        this._data = / data-(.*?)=/g;
        this._link = /<script(.*?)src="(.*?)"/g;
        this.res = {};
        this.link = {};
    }
    init(uri) {
        if (uri in this.res)
            return;
        let dir = decodeURI(path.dirname(uri.replace('file://', '')));
        let _this = this;
        fs.readdir(dir, function (err, files) {
            if (err)
                return;
            let file;
            for (file of files) {
                if (file.endsWith('.html') || file.endsWith('.tpl')) {
                    fs.readFile(dir + '/' + file, { encoding: 'utf-8' }, function (file, err, text) {
                        if (err)
                            return;
                        _this.parse(text, 'file://' + dir + '/' + file);
                    }.bind(null, file));
                }
            }
        });
    }
    parse(text, uri) {
        let cla = [];
        let id = [];
        let res = {};
        let t;
        let filename;
        filename = uri.split('/').pop();
        //collect class
        let match = text.match(this._class);
        if (match !== null)
            for (t of match) {
                if (t.length > 1)
                    cla = cla.concat(t.substring(8, t.length - 1).split(' '));
            }
        res[dataType.cla] = this.fitter(cla, filename);
        //collect data
        let data = [];
        match = text.match(this._data);
        if (match !== null)
            for (t of match) {
                data.push(t.slice(6, -1));
            }
        res[dataType.data] = this.fitter(data, filename);
        //collect id
        match = text.match(this._id);
        if (match !== null)
            for (t of match) {
                id.push(t.substring(5, t.length - 1));
            }
        res[dataType.id] = this.fitter(id, filename);
        this.res[uri] = res;
        //build link
        let link = [];
        match = text.match(this._link);
        if (match !== null) {
            for (t of match) {
                let arr = t.split('/');
                if (arr.length == 1) {
                    match = arr[0].match(/src="(.*?)"/);
                    t = match[0].slice(5, -1);
                }
                else {
                    t = arr[arr.length - 1];
                    t = t.substr(0, t.length - 1);
                }
                if (t.endsWith('.js')) {
                    if (t in this.link) {
                        if (uri in this.link[t])
                            this.link[t].push(uri);
                    }
                    else
                        this.link[t] = [uri];
                }
            }
        }
        this.link[uri] = [uri];
    }
    //remove repeated item and return completeItem list
    fitter(arr, filename) {
        arr = Array.from(new Set(arr));
        let res = [];
        arr.forEach((v) => {
            res.push({ val: v, from: filename });
        });
        return res;
    }
    getComplete(uri, index) {
        if (uri.endsWith('.html') || uri.endsWith('.tpl')) {
            if (uri in this.res)
                return this.res[uri][index];
            else
                return [];
        }
        else {
            let arr = uri.split('/');
            let name = arr[arr.length - 1];
            if (name in this.link) {
                let res = [];
                let t;
                for (t of this.link[name]) {
                    res = res.concat(this.res[t][index]);
                }
                return res;
            }
            else
                return [];
        }
    }
}
exports.sing = sing;
//# sourceMappingURL=single.js.map