///////////////////////////////////////////////////
//
//  同步数据到osss
// 作者：龙仕云  2017-8-21
//
//
// 编号   作者     日期       内容:
//  1   龙仕云   2017-8-21  只有变化的才处理
//
////////////////////////////////////////////////////

var OSS = require('ali-oss');
var  Config = require('./config.js');
var co = require('co');
var fs = require('fs');
var crypto = require('crypto');
var async = require('async');


var client = new OSS({
  region: Config.region,
  accessKeyId: Config.accessKeyId,
  accessKeySecret: Config.accessKeySecret,
  timeout: 60000*10000, // 60s
});


co(function* () {
  
  client.useBucket(Config.bucket);
  var result = yield client.list({
    prefix:Config.subdir
  });
  

  //删除不要的文件
  //for(var i=0,ii=result.objects ? result.objects.length:0;i<ii;i++){
  //  yield client.delete(result.objects[i].name);  
  //};
  
  //1.取出版本来
  var verfile = __dirname + '/ver.json';
  if (fs.existsSync(verfile)){
    var str = fs.readFileSync(verfile,"utf8");
    var verjson=JSON.parse(str);
        
    //for(var i=0,ii=verjson.filedata.length;i<ii;i++){
    var filedata=[];
    async.eachSeries(verjson.filedata,function(curfile,cb){  
      
      var params = curfile.split(',');
      
      if(params.length==4){
        
        if(params[0] == 'd' || params[0]=='D'){
          cb(null);
        }
        else{
          var filename    = __dirname + '/filedata/' + params[2];  //本地的
          var ossfilename = Config.subdir + '/filedata/' + params[2]; //oss的
          var ossmd5 ;
          co(function*(){
            try{
              var result = yield client.head(ossfilename);
              ossmd5 = result.res.headers.etag.replace(/"/g,'');

              if(ossmd5){
                var md5sum = crypto.createHash('md5');  
                var stream = fs.createReadStream(filename);
                stream.on('data', function(chunk){
                  md5sum.update(chunk);
                });
                stream.on('end', function() {
                  str = md5sum.digest('hex').toUpperCase();
                  if (str == ossmd5.toUpperCase()){
                    console.log('不更新='+filename);
                    params[3] = str;
                    curfile = params.join(',');
                    filedata.push(curfile);
                    cb(null);
                  }
                  else{
                    console.log('更新='+filename);
                    co(function*() {
                      var result = yield client.put(ossfilename,filename);
                      if(result.res.statusCode==200){
                        params[3] = result.res.headers.etag;   
                        curfile = params.join(',');
                        filedata.push(curfile);
                        cb(null);
                      }
                      else{
                        cb(new Error("上传文件出错。" + filename))
                      };
                    });//end co

                  }; //end md5
                }); //end stream

              } else {
                console.log('新增='+filename);
                var result = yield client.put(ossfilename,filename);
                if(result.res.status==200){
                  params[3] = result.res.headers.etag;   
                  curfile = params.join(',');
                  filedata.push(curfile);

                }
                else{
                 console.error("上传文件出错。" + filename);       
                };
              };

            } catch(err){

              console.log('新增='+filename);
              var result = yield client.put(ossfilename,filename);
              if(result.res.status==200){
                params[3] = result.res.headers.etag;   
                curfile = params.join(',');
                filedata.push(curfile);
                cb(null);
              }
              else{
               cb(new Error("上传文件出错。" + filename));       
              };

            };

          }); //end co
        }//end U
        
      }else{
        cb(new Error("参数出错。"));
      }
      
    },function(err){
      
      if(!err){
        co(function*(){
        //3.回写内容到ver.json 因为有md5码的更新,并上传
        var newfile = __dirname + '/ver1.json';
        verjson.filedata = filedata;
        fs.writeFileSync(newfile, JSON.stringify(verjson));
        yield client.put(Config.subdir + '/ver.json' ,newfile);
        });
      }
      else{
        console.error(err.toString());
      }
    });
  }
  else{
    console.log('没有找到ver.json文件');    
  }
  
}).catch(function (err) {
  console.log(err);
});
