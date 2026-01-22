// 小鹅日记 - Service Worker
// 版本: 1.3.0
// 缓存名称
const CACHE_NAME = 'goose-diary-v1.3.0';
const OFFLINE_CACHE = 'goose-diary-offline-v1';

// 需要缓存的资源
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  'style.css',
  'script.js',
  'gooseai.png',
  'donate.png',
  'icons/icon-72x72.png',
  'icons/icon-96x96.png',
  'icons/icon-128x128.png',
  'icons/icon-144x144.png',
  'icons/icon-152x152.png',
  'icons/icon-192x192.png',
  'icons/icon-384x384.png',
  'icons/icon-512x512.png',
  'https://cdn.tailwindcss.com/3.3.5',
  'https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// 离线页面HTML
const OFFLINE_HTML = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>小鹅日记 - 离线</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            background: linear-gradient(135deg, #F8F4E3 0%, #E6F4F1 100%);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            color: #4F6D7A;
        }
        .container {
            max-width: 400px;
            text-align: center;
            padding: 40px 30px;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(79, 109, 122, 0.2);
        }
        .goose-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            background: #a8d1e7;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            color: #4F6D7A;
        }
        h1 {
            font-size: 24px;
            margin-bottom: 10px;
            color: #4F6D7A;
        }
        p {
            margin-bottom: 20px;
            line-height: 1.5;
            color: #666;
        }
        .tip {
            background: #E6F4F1;
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            border-left: 4px solid #4F6D7A;
        }
        .tip h3 {
            color: #4F6D7A;
            margin-bottom: 8px;
        }
        .tip ul {
            text-align: left;
            padding-left: 20px;
        }
        .tip li {
            margin-bottom: 5px;
        }
        .actions {
            margin-top: 30px;
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        button {
            padding: 12px 24px;
            border: none;
            border-radius: 10px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s;
            font-family: inherit;
        }
        .retry {
            background: #4F6D7A;
            color: white;
        }
        .back {
            background: #D9AE94;
            color: #333;
        }
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        .offline-data {
            margin-top: 25px;
            padding: 15px;
            background: #FFF9F0;
            border-radius: 10px;
            border: 1px dashed #D9AE94;
        }
        .offline-data h4 {
            color: #E07A5F;
            margin-bottom: 10px;
        }
        .status {
            margin-top: 15px;
            font-size: 14px;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="goose-icon">🐤</div>
        <h1>小鹅日记</h1>
        <p>网络连接已断开，无法连接到服务器。</p>
        
        <div class="tip">
            <h3>离线功能说明：</h3>
            <ul>
                <li>日记数据已保存在浏览器中</li>
                <li>您可以继续浏览已加载的页面</li>
                <li>网络恢复后可正常同步</li>
                <li>所有本地数据均不受影响</li>
            </ul>
        </div>
        
        <div class="offline-data">
            <h4>📊 离线数据统计</h4>
            <p>您的日记数据已本地保存，请放心使用。</p>
        </div>
        
        <div class="actions">
            <button class="retry" onclick="window.location.reload()">刷新页面</button>
            <button class="back" onclick="window.history.back()">返回上一页</button>
        </div>
        
        <div class="status">
            <p>小鹅日记 v1.3.0 | 离线模式</p>
        </div>
    </div>
</body>
</html>
`;

// 安装事件 - 缓存静态资源
self.addEventListener('install', event => {
    console.log('[Service Worker] 安装中...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] 正在缓存核心资源...');
                return cache.addAll(STATIC_RESOURCES);
            })
            .then(() => {
                console.log('[Service Worker] 核心资源缓存完成');
                // 跳过等待阶段，立即激活新的 Service Worker
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('[Service Worker] 缓存失败:', error);
            })
    );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
    console.log('[Service Worker] 激活中...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        // 删除旧版本的缓存
                        if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE) {
                            console.log('[Service Worker] 删除旧缓存:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[Service Worker] 已清理旧缓存');
                // 立即控制所有客户端
                return self.clients.claim();
            })
    );
});

// 监听推送通知
self.addEventListener('push', event => {
    console.log('[Service Worker] 收到推送通知');
    
    const title = '小鹅日记';
    const options = {
        body: event.data ? event.data.text() : '今天记得写日记哦！',
        icon: 'icons/icon-192x192.png',
        badge: 'icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 'goose-diary-reminder'
        },
        actions: [
            {
                action: 'open',
                title: '打开应用'
            },
            {
                action: 'dismiss',
                title: '忽略'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// 处理通知点击
self.addEventListener('notificationclick', event => {
    console.log('[Service Worker] 通知被点击');
    
    event.notification.close();
    
    if (event.action === 'open') {
        // 用户点击了"打开应用"
        event.waitUntil(
            clients.openWindow('/')
        );
    } else if (event.action === 'dismiss') {
        // 用户点击了"忽略"，不做任何操作
        console.log('通知被忽略');
    } else {
        // 用户点击了通知本身
        event.waitUntil(
            clients.matchAll({
                type: 'window',
                includeUncontrolled: true
            }).then(windowClients => {
                if (windowClients.length > 0) {
                    // 如果已经有打开的窗口，则聚焦它
                    windowClients[0].focus();
                } else {
                    // 否则打开新窗口
                    clients.openWindow('/');
                }
            })
        );
    }
});

// 同步事件（后台同步）
self.addEventListener('sync', event => {
    console.log('[Service Worker] 后台同步事件:', event.tag);
    
    if (event.tag === 'sync-diary-data') {
        event.waitUntil(syncDiaryData());
    }
});

// 后台同步日记数据
async function syncDiaryData() {
    console.log('[Service Worker] 正在同步日记数据...');
    
    try {
        // 这里可以添加云端同步逻辑
        // 由于是本地应用，这里只是示例
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        const syncData = {
            timestamp: new Date().toISOString(),
            userCount: Object.keys(users).length,
            syncType: 'background'
        };
        
        console.log('[Service Worker] 同步数据:', syncData);
        return Promise.resolve();
    } catch (error) {
        console.error('[Service Worker] 同步失败:', error);
        return Promise.reject(error);
    }
}

// 定期提醒功能（周期性同步）
self.addEventListener('periodicsync', event => {
    console.log('[Service Worker] 周期性同步:', event.tag);
    
    if (event.tag === 'daily-reminder') {
        event.waitUntil(sendDailyReminder());
    }
});

// 发送每日提醒
async function sendDailyReminder() {
    const now = new Date();
    const hour = now.getHours();
    
    // 只在白天时间发送提醒
    if (hour >= 8 && hour <= 22) {
        console.log('[Service Worker] 发送每日提醒');
        
        // 检查用户是否有今日日记
        try {
            const currentUser = await getCurrentUser();
            if (currentUser) {
                const diaries = JSON.parse(localStorage.getItem(`diaries_${currentUser}`) || '[]');
                const today = new Date().toISOString().split('T')[0];
                const hasTodayDiary = diaries.some(diary => diary.date === today);
                
                if (!hasTodayDiary) {
                    // 用户今天还没写日记，发送提醒
                    const title = '小鹅日记提醒';
                    const options = {
                        body: '今天还没写日记呢，快来记录一下吧！',
                        icon: 'icons/icon-192x192.png',
                        badge: 'icons/icon-72x72.png',
                        tag: 'daily-reminder',
                        renotify: true,
                        data: {
                            reminderType: 'daily',
                            timestamp: now.getTime()
                        }
                    };
                    
                    return self.registration.showNotification(title, options);
                }
            }
        } catch (error) {
            console.error('[Service Worker] 发送提醒失败:', error);
        }
    }
}

// 获取当前用户（简化版，实际需要更复杂的跨上下文通信）
async function getCurrentUser() {
    try {
        const clients = await self.clients.matchAll();
        for (const client of clients) {
            // 尝试从客户端获取用户信息
            // 注意：这需要客户端配合发送消息
            if (client.url && client.url.includes('goose-diary')) {
                return 'user'; // 简化处理，实际需要真实用户信息
            }
        }
    } catch (error) {
        console.error('[Service Worker] 获取用户信息失败:', error);
    }
    return null;
}

// 拦截请求
self.addEventListener('fetch', event => {
    // 排除非HTTP请求和Chrome扩展
    if (!event.request.url.startsWith('http') || 
        event.request.url.includes('chrome-extension://')) {
        return;
    }
    
    // 处理离线情况的策略
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // 如果有缓存，返回缓存
                if (cachedResponse) {
                    console.log('[Service Worker] 从缓存返回:', event.request.url);
                    return cachedResponse;
                }
                
                // 否则尝试从网络获取
                return fetch(event.request)
                    .then(networkResponse => {
                        // 成功获取网络响应，缓存它
                        if (event.request.method === 'GET' && 
                            networkResponse.status === 200) {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });
                        }
                        return networkResponse;
                    })
                    .catch(error => {
                        console.log('[Service Worker] 网络请求失败:', error);
                        
                        // 如果是HTML请求，返回离线页面
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return new Response(OFFLINE_HTML, {
                                headers: { 'Content-Type': 'text/html' },
                                status: 200,
                                statusText: 'OK'
                            });
                        }
                        
                        // 如果是API请求，返回合适的错误响应
                        if (event.request.url.includes('/api/')) {
                            return new Response(JSON.stringify({
                                error: '网络连接失败',
                                offline: true,
                                timestamp: new Date().toISOString()
                            }), {
                                headers: { 'Content-Type': 'application/json' },
                                status: 503
                            });
                        }
                        
                        // 其他请求，返回默认离线响应
                        return new Response('网络连接失败，请检查网络设置', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});

// 监听消息
self.addEventListener('message', event => {
    console.log('[Service Worker] 收到消息:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_ASSETS') {
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(event.data.payload);
            })
            .then(() => {
                event.ports[0].postMessage({ success: true });
            })
            .catch(error => {
                event.ports[0].postMessage({ success: false, error: error.message });
            });
    }
});

// 监听后台fetch事件（用于分析）
self.addEventListener('backgroundfetchsuccess', event => {
    console.log('[Service Worker] 后台抓取成功:', event.registration.id);
    
    event.updateUI({ title: '小鹅日记数据同步完成' });
});

self.addEventListener('backgroundfetchfail', event => {
    console.log('[Service Worker] 后台抓取失败:', event.registration.id);
    
    event.updateUI({ title: '小鹅日记同步失败' });
});