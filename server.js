'use strict';

import express from 'express';
import fetch from 'node-fetch';

// Constants
const PORT = process.env.PORT?process.env.PORT:8080;
const HOST = '0.0.0.0';
const MD = "http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token";
const VA = "https://ocr.api.cloud.yandex.net/ocr/v1/recognizeText"
const SC = "https://smartcaptcha.yandexcloud.net/validate";
const S1 = (typeof(process.env.SCC)=="string")?process.env.SCC:'';//'ysc1_Atxxx...';
const S2 = (typeof(process.env.SCS)=="string")?process.env.SCS:'';//'ysc2_Atxxx...';

// App
const app = express();
app.use(express.json({"type": "*/*", limit: '10mb'})) // for parsing application/json

function getCookie(req, name) {
  let matches = req?.headers?.cookie?.match(`(?:^|; )${name}=([^;]*)`);
  return matches?matches[1]:null;
}

function logIp(req) {
  let item = {};
  item.IP = req.ip;
  item.ForwardedFor = req.header('X-Forwarded-For');
  item.RealIP = req.header('X-Real-IP');
  item.UserAgent = req.header('User-Agent');
  item.DateTime = (new Date()).toISOString();
  item.Method = req.method;
  item.Path = req.path;
  item.URI = req.originalUrl;
  if (typeof(req.body?.info) != 'undefined') item.info = req.body.info;
  if (typeof(req.body?.type) != 'undefined') item.type = req.body.type;
  if (typeof(req.body?.model) != 'undefined') item.model = req.body.model;
  let c;
  c = getCookie(req, "userid"); if (c) item.UserID = c;
  console.log(JSON.stringify({level: "TRACE", msg: item}));
};

//main page
app.get('/', (req, res) => {
  logIp(req);
  //this will make to load page from cache not contacting server. SUPERFAST!
  res.appendHeader('Cache-Control', 'max-age=300, immutable');
  //you may pass uuid to user to act as user id:
  //res.cookie("userid", "x", {maxAge: 1000*60*60*24*1});
  if (S1) res.cookie("SC", S1, {maxAge: 1000*60, sameSite: true});
  res.sendFile(process.cwd() + '/recognizr.html');
});

//updating stuff
app.get('/ext', (req, res) => { //for plugins 1.2 and before (seems deprecated)
  logIp(req);
  res.sendFile(process.cwd() + '/C.xml');
});
app.get('/C', (req, res) => {
  logIp(req);
  res.sendFile(process.cwd() + '/C.xml');
});
app.get('/F', (req, res) => {
  logIp(req);
  res.sendFile(process.cwd() + '/F.json');
});

app.get('/plugin*', (req, res) => {
  logIp(req);
  res.sendFile(process.cwd() + req.path);
});

//log
app.post('/log', (req, res) => {
  //this should log user-passed faults
  logIp(req);
  console.log(JSON.stringify(req.body));
})

//vision proxy
app.post('/', async (req, res) => {
  logIp(req);
  res.appendHeader('content-type','application/json');
  //SmartCaptcha
  if (S2) {
    let captcha1 = await fetch(`${SC}?secret=${S2}&ip=${req.real_ip}&token=${req.body.token}`);
    if (captcha1.status == 200) {
      let captcha2 = await captcha1.json();
      if (captcha2.status != "ok") {
        res.send(JSON.stringify(
          {recognizr: "ok", answer: captcha1.status, result: captcha2}
        ));
        return;
      }
    }
  }
  //get token
  let result = await fetch(MD, {"headers": {"Metadata-Flavor": "Google"}});
  let reslt2 = await result.json();
  let token = reslt2.access_token;
  //prepare body
  let img = req.body.img;
  let my_json = {"mimeType":"JPEG","languageCodes":["en","ru"],"model":"page"};
  my_json.content = img;
  if (req.body.type == "pdf") my_json.mimeType = "PDF";
  if (req.body.model) my_json.model = req.body.model;
  //recognize
  let vision1 = await fetch(VA, {method: "POST", headers: {Authorization: "Bearer " + token}, body: JSON.stringify(my_json)});
  let vision2 = await vision1.json();
  //reply
  let my_vision = {recognizr: "ok", answer: vision1.status, result: vision2};
  res.send(JSON.stringify(my_vision));
});

app.listen(PORT, HOST, () => {
  console.log(`Running v1.4 on http://${HOST}:${PORT}` + (S1?" with SmartCaptcha":""));
});
