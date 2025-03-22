# wxpusher-chrome-extensions
WxPusher Chrome版客户端，兼容Window和Mac的谷歌浏览器，开着浏览器即可收到推送消息。

# 安装教程
1. 下载插件，你可以直接clone本项目，或者直接下载zip包，<a href="https://github.com/wxpusher/wxpusher-chrome-extensions/archive/refs/heads/main.zip">点击这里下载最新版本的插件zip包</a>；
2. 下载后解压到适当位置；
3. 进入chrome浏览器插件管理页：你可以在浏览器里面输入：chrome://extensions/ ，或者<a href="chrome://extensions/">点击这里</a>;
4. 点击右上角，开启“**开发者模式**”（_本插件目前没有上架到Chrome Store，所以需要通过开发者的方式安装_）；
5. 点击左上角“加载已解压的扩展程序”，选择第1步解压的文件夹；
6. 安装完会自动弹出微信扫码登录页面，使用微信扫码完成账户的绑定即可。
7. 如果只能听到声音，没有提示，请在window设置里-通知（Mac同理，在设置-通知），把对应浏览器的通知打开；

安装说明：

<img src="./preview-imgs/install-des.png" title="安装说明">

安装后，可以在右上角插件找到这个扩展，微信扫码完成登陆。

<img src="./preview-imgs/preview.png" title="安装后预览">


到这里，你已经完成了安装，所有发送到微信的消息，都会转发一份到浏览器客户端。

你可以使用Demo程序，对其进行测试：<a href="https://wxpusher.zjiecode.com/demo">https://wxpusher.zjiecode.com/demo</a>

# 其他说明
1. 当前1.1.0版本已经使用Chrome V3 API，请尽快升级到此版本；
2. 如需更换账号，请卸载插件后重新安装；
3. 目前浏览器插件消息会在服务器缓存24小时，浏览器关闭以后，24小时以内上线，会重新把消息发送给你，如果超过24小时，消息会被丢弃；
4. Chrome扩展是微信公众号的拓展，绑定Chrome扩展以后，Chrome和微信公众号会同时收到消息；

# 开源声明
1. ⚠️浏览器插件不开源，本代码仓库仅用于代码安全审查和用户安装使用；
2. 不得修改默认对接的WxPusher通道；
3. 不得修改代码后后再次发布。

# 特别鸣谢
特别鸣谢「人生没有如果」，本消息插件由他最早发起，并且完成了早期的开发，后来由WxPusher官方进行完善。
