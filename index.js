var OSS = require('ali-oss');
var  Config = require('./config.js');
var co = require('co');
var fs = require('fs');


var client = new OSS({
  region: Config.region,
  accessKeyId: Config.accessKeyId,
  accessKeySecret: Config.accessKeySecret
});


co(function* () {
  client.useBucket('ydupgrade');
  var result = yield client.list({
    prefix:'ppms-client'
  });
  

  //删除不要的文件
  for(var i=0,ii=result.objects ? result.objects.length:0;i<ii;i++){
    yield client.delete(result.objects[i].name);  
  };
  
  //1.取出版本来
  var verfile = __dirname + '/ver.json';
  if (fs.existsSync(verfile)){
    var str = fs.readFileSync(verfile,"utf8");
    var verjson=JSON.parse(str);
        
    for(var i=0,ii=verjson.filedata.length;i<ii;i++){
      var params = verjson.filedata[i];
      var params = params.split(',');
      if(params.length==4){
        var filename = __dirname + '/filedata/' + params[2];  
        console.log(filename);
        var result = yield client.put('ppms-client/filedata/' + params[2],filename);
        if(result.res.status==200){
          console.log(result);
          params[3] = result.res.headers.etag;   
          verjson.filedata[i] = params.join(',');
        }
        else{
           console.error("上传文件出错。" + filename);       
        }
      }
      else{
        console.error("参数出错。");   
      }   
    };
    
    //3.回写内容到ver.json 因为有md5码的更新
    fs.writeFileSync(verfile, JSON.stringify(verjson));
  }
  else{
    console.log('没有找到ver.json文件');    
  }
  
  
}).catch(function (err) {
  console.log(err);
});
