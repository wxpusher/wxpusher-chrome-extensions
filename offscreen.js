// 监听来自Service Worker的消息
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'play-notification-sound') {
    playNotificationSound();
  }
});

// 播放通知声音
function playNotificationSound() {
  const audio = document.getElementById('notification-sound');
  if (audio) {
    // 确保音频从头开始播放
    audio.currentTime = 0;
    
    // 播放声音
    audio.play()
      .then(() => {
        console.log('通知声音播放成功');
      })
      .catch((error) => {
        console.error('通知声音播放失败:', error);
      });
  }
}

// 在页面加载时通知Service Worker
window.onload = () => {
  chrome.runtime.sendMessage({
    type: 'offscreen-ready'
  });
}; 