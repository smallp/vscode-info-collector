import { TextDocument} from "vscode-languageserver";
import * as fs from 'fs';
import * as path from 'path';

export class dataType {
    static cla='class';
    static id='id';
    static data='data';};
export interface completeItem {
    val: string;
    from: string;
}
export class sing{
    _class=/ class="(.*?)"/g;
    _id=/ id="(.*?)"/g;
    _data=/ data-(.*?)=/g;
    _link=/<script(.*?)src="(.*?)"/g;
    res={};
    link={};
    init(document:TextDocument):void{
        if (document.uri in this.res) return;
        let dir=decodeURI(path.dirname(document.uri.replace('file://','')));
        fs.readdir(dir,(err,files)=>{
            if (err) return;
            let file:string;
            for (file of files){
                if (file.endsWith('.html')||file.endsWith('.tpl')){
                    fs.readFile(dir+'/'+file,{encoding:'utf-8'},function(file,err,text){
                        if (err) return;
                        this.parse(text,this.path2uri(dir+'/'+file));
                    }.bind(this,file));
                }
            }
        });
    }
    parse(text:string,uri:string):void{
        let cla=[];
        let id=[];
        let res={};
        let t:string;
        let filename:string;
        filename=uri.split('/').pop();
        //collect class
        let match=text.match(this._class);
        if (match!==null)
            for (t of match){
                if (t.length>1)
                    cla=cla.concat(t.substring(8,t.length-1).split(' '));
            }
        res[dataType.cla]=this.fitter(cla,filename);
        //collect data
        let data=[];
        match=text.match(this._data);
        if (match!==null)
            for (t of match){
                data.push(t.slice(6,-1));
            }
        res[dataType.data]=this.fitter(data,filename);
        //collect id
        match=text.match(this._id);
        if (match!==null)
            for (t of match){
                id.push(t.substring(5,t.length-1));
            }
        res[dataType.id]=this.fitter(id,filename);
        this.res[uri]=res;
        //build link
        let link=[];
        match=text.match(this._link);
        if (match!==null){
            for (t of match){
                let arr=t.split('/');
                if (arr.length==1){
                    match=arr[0].match(/src="(.*?)"/);
                    t=match[0].slice(5,-1);
                }else{
                    t=arr[arr.length-1];
                    t=t.substr(0,t.length-1);
                }
                if (t.endsWith('.js')){
                    if (t in this.link){
                        if (uri in this.link[t])
                            this.link[t].push(uri);
                    }
                    else this.link[t]=[uri];
                }
            }
        }
        this.link[uri]=[uri];
    }
    //remove repeated item and return completeItem list
    fitter(arr:Array<string>,filename:string):Array<completeItem>{
        arr=Array.from(new Set(arr));
        let res=[];
        arr.forEach((v)=>{
            res.push({val:v,from:filename});
        });
        return res;
    }
    getComplete(uri:string,index:string):Array<completeItem>{
        if (uri.endsWith('.html')||uri.endsWith('.tpl')){
            //in html, read the completeItems in this html
            if (uri in this.res) return this.res[uri][index];
            else return [];
        }else{
            //in js, read all the html that include this js
            let arr:Array<string>=uri.split('/');
            let name=arr[arr.length-1];
            if (name in this.link){
                let res=[];
                let t:string;
                for (t of this.link[name]){
                    res=res.concat(this.res[t][index]);
                }
                return res;
            }else return [];
        }
    }
    path2uri(path:string):string{
        if (path[0] !== '/') path = '/' + encodeURI(path.replace(/\\/g, '/')).replace(':', '%3A');
        else path=encodeURI(path);
        return `file://${path}`;
    }
}