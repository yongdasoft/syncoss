# syncoss
将文件同步到oss功能.


# 结构要求
1. 根目录下必有ver.json
- ver.json 的格式是有要求的.
```
{
 "ver":1
 "filedata":[
    "U,%APPDIR%/xxxxxx","xxxxxx.jpg","xxxx 这个会自动生成可以填随意字符串，但不能少"
 ]
}

```
2. 根目录下必有filedata 
3. 可以参考 /ppms-client 的数据源.

#### config.js 

```js


module.exports={
	region: 'oss-cn-hangzhou',
	accessKeyId: "xxxxxxx",
    accessKeySecret:"xxxxxxxxxx",
    bucket:"ydupgrade",
    subdir:'ppms-client', 
};


```
