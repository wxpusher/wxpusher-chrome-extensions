//内存存储一些数据，每次打开的时候，初始化
function setVersion(version) {
    localStorage['version'] = version;
}

function getVersion() {
    return localStorage['version'] || '';
}

function setPlatform(platform) {
    localStorage['platform'] = platform;
}

function getPlatform() {
    return localStorage['platform'] || '';
}

function isWsConnect() {
    return localStorage['isWsConnect'] || false;
}
function setWsConnect(isWsConnect) {
    return localStorage['isWsConnect'] = isWsConnect;
}

function getPushToken() {
    return localStorage['pushToken'] || '';
}

function setPushToken(pushToken) {
    localStorage['pushToken'] = pushToken;
}
function setDeviceToken(deviceToken) {
    localStorage['deviceToken'] = deviceToken;
}

function getDeviceToken() {
    return localStorage['deviceToken'] || '';
}
function setDeviceUuid(deviceUuid) {
    localStorage['deviceUuid'] = deviceUuid;
}

function getDeviceUuid() {
    return localStorage['deviceUuid'] || '';
}

function setDeviceName(deviceName) {
    localStorage['deviceName'] = deviceName;
}

function getDeviceName() {
    return localStorage['deviceName'] || '';
}

