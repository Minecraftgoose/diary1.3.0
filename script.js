// ==================== 窗口管理函数 ====================

// 窗口管理器类
class WindowManager {
    constructor() {
        this.windows = {};
        this.zIndexCounter = 1000;
        this.init();
    }
    
    init() {
        // 绑定全局窗口事件
        document.addEventListener('click', (e) => {
            // 点击窗口标题栏时置顶窗口
            if (e.target.closest('.window-title-bar')) {
                const windowEl = e.target.closest('.window-container');
                if (windowEl) {
                    this.bringToFront(windowEl.id);
                }
            }
        });
        
        // 绑定ESC键关闭所有窗口
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllWindows();
            }
        });
        
        // 确保body有窗口容器
        if (!document.getElementById('windows-container')) {
            const container = document.createElement('div');
            container.id = 'windows-container';
            container.className = 'fixed inset-0 pointer-events-none z-30';
            document.body.appendChild(container);
        }
    }
    
    // 创建新窗口
    createWindow(windowId, title, content, options = {}) {
        const defaultOptions = {
            width: options.width || '600px',
            height: options.height || '500px',
            x: options.x || Math.random() * (window.innerWidth - 600) * 0.5 + 100,
            y: options.y || Math.random() * (window.innerHeight - 500) * 0.5 + 50,
            minWidth: options.minWidth || '300px',
            minHeight: options.minHeight || '200px',
            resizable: options.resizable !== false,
            draggable: options.draggable !== false,
            closable: options.closable !== false,
            minimizable: false // 删除最小化功能
        };
        
        // 如果窗口已存在，先关闭
        if (this.windows[windowId]) {
            this.closeWindow(windowId);
        }
        
        // 创建窗口元素
        const windowEl = document.createElement('div');
        windowEl.id = windowId;
        windowEl.className = `window-container absolute bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col overflow-hidden pointer-events-auto ${options.className || ''}`;
        windowEl.style.width = defaultOptions.width;
        windowEl.style.height = defaultOptions.height;
        windowEl.style.left = `${defaultOptions.x}px`;
        windowEl.style.top = `${defaultOptions.y}px`;
        windowEl.style.zIndex = this.zIndexCounter++;
        windowEl.style.touchAction = 'none'; // 防止触摸滚动干扰
        
        // 创建窗口标题栏
        const titleBar = document.createElement('div');
        titleBar.className = 'window-title-bar bg-primary text-white px-4 py-3 flex items-center justify-between cursor-move select-none touch-action-none';
        titleBar.innerHTML = `
            <div class="flex items-center">
                ${options.icon ? `<span class="mr-2">${options.icon}</span>` : ''}
                <span class="font-medium text-sm">${title}</span>
            </div>
            <div class="flex items-center space-x-2">
                ${defaultOptions.closable ? 
                    `<button class="window-close-btn text-white hover:text-red-300 transition-colors" data-window="${windowId}">
                        <i class="fa fa-times"></i>
                    </button>` : ''}
            </div>
        `;
        
        // 创建窗口内容区
        const contentArea = document.createElement('div');
        contentArea.className = 'window-content flex-grow overflow-auto bg-white';
        contentArea.innerHTML = content;
        
        windowEl.appendChild(titleBar);
        windowEl.appendChild(contentArea);
        
        // 添加到窗口容器
        document.getElementById('windows-container').appendChild(windowEl);
        
        // 存储窗口引用
        this.windows[windowId] = {
            element: windowEl,
            options: defaultOptions,
            originalPosition: { x: defaultOptions.x, y: defaultOptions.y },
            originalSize: { width: defaultOptions.width, height: defaultOptions.height }
        };
        
        // 绑定窗口事件
        this.bindWindowEvents(windowId);
        
        return windowEl;
    }
    
    // 绑定窗口事件 - 修复触摸屏支持
    bindWindowEvents(windowId) {
        const windowData = this.windows[windowId];
        const windowEl = windowData.element;
        
        // 拖动功能 - 支持触摸屏
        if (windowData.options.draggable) {
            const titleBar = windowEl.querySelector('.window-title-bar');
            let isDragging = false;
            let dragOffset = { x: 0, y: 0 };
            
            // 开始拖动 - 支持鼠标和触摸
            const startDrag = (e) => {
                // 如果点击的是关闭按钮，不拖动
                if (e.target.closest('.window-close-btn')) {
                    return;
                }
                
                isDragging = true;
                
                // 获取点击位置
                let clientX, clientY;
                if (e.type === 'touchstart') {
                    clientX = e.touches[0].clientX;
                    clientY = e.touches[0].clientY;
                } else {
                    clientX = e.clientX;
                    clientY = e.clientY;
                }
                
                const rect = windowEl.getBoundingClientRect();
                dragOffset = {
                    x: clientX - rect.left,
                    y: clientY - rect.top
                };
                
                this.bringToFront(windowId);
                
                // 绑定移动和结束事件
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
                document.addEventListener('touchmove', onTouchMove, { passive: false });
                document.addEventListener('touchend', onTouchEnd);
                
                e.preventDefault();
            };
            
            // 鼠标移动
            const onMouseMove = (e) => {
                if (!isDragging) return;
                updatePosition(e.clientX, e.clientY);
                e.preventDefault();
            };
            
            // 触摸移动
            const onTouchMove = (e) => {
                if (!isDragging) return;
                if (e.touches.length > 0) {
                    updatePosition(e.touches[0].clientX, e.touches[0].clientY);
                    e.preventDefault(); // 防止页面滚动
                }
            };
            
            // 更新位置
            const updatePosition = (clientX, clientY) => {
                const x = clientX - dragOffset.x;
                const y = clientY - dragOffset.y;
                
                // 确保窗口保持在视口内
                const maxX = window.innerWidth - windowEl.offsetWidth;
                const maxY = window.innerHeight - windowEl.offsetHeight;
                
                windowEl.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
                windowEl.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
            };
            
            // 鼠标抬起
            const onMouseUp = () => {
                endDrag();
            };
            
            // 触摸结束
            const onTouchEnd = () => {
                endDrag();
            };
            
            // 结束拖动
            const endDrag = () => {
                isDragging = false;
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                document.removeEventListener('touchmove', onTouchMove);
                document.removeEventListener('touchend', onTouchEnd);
            };
            
            // 绑定开始事件
            titleBar.addEventListener('mousedown', startDrag);
            titleBar.addEventListener('touchstart', startDrag, { passive: false });
            
            // 防止触摸滚动在标题栏上发生
            titleBar.addEventListener('touchmove', (e) => {
                if (isDragging) {
                    e.preventDefault();
                }
            }, { passive: false });
        }
        
        // 调整大小功能 - 支持触摸屏
        if (windowData.options.resizable) {
            const resizeHandle = document.createElement('div');
            resizeHandle.className = 'absolute bottom-0 right-0 w-8 h-8 cursor-se-resize touch-resize-handle';
            resizeHandle.innerHTML = '<div class="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-gray-400"></div>';
            windowEl.appendChild(resizeHandle);
            
            let isResizing = false;
            let startSize = { width: 0, height: 0 };
            let startPos = { x: 0, y: 0 };
            
            // 开始调整大小 - 支持鼠标和触摸
            const startResize = (e) => {
                isResizing = true;
                
                // 获取开始位置
                let clientX, clientY;
                if (e.type === 'touchstart') {
                    clientX = e.touches[0].clientX;
                    clientY = e.touches[0].clientY;
                } else {
                    clientX = e.clientX;
                    clientY = e.clientY;
                }
                
                startSize = {
                    width: windowEl.offsetWidth,
                    height: windowEl.offsetHeight
                };
                startPos = { x: clientX, y: clientY };
                
                // 绑定移动和结束事件
                document.addEventListener('mousemove', onResizeMove);
                document.addEventListener('mouseup', onResizeUp);
                document.addEventListener('touchmove', onResizeTouchMove, { passive: false });
                document.addEventListener('touchend', onResizeTouchEnd);
                
                e.preventDefault();
            };
            
            // 鼠标移动调整
            const onResizeMove = (e) => {
                if (!isResizing) return;
                updateSize(e.clientX, e.clientY);
                e.preventDefault();
            };
            
            // 触摸移动调整
            const onResizeTouchMove = (e) => {
                if (!isResizing) return;
                if (e.touches.length > 0) {
                    updateSize(e.touches[0].clientX, e.touches[0].clientY);
                    e.preventDefault(); // 防止页面滚动
                }
            };
            
            // 更新大小
            const updateSize = (clientX, clientY) => {
                const deltaX = clientX - startPos.x;
                const deltaY = clientY - startPos.y;
                
                const newWidth = Math.max(
                    parseInt(windowData.options.minWidth) || 300,
                    startSize.width + deltaX
                );
                const newHeight = Math.max(
                    parseInt(windowData.options.minHeight) || 200,
                    startSize.height + deltaY
                );
                
                windowEl.style.width = `${newWidth}px`;
                windowEl.style.height = `${newHeight}px`;
            };
            
            // 鼠标抬起结束调整
            const onResizeUp = () => {
                endResize();
            };
            
            // 触摸结束调整
            const onResizeTouchEnd = () => {
                endResize();
            };
            
            // 结束调整大小
            const endResize = () => {
                isResizing = false;
                document.removeEventListener('mousemove', onResizeMove);
                document.removeEventListener('mouseup', onResizeUp);
                document.removeEventListener('touchmove', onResizeTouchMove);
                document.removeEventListener('touchend', onResizeTouchEnd);
            };
            
            // 绑定开始事件
            resizeHandle.addEventListener('mousedown', startResize);
            resizeHandle.addEventListener('touchstart', startResize, { passive: false });
            
            // 防止触摸滚动在调整手柄上发生
            resizeHandle.addEventListener('touchmove', (e) => {
                if (isResizing) {
                    e.preventDefault();
                }
            }, { passive: false });
        }
        
        // 关闭按钮
        const closeBtn = windowEl.querySelector('.window-close-btn');
        if (closeBtn) {
            // 添加触摸支持
            closeBtn.addEventListener('touchstart', (e) => {
                e.preventDefault(); // 防止触摸触发其他事件
                e.stopPropagation();
            }, { passive: false });
            
            closeBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.closeWindow(windowId);
            });
            
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeWindow(windowId);
            });
        }
        
        // 防止窗口内容在触摸时触发拖动
        const contentArea = windowEl.querySelector('.window-content');
        if (contentArea) {
            contentArea.addEventListener('touchstart', (e) => {
                if (e.target.tagName === 'INPUT' || 
                    e.target.tagName === 'TEXTAREA' || 
                    e.target.tagName === 'SELECT' ||
                    e.target.tagName === 'BUTTON' ||
                    e.target.closest('button') ||
                    e.target.closest('input') ||
                    e.target.closest('textarea') ||
                    e.target.closest('select')) {
                    // 允许表单元素正常工作
                    return;
                }
                // 防止内容区域触摸事件冒泡到窗口拖动
                e.stopPropagation();
            }, { passive: false });
        }
    }
    
    // 打开窗口
    openWindow(windowId) {
        const windowData = this.windows[windowId];
        if (!windowData) return;
        
        windowData.element.classList.remove('hidden');
        this.bringToFront(windowId);
    }
    
    // 关闭窗口
    closeWindow(windowId) {
        const windowData = this.windows[windowId];
        if (!windowData) return;
        
        if (windowData.element && windowData.element.parentNode) {
            windowData.element.parentNode.removeChild(windowData.element);
        }
        
        delete this.windows[windowId];
    }
    
    // 将窗口置于最前
    bringToFront(windowId) {
        const windowData = this.windows[windowId];
        if (!windowData) return;
        
        // 更新所有窗口的z-index
        for (const id in this.windows) {
            this.windows[id].element.style.zIndex = 1000;
        }
        
        // 将当前窗口置顶
        windowData.element.style.zIndex = this.zIndexCounter++;
    }
    
    // 关闭所有窗口
    closeAllWindows() {
        for (const windowId in this.windows) {
            this.closeWindow(windowId);
        }
    }
    
    // 检查窗口是否打开
    isWindowOpen(windowId) {
        return !!this.windows[windowId];
    }
    
    // 获取窗口内容元素
    getWindowContent(windowId) {
        const windowData = this.windows[windowId];
        return windowData ? windowData.element.querySelector('.window-content') : null;
    }
}

// 初始化窗口管理器
const windowManager = new WindowManager();

// ==================== 性能优化函数 ====================

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 节流函数
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 简单的事件委托函数
function delegateEvent(container, selector, event, handler) {
    container.addEventListener(event, function(e) {
        const target = e.target.closest(selector);
        if (target && container.contains(target)) {
            handler.call(target, e);
        }
    });
}

// 根据时间获取问候语
function getTimeBasedGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 9) {
        return '早上好';
    } else if (hour >= 9 && hour < 12) {
        return '上午好';
    } else if (hour >= 12 && hour < 14) {
        return '中午好';
    } else if (hour >= 14 && hour < 18) {
        return '下午好';
    } else if (hour >= 18 && hour < 22) {
        return '晚上好';
    } else {
        return '夜深了';
    }
}

// 格式化时间为 24小时制（HH:MM）
function formatTimeForTitle() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// 设置最长加载时间，确保页面能正常显示
const MAX_LOADING_TIME = 3000;

// 安全的加密函数（使用更简单但相对安全的方法）
function simpleEncrypt(str) {
    const timestamp = Date.now().toString().substr(-4);
    const encoded = btoa(encodeURIComponent(str + '|' + timestamp));
    // 添加简单的混淆
    return encoded.split('').reverse().join('');
}

// 安全的解密函数
function simpleDecrypt(str) {
    try {
        // 反转混淆
        const reversed = str.split('').reverse().join('');
        const decoded = decodeURIComponent(atob(reversed));
        return decoded.split('|')[0];
    } catch (e) {
        return '';
    }
}

// 记住我功能的存储和读取
class RememberMeManager {
    constructor() {
        this.REMEMBER_ME_KEY = 'goose_diary_remember_me';
        this.EXPIRY_DAYS = 7;
    }
    
    // 保存记住我信息
    saveRememberMe(username, password) {
        try {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + this.EXPIRY_DAYS);
            
            const data = {
                username: username,
                password: simpleEncrypt(password),
                expires: expiryDate.getTime()
            };
            
            localStorage.setItem(this.REMEMBER_ME_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('保存记住我信息失败:', e);
            return false;
        }
    }
    
    // 加载记住我信息
    loadRememberMe() {
        try {
            const stored = localStorage.getItem(this.REMEMBER_ME_KEY);
            if (!stored) return null;
            
            const data = JSON.parse(stored);
            
            // 检查是否过期
            if (Date.now() > data.expires) {
                this.clearRememberMe();
                return null;
            }
            
            // 解密密码
            data.password = simpleDecrypt(data.password);
            return data;
        } catch (e) {
            console.error('加载记住我信息失败:', e);
            this.clearRememberMe();
            return null;
        }
    }
    
    // 清除记住我信息
    clearRememberMe() {
        localStorage.removeItem(this.REMEMBER_ME_KEY);
    }
    
    // 检查是否有记住我信息
    hasRememberMe() {
        return !!this.loadRememberMe();
    }
}

// ==================== 管理员功能类 ====================

// 管理员管理器
class AdminManager {
    constructor(authManager) {
        this.authManager = authManager;
        this.ADMIN_USERNAME = 'admin';
        this.init();
    }
    
    init() {
        this.ensureAdminAccount();
    }
    
    // 确保管理员账户存在
    ensureAdminAccount() {
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        
        if (!users[this.ADMIN_USERNAME]) {
            // 创建管理员账户
            users[this.ADMIN_USERNAME] = {
                password: simpleEncrypt('admin'), // 默认密码：admin
                createdAt: new Date().toISOString(),
                isAdmin: true,
                lastLogin: null
            };
            
            localStorage.setItem('users', JSON.stringify(users));
            console.log('管理员账户已创建: admin/admin');
        } else {
            // 确保现有管理员账户有isAdmin标志
            if (!users[this.ADMIN_USERNAME].isAdmin) {
                users[this.ADMIN_USERNAME].isAdmin = true;
                localStorage.setItem('users', JSON.stringify(users));
            }
        }
    }
    
    // 检查用户是否为管理员
    isAdmin(username) {
        if (username === this.ADMIN_USERNAME) return true;
        
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        return users[username] && users[username].isAdmin === true;
    }
    
    // 获取所有用户（管理员专用）
    getAllUsers() {
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        const userList = [];
        
        for (const username in users) {
            const userData = users[username];
            // 获取该用户的日记数量
            const diaries = JSON.parse(localStorage.getItem(`diaries_${username}`) || '[]');
            
            userList.push({
                username,
                isAdmin: userData.isAdmin || false,
                createdAt: userData.createdAt || '未知',
                lastLogin: userData.lastLogin || '从未登录',
                diaryCount: diaries.length,
                storageKey: `diaries_${username}`
            });
        }
        
        // 按创建时间排序
        return userList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    // 获取所有用户的日记总数
    getAllDiariesCount() {
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        let total = 0;
        
        for (const username in users) {
            const diaries = JSON.parse(localStorage.getItem(`diaries_${username}`) || '[]');
            total += diaries.length;
        }
        
        return total;
    }
    
    // 删除用户（管理员专用）
    deleteUser(username) {
        if (username === this.ADMIN_USERNAME) {
            return { success: false, message: '不能删除管理员账户' };
        }
        
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        
        if (!users[username]) {
            return { success: false, message: '用户不存在' };
        }
        
        // 删除用户账户
        delete users[username];
        localStorage.setItem('users', JSON.stringify(users));
        
        // 删除用户的日记数据
        localStorage.removeItem(`diaries_${username}`);
        
        return { success: true, message: `用户 ${username} 已删除` };
    }
    
    // 清空所有用户数据（管理员专用）
    clearAllUserData() {
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        
        // 保留管理员账户
        const adminData = users[this.ADMIN_USERNAME];
        const newUsers = { [this.ADMIN_USERNAME]: adminData };
        
        // 删除所有非管理员用户的日记数据
        for (const username in users) {
            if (username !== this.ADMIN_USERNAME) {
                localStorage.removeItem(`diaries_${username}`);
            }
        }
        
        // 重置用户列表（只保留管理员）
        localStorage.setItem('users', JSON.stringify(newUsers));
        
        return { success: true, message: '所有用户数据已清空（管理员账户保留）' };
    }
    
    // 重置管理员密码
    resetAdminPassword() {
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        
        if (users[this.ADMIN_USERNAME]) {
            users[this.ADMIN_USERNAME].password = simpleEncrypt('admin');
            localStorage.setItem('users', JSON.stringify(users));
            return { success: true, message: '管理员密码已重置为默认密码: admin' };
        }
        
        return { success: false, message: '管理员账户不存在' };
    }
    
    // 导出所有用户数据
    exportAllUserData() {
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        const allData = {
            exportDate: new Date().toISOString(),
            version: '1.2.0',
            users: {}
        };
        
        for (const username in users) {
            const diaries = JSON.parse(localStorage.getItem(`diaries_${username}`) || '[]');
            allData.users[username] = {
                userInfo: users[username],
                diaries: diaries,
                diaryCount: diaries.length
            };
        }
        
        const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `goose-diary-all-users-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return { success: true, message: '所有用户数据导出成功' };
    }
    
    // 获取存储使用情况
    getStorageUsage() {
        let totalSize = 0;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            totalSize += key.length + value.length;
        }
        
        // 转换为KB
        const sizeInKB = (totalSize / 1024).toFixed(2);
        return sizeInKB;
    }
    
    // 获取LocalStorage统计信息
    getStorageStats() {
        let totalSize = 0;
        const items = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            const size = key.length + value.length;
            totalSize += size;
            
            items.push({
                key,
                size: (size / 1024).toFixed(2) + ' KB',
                isUserData: key.startsWith('diaries_') || key === 'users',
                isRememberMe: key === 'goose_diary_remember_me',
                isApiKey: key === 'hunyuanApiKey'
            });
        }
        
        // 尝试获取总存储空间（某些浏览器支持）
        let totalSpace = '未知';
        let freeSpace = '未知';
        
        try {
            // 这是一个估算，实际存储限制因浏览器而异
            totalSpace = '5-10 MB（浏览器限制）';
            freeSpace = '未知';
        } catch (e) {
            // 忽略错误
        }
        
        return {
            total: (totalSize / 1024).toFixed(2) + ' KB',
            used: (totalSize / 1024).toFixed(2) + ' KB',
            free: freeSpace,
            items: items
        };
    }
    
    // 清除缓存（非用户数据）
    clearCache() {
        const keysToRemove = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            // 保留用户数据和设置
            if (!key.startsWith('diaries_') && 
                key !== 'users' && 
                key !== 'goose_diary_remember_me' && 
                key !== 'hunyuanApiKey') {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
        
        return { 
            success: true, 
            message: `已清除 ${keysToRemove.length} 个缓存项`,
            clearedItems: keysToRemove.length
        };
    }
    
    // 更新用户最后登录时间
    updateLastLogin(username) {
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        
        if (users[username]) {
            users[username].lastLogin = new Date().toISOString();
            localStorage.setItem('users', JSON.stringify(users));
        }
    }
}

// 小鹅助手类
class GooseAssistant {
    constructor(diaryManager, authManager) {
        this.diaryManager = diaryManager;
        this.authManager = authManager;
        this.init();
    }
    
    init() {
        // 延迟发送欢迎消息
        setTimeout(() => {
            const username = this.authManager.getCurrentUser();
            const isAdmin = this.authManager.adminManager.isAdmin(username);
            
            if (isAdmin) {
                this.showNotification("admin，您好！我是小鹅助手，支持系统管理。");
            } else {
                this.showNotification("你好呀！我是小鹅助手~ 我可以帮你记录日记、分析心情哦！");
            }
            
            // 检查是否有连续记录
            setTimeout(() => {
                const streak = this.diaryManager.calculateStreak();
                if (streak > 1) {
                    this.showNotification(`哇，你已经连续记录${streak}天日记了，真棒！`);
                } else if (streak === 1) {
                    this.showNotification("不错哦，今天已经记录日记了！");
                } else {
                    this.showNotification("今天还没写日记呢，需要我帮你打开写日记的页面吗？");
                }
            }, 1500);
        }, 3000);
    }
    
    // 显示通知
    showNotification(message) {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-24 right-6 bg-white rounded-lg shadow-lg p-4 max-w-xs z-40 slide-up border-l-4 border-gooseBeak';
        notification.innerHTML = `
            <div class="flex items-start">
                <div class="mr-2">
                    <img src="gooseai.png" alt="小鹅助手" class="w-6 h-6 rounded-full object-cover">
                </div>
                <div class="flex-grow">
                    <p class="text-sm">${message}</p>
                </div>
                <button class="close-notification ml-2 text-gray-400 hover:text-gray-600">
                    <i class="fa fa-times"></i>
                </button>
            </div>
        `;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 绑定关闭按钮事件
        const closeBtn = notification.querySelector('.close-notification');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });
        
        // 添加触摸支持
        closeBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        closeBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            notification.remove();
        });
        
        // 5秒后自动移除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
    
    // 助手窗口
    showFullScreen() {
        const username = this.authManager.getCurrentUser();
        const isAdmin = this.authManager.adminManager.isAdmin(username);
        
        const assistantContent = `
            <div class="p-4 h-full flex flex-col">
                <!-- 消息内容区 -->
                <div id="goose-messages" class="flex-grow overflow-y-auto space-y-4 mb-4 touch-pan-y">
                    <div class="flex items-start">
                        <div class="mr-3">
                            <img src="gooseai.png" alt="小鹅助手" class="w-8 h-8 rounded-full object-cover">
                        </div>
                        <div class="bg-gray-100 rounded-lg rounded-tl-none px-4 py-3 max-w-[80%]">
                            <p>hi！我是小鹅助手，有什么可以帮助你的吗？</p>
                        </div>
                    </div>
                </div>
                
                <!-- 输入区 -->
                <div class="border-t pt-4">
                    <form id="goose-form" class="flex gap-3">
                        <input 
                            type="text" 
                            id="goose-input" 
                            placeholder="和小鹅说点什么吧..." 
                            class="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-goose focus:border-goose"
                        >
                        <button type="submit" class="bg-goose hover:bg-goose/80 text-primary px-4 py-2 rounded-lg transition-colors">
                            <i class="fa fa-paper-plane"></i>
                        </button>
                    </form>
                </div>
            </div>
        `;
        
        windowManager.createWindow('goose-assistant-window', '小鹅助手', assistantContent, {
            width: '350px',
            height: '400px',
            icon: '<img src="gooseai.png" alt="小鹅助手" class="w-5 h-5 rounded-full object-cover mr-1">'
        });
        
        // 绑定事件
        setTimeout(() => {
            const windowContent = windowManager.getWindowContent('goose-assistant-window');
            if (windowContent) {
                const form = windowContent.querySelector('#goose-form');
                const input = windowContent.querySelector('#goose-input');
                const messagesContainer = windowContent.querySelector('#goose-messages');
                
                if (form) {
                    form.addEventListener('submit', (e) => {
                        e.preventDefault();
                        const message = input.value.trim();
                        
                        if (message) {
                            // 显示用户消息
                            this.showMessage(message, true, messagesContainer);
                            input.value = '';
                            
                            // 处理消息并回复
                            this.processMessage(message, messagesContainer);
                        }
                    });
                }
                
                // 自动聚焦输入框
                if (input) {
                    input.focus();
                    
                    // 移动端虚拟键盘处理
                    input.addEventListener('touchstart', (e) => {
                        e.stopPropagation();
                    }, { passive: true });
                }
            }
        }, 100);
    }
    
    // 显示帮助信息
    showHelp() {
        this.showFullScreen();
        
        setTimeout(() => {
            const windowContent = windowManager.getWindowContent('goose-assistant-window');
            if (windowContent) {
                const messagesContainer = windowContent.querySelector('#goose-messages');
                const username = this.authManager.getCurrentUser();
                const isAdmin = this.authManager.adminManager.isAdmin(username);
                
                if (isAdmin) {
                    this.showMessage("管理员，我可以帮您做这些事：\n1. 管理用户账户\n2. 查看系统统计\n3. 导出所有数据\n4. 清空用户数据\n5. 分析系统性能\n您可以在主界面点击管理员按钮进入管理员面板。", false, messagesContainer);
                } else {
                    this.showMessage("我可以帮你做这些事哦：\n1. 创建新日记\n2. 统计日记数量\n3. 分析你的心情变化\n4. 生成月度总结\n5. 查看连续记录天数\n你可以试着说'分析我的心情'或者'月度总结'。", false, messagesContainer);
                }
            }
        }, 500);
    }
    
    // 显示消息
    showMessage(text, isUser = false, messagesContainer) {
        if (!messagesContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex items-start ${isUser ? 'justify-end' : ''}`;
        
        if (isUser) {
            messageDiv.innerHTML = `
                <div class="bg-primary text-white rounded-lg rounded-tr-none px-4 py-3 max-w-[80%]">
                    <p>${text}</p>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="mr-3">
                    <img src="gooseai.png" alt="小鹅助手" class="w-8 h-8 rounded-full object-cover">
                </div>
                <div class="bg-gray-100 rounded-lg rounded-tl-none px-4 py-3 max-w-[80%]">
                    <p>${text}</p>
                </div>
            `;
        }
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // 分析心情统计
    analyzeMoods() {
        if (this.diaryManager.diaries.length === 0) {
            return "你还没有写日记呢，开始记录你的心情吧！";
        }
        
        const moodCounts = {};
        this.diaryManager.diaries.forEach(diary => {
            const mood = diary.mood || '其他';
            moodCounts[mood] = (moodCounts[mood] || 0) + 1;
        });
        
        // 找出最常见的心情
        let mostCommonMood = '';
        let maxCount = 0;
        for (const mood in moodCounts) {
            if (moodCounts[mood] > maxCount) {
                maxCount = moodCounts[mood];
                mostCommonMood = mood;
            }
        }
        
        const total = this.diaryManager.diaries.length;
        const percentage = Math.round((maxCount / total) * 100);
        
        return `在你记录的${total}篇日记中，你最常出现的心情是${mostCommonMood}，占${percentage}%。希望你每天都能保持好心情哦！`;
    }
    
    // 生成月度总结
    generateMonthlySummary() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const monthlyDiaries = this.diaryManager.diaries.filter(diary => {
            const date = new Date(diary.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });
        
        if (monthlyDiaries.length === 0) {
            return `这个月(${currentYear}年${currentMonth + 1}月)你还没有写日记呢，开始记录吧！`;
        }
        
        // 统计心情
        const moodCounts = {};
        monthlyDiaries.forEach(diary => {
            const mood = diary.mood || '其他';
            moodCounts[mood] = (moodCounts[mood] || 0) + 1;
        });
        
        // 统计标签
        const tagCounts = {};
        monthlyDiaries.forEach(diary => {
            const tag = diary.tag || '其他';
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
        
        // 找出最常见的标签
        let mostCommonTag = '';
        let maxTagCount = 0;
        for (const tag in tagCounts) {
            if (tagCounts[tag] > maxTagCount) {
                maxTagCount = tagCounts[tag];
                mostCommonTag = tag;
            }
        }
        
        return `这个月(${currentYear}年${currentMonth + 1}月)你已经写了${monthlyDiaries.length}篇日记，主要记录了${mostCommonTag}相关的内容。继续保持哦！`;
    }
    
    // 获取随机回复
    getRandomResponse() {
        const responses = [
            "这个问题很有趣！不过作为本地助手，我的功能有限。",
            "我可以帮你管理日记，分析心情，生成统计信息。",
            "哎，我太难了",
            "你今天的日记写了吗？如果没有，我可以帮你打开写日记页面。",
            "我注意到你已经坚持写日记一段时间了，真棒！",
            "有什么关于日记管理的具体问题吗？我很乐意帮忙。",
            "保持记录的习惯，未来你会感谢现在的自己。",
            "如果你想问我的头像是怎么回事的话，那我告诉你，这是我作者的头像，我给偷来了，o(^▽^)o",
            "我的回答是预设的，别问太难的问题了，我求你了'。"
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // 处理消息并生成回复
    processMessage(message, messagesContainer) {
        const lowerMsg = message.toLowerCase();
        const username = this.authManager.getCurrentUser();
        const isAdmin = this.authManager.adminManager.isAdmin(username);
        
        // 简单的命令识别
        if (lowerMsg.includes('你好') || lowerMsg.includes('嗨') || lowerMsg.includes('hello')) {
            setTimeout(() => {
                if (isAdmin) {
                    this.showMessage("尊敬的 admin 管理员，您好！有什么可以为您服务的吗？", false, messagesContainer);
                } else {
                    this.showMessage("你好呀！有什么可以帮你的吗？", false, messagesContainer);
                }
            }, 800);
        } else if (lowerMsg.includes('创建') && lowerMsg.includes('日记') || 
                  lowerMsg.includes('写') && lowerMsg.includes('日记')) {
            setTimeout(() => {
                this.showMessage("好的，我来帮你打开写日记的页面！", false, messagesContainer);
                setTimeout(() => {
                    this.diaryManager.openAddWindow();
                    windowManager.closeWindow('goose-assistant-window');
                }, 1000);
            }, 800);
        } else if (lowerMsg.includes('日记数量') || lowerMsg.includes('多少篇日记')) {
            setTimeout(() => {
                const count = this.diaryManager.diaries.length;
                this.showMessage(`你目前有 ${count} 篇日记。需要我帮你查看最新的日记吗？`, false, messagesContainer);
            }, 800);
        } else if (lowerMsg.includes('帮助') || lowerMsg.includes('功能')) {
            setTimeout(() => {
                if (isAdmin) {
                    this.showMessage("管理员，我可以帮您做这些事：\n1. 管理用户账户\n2. 查看系统统计\n3. 导出所有数据\n4. 清空用户数据\n5. 分析系统性能\n您可以在主界面点击管理员按钮进入管理员面板。", false, messagesContainer);
                } else {
                    this.showMessage("我可以帮你做这些事哦：\n1. 创建新日记\n2. 统计日记数量\n3. 分析你的心情变化\n4. 生成月度总结\n5. 查看连续记录天数\n你可以试着说'分析我的心情'或者'月度总结'。", false, messagesContainer);
                }
            }, 800);
		} else if (lowerMsg.includes('爸') || lowerMsg.includes('爹') || lowerMsg.includes('作者')) {
            setTimeout(() => {
                if (isAdmin) {
                    this.showMessage("我的爸爸是Minecraft_goose,他现在穷的要命，你能打赏一下他嘛", false, messagesContainer);
                } else {
                    this.showMessage("我的爸爸是Minecraft_goose,他现在穷的要命，你能打赏一下他嘛。", false, messagesContainer);
                }
            }, 800);
        } else if (lowerMsg.includes('今天') && lowerMsg.includes('日记')) {
            setTimeout(() => {
                const today = new Date().toISOString().split('T')[0];
                const todayDiary = this.diaryManager.diaries.find(d => d.date === today);
                
                if (todayDiary) {
                    this.showMessage("你今天已经写了一篇日记哦，需要我帮你打开查看吗？", false, messagesContainer);
                } else {
                    this.showMessage("你今天还没有写日记呢，需要我帮你创建一篇吗？", false, messagesContainer);
                }
            }, 800);
        } else if (lowerMsg.includes('谢谢') || lowerMsg.includes('thank')) {
            setTimeout(() => {
                this.showMessage("不客气！有任何需要随时踹我哦~", false, messagesContainer);
            }, 800);
        } else if (lowerMsg.includes('心情') && (lowerMsg.includes('分析') || lowerMsg.includes('统计'))) {
            setTimeout(() => {
                const analysis = this.analyzeMoods();
                this.showMessage(analysis, false, messagesContainer);
            }, 1200);
        } else if (lowerMsg.includes('月度') && (lowerMsg.includes('总结') || lowerMsg.includes('统计'))) {
            setTimeout(() => {
                const summary = this.generateMonthlySummary();
                this.showMessage(summary, false, messagesContainer);
            }, 1200);
        } else if (lowerMsg.includes('连续') && (lowerMsg.includes('记录') || lowerMsg.includes('天数'))) {
            setTimeout(() => {
                const streak = this.diaryManager.calculateStreak();
                if (streak > 1) {
                    this.showMessage(`你已经连续记录${streak}天日记了，太厉害了！继续保持哦！`, false, messagesContainer);
                } else if (streak === 1) {
                    this.showMessage("你今天已经记录日记了，继续努力保持下去吧！", false, messagesContainer);
                } else {
                    this.showMessage("今天还没记录日记哦，现在写一篇就能开始你的连续记录啦！", false, messagesContainer);
                }
            }, 800);
        } else if (isAdmin && (lowerMsg.includes('用户') || lowerMsg.includes('管理'))) {
            setTimeout(() => {
                this.showMessage("好的，正在为您打开管理员面板...", false, messagesContainer);
                setTimeout(() => {
                    // 触发管理员面板按钮点击
                    const adminBtn = document.getElementById('admin-btn');
                    if (adminBtn) adminBtn.click();
                    windowManager.closeWindow('goose-assistant-window');
                }, 1000);
            }, 800);
        } else if (lowerMsg.includes('帮助') || lowerMsg.includes('help')) {
            setTimeout(() => {
                this.showMessage("我可以帮你做这些事：\n1. 创建新日记\n2. 统计日记数量\n3. 分析你的心情变化\n4. 生成月度总结\n5. 查看连续记录天数\n6. 搜索和过滤日记\n试试说'今天写日记了吗'或'分析我的心情'。", false, messagesContainer);
            }, 800);
        } else if (lowerMsg.includes('关于') || lowerMsg.includes('about')) {
            setTimeout(() => {
                this.showMessage("我是小鹅助手，一个本地AI助手，专门帮助您管理日记。我无需联网即可工作，保护您的隐私安全。", false, messagesContainer);
            }, 800);
        } else if (lowerMsg.includes('设置') || lowerMsg.includes('setting')) {
            setTimeout(() => {
                this.showMessage("您可以在主界面点击设置按钮进入设置页面，在那里可以修改密码、导出数据等。", false, messagesContainer);
            }, 800);
        } else {
            // 其他问题使用本地回复
            setTimeout(() => {
                this.showMessage(this.getRandomResponse(), false, messagesContainer);
            }, 800);
        }
    }
}

// 用户认证管理
class AuthManager {
    constructor() {
        this.rememberMeManager = new RememberMeManager();
        this.adminManager = new AdminManager(this);
        this.currentUser = null;
        this.isAdminUser = false;
        this.init();
    }
    
    init() {
        // 初始化用户数据存储
        if (!localStorage.getItem('users')) {
            localStorage.setItem('users', JSON.stringify({}));
        }
        
        // 确保管理员账户存在
        this.adminManager.ensureAdminAccount();
    }
    
    // 注册新用户
    register(username, password) {
        // 检查用户名是否为admin（保留字）
        if (username.toLowerCase() === 'admin') {
            return { success: false, message: '用户名 "admin" 是保留字，请使用其他用户名' };
        }
        
        const users = JSON.parse(localStorage.getItem('users'));
        
        // 检查用户名是否已存在
        if (users[username]) {
            return { success: false, message: '用户名已存在' };
        }
        
        // 保存用户信息（密码加密）
        users[username] = {
            password: simpleEncrypt(password),
            createdAt: new Date().toISOString(),
            lastLogin: null,
            isAdmin: false
        };
        
        localStorage.setItem('users', JSON.stringify(users));
        
        // 初始化该用户的日记存储
        localStorage.setItem(`diaries_${username}`, JSON.stringify([]));
        
        return { success: true, message: '注册成功，请登录' };
    }
    
    // 用户登录 - 支持记住我功能
    login(username, password, rememberMe = false) {
        const users = JSON.parse(localStorage.getItem('users'));
        const user = users[username];
        
        // 检查用户是否存在
        if (!user) {
            return { success: false, message: '用户名或密码错误' };
        }
        
        // 验证密码
        const decryptedPassword = simpleDecrypt(user.password);
        if (decryptedPassword !== password) {
            return { success: false, message: '用户名或密码错误' };
        }
        
        // 保存当前用户到内存
        this.currentUser = username;
        this.isAdminUser = this.adminManager.isAdmin(username);
        
        // 更新最后登录时间
        this.adminManager.updateLastLogin(username);
        
        // 如果勾选了记住我，保存信息
        if (rememberMe) {
            this.rememberMeManager.saveRememberMe(username, password);
        } else {
            // 如果未勾选记住我，清除可能的旧记录
            this.rememberMeManager.clearRememberMe();
        }
        
        return { success: true, message: '登录成功', user: username, isAdmin: this.isAdminUser };
    }
    
    // 自动登录（通过记住我功能）
    autoLogin() {
        const rememberMeData = this.rememberMeManager.loadRememberMe();
        if (rememberMeData) {
            const result = this.login(rememberMeData.username, rememberMeData.password, true);
            if (result.success) {
                return result;
            } else {
                // 自动登录失败，清除记住我信息
                this.rememberMeManager.clearRememberMe();
            }
        }
        return { success: false, message: '需要手动登录' };
    }
    
    // 修改密码
    changePassword(username, currentPassword, newPassword) {
        const users = JSON.parse(localStorage.getItem('users'));
        const user = users[username];
        
        // 验证当前密码
        const decryptedPassword = simpleDecrypt(user.password);
        if (decryptedPassword !== currentPassword) {
            return { success: false, message: '当前密码错误' };
        }
        
        // 更新密码
        user.password = simpleEncrypt(newPassword);
        users[username] = user;
        localStorage.setItem('users', JSON.stringify(users));
        
        // 更新记住我信息（如果存在）
        const rememberMeData = this.rememberMeManager.loadRememberMe();
        if (rememberMeData && rememberMeData.username === username) {
            this.rememberMeManager.saveRememberMe(username, newPassword);
        }
        
        return { success: true, message: '密码修改成功' };
    }
    
    // 用户登出
    logout() {
        // 如果用户没有勾选记住我，清除记住我信息
        const rememberMeData = this.rememberMeManager.loadRememberMe();
        if (!rememberMeData || rememberMeData.username !== this.currentUser) {
            this.rememberMeManager.clearRememberMe();
        }
        
        this.currentUser = null;
        this.isAdminUser = false;
        return { success: true, message: '已退出' };
    }
    
    // 检查是否已登录
    isLoggedIn() {
        return !!this.currentUser;
    }
    
    // 获取当前登录用户
    getCurrentUser() {
        return this.currentUser;
    }
    
    // 检查是否是管理员
    isAdmin() {
        return this.isAdminUser;
    }
    
    // 检查是否有记住我信息
    hasRememberMe() {
        return this.rememberMeManager.hasRememberMe();
    }
}

// 日记数据管理
class DiaryManager {
    constructor(authManager) {
        this.authManager = authManager;
        this.diaries = [];
        this.currentPage = 1;
        this.diariesPerPage = 12; // 每页显示12篇日记
        this.init();
    }
    
    init() {
        const currentUser = this.authManager.getCurrentUser();
        if (!currentUser) {
            this.diaries = [];
            return;
        }
        
        // 初始化当前用户的日记数据
        try {
            const storedDiaries = localStorage.getItem(`diaries_${currentUser}`);
            this.diaries = storedDiaries ? JSON.parse(storedDiaries) : [];
            
            // 验证日记数据格式
            if (!Array.isArray(this.diaries)) {
                this.diaries = [];
            }
        } catch (e) {
            console.error('加载日记数据失败，重置为空白', e);
            this.diaries = [];
            this.saveDiaries();
        }
        
        this.initMonthsFilter();
        this.renderDiaries();
        this.updateCounters();
    }
    
    // 计算连续记录天数
    calculateStreak() {
        if (this.diaries.length === 0) return 0;
        
        // 按日期排序
        const sortedDiaries = [...this.diaries].sort((a, b) => new Date(b.date) - new Date(a.date));
        const dates = sortedDiaries.map(d => new Date(d.date).toISOString().split('T')[0]);
        
        // 去重并排序
        const uniqueDates = [...new Set(dates)].sort((a, b) => new Date(b) - new Date(a));
        
        if (uniqueDates.length === 0) return 0;
        
        // 检查最新日记是否是今天或昨天
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        
        // 如果最新日记不是今天或昨天，则没有连续记录
        if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
            return 0;
        }
        
        // 计算连续天数
        let streak = 1;
        let currentDate = new Date(uniqueDates[0]);
        
        for (let i = 1; i < uniqueDates.length; i++) {
            const prevDate = new Date(currentDate);
            prevDate.setDate(prevDate.getDate() - 1);
            const prevDateStr = prevDate.toISOString().split('T')[0];
            
            if (uniqueDates[i] === prevDateStr) {
                streak++;
                currentDate = new Date(uniqueDates[i]);
            } else {
                break;
            }
        }
        
        return streak;
    }
    
    // 初始化月份过滤器
    initMonthsFilter() {
        const filterSelect = document.getElementById('filter-month');
        if (!filterSelect) return;
        
        // 清空现有选项（保留"所有月份"）
        while (filterSelect.options.length > 1) {
            filterSelect.remove(1);
        }
        
        const monthsSet = new Set();
        
        // 添加所有已存在日记的月份
        this.diaries.forEach(diary => {
            const date = new Date(diary.date);
            const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthsSet.add(yearMonth);
        });
        
        // 转换为数组并排序
        const monthsArray = Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
        
        // 添加到过滤器
        monthsArray.forEach(month => {
            const [year, monthNum] = month.split('-');
            const option = document.createElement('option');
            option.value = month;
            option.textContent = `${year}年${monthNum}月`;
            filterSelect.appendChild(option);
        });
    }
    
    // 获取过滤后的日记 - 按写作时间先后排序（新的在前）
    getFilteredDiaries() {
        const searchInput = document.getElementById('search-diary');
        const filterMonth = document.getElementById('filter-month');
        const filterMood = document.getElementById('filter-mood');
        
        if (!searchInput || !filterMonth || !filterMood) {
            return this.diaries.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt) : new Date(a.date);
                const dateB = b.createdAt ? new Date(b.createdAt) : new Date(b.date);
                return dateB - dateA;
            });
        }
        
        const searchTerm = searchInput.value.toLowerCase();
        const selectedMonth = filterMonth.value;
        const selectedMood = filterMood.value;
        
        return this.diaries.filter(diary => {
            // 搜索过滤
            const matchesSearch = 
                diary.title.toLowerCase().includes(searchTerm) || 
                diary.content.toLowerCase().includes(searchTerm) ||
                diary.tag.toLowerCase().includes(searchTerm) ||
                (diary.mood && diary.mood.toLowerCase().includes(searchTerm));
            
            // 月份过滤
            let matchesMonth = true;
            if (selectedMonth !== 'all') {
                const diaryDate = new Date(diary.date);
                const diaryYearMonth = `${diaryDate.getFullYear()}-${String(diaryDate.getMonth() + 1).padStart(2, '0')}`;
                matchesMonth = diaryYearMonth === selectedMonth;
            }
            
            // 心情过滤
            let matchesMood = true;
            if (selectedMood !== 'all' && diary.mood) {
                matchesMood = diary.mood === selectedMood;
            }
            
            return matchesSearch && matchesMonth && matchesMood;
        }).sort((a, b) => {
            // 按创建时间排序，新的在前
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(a.date);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(b.date);
            return dateB - dateA;
        });
    }
    
    // 渲染日记列表 - 修复版
    renderDiaries() {
        const container = document.getElementById('diaries-container');
        if (!container) return;
        
        const filteredDiaries = this.getFilteredDiaries();
        
        // 清空容器
        container.innerHTML = '';
        
        if (filteredDiaries.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12 text-gray-500 fade-in">
                    <i class="fa fa-book-open text-5xl mb-4 opacity-30"></i>
                    <p>还没有符合条件的日记哦，点击"写日记"开始记录吧</p>
                </div>
            `;
            return;
        }
        
        // 计算要显示的日记数量
        const diariesToShow = this.currentPage * this.diariesPerPage;
        const visibleDiaries = filteredDiaries.slice(0, diariesToShow);
        
        // 渲染日记卡片
        visibleDiaries.forEach((diary, index) => {
            this.createDiaryCard(diary, index, container);
        });
        
        // 如果还有更多日记，显示"加载更多"按钮
        if (filteredDiaries.length > visibleDiaries.length) {
            this.renderLoadMoreButton(container, filteredDiaries.length - visibleDiaries.length);
        }
    }
    
    // 渲染加载更多按钮 - 新增方法
    renderLoadMoreButton(container, remainingCount) {
        // 移除已存在的加载更多按钮
        const existingBtn = container.querySelector('.load-more-btn');
        if (existingBtn) {
            existingBtn.remove();
        }
        
        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.className = 'load-more-btn fade-in';
        loadMoreBtn.innerHTML = `<i class="fa fa-arrow-down mr-2"></i>加载更多 (${remainingCount}篇)`;
        
        // 添加触摸支持
        loadMoreBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        loadMoreBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.currentPage++;
            this.renderDiaries();
        });
        
        loadMoreBtn.addEventListener('click', () => {
            this.currentPage++;
            this.renderDiaries();
        });
        
        // 创建容器并添加按钮
        const loadMoreContainer = document.createElement('div');
        loadMoreContainer.className = 'load-more-container';
        loadMoreContainer.appendChild(loadMoreBtn);
        
        // 添加到日记容器中（在所有日记卡片之后）
        container.appendChild(loadMoreContainer);
    }
    
    // 创建单个日记卡片
    createDiaryCard(diary, index, container) {
        const date = new Date(diary.date);
        const formattedDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
        
        // 截取内容预览
        const preview = diary.content.length > 100 
            ? `${diary.content.substring(0, 100)}...` 
            : diary.content;
        
        // 心情标签样式
        let moodClass = '';
        switch(diary.mood) {
            case '开心':
                moodClass = 'bg-green-100 text-green-800';
                break;
            case '难过':
                moodClass = 'bg-blue-100 text-blue-800';
                break;
            case '平静':
                moodClass = 'bg-gray-100 text-gray-800';
                break;
            case '紧张':
                moodClass = 'bg-yellow-100 text-yellow-800';
                break;
            case '兴奋':
                moodClass = 'bg-pink-100 text-pink-800';
                break;
            default:
                moodClass = 'bg-gray-100 text-gray-800';
        }
        
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl shadow-md overflow-hidden diary-card-hover fade-in touch-pan-y';
        card.style.animationDelay = `${index * 0.05}s`;
        card.innerHTML = `
            <div class="p-5">
                <div class="flex justify-between items-start mb-3">
                    <span class="px-3 py-1 bg-secondary/20 text-primary text-sm rounded-full">${diary.tag}</span>
                    <span class="px-2 py-0.5 ${moodClass} text-xs rounded-full">${diary.mood || '心情'}</span>
                </div>
                <div class="text-gray-500 text-sm mb-2">${formattedDate} ${diary.weather ? '· ' + diary.weather : ''}</div>
                <h4 class="text-lg font-semibold mb-2 text-primary hover:text-accent transition-colors cursor-pointer diary-title">${diary.title}</h4>
                <p class="text-gray-600 mb-4 line-clamp-3 diary-content">${preview}</p>
                <div class="flex justify-end gap-2">
                    <button class="diary-action p-2 text-primary hover:text-accent transition-colors" data-action="edit" data-id="${diary.id}">
                        <i class="fa fa-pencil"></i>
                    </button>
                    <button class="diary-action p-2 text-primary hover:text-accent transition-colors" data-action="view" data-id="${diary.id}">
                        <i class="fa fa-eye"></i>
                    </button>
                </div>
            </div>
        `;
        
        // 添加触摸支持
        const editBtn = card.querySelector('.diary-action[data-action="edit"]');
        const viewBtn = card.querySelector('.diary-action[data-action="view"]');
        const titleEl = card.querySelector('.diary-title');
        const contentEl = card.querySelector('.diary-content');
        
        if (editBtn) {
            editBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
            }, { passive: false });
            
            editBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.openEditWindow(diary.id);
            });
        }
        
        if (viewBtn) {
            viewBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
            }, { passive: false });
            
            viewBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.openViewWindow(diary.id);
            });
        }
        
        // 标题和内容点击
        const handleCardClick = (e) => {
            if (!e.target.closest('.diary-action')) {
                this.openViewWindow(diary.id);
            }
        };
        
        if (titleEl) {
            titleEl.addEventListener('touchstart', (e) => {
                e.preventDefault();
            }, { passive: false });
            
            titleEl.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.openViewWindow(diary.id);
            });
        }
        
        if (contentEl) {
            contentEl.addEventListener('touchstart', (e) => {
                e.preventDefault();
            }, { passive: false });
            
            contentEl.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.openViewWindow(diary.id);
            });
        }
        
        container.appendChild(card);
    }
    
    // 更新计数器
    updateCounters() {
        // 总日记数
        const totalCount = document.getElementById('total-diary-count');
        if (totalCount) totalCount.textContent = this.diaries.length;
        
        // 本月新增
        const monthlyCount = document.getElementById('monthly-diary-count');
        if (monthlyCount) {
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();
            
            const monthlyDiaries = this.diaries.filter(diary => {
                const date = new Date(diary.date);
                return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
            }).length;
            
            monthlyCount.textContent = monthlyDiaries;
        }
        
        // 连续记录天数
        const streakCount = document.getElementById('streak-count');
        if (streakCount) {
            const streak = this.calculateStreak();
            streakCount.textContent = streak;
        }
    }
    
    // 添加新日记
    addDiary(diaryData) {
        const newDiary = {
            id: Date.now().toString(),
            ...diaryData,
            createdAt: new Date().toISOString()
        };
        
        this.diaries.unshift(newDiary); // 添加到开头，便于快速访问
        this.saveDiaries();
        this.initMonthsFilter();
        this.renderDiaries();
        this.updateCounters();
        
        return newDiary;
    }
    
    // 更新日记
    updateDiary(id, updatedData) {
        const index = this.diaries.findIndex(diary => diary.id === id);
        if (index !== -1) {
            this.diaries[index] = {
                ...this.diaries[index],
                ...updatedData,
                updatedAt: new Date().toISOString()
            };
            
            this.saveDiaries();
            this.renderDiaries();
            this.updateCounters();
            return true;
        }
        return false;
    }
    
    // 删除日记
    deleteDiary(id) {
        const initialLength = this.diaries.length;
        this.diaries = this.diaries.filter(diary => diary.id !== id);
        
        if (this.diaries.length !== initialLength) {
            this.saveDiaries();
            this.initMonthsFilter();
            this.renderDiaries();
            this.updateCounters();
            return true;
        }
        return false;
    }
    
    // 清空所有日记
    clearAllDiaries() {
        this.diaries = [];
        this.saveDiaries();
        this.initMonthsFilter();
        this.renderDiaries();
        this.updateCounters();
        return true;
    }
    
    // 导出日记数据
    exportDiaries() {
        const data = {
            diaries: this.diaries,
            exportDate: new Date().toISOString(),
            version: '1.2.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `goose-diary-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return true;
    }
    
    // 导入日记数据
    importDiaries(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            // 验证数据格式
            if (!data.diaries || !Array.isArray(data.diaries)) {
                throw new Error('无效的数据格式');
            }
            
            // 合并日记，避免重复
            const existingIds = new Set(this.diaries.map(d => d.id));
            const newDiaries = data.diaries.filter(d => !existingIds.has(d.id));
            
            this.diaries = [...this.diaries, ...newDiaries];
            this.saveDiaries();
            this.initMonthsFilter();
            this.renderDiaries();
            this.updateCounters();
            
            return { success: true, message: `成功导入 ${newDiaries.length} 篇日记` };
        } catch (error) {
            console.error('导入日记失败:', error);
            return { success: false, message: '导入失败：' + error.message };
        }
    }
    
    // 保存到本地存储
    saveDiaries() {
        try {
            const currentUser = this.authManager.getCurrentUser();
            if (!currentUser) {
                throw new Error('未登录，无法保存日记');
            }
            
            localStorage.setItem(`diaries_${currentUser}`, JSON.stringify(this.diaries));
            return true;
        } catch (e) {
            console.error('保存日记失败:', e);
            showToast('保存失败，请重试', 'error');
            return false;
        }
    }
    
    // 打开添加日记窗口 - 自动填充当前时间到标题
    openAddWindow() {
        const diaryContent = `
            <div class="p-4 h-full flex flex-col">
                <form id="diary-form" class="flex-grow flex flex-col">
                    <input type="hidden" id="diary-id">
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label for="diary-title" class="block text-gray-700 font-medium mb-2 text-sm">标题</label>
                            <input 
                                type="text" 
                                id="diary-title" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                                placeholder="给你的日记起个标题吧"
                                required
                                value="${formatTimeForTitle()}"
                            >
                        </div>
                        
                        <div>
                            <label for="diary-date" class="block text-gray-700 font-medium mb-2 text-sm">日期</label>
                            <input 
                                type="date" 
                                id="diary-date" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                                required
                                value="${new Date().toISOString().split('T')[0]}"
                            >
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label for="diary-tag" class="block text-gray-700 font-medium mb-2 text-sm">标签</label>
                            <select 
                                id="diary-tag" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                            >
                                <option value="生活">生活</option>
                                <option value="工作">工作</option>
                                <option value="学习">学习</option>
                                <option value="旅行">旅行</option>
                                <option value="感悟">感悟</option>
                                <option value="其他">其他</option>
                            </select>
                        </div>
                        
                        <div>
                            <label for="diary-mood" class="block text-gray-700 font-medium mb-2 text-sm">今日心情</label>
                            <select 
                                id="diary-mood" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                            >
                                <option value="开心">开心</option>
                                <option value="难过">难过</option>
                                <option value="平静">平静</option>
                                <option value="紧张">紧张</option>
                                <option value="兴奋">兴奋</option>
                                <option value="其他">其他</option>
                            </select>
                        </div>
                        
                        <div>
                            <label for="diary-weather" class="block text-gray-700 font-medium mb-2 text-sm">今日天气</label>
                            <select 
                                id="diary-weather" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                            >
                                <option value="晴朗">晴朗</option>
                                <option value="多云">多云</option>
                                <option value="阴天">阴天</option>
                                <option value="雨天">雨天</option>
                                <option value="雪天">雪天</option>
                                <option value="其他">其他</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="flex-grow mb-4">
                        <label for="diary-content" class="block text-gray-700 font-medium mb-2 text-sm">内容</label>
                        <textarea 
                            id="diary-content" 
                            class="w-full h-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none text-sm"
                            placeholder="今天发生了啥？写下你的想法和感受吧..."
                            rows="12"
                            required
                        ></textarea>
                    </div>
                    
                    <div class="flex justify-end gap-3 pt-4 border-t">
                        <button type="button" id="cancel-diary" class="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm">
                            取消
                        </button>
                        <button type="submit" id="save-diary" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm">
                            <i class="fa fa-save mr-1"></i> 保存
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        windowManager.createWindow('diary-window', '写一篇新日记', diaryContent, {
            width: '500px',
            height: '500px',
            icon: '<i class="fa fa-pencil text-sm"></i>'
        });
        
        // 绑定事件
        setTimeout(() => {
            const windowContent = windowManager.getWindowContent('diary-window');
            if (windowContent) {
                const form = windowContent.querySelector('#diary-form');
                const cancelBtn = windowContent.querySelector('#cancel-diary');
                
                if (form) {
                    form.addEventListener('submit', (e) => {
                        e.preventDefault();
                        
                        const idInput = windowContent.querySelector('#diary-id');
                        const titleInput = windowContent.querySelector('#diary-title');
                        const dateInput = windowContent.querySelector('#diary-date');
                        const tagInput = windowContent.querySelector('#diary-tag');
                        const moodInput = windowContent.querySelector('#diary-mood');
                        const weatherInput = windowContent.querySelector('#diary-weather');
                        const contentInput = windowContent.querySelector('#diary-content');
                        
                        if (!titleInput || !dateInput || !contentInput) return;
                        
                        const id = idInput ? idInput.value : '';
                        const title = titleInput.value;
                        const date = dateInput.value;
                        const tag = tagInput ? tagInput.value : '生活';
                        const mood = moodInput ? moodInput.value : '其他';
                        const weather = weatherInput ? weatherInput.value : '晴朗';
                        const content = contentInput.value;
                        
                        // 验证表单数据
                        if (!title.trim() || !date || !content.trim()) {
                            showToast('请填写必要的日记信息', 'error');
                            return;
                        }
                        
                        const diaryData = { title, date, tag, mood, weather, content };
                        
                        let success = false;
                        if (id) {
                            // 更新现有日记
                            success = this.updateDiary(id, diaryData);
                        } else {
                            // 添加新日记
                            const newDiary = this.addDiary(diaryData);
                            success = !!newDiary;
                        }
                        
                        if (success) {
                            // 关闭窗口
                            windowManager.closeWindow('diary-window');
                            
                            // 显示成功提示
                            showToast(id ? '日记更新成功' : '日记添加成功');
                            
                            // 通知小鹅助手
                            if (window.gooseAssistant) {
                                setTimeout(() => {
                                    window.gooseAssistant.showNotification(id ? '日记已更新' : '新日记已添加');
                                }, 500);
                            }
                        }
                    });
                }
                
                if (cancelBtn) {
                    // 添加触摸支持
                    cancelBtn.addEventListener('touchstart', (e) => {
                        e.preventDefault();
                    }, { passive: false });
                    
                    cancelBtn.addEventListener('touchend', (e) => {
                        e.preventDefault();
                        windowManager.closeWindow('diary-window');
                    });
                    
                    cancelBtn.addEventListener('click', () => {
                        windowManager.closeWindow('diary-window');
                    });
                }
                
                // 自动聚焦标题输入框
                const titleInput = windowContent.querySelector('#diary-title');
                if (titleInput) {
                    titleInput.focus();
                    titleInput.select();
                }
            }
        }, 100);
    }
    
    // 打开编辑日记窗口
    openEditWindow(id) {
        const diary = this.diaries.find(d => d.id === id);
        if (!diary) return;
        
        const diaryContent = `
            <div class="p-4 h-full flex flex-col">
                <form id="diary-form" class="flex-grow flex flex-col">
                    <input type="hidden" id="diary-id" value="${diary.id}">
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label for="diary-title" class="block text-gray-700 font-medium mb-2 text-sm">标题</label>
                            <input 
                                type="text" 
                                id="diary-title" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                                placeholder="给你的日记起个标题吧"
                                required
                                value="${diary.title}"
                            >
                        </div>
                        
                        <div>
                            <label for="diary-date" class="block text-gray-700 font-medium mb-2 text-sm">日期</label>
                            <input 
                                type="date" 
                                id="diary-date" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                                required
                                value="${diary.date}"
                            >
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label for="diary-tag" class="block text-gray-700 font-medium mb-2 text-sm">标签</label>
                            <select 
                                id="diary-tag" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                            >
                                <option value="生活" ${diary.tag === '生活' ? 'selected' : ''}>生活</option>
                                <option value="工作" ${diary.tag === '工作' ? 'selected' : ''}>工作</option>
                                <option value="学习" ${diary.tag === '学习' ? 'selected' : ''}>学习</option>
                                <option value="旅行" ${diary.tag === '旅行' ? 'selected' : ''}>旅行</option>
                                <option value="感悟" ${diary.tag === '感悟' ? 'selected' : ''}>感悟</option>
                                <option value="其他" ${diary.tag === '其他' ? 'selected' : ''}>其他</option>
                            </select>
                        </div>
                        
                        <div>
                            <label for="diary-mood" class="block text-gray-700 font-medium mb-2 text-sm">今日心情</label>
                            <select 
                                id="diary-mood" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                            >
                                <option value="开心" ${diary.mood === '开心' ? 'selected' : ''}>开心</option>
                                <option value="难过" ${diary.mood === '难过' ? 'selected' : ''}>难过</option>
                                <option value="平静" ${diary.mood === '平静' ? 'selected' : ''}>平静</option>
                                <option value="紧张" ${diary.mood === '紧张' ? 'selected' : ''}>紧张</option>
                                <option value="兴奋" ${diary.mood === '兴奋' ? 'selected' : ''}>兴奋</option>
                                <option value="其他" ${!['开心', '难过', '平静', '紧张', '兴奋'].includes(diary.mood) ? 'selected' : ''}>其他</option>
                            </select>
                        </div>
                        
                        <div>
                            <label for="diary-weather" class="block text-gray-700 font-medium mb-2 text-sm">今日天气</label>
                            <select 
                                id="diary-weather" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                            >
                                <option value="晴朗" ${diary.weather === '晴朗' ? 'selected' : ''}>晴朗</option>
                                <option value="多云" ${diary.weather === '多云' ? 'selected' : ''}>多云</option>
                                <option value="阴天" ${diary.weather === '阴天' ? 'selected' : ''}>阴天</option>
                                <option value="雨天" ${diary.weather === '雨天' ? 'selected' : ''}>雨天</option>
                                <option value="雪天" ${diary.weather === '雪天' ? 'selected' : ''}>雪天</option>
                                <option value="其他" ${!['晴朗', '多云', '阴天', '雨天', '雪天'].includes(diary.weather) ? 'selected' : ''}>其他</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="flex-grow mb-4">
                        <label for="diary-content" class="block text-gray-700 font-medium mb-2 text-sm">内容</label>
                        <textarea 
                            id="diary-content" 
                            class="w-full h-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none text-sm"
                            placeholder="今天发生了啥？写下你的想法和感受吧..."
                            rows="12"
                            required
                        >${diary.content}</textarea>
                    </div>
                    
                    <div class="flex justify-between gap-3 pt-4 border-t">
                        <button type="button" id="delete-diary" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm" data-id="${diary.id}">
                            <i class="fa fa-trash mr-1"></i> 删除
                        </button>
                        <div class="flex gap-3">
                            <button type="button" id="cancel-diary" class="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm">
                                取消
                            </button>
                            <button type="submit" id="save-diary" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm">
                                <i class="fa fa-save mr-1"></i> 保存
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        `;
        
        windowManager.createWindow('diary-window', '编辑日记', diaryContent, {
            width: '500px',
            height: '500px',
            icon: '<i class="fa fa-pencil text-sm"></i>'
        });
        
        // 绑定事件
        setTimeout(() => {
            const windowContent = windowManager.getWindowContent('diary-window');
            if (windowContent) {
                const form = windowContent.querySelector('#diary-form');
                const cancelBtn = windowContent.querySelector('#cancel-diary');
                const deleteBtn = windowContent.querySelector('#delete-diary');
                
                if (form) {
                    form.addEventListener('submit', (e) => {
                        e.preventDefault();
                        
                        const idInput = windowContent.querySelector('#diary-id');
                        const titleInput = windowContent.querySelector('#diary-title');
                        const dateInput = windowContent.querySelector('#diary-date');
                        const tagInput = windowContent.querySelector('#diary-tag');
                        const moodInput = windowContent.querySelector('#diary-mood');
                        const weatherInput = windowContent.querySelector('#diary-weather');
                        const contentInput = windowContent.querySelector('#diary-content');
                        
                        if (!titleInput || !dateInput || !contentInput) return;
                        
                        const id = idInput ? idInput.value : '';
                        const title = titleInput.value;
                        const date = dateInput.value;
                        const tag = tagInput ? tagInput.value : '生活';
                        const mood = moodInput ? moodInput.value : '其他';
                        const weather = weatherInput ? weatherInput.value : '晴朗';
                        const content = contentInput.value;
                        
                        // 验证表单数据
                        if (!title.trim() || !date || !content.trim()) {
                            showToast('请填写必要的日记信息', 'error');
                            return;
                        }
                        
                        const diaryData = { title, date, tag, mood, weather, content };
                        
                        let success = false;
                        if (id) {
                            // 更新现有日记
                            success = this.updateDiary(id, diaryData);
                        } else {
                            // 添加新日记
                            const newDiary = this.addDiary(diaryData);
                            success = !!newDiary;
                        }
                        
                        if (success) {
                            // 关闭窗口
                            windowManager.closeWindow('diary-window');
                            
                            // 显示成功提示
                            showToast(id ? '日记更新成功' : '日记添加成功');
                            
                            // 通知小鹅助手
                            if (window.gooseAssistant) {
                                setTimeout(() => {
                                    window.gooseAssistant.showNotification(id ? '日记已更新' : '新日记已添加');
                                }, 500);
                            }
                        }
                    });
                }
                
                if (cancelBtn) {
                    // 添加触摸支持
                    cancelBtn.addEventListener('touchstart', (e) => {
                        e.preventDefault();
                    }, { passive: false });
                    
                    cancelBtn.addEventListener('touchend', (e) => {
                        e.preventDefault();
                        windowManager.closeWindow('diary-window');
                    });
                    
                    cancelBtn.addEventListener('click', () => {
                        windowManager.closeWindow('diary-window');
                    });
                }
                
                if (deleteBtn) {
                    // 添加触摸支持
                    deleteBtn.addEventListener('touchstart', (e) => {
                        e.preventDefault();
                    }, { passive: false });
                    
                    deleteBtn.addEventListener('touchend', (e) => {
                        e.preventDefault();
                        const id = deleteBtn.getAttribute('data-id');
                        if (id && confirm('确定要删除这篇日记吗？此操作不可恢复。')) {
                            const success = this.deleteDiary(id);
                            if (success) {
                                windowManager.closeWindow('diary-window');
                                showToast('日记已删除');
                                
                                // 通知小鹅助手
                                if (window.gooseAssistant) {
                                    setTimeout(() => {
                                        window.gooseAssistant.showNotification('日记已删除');
                                    }, 500);
                                }
                            } else {
                                showToast('删除失败，请重试', 'error');
                            }
                        }
                    });
                    
                    deleteBtn.addEventListener('click', (e) => {
                        const id = deleteBtn.getAttribute('data-id');
                        if (id && confirm('确定要删除这篇日记吗？此操作不可恢复。')) {
                            const success = this.deleteDiary(id);
                            if (success) {
                                windowManager.closeWindow('diary-window');
                                showToast('日记已删除');
                                
                                // 通知小鹅助手
                                if (window.gooseAssistant) {
                                    setTimeout(() => {
                                        window.gooseAssistant.showNotification('日记已删除');
                                    }, 500);
                                }
                            } else {
                                showToast('删除失败，请重试', 'error');
                            }
                        }
                    });
                }
                
                // 自动聚焦标题输入框
                const titleInput = windowContent.querySelector('#diary-title');
                if (titleInput) {
                    titleInput.focus();
                    titleInput.select();
                }
            }
        }, 100);
    }
    
    // 打开查看日记窗口
    openViewWindow(id) {
        const diary = this.diaries.find(d => d.id === id);
        if (!diary) return;
        
        const date = new Date(diary.date);
        const formattedDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
        
        const diaryContent = `
            <div class="p-4 h-full flex flex-col">
                <div class="flex-grow overflow-y-auto touch-pan-y">
                    <div class="mb-6">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <h3 class="text-xl font-semibold text-primary mb-2">${diary.title}</h3>
                                <p class="text-gray-500 text-sm">${formattedDate} ${diary.weather ? '· ' + diary.weather : ''}</p>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="px-3 py-1 bg-secondary/20 text-primary text-sm rounded-full">${diary.tag}</span>
                                <span class="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">${diary.mood || '心情'}</span>
                            </div>
                        </div>
                        
                        <div class="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-gray-700 leading-relaxed">
                            ${diary.content}
                        </div>
                    </div>
                    
                    <div class="text-xs text-gray-400 border-t pt-4">
                        <p>创建时间: ${new Date(diary.createdAt).toLocaleString('zh-CN')}</p>
                        ${diary.updatedAt ? `<p>最后编辑: ${new Date(diary.updatedAt).toLocaleString('zh-CN')}</p>` : ''}
                    </div>
                </div>
                
                <div class="flex justify-end gap-3 pt-4 border-t">
                    <button type="button" id="close-view" class="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm">
                        关闭
                    </button>
                    <button type="button" id="edit-diary" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm" data-id="${diary.id}">
                        <i class="fa fa-pencil mr-1"></i> 编辑
                    </button>
                </div>
            </div>
        `;
        
        windowManager.createWindow('diary-view-window', '查看日记', diaryContent, {
            width: '500px',
            height: '500px',
            icon: '<i class="fa fa-eye text-sm"></i>'
        });
        
        // 绑定事件
        setTimeout(() => {
            const windowContent = windowManager.getWindowContent('diary-view-window');
            if (windowContent) {
                const closeBtn = windowContent.querySelector('#close-view');
                const editBtn = windowContent.querySelector('#edit-diary');
                
                if (closeBtn) {
                    // 添加触摸支持
                    closeBtn.addEventListener('touchstart', (e) => {
                        e.preventDefault();
                    }, { passive: false });
                    
                    closeBtn.addEventListener('touchend', (e) => {
                        e.preventDefault();
                        windowManager.closeWindow('diary-view-window');
                    });
                    
                    closeBtn.addEventListener('click', () => {
                        windowManager.closeWindow('diary-view-window');
                    });
                }
                
                if (editBtn) {
                    // 添加触摸支持
                    editBtn.addEventListener('touchstart', (e) => {
                        e.preventDefault();
                    }, { passive: false });
                    
                    editBtn.addEventListener('touchend', (e) => {
                        e.preventDefault();
                        const id = editBtn.getAttribute('data-id');
                        windowManager.closeWindow('diary-view-window');
                        setTimeout(() => {
                            this.openEditWindow(id);
                        }, 100);
                    });
                    
                    editBtn.addEventListener('click', (e) => {
                        const id = editBtn.getAttribute('data-id');
                        windowManager.closeWindow('diary-view-window');
                        setTimeout(() => {
                            this.openEditWindow(id);
                        }, 100);
                    });
                }
            }
        }, 100);
    }
}

// 设置管理
class SettingsManager {
    constructor(authManager, diaryManager) {
        this.authManager = authManager;
        this.diaryManager = diaryManager;
        this.init();
    }
    
    init() {
        // 设置内容在打开窗口时动态生成
    }
    
    // 打开设置窗口
    openSettings() {
        const settingsContent = `
            <div class="p-4 h-full overflow-y-auto touch-pan-y">
                <div class="space-y-8">
                    <!-- 账户设置 -->
                    <div class="space-y-4">
                        <h4 class="text-lg font-medium text-primary mb-3 flex items-center">
                            <i class="fa fa-user-circle mr-2"></i>
                            账户设置
                        </h4>
                        <div class="bg-gray-50 p-5 rounded-lg border border-gray-200 space-y-4">
                            <div>
                                <label for="current-password" class="block text-gray-700 font-medium mb-2 text-sm">当前密码</label>
                                <input 
                                    type="password" 
                                    id="current-password" 
                                    class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                                    placeholder="请输入当前密码"
                                >
                            </div>
                            <div>
                                <label for="new-password" class="block text-gray-700 font-medium mb-2 text-sm">新密码</label>
                                <input 
                                    type="password" 
                                    id="new-password" 
                                    class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                                    placeholder="请设置新密码（至少6位）"
                                    minlength="6"
                                >
                            </div>
                            <div>
                                <label for="confirm-password" class="block text-gray-700 font-medium mb-2 text-sm">确认新密码</label>
                                <input 
                                    type="password" 
                                    id="confirm-password" 
                                    class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                                    placeholder="请再次输入新密码"
                                >
                            </div>
                            <button id="change-password" class="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm">
                                <i class="fa fa-key mr-1"></i> 修改密码
                            </button>
                        </div>
                    </div>
                    
                    <!-- 数据管理 -->
                    <div class="space-y-4">
                        <h4 class="text-lg font-medium text-primary mb-3 flex items-center">
                            <i class="fa fa-database mr-2"></i>
                            数据管理
                        </h4>
                        <div class="bg-gray-50 p-5 rounded-lg border border-gray-200 space-y-3">
                            <div class="grid grid-cols-2 gap-3">
                                <button id="export-data" class="py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center text-sm">
                                    <i class="fa fa-download mr-2"></i>
                                    导出数据
                                </button>
                                <button id="import-data" class="py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center text-sm">
                                    <i class="fa fa-upload mr-2"></i>
                                    导入数据
                                </button>
                            </div>
                            <div class="text-center">
                                <button id="clear-data" class="w-full max-w-xs py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center text-sm mx-auto">
                                    <i class="fa fa-trash mr-2"></i>
                                    清空所有数据
                                </button>
                                <p class="text-xs text-gray-500 mt-2">此操作将删除所有日记，不可恢复</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 小鹅助手 -->
                    <div class="space-y-4">
                        <h4 class="text-lg font-medium text-primary mb-3 flex items-center">
                            <i class="fa fa-robot mr-2"></i>
                            小鹅助手
                        </h4>
                        <div class="bg-gray-50 p-5 rounded-lg border border-gray-200 space-y-4">
                            <div>
                                <p class="text-sm text-gray-600 mb-3">小鹅助手是您的本地智能助手，无需联网即可为您提供日记管理帮助。</p>
                                <div class="grid grid-cols-2 gap-3">
                                    <button id="open-goose-full" class="py-3 bg-goose text-primary rounded-lg hover:bg-goose/80 transition-colors font-medium flex items-center justify-center text-sm">
                                        <i class="fa fa-comment mr-2"></i>
                                        打开助手
                                    </button>
                                    <button id="goose-help" class="py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-medium flex items-center justify-center text-sm">
                                        <i class="fa fa-question mr-2"></i>
                                        查看帮助
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 外观设置 -->
                    <div class="space-y-4">
                        <h4 class="text-lg font-medium text-primary mb-3 flex items-center">
                            <i class="fa fa-paint-brush mr-2"></i>
                            外观设置（尚未开发）
                        </h4>
                        <div class="bg-gray-50 p-5 rounded-lg border border-gray-200 space-y-4">
                            <div>
                                <label class="block text-gray-700 font-medium mb-3 text-sm">主题模式</label>
                                <div class="flex gap-3">
                                    <button id="theme-light" class="flex-1 py-2 border-2 border-primary bg-white text-primary rounded-lg font-medium text-sm">
                                        浅色模式
                                    </button>
                                    <button id="theme-dark" class="flex-1 py-2 border border-gray-300 bg-gray-800 text-white rounded-lg font-medium text-sm">
                                        深色模式
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label class="block text-gray-700 font-medium mb-3 text-sm">日记列表样式</label>
                                <div class="flex gap-3">
                                    <button id="layout-grid" class="flex-1 py-2 border-2 border-primary bg-white text-primary rounded-lg font-medium text-sm">
                                        <i class="fa fa-th-large mr-1"></i> 网格
                                    </button>
                                    <button id="layout-list" class="flex-1 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg font-medium text-sm">
                                        <i class="fa fa-list mr-1"></i> 列表
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 打赏作者 -->
                    <div class="space-y-4">
                        <h4 class="text-lg font-medium text-donate mb-3 flex items-center">
                            <i class="fa fa-heart mr-2"></i>
                            支持作者
                        </h4>
                        <div class="bg-gradient-to-r from-pink-50 to-red-50 p-5 rounded-lg border border-pink-200">
                            <div class="text-center mb-4">
                                <i class="fa fa-gift text-3xl text-donate mb-2"></i>
                                <h5 class="font-medium text-gray-800 text-lg mb-2">感谢使用小鹅日记！</h5>
                                <p class="text-gray-600 text-sm mb-4">如果这个应用对你有帮助，请作者喝杯咖啡吧~</p>
                            </div>
                            
                            <div class="mb-6">
                                <div class="bg-white p-4 rounded-lg border border-gray-300 mb-3">
                                    <div class="flex items-center mb-2">
                                        <i class="fa fa-wechat text-green-500 mr-2"></i>
                                        <span class="font-medium text-gray-700">WeChat</span>
                                    </div>
                                    <div class="flex justify-center">
                                        <img src="donate.png" alt="微信赞赏码" class="w-48 h-48 object-contain rounded-lg border border-gray-300">
                                    </div>
                                    <p class="text-xs text-gray-500 mt-2 text-center">扫描二维码赞赏</p>
                                </div>
                                
                            <div class="text-center">
                                <p class="text-xs text-gray-500">
                                    <i class="fa fa-info-circle mr-1"></i>
                                    您的支持是我持续改进的动力！
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 关于 -->
                    <div class="space-y-4">
                        <h4 class="text-lg font-medium text-primary mb-3 flex items-center">
                            <i class="fa fa-info-circle mr-2"></i>
                            关于小鹅日记
                        </h4>
                        <div class="bg-gray-50 p-5 rounded-lg border border-gray-200">
                            <div class="flex items-start mb-4">
                                <div>
                                    <p class="font-medium text-gray-800">小鹅日记</p>
                                    <p class="text-sm text-gray-600">记录生活的每一刻</p>
                                </div>
                            </div>
                            
                            <div class="space-y-3 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-gray-600">版本号：</span>
                                    <span class="font-medium text-primary">v1.3.0</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">开发者：</span>
                                    <span class="font-medium">Minecraft_goose</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">发布日期：</span>
                                    <span>${new Date().toISOString().split('T')[0]}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">数据存储：</span>
                                    <span>浏览器本地存储</span>
                                </div>
                            </div>
                            
                            <div class="mt-4 pt-4 border-t border-gray-200">
                                <p class="text-gray-600 text-sm">
                                    <strong>特点：</strong> 一个简单、优雅的在线日记本，记录生活的每一刻。
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        windowManager.createWindow('settings-window', '设置与偏好', settingsContent, {
            width: '450px',
            height: '500px',
            icon: '<i class="fa fa-cog text-sm"></i>'
        });
        
        // 绑定事件
        setTimeout(() => {
            const windowContent = windowManager.getWindowContent('settings-window');
            if (windowContent) {
                // 修改密码
                const changePasswordBtn = windowContent.querySelector('#change-password');
                if (changePasswordBtn) {
                    this.bindTouchAndClick(changePasswordBtn, () => {
                        this.changePassword(windowContent);
                    });
                }
                
                // 导出数据
                const exportBtn = windowContent.querySelector('#export-data');
                if (exportBtn) {
                    this.bindTouchAndClick(exportBtn, () => {
                        this.exportData();
                    });
                }
                
                // 导入数据
                const importBtn = windowContent.querySelector('#import-data');
                if (importBtn) {
                    this.bindTouchAndClick(importBtn, () => {
                        this.triggerImport();
                    });
                }
                
                // 清空数据
                const clearBtn = windowContent.querySelector('#clear-data');
                if (clearBtn) {
                    this.bindTouchAndClick(clearBtn, () => {
                        this.clearData();
                    });
                }
                
                // 小鹅助手
                const openGooseBtn = windowContent.querySelector('#open-goose-full');
                if (openGooseBtn) {
                    this.bindTouchAndClick(openGooseBtn, () => {
                        windowManager.closeWindow('settings-window');
                        setTimeout(() => {
                            if (window.gooseAssistant) {
                                window.gooseAssistant.showFullScreen();
                            }
                        }, 100);
                    });
                }
                
                // 小鹅帮助
                const gooseHelpBtn = windowContent.querySelector('#goose-help');
                if (gooseHelpBtn) {
                    this.bindTouchAndClick(gooseHelpBtn, () => {
                        windowManager.closeWindow('settings-window');
                        setTimeout(() => {
                            if (window.gooseAssistant) {
                                window.gooseAssistant.showHelp();
                            }
                        }, 100);
                    });
                }
                
                // 主题切换
                const themeLightBtn = windowContent.querySelector('#theme-light');
                const themeDarkBtn = windowContent.querySelector('#theme-dark');
                if (themeLightBtn && themeDarkBtn) {
                    const currentTheme = localStorage.getItem('goose-diary-theme') || 'light';
                    this.updateThemeButtons(currentTheme, themeLightBtn, themeDarkBtn);
                    
                    this.bindTouchAndClick(themeLightBtn, () => {
                        this.applyTheme('light');
                        this.updateThemeButtons('light', themeLightBtn, themeDarkBtn);
                    });
                    
                    this.bindTouchAndClick(themeDarkBtn, () => {
                        this.applyTheme('dark');
                        this.updateThemeButtons('dark', themeLightBtn, themeDarkBtn);
                    });
                }
                
                // 布局切换
                const layoutGridBtn = windowContent.querySelector('#layout-grid');
                const layoutListBtn = windowContent.querySelector('#layout-list');
                if (layoutGridBtn && layoutListBtn) {
                    const currentLayout = localStorage.getItem('goose-diary-layout') || 'grid';
                    this.updateLayoutButtons(currentLayout, layoutGridBtn, layoutListBtn);
                    
                    this.bindTouchAndClick(layoutGridBtn, () => {
                        this.applyLayout('grid');
                        this.updateLayoutButtons('grid', layoutGridBtn, layoutListBtn);
                    });
                    
                    this.bindTouchAndClick(layoutListBtn, () => {
                        this.applyLayout('list');
                        this.updateLayoutButtons('list', layoutGridBtn, layoutListBtn);
                    });
                }
                
                // 创建文件输入元素用于导入
                const importFileInput = document.createElement('input');
                importFileInput.type = 'file';
                importFileInput.id = 'import-file';
                importFileInput.accept = '.json';
                importFileInput.className = 'hidden';
                importFileInput.addEventListener('change', (e) => this.handleImport(e));
                document.body.appendChild(importFileInput);
              
                
               
            }
        }, 100);
    }
    
    // 绑定触摸和点击事件的辅助方法
    bindTouchAndClick(element, handler) {
        element.addEventListener('touchstart', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        element.addEventListener('touchend', (e) => {
            e.preventDefault();
            handler();
        });
        
        element.addEventListener('click', handler);
    }
    
    // 修改密码
    changePassword(windowContent) {
        const currentPassword = windowContent.querySelector('#current-password').value;
        const newPassword = windowContent.querySelector('#new-password').value;
        const confirmPassword = windowContent.querySelector('#confirm-password').value;
        
        // 验证输入
        if (!currentPassword || !newPassword || !confirmPassword) {
            showToast('请填写所有密码字段', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showToast('两次输入的新密码不一致', 'error');
            return;
        }
        
        if (newPassword.length < 6) {
            showToast('新密码长度至少为6位', 'error');
            return;
        }
        
        // 调用认证管理器修改密码
        const result = this.authManager.changePassword(
            this.authManager.getCurrentUser(),
            currentPassword,
            newPassword
        );
        
        showToast(result.message, result.success ? 'success' : 'error');
        
        if (result.success) {
            // 清空表单
            windowContent.querySelector('#current-password').value = '';
            windowContent.querySelector('#new-password').value = '';
            windowContent.querySelector('#confirm-password').value = '';
        }
    }
    
    // 导出数据
    exportData() {
        const success = this.diaryManager.exportDiaries();
        if (success) {
            showToast('数据导出成功');
        }
    }
    
    // 触发文件选择
    triggerImport() {
        const importFileInput = document.getElementById('import-file');
        if (importFileInput) {
            importFileInput.click();
        }
    }
    
    // 处理文件导入
    handleImport(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = this.diaryManager.importDiaries(e.target.result);
            showToast(result.message, result.success ? 'success' : 'error');
        };
        reader.readAsText(file);
        
        // 重置文件输入
        e.target.value = '';
    }
    
    // 清空数据
    clearData() {
        if (confirm('确定要清空所有日记数据吗？此操作不可恢复！')) {
            const success = this.diaryManager.clearAllDiaries();
            if (success) {
                showToast('所有数据已清空');
            }
        }
    }
    
    // 应用主题
    applyTheme(theme) {
        localStorage.setItem('goose-diary-theme', theme);
        
        if (theme === 'dark') {
            document.documentElement.classList.add('dark-theme');
        } else {
            document.documentElement.classList.remove('dark-theme');
        }
        
        showToast(`已切换到${theme === 'dark' ? '深色' : '浅色'}模式`, 'success');
    }
    
    // 更新主题按钮状态
    updateThemeButtons(selectedTheme, themeLightBtn, themeDarkBtn) {
        if (selectedTheme === 'light') {
            themeLightBtn.classList.add('border-2', 'border-primary');
            themeLightBtn.classList.remove('border');
            themeDarkBtn.classList.add('border');
            themeDarkBtn.classList.remove('border-2', 'border-primary');
        } else {
            themeDarkBtn.classList.add('border-2', 'border-primary');
            themeDarkBtn.classList.remove('border');
            themeLightBtn.classList.add('border');
            themeLightBtn.classList.remove('border-2', 'border-primary');
        }
    }
    
    // 应用布局
    applyLayout(layout) {
        localStorage.setItem('goose-diary-layout', layout);
        
        const diariesContainer = document.getElementById('diaries-container');
        if (diariesContainer) {
            if (layout === 'grid') {
                diariesContainer.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
            } else {
                diariesContainer.className = 'grid grid-cols-1 gap-4';
            }
        }
        
        showToast(`已切换到${layout === 'grid' ? '网格' : '列表'}布局`, 'success');
    }
    
    // 更新布局按钮状态
    updateLayoutButtons(selectedLayout, layoutGridBtn, layoutListBtn) {
        if (selectedLayout === 'grid') {
            layoutGridBtn.classList.add('border-2', 'border-primary');
            layoutGridBtn.classList.remove('border');
            layoutListBtn.classList.add('border');
            layoutListBtn.classList.remove('border-2', 'border-primary');
        } else {
            layoutListBtn.classList.add('border-2', 'border-primary');
            layoutListBtn.classList.remove('border');
            layoutGridBtn.classList.add('border');
            layoutGridBtn.classList.remove('border-2', 'border-primary');
        }
    }
}

// 管理员面板管理
class AdminPanelManager {
    constructor(authManager, diaryManager) {
        this.authManager = authManager;
        this.diaryManager = diaryManager;
        this.init();
    }
    
    init() {
        // 初始化代码在打开窗口时执行
    }
    
    // 打开管理员面板
    openAdminPanel() {
        // 先加载数据
        const adminManager = this.authManager.adminManager;
        const allUsers = adminManager.getAllUsers();
        const totalUsers = allUsers.length;
        const totalDiaries = adminManager.getAllDiariesCount();
        const storageUsage = adminManager.getStorageUsage();
        const storageStats = adminManager.getStorageStats();
        
        // 生成用户列表HTML
        let usersListHTML = '';
        if (allUsers.length === 0) {
            usersListHTML = `
                <tr>
                    <td colspan="5" class="p-4 text-center text-gray-500">暂无用户数据</td>
                </tr>
            `;
        } else {
            allUsers.forEach(user => {
                const createdDate = new Date(user.createdAt);
                const formattedCreated = createdDate.toLocaleDateString('zh-CN');
                const lastLoginDate = user.lastLogin === '从未登录' ? '从未登录' : new Date(user.lastLogin).toLocaleString('zh-CN');
                
                usersListHTML += `
                    <tr class="border-b hover:bg-gray-50">
                        <td class="p-3">
                            <div class="flex items-center">
                                <span class="font-medium">${user.username}</span>
                                ${user.isAdmin ? '<span class="ml-2 bg-admin text-white text-xs px-2 py-0.5 rounded">管理员</span>' : ''}
                            </div>
                        </td>
                        <td class="p-3 text-gray-600">${formattedCreated}</td>
                        <td class="p-3 text-gray-600">${user.diaryCount} 篇</td>
                        <td class="p-3 text-gray-600">${lastLoginDate}</td>
                        <td class="p-3">
                            ${!user.isAdmin ? `
                                <button class="delete-user-btn px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm" data-username="${user.username}">
                                    删除
                                </button>
                            ` : '<span class="text-gray-400 text-sm">系统账户</span>'}
                        </td>
                    </tr>
                `;
            });
        }
        
        const adminContent = `
            <div class="p-4 h-full overflow-y-auto touch-pan-y">
                <div class="space-y-6">
                    <!-- 用户管理 -->
                    <div class="border-b pb-6">
                        <h4 class="text-lg font-medium text-admin mb-4 flex items-center">
                            <i class="fa fa-users mr-2"></i>
                            用户管理
                        </h4>
                        <div class="bg-gray-50 p-4 rounded-lg mb-4">
                            <p class="text-gray-600 mb-2">
                                <strong>总用户数：</strong>
                                <span id="total-users-count" class="font-bold">${totalUsers}</span>
                            </p>
                            <p class="text-gray-600 mb-2">
                                <strong>总日记数（所有用户）：</strong>
                                <span id="total-all-diaries-count" class="font-bold">${totalDiaries}</span>
                            </p>
                            <p class="text-gray-600">
                                <strong>存储使用情况：</strong>
                                <span id="storage-usage" class="font-bold">${storageUsage} KB</span>
                            </p>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full border-collapse">
                                <thead>
                                    <tr class="bg-gray-100">
                                        <th class="p-3 text-left text-gray-700 font-medium text-sm">用户名</th>
                                        <th class="p-3 text-left text-gray-700 font-medium text-sm">注册时间</th>
                                        <th class="p-3 text-left text-gray-700 font-medium text-sm">日记数量</th>
                                        <th class="p-3 text-left text-gray-700 font-medium text-sm">最后活跃</th>
                                        <th class="p-3 text-left text-gray-700 font-medium text-sm">操作</th>
                                    </tr>
                                </thead>
                                <tbody id="users-list">
                                    ${usersListHTML}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <!-- 系统管理 -->
                    <div class="border-b pb-6">
                        <h4 class="text-lg font-medium text-admin mb-4 flex items-center">
                            <i class="fa fa-cogs mr-2"></i>
                            系统管理
                        </h4>
                        <div class="space-y-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button id="clear-all-data" class="p-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium flex flex-col items-center justify-center text-sm">
                                    <i class="fa fa-trash text-2xl mb-2"></i>
                                    <span>清空所有用户数据</span>
                                    <p class="text-xs mt-1 text-white/80">删除所有用户和日记数据</p>
                                </button>
                                <button id="reset-admin-password" class="p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex flex-col items-center justify-center text-sm">
                                    <i class="fa fa-key text-2xl mb-2"></i>
                                    <span>重置管理员密码</span>
                                    <p class="text-xs mt-1 text-white/80">将管理员密码重置为默认</p>
                                </button>
                                <button id="export-all-data" class="p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex flex-col items-center justify-center text-sm">
                                    <i class="fa fa-database text-2xl mb-2"></i>
                                    <span>导出所有数据</span>
                                    <p class="text-xs mt-1 text-white/80">导出所有用户的日记数据</p>
                                </button>
                                <button id="refresh-stats" class="p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium flex flex-col items-center justify-center text-sm">
                                    <i class="fa fa-refresh text-2xl mb-2"></i>
                                    <span>刷新统计</span>
                                    <p class="text-xs mt-1 text-white/80">更新所有统计数据</p>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 开发工具 -->
                    <div>
                        <h4 class="text-lg font-medium text-admin mb-4 flex items-center">
                            <i class="fa fa-code mr-2"></i>
                            开发工具
                        </h4>
                        <div class="space-y-4">
                            <div class="bg-gray-50 p-4 rounded-lg">
                                <h5 class="font-medium text-gray-700 mb-2 text-sm">LocalStorage 信息</h5>
                                <div class="space-y-2">
                                    <div class="flex justify-between">
                                        <span class="text-gray-600 text-sm">存储总大小：</span>
                                        <span id="storage-total" class="font-medium text-sm">${storageStats.total}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-gray-600 text-sm">已使用：</span>
                                        <span id="storage-used" class="font-medium text-sm">${storageStats.used}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-gray-600 text-sm">剩余空间：</span>
                                        <span id="storage-free" class="font-medium text-sm">${storageStats.free}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button id="clear-cache" class="p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center justify-center text-sm">
                                    <i class="fa fa-eraser mr-2"></i>
                                    清除缓存
                                </button>
                                <button id="view-log" class="p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center justify-center text-sm">
                                    <i class="fa fa-file-text-o mr-2"></i>
                                    查看日志
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        windowManager.createWindow('admin-window', '管理员面板', adminContent, {
            width: '450px',
            height: '500px',
            icon: '<i class="fa fa-shield text-sm"></i>'
        });
        
        // 绑定事件
        setTimeout(() => {
            const windowContent = windowManager.getWindowContent('admin-window');
            if (windowContent) {
                // 删除用户按钮
                windowContent.addEventListener('click', (e) => {
                    const deleteBtn = e.target.closest('.delete-user-btn');
                    if (deleteBtn) {
                        const username = deleteBtn.getAttribute('data-username');
                        this.deleteUser(username, windowContent);
                    }
                });
                
                // 同时绑定触摸事件
                windowContent.addEventListener('touchstart', (e) => {
                    const deleteBtn = e.target.closest('.delete-user-btn');
                    if (deleteBtn) {
                        e.preventDefault();
                    }
                }, { passive: false });
                
                windowContent.addEventListener('touchend', (e) => {
                    const deleteBtn = e.target.closest('.delete-user-btn');
                    if (deleteBtn) {
                        e.preventDefault();
                        const username = deleteBtn.getAttribute('data-username');
                        this.deleteUser(username, windowContent);
                    }
                });
                
                // 清空所有用户数据
                const clearAllDataBtn = windowContent.querySelector('#clear-all-data');
                if (clearAllDataBtn) {
                    this.bindTouchAndClick(clearAllDataBtn, () => {
                        this.clearAllUserData(windowContent);
                    });
                }
                
                // 重置管理员密码
                const resetAdminBtn = windowContent.querySelector('#reset-admin-password');
                if (resetAdminBtn) {
                    this.bindTouchAndClick(resetAdminBtn, () => {
                        this.resetAdminPassword();
                    });
                }
                
                // 导出所有数据
                const exportAllBtn = windowContent.querySelector('#export-all-data');
                if (exportAllBtn) {
                    this.bindTouchAndClick(exportAllBtn, () => {
                        this.exportAllUserData();
                    });
                }
                
                // 刷新统计
                const refreshStatsBtn = windowContent.querySelector('#refresh-stats');
                if (refreshStatsBtn) {
                    this.bindTouchAndClick(refreshStatsBtn, () => {
                        this.refreshStats(windowContent);
                    });
                }
                
                // 清除缓存
                const clearCacheBtn = windowContent.querySelector('#clear-cache');
                if (clearCacheBtn) {
                    this.bindTouchAndClick(clearCacheBtn, () => {
                        this.clearCache(windowContent);
                    });
                }
                
                // 查看日志
                const viewLogBtn = windowContent.querySelector('#view-log');
                if (viewLogBtn) {
                    this.bindTouchAndClick(viewLogBtn, () => {
                        this.viewLog();
                    });
                }
            }
        }, 100);
    }
    
    // 绑定触摸和点击事件的辅助方法
    bindTouchAndClick(element, handler) {
        element.addEventListener('touchstart', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        element.addEventListener('touchend', (e) => {
            e.preventDefault();
            handler();
        });
        
        element.addEventListener('click', handler);
    }
    
    // 删除用户
    deleteUser(username, windowContent) {
        if (confirm(`确定要删除用户 "${username}" 吗？此操作将删除该用户的所有日记数据，且不可恢复。`)) {
            const result = this.authManager.adminManager.deleteUser(username);
            showToast(result.message, result.success ? 'success' : 'error');
            
            if (result.success) {
                this.refreshStats(windowContent);
            }
        }
    }
    
    // 清空所有用户数据
    clearAllUserData(windowContent) {
        if (confirm('确定要清空所有用户数据吗？此操作将删除所有非管理员用户的日记数据，且不可恢复。')) {
            const result = this.authManager.adminManager.clearAllUserData();
            showToast(result.message, result.success ? 'success' : 'error');
            
            if (result.success) {
                this.refreshStats(windowContent);
            }
        }
    }
    
    // 重置管理员密码
    resetAdminPassword() {
        if (confirm('确定要将管理员密码重置为默认密码 "admin" 吗？')) {
            const result = this.authManager.adminManager.resetAdminPassword();
            showToast(result.message, result.success ? 'success' : 'error');
        }
    }
    
    // 导出所有用户数据
    exportAllUserData() {
        const result = this.authManager.adminManager.exportAllUserData();
        showToast(result.message, result.success ? 'success' : 'error');
    }
    
    // 刷新统计
    refreshStats(windowContent) {
        const adminManager = this.authManager.adminManager;
        const allUsers = adminManager.getAllUsers();
        const totalUsers = allUsers.length;
        const totalDiaries = adminManager.getAllDiariesCount();
        const storageUsage = adminManager.getStorageUsage();
        const storageStats = adminManager.getStorageStats();
        
        // 更新显示
        const totalUsersEl = windowContent.querySelector('#total-users-count');
        const totalDiariesEl = windowContent.querySelector('#total-all-diaries-count');
        const storageUsageEl = windowContent.querySelector('#storage-usage');
        const storageTotalEl = windowContent.querySelector('#storage-total');
        const storageUsedEl = windowContent.querySelector('#storage-used');
        const storageFreeEl = windowContent.querySelector('#storage-free');
        
        if (totalUsersEl) totalUsersEl.textContent = totalUsers;
        if (totalDiariesEl) totalDiariesEl.textContent = totalDiaries;
        if (storageUsageEl) storageUsageEl.textContent = `${storageUsage} KB`;
        if (storageTotalEl) storageTotalEl.textContent = storageStats.total;
        if (storageUsedEl) storageUsedEl.textContent = storageStats.used;
        if (storageFreeEl) storageFreeEl.textContent = storageStats.free;
        
        // 更新用户列表
        const usersList = windowContent.querySelector('#users-list');
        if (usersList) {
            let usersListHTML = '';
            if (allUsers.length === 0) {
                usersListHTML = `
                    <tr>
                        <td colspan="5" class="p-4 text-center text-gray-500">暂无用户数据</td>
                    </tr>
                `;
            } else {
                allUsers.forEach(user => {
                    const createdDate = new Date(user.createdAt);
                    const formattedCreated = createdDate.toLocaleDateString('zh-CN');
                    const lastLoginDate = user.lastLogin === '从未登录' ? '从未登录' : new Date(user.lastLogin).toLocaleString('zh-CN');
                    
                    usersListHTML += `
                        <tr class="border-b hover:bg-gray-50">
                            <td class="p-3">
                                <div class="flex items-center">
                                    <span class="font-medium">${user.username}</span>
                                    ${user.isAdmin ? '<span class="ml-2 bg-admin text-white text-xs px-2 py-0.5 rounded">管理员</span>' : ''}
                                </div>
                            </td>
                            <td class="p-3 text-gray-600">${formattedCreated}</td>
                            <td class="p-3 text-gray-600">${user.diaryCount} 篇</td>
                            <td class="p-3 text-gray-600">${lastLoginDate}</td>
                            <td class="p-3">
                                ${!user.isAdmin ? `
                                    <button class="delete-user-btn px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm" data-username="${user.username}">
                                        删除
                                    </button>
                                ` : '<span class="text-gray-400 text-sm">系统账户</span>'}
                            </td>
                        </tr>
                    `;
                });
            }
            usersList.innerHTML = usersListHTML;
        }
    }
    
    // 清除缓存
    clearCache(windowContent) {
        const result = this.authManager.adminManager.clearCache();
        showToast(result.message, result.success ? 'success' : 'error');
        
        if (result.success) {
            this.refreshStats(windowContent);
        }
    }
    
    // 查看日志
    viewLog() {
        const storageStats = this.authManager.adminManager.getStorageStats();
        let logMessage = "=== 小鹅日记系统日志 ===\n\n";
        
        logMessage += `当前时间: ${new Date().toLocaleString('zh-CN')}\n`;
        logMessage += `登录用户: ${this.authManager.getCurrentUser()}\n`;
        logMessage += `存储使用: ${storageStats.used}\n`;
        logMessage += `用户数量: ${this.authManager.adminManager.getAllUsers().length}\n`;
        logMessage += `总日记数: ${this.authManager.adminManager.getAllDiariesCount()}\n\n`;
        
        logMessage += "=== LocalStorage 项目 ===\n";
        storageStats.items.forEach(item => {
            const type = item.isUserData ? '[用户数据]' : item.isRememberMe ? '[记住我]' : item.isApiKey ? '[API密钥]' : '[其他]';
            logMessage += `${type} ${item.key}: ${item.size}\n`;
        });
        
        alert(logMessage);
    }
}

// ==================== 应用初始化 ====================

// 初始化应用
function initApp() {
    // 设置加载超时机制，防止无限加载
    const loadingTimeout = setTimeout(forceHideLoader, MAX_LOADING_TIME);
    
    const authManager = new AuthManager();
    
    // 首先尝试自动登录
    const autoLoginResult = authManager.autoLogin();
    
    if (autoLoginResult.success) {
        // 自动登录成功
        clearTimeout(loadingTimeout);
        hideLoader();
        setTimeout(() => {
            initMainApp(authManager);
        }, 300);
    } else {
        // 显示加载界面2秒后再显示登录窗口
        setTimeout(() => {
            hideLoader();
            setTimeout(() => {
                openAuthWindow(authManager, () => {
                    // 登录成功后的回调
                    clearTimeout(loadingTimeout);
                    initMainApp(authManager);
                });
            }, 500);
        }, 2000);
    }
}

// 打开认证窗口
function openAuthWindow(authManager, onLoginSuccess) {
    const authContent = `
        <div class="p-6">
            <!-- 切换登录/注册 -->
            <div class="flex border-b mb-6">
                <button id="login-tab" class="flex-1 py-3 font-medium text-primary border-b-2 border-primary text-sm">登录</button>
                <button id="register-tab" class="flex-1 py-3 font-medium text-gray-500 hover:text-primary transition-colors text-sm">注册</button>
            </div>
            
            <!-- 登录表单 -->
            <div id="login-form-container">
                <form id="login-form" class="space-y-4">
                    <div>
                        <label for="login-username" class="block text-gray-700 font-medium mb-2 text-sm">用户名</label>
                        <input 
                            type="text" 
                            id="login-username" 
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                            placeholder="请输入用户名"
                            required
                        >
                    </div>
                    
                    <div>
                        <label for="login-password" class="block text-gray-700 font-medium mb-2 text-sm">密码</label>
                        <input 
                            type="password" 
                            id="login-password" 
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                            placeholder="请输入密码"
                            required
                        >
                    </div>
                    
                    <!-- "记住我"复选框 -->
                    <div class="flex items-center">
                        <input 
                            type="checkbox" 
                            id="remember-me" 
                            class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary/50 focus:ring-2"
                        >
                        <label for="remember-me" class="ml-2 text-gray-700 text-sm">记住我 (7天内自动登录)</label>
                    </div>
                    
                    <button type="submit" class="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm">
                        <i class="fa fa-sign-in mr-1"></i> 登录
                    </button>
                </form>
            </div>
            
            <!-- 注册表单 -->
            <div id="register-form-container" class="hidden">
                <form id="register-form" class="space-y-4">
                    <div>
                        <label for="register-username" class="block text-gray-700 font-medium mb-2 text-sm">用户名</label>
                        <input 
                            type="text" 
                            id="register-username" 
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                            placeholder="请设置用户名"
                            required
                        >
                    </div>
                    
                    <div>
                        <label for="register-password" class="block text-gray-700 font-medium mb-2 text-sm">密码</label>
                        <input 
                            type="password" 
                            id="register-password" 
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                            placeholder="请设置密码（至少6位）"
                            minlength="6"
                            required
                        >
                    </div>
                    
                    <div>
                        <label for="register-confirm" class="block text-gray-700 font-medium mb-2 text-sm">确认密码</label>
                        <input 
                            type="password" 
                            id="register-confirm" 
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                            placeholder="请再次输入密码"
                            required
                        >
                    </div>
                    
                    <button type="submit" class="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm">
                        <i class="fa fa-user-plus mr-1"></i> 注册
                    </button>
                </form>
            </div>
        </div>
    `;
    
    windowManager.createWindow('auth-window', '小鹅日记', authContent, {
        width: '400px',
        height: '500px',
        closable: false,
        minimizable: false
    });
    
    // 绑定事件
    setTimeout(() => {
        const windowContent = windowManager.getWindowContent('auth-window');
        if (windowContent) {
            // 切换登录/注册标签
            const loginTab = windowContent.querySelector('#login-tab');
            const registerTab = windowContent.querySelector('#register-tab');
            const loginFormContainer = windowContent.querySelector('#login-form-container');
            const registerFormContainer = windowContent.querySelector('#register-form-container');
            
            if (loginTab && registerTab) {
                // 绑定触摸和点击事件
                const bindTabSwitch = (activeTab, inactiveTab, showContainer, hideContainer) => {
                    const handler = () => {
                        activeTab.classList.add('text-primary', 'border-primary', 'border-b-2');
                        activeTab.classList.remove('text-gray-500');
                        inactiveTab.classList.remove('text-primary', 'border-primary', 'border-b-2');
                        inactiveTab.classList.add('text-gray-500');
                        
                        if (showContainer) showContainer.classList.remove('hidden');
                        if (hideContainer) hideContainer.classList.add('hidden');
                    };
                    
                    activeTab.addEventListener('touchstart', (e) => {
                        e.preventDefault();
                    }, { passive: false });
                    
                    activeTab.addEventListener('touchend', (e) => {
                        e.preventDefault();
                        handler();
                    });
                    
                    activeTab.addEventListener('click', handler);
                };
                
                bindTabSwitch(loginTab, registerTab, loginFormContainer, registerFormContainer);
                bindTabSwitch(registerTab, loginTab, registerFormContainer, loginFormContainer);
            }
            
            // 登录表单提交
            const loginForm = windowContent.querySelector('#login-form');
            if (loginForm) {
                loginForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    
                    const username = windowContent.querySelector('#login-username').value;
                    const password = windowContent.querySelector('#login-password').value;
                    const rememberMe = windowContent.querySelector('#remember-me').checked;
                    
                    const result = authManager.login(username, password, rememberMe);
                    if (result.success) {
                        showToast(result.message);
                        // 关闭认证窗口
                        windowManager.closeWindow('auth-window');
                        // 登录成功回调
                        onLoginSuccess();
                    } else {
                        showToast(result.message, 'error');
                    }
                });
            }
            
            // 注册表单提交
            const registerForm = windowContent.querySelector('#register-form');
            if (registerForm) {
                registerForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    
                    const username = windowContent.querySelector('#register-username').value;
                    const password = windowContent.querySelector('#register-password').value;
                    const confirmPassword = windowContent.querySelector('#register-confirm').value;
                    
                    // 验证密码一致性
                    if (password !== confirmPassword) {
                        showToast('两次输入的密码不一致', 'error');
                        return;
                    }
                    
                    // 验证密码长度
                    if (password.length < 6) {
                        showToast('密码长度至少为6位', 'error');
                        return;
                    }
                    
                    const result = authManager.register(username, password);
                    showToast(result.message, result.success ? 'success' : 'error');
                    
                    // 注册成功后切换到登录表单
                    if (result.success) {
                        if (loginTab) loginTab.click();
                        const loginUsername = windowContent.querySelector('#login-username');
                        const loginPassword = windowContent.querySelector('#login-password');
                        const rememberMe = windowContent.querySelector('#remember-me');
                        
                        if (loginUsername) loginUsername.value = username;
                        if (loginPassword) loginPassword.value = '';
                        if (rememberMe) rememberMe.checked = false;
                        if (loginPassword) loginPassword.focus();
                    }
                });
            }
            
            // 自动聚焦用户名输入框
            const usernameInput = windowContent.querySelector('#login-username');
            if (usernameInput) {
                usernameInput.focus();
            }
        }
    }, 100);
}

// 初始化主应用
function initMainApp(authManager) {
    document.getElementById('app').classList.remove('hidden');
    document.getElementById('app').classList.add('page-turn');
    
    // 显示当前用户名和问候语
    const username = authManager.getCurrentUser();
    const isAdmin = authManager.isAdmin();
    
    const usernameEl = document.getElementById('current-username');
    const greetingEl = document.getElementById('time-greeting');
    
    if (usernameEl) usernameEl.textContent = username;
    if (greetingEl) greetingEl.textContent = getTimeBasedGreeting();
    
    // 显示/隐藏管理员标识
    const adminBadge = document.getElementById('admin-badge');
    const adminBtn = document.getElementById('admin-btn');
    
    if (isAdmin) {
        if (adminBadge) adminBadge.classList.remove('hidden');
        if (adminBtn) adminBtn.classList.remove('hidden');
    }
    
    // 初始化日记管理器
    const diaryManager = new DiaryManager(authManager);
    
    // 初始化小鹅助手
    const gooseAssistant = new GooseAssistant(diaryManager, authManager);
    window.gooseAssistant = gooseAssistant; // 设置为全局可访问
    
    // 初始化设置管理器
    const settingsManager = new SettingsManager(authManager, diaryManager);
    window.settingsManager = settingsManager; // 设置为全局可访问
    
    // 初始化管理员面板管理器
    const adminPanelManager = new AdminPanelManager(authManager, diaryManager);
    window.adminPanelManager = adminPanelManager; // 设置为全局可访问
    
    // 设置应用事件监听
    setupEventListeners(authManager, diaryManager, gooseAssistant);
}

// 正常隐藏加载界面
function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.add('fade-out');
        setTimeout(() => {
            loader.style.display = 'none';
        }, 500);
    }
}

// 强制隐藏加载界面（超时情况下）
function forceHideLoader() {
    console.warn('加载超时，强制隐藏加载界面');
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'none';
    }
}

// 设置应用事件监听
function setupEventListeners(authManager, diaryManager, gooseAssistant) {
    // 添加日记按钮事件（顶部）
    const addDiaryBtn = document.getElementById('add-diary-btn');
    if (addDiaryBtn) {
        // 绑定触摸和点击事件
        const bindButton = (element, handler) => {
            element.addEventListener('touchstart', (e) => {
                e.preventDefault();
            }, { passive: false });
            
            element.addEventListener('touchend', (e) => {
                e.preventDefault();
                handler();
            });
            
            element.addEventListener('click', handler);
        };
        
        bindButton(addDiaryBtn, () => {
            diaryManager.openAddWindow();
        });
    }
    
    // 主界面小鹅助手按钮事件
    const navGooseBtn = document.getElementById('nav-goose-btn');
    if (navGooseBtn) {
        navGooseBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        navGooseBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (gooseAssistant) {
                gooseAssistant.showFullScreen();
            }
        });
        
        navGooseBtn.addEventListener('click', () => {
            if (gooseAssistant) {
                gooseAssistant.showFullScreen();
            }
        });
    }
    
    // 主界面设置按钮事件
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        settingsBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (window.settingsManager) {
                window.settingsManager.openSettings();
            }
        });
        
        settingsBtn.addEventListener('click', () => {
            if (window.settingsManager) {
                window.settingsManager.openSettings();
            }
        });
    }
    
    // 主界面管理员按钮事件
    const adminBtn = document.getElementById('admin-btn');
    if (adminBtn) {
        adminBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        adminBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (window.adminPanelManager) {
                window.adminPanelManager.openAdminPanel();
            }
        });
        
        adminBtn.addEventListener('click', () => {
            if (window.adminPanelManager) {
                window.adminPanelManager.openAdminPanel();
            }
        });
    }
    
    // 主界面登出事件
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        logoutBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (confirm('确定要退出登录吗？')) {
                const result = authManager.logout();
                if (result.success) {
                    showToast(result.message);
                    // 关闭所有窗口
                    windowManager.closeAllWindows();
                    // 重新加载页面，确保需要重新登录
                    window.location.reload();
                }
            }
        });
        
        logoutBtn.addEventListener('click', () => {
            if (confirm('确定要退出登录吗？')) {
                const result = authManager.logout();
                if (result.success) {
                    showToast(result.message);
                    // 关闭所有窗口
                    windowManager.closeAllWindows();
                    // 重新加载页面，确保需要重新登录
                    window.location.reload();
                }
            }
        });
    }
    
    // 搜索和过滤事件（使用防抖优化性能）
    const searchInput = document.getElementById('search-diary');
    const filterMonth = document.getElementById('filter-month');
    const filterMood = document.getElementById('filter-mood');
    
    const debouncedRender = debounce(() => {
        diaryManager.currentPage = 1; // 重置到第一页
        diaryManager.renderDiaries();
    }, 300);
    
    if (searchInput) {
        searchInput.addEventListener('input', debouncedRender);
    }
    
    if (filterMonth) {
        filterMonth.addEventListener('change', debouncedRender);
    }
    
    if (filterMood) {
        filterMood.addEventListener('change', debouncedRender);
    }
    
    // 使用事件委托处理日记卡片中的按钮点击
    const diariesContainer = document.getElementById('diaries-container');
    if (diariesContainer) {
        diariesContainer.addEventListener('click', (e) => {
            const button = e.target.closest('.diary-action');
            if (button) {
                const action = button.getAttribute('data-action');
                const id = button.getAttribute('data-id');
                
                if (action === 'edit') {
                    diaryManager.openEditWindow(id);
                } else if (action === 'view') {
                    diaryManager.openViewWindow(id);
                }
            }
        });
        
        // 添加对日记标题和内容的点击事件委托
        diariesContainer.addEventListener('click', (e) => {
            const title = e.target.closest('.diary-title');
            const content = e.target.closest('.diary-content');
            
            if (title || content) {
                const card = e.target.closest('.bg-white.rounded-xl');
                if (card) {
                    const actionButton = card.querySelector('.diary-action[data-action="view"]');
                    if (actionButton) {
                        const id = actionButton.getAttribute('data-id');
                        diaryManager.openViewWindow(id);
                    }
                }
            }
        });
    }
}

// 显示提示消息
function showToast(message, type = 'success') {
    // 创建toast元素
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-primary' : 
                    type === 'error' ? 'bg-red-500' : 
                    type === 'warning' ? 'bg-yellow-500' : 
                    'bg-admin';
    toast.className = `fixed bottom-24 right-4 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg z-50 fade-in`;
    toast.textContent = message;
    
    // 添加到页面
    document.body.appendChild(toast);
    
    // 3秒后移除
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 500);
    }, 3000);
}

// ==================== PWA 功能 ====================

// 注册Service Worker
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('Service Worker 注册成功:', registration.scope);
                    
                    // 检查更新
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        console.log('发现Service Worker更新:', newWorker.state);
                        
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // 新Service Worker已安装，提示用户刷新
                                showUpdateNotification();
                            }
                        });
                    });
                })
                .catch(error => {
                    console.log('Service Worker 注册失败:', error);
                });
        });
    }
}

// 显示更新通知
function showUpdateNotification() {
    // 创建更新提示
    const updateNotification = document.createElement('div');
    updateNotification.className = 'fixed top-4 right-4 bg-primary text-white rounded-lg shadow-lg p-4 max-w-xs z-50 slide-up';
    updateNotification.innerHTML = `
        <div class="flex items-start">
            <i class="fa fa-refresh mr-3 mt-1 text-secondary"></i>
            <div class="flex-grow">
                <p class="font-medium mb-2">小鹅日记有新版本</p>
                <p class="text-sm opacity-90 mb-3">点击刷新以使用最新版本</p>
                <div class="flex gap-2">
                    <button id="refresh-app" class="px-3 py-1 bg-secondary text-dark rounded text-sm font-medium hover:bg-secondary/90 transition-colors">
                        立即刷新
                    </button>
                    <button id="dismiss-update" class="px-3 py-1 bg-gray-700 text-white rounded text-sm font-medium hover:bg-gray-600 transition-colors">
                        稍后
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(updateNotification);
    
    // 绑定事件
    const refreshBtn = updateNotification.querySelector('#refresh-app');
    const dismissBtn = updateNotification.querySelector('#dismiss-update');
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            window.location.reload();
        });
        
        refreshBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        refreshBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            window.location.reload();
        });
    }
    
    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            updateNotification.remove();
        });
        
        dismissBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        dismissBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            updateNotification.remove();
        });
    }
    
    // 5秒后自动移除
    setTimeout(() => {
        if (updateNotification.parentNode) {
            updateNotification.remove();
        }
    }, 15000);
}

// 添加到主界面 - 在顶部导航栏添加安装按钮
function addPWAInstallButton() {
    // 检查是否可安装
    if (window.matchMedia('(display-mode: standalone)').matches) {
        // 已经是PWA模式，不显示安装按钮
        return;
    }
    
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {
        // 阻止Chrome默认的安装提示
        e.preventDefault();
        deferredPrompt = e;
        
        // 创建安装按钮
        const installBtn = document.createElement('button');
        installBtn.id = 'pwa-install-btn';
        installBtn.className = 'hidden bg-goose text-primary hover:bg-goose/80 px-3 py-2 rounded-lg flex items-center space-x-1 transition-all duration-300 shadow-md nav-button';
        installBtn.innerHTML = `
            <i class="fa fa-download"></i>
            <span class="hidden md:inline text-sm">安装应用</span>
        `;
        
        // 添加到导航栏
        const navContainer = document.querySelector('header .flex.items-center.space-x-1');
        if (navContainer) {
            navContainer.appendChild(installBtn);
            installBtn.classList.remove('hidden');
        }
        
        // 绑定点击事件
        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            
            // 显示安装提示
            deferredPrompt.prompt();
            
            // 等待用户选择
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`用户安装选择: ${outcome}`);
            
            // 清除保存的提示
            deferredPrompt = null;
            
            // 隐藏安装按钮
            installBtn.classList.add('hidden');
        });
        
        // 添加触摸支持
        installBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        installBtn.addEventListener('touchend', async (e) => {
            e.preventDefault();
            if (!deferredPrompt) return;
            
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`用户安装选择: ${outcome}`);
            deferredPrompt = null;
            installBtn.classList.add('hidden');
        });
    });
    
    // 安装完成事件
    window.addEventListener('appinstalled', () => {
        console.log('小鹅日记已安装为PWA');
        showToast('小鹅日记已成功安装！');
    });
}

// 离线状态检测
function setupOfflineDetection() {
    // 更新网络状态显示
    function updateOnlineStatus() {
        const isOnline = navigator.onLine;
        const statusEl = document.createElement('div');
        statusEl.id = 'network-status';
        statusEl.className = `fixed bottom-16 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium z-40 slide-up ${
            isOnline ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`;
        statusEl.textContent = isOnline ? '✓ 网络已连接' : '⚠ 网络已断开（离线模式）';
        
        // 移除旧的状态提示
        const oldStatus = document.getElementById('network-status');
        if (oldStatus) oldStatus.remove();
        
        // 添加新的状态提示
        document.body.appendChild(statusEl);
        
        // 3秒后移除
        setTimeout(() => {
            if (statusEl.parentNode) {
                statusEl.classList.add('slide-down');
                setTimeout(() => {
                    if (statusEl.parentNode) {
                        statusEl.remove();
                    }
                }, 300);
            }
        }, 3000);
        
        // 通知用户
        if (!isOnline) {
            showToast('网络连接已断开，正在使用离线模式', 'warning');
        }
    }
    
    // 监听网络状态变化
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // 初始化状态
    setTimeout(updateOnlineStatus, 1000);
}

// 初始化PWA功能
function initPWA() {
    // 注册Service Worker
    registerServiceWorker();
    
    // 添加安装按钮
    addPWAInstallButton();
    
    // 设置离线检测
    setupOfflineDetection();
    
    // 添加离线数据保护提示
    showOfflineDataProtection();
}

// 显示离线数据保护提示
function showOfflineDataProtection() {
    // 只在首次访问时显示
    const hasShown = localStorage.getItem('goose-pwa-tips-shown');
    if (hasShown) return;
    
    setTimeout(() => {
        const tipWindow = document.createElement('div');
        tipWindow.className = 'fixed bottom-20 right-4 bg-white rounded-lg shadow-xl p-4 max-w-xs z-40 slide-up border-l-4 border-gooseBeak';
        tipWindow.innerHTML = `
            <div class="flex items-start mb-2">
                <i class="fa fa-shield text-gooseBeak mr-2 text-lg"></i>
                <h4 class="font-medium text-gray-800">数据保护提醒</h4>
            </div>
            <p class="text-sm text-gray-600 mb-3">
                您的日记数据已保存在本地浏览器中，支持离线使用。建议定期导出备份重要数据。
            </p>
            <div class="flex justify-between items-center">
                <button id="pwa-tip-close" class="text-xs text-gray-500 hover:text-gray-700">
                    不再提醒
                </button>
                <button id="pwa-tip-learn" class="text-xs text-primary hover:text-primary/80">
                    了解更多
                </button>
            </div>
        `;
        
        document.body.appendChild(tipWindow);
        
        // 绑定事件
        const closeBtn = tipWindow.querySelector('#pwa-tip-close');
        const learnBtn = tipWindow.querySelector('#pwa-tip-learn');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                localStorage.setItem('goose-pwa-tips-shown', 'true');
                tipWindow.remove();
            });
            
            closeBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
            }, { passive: false });
            
            closeBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                localStorage.setItem('goose-pwa-tips-shown', 'true');
                tipWindow.remove();
            });
        }
        
        if (learnBtn) {
            learnBtn.addEventListener('click', () => {
                tipWindow.remove();
                showPWAFaq();
            });
            
            learnBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
            }, { passive: false });
            
            learnBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                tipWindow.remove();
                showPWAFaq();
            });
        }
        
        // 10秒后自动移除
        setTimeout(() => {
            if (tipWindow.parentNode) {
                tipWindow.remove();
            }
        }, 10000);
    }, 5000);
}

// 显示PWA常见问题
function showPWAFaq() {
    const faqContent = `
        <div class="p-4 h-full overflow-y-auto touch-pan-y">
            <div class="space-y-6">
                <div class="border-b pb-6">
                    <h4 class="text-lg font-medium text-primary mb-4 flex items-center">
                        <i class="fa fa-mobile mr-2"></i>
                        离线功能与安装
                    </h4>
                    <div class="space-y-4">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h5 class="font-medium text-gray-700 mb-2 text-sm">如何安装应用？</h5>
                            <p class="text-sm text-gray-600">点击右上角的"安装应用"按钮，或在浏览器菜单中选择"添加到主屏幕"。</p>
                        </div>
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h5 class="font-medium text-gray-700 mb-2 text-sm">数据存储在哪里？</h5>
                            <p class="text-sm text-gray-600">所有数据保存在浏览器本地存储中，支持离线使用。</p>
                        </div>
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h5 class="font-medium text-gray-700 mb-2 text-sm">如何备份数据？</h5>
                            <p class="text-sm text-gray-600">在设置页面点击"导出数据"即可备份所有日记。</p>
                        </div>
                    </div>
                </div>
                
                <div class="border-b pb-6">
                    <h4 class="text-lg font-medium text-primary mb-4 flex items-center">
                        <i class="fa fa-shield mr-2"></i>
                        隐私与安全
                    </h4>
                    <div class="space-y-4">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h5 class="font-medium text-gray-700 mb-2 text-sm">数据会上传到服务器吗？</h5>
                            <p class="text-sm text-gray-600">不会。小鹅日记是完全本地应用，所有数据仅存储在您的设备上。</p>
                        </div>
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h5 class="font-medium text-gray-700 mb-2 text-sm">更换设备怎么办？</h5>
                            <p class="text-sm text-gray-600">请定期导出数据备份，在新设备上导入备份文件即可恢复数据。</p>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h4 class="text-lg font-medium text-primary mb-4 flex items-center">
                        <i class="fa fa-question-circle mr-2"></i>
                        常见问题
                    </h4>
                    <div class="space-y-4">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h5 class="font-medium text-gray-700 mb-2 text-sm">清除浏览器缓存会丢失数据吗？</h5>
                            <p class="text-sm text-gray-600">会。请在清除缓存前导出备份重要数据。</p>
                        </div>
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h5 class="font-medium text-gray-700 mb-2 text-sm">支持云同步吗？</h5>
                            <p class="text-sm text-gray-600">目前仅支持本地存储，未来版本可能添加云同步功能。</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    windowManager.createWindow('pwa-faq-window', '离线与安装帮助', faqContent, {
        width: '450px',
        height: '500px',
        icon: '<i class="fa fa-question-circle text-sm"></i>'
    });
}

// 请求通知权限
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        setTimeout(() => {
            const notificationBtn = document.createElement('button');
            notificationBtn.id = 'notification-permission-btn';
            notificationBtn.className = 'fixed bottom-24 left-4 bg-goose text-primary hover:bg-goose/80 px-4 py-2 rounded-lg shadow-lg z-40 slide-up flex items-center';
            notificationBtn.innerHTML = `
                <i class="fa fa-bell mr-2"></i>
                <span>开启日记提醒</span>
            `;
            
            document.body.appendChild(notificationBtn);
            
            // 绑定事件
            notificationBtn.addEventListener('click', async () => {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    showToast('提醒权限已开启');
                    notificationBtn.remove();
                    
                    // 设置每日提醒
                    setupDailyReminder();
                }
            });
            
            notificationBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
            }, { passive: false });
            
            notificationBtn.addEventListener('touchend', async (e) => {
                e.preventDefault();
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    showToast('提醒权限已开启');
                    notificationBtn.remove();
                    setupDailyReminder();
                }
            });
            
            // 15秒后自动移除
            setTimeout(() => {
                if (notificationBtn.parentNode) {
                    notificationBtn.remove();
                }
            }, 15000);
        }, 8000);
    }
}

// 设置每日提醒
function setupDailyReminder() {
    if ('serviceWorker' in navigator && 'Notification' in window && Notification.permission === 'granted') {
        // 注册周期性同步（需要浏览器支持）
        if ('periodicSync' in navigator.serviceWorker) {
            navigator.serviceWorker.ready.then(registration => {
                registration.periodicSync.register('daily-reminder', {
                    minInterval: 24 * 60 * 60 * 1000 // 24小时
                }).then(() => {
                    console.log('每日提醒已设置');
                });
            });
        }
        
        // 设置本地提醒
        const now = new Date();
        const reminderTime = new Date(now);
        reminderTime.setHours(20, 0, 0, 0); // 晚上8点提醒
        
        // 如果已经过了今天8点，就设置明天8点
        if (now > reminderTime) {
            reminderTime.setDate(reminderTime.getDate() + 1);
        }
        
        const timeUntilReminder = reminderTime.getTime() - now.getTime();
        
        setTimeout(() => {
            if ('Notification' in window && Notification.permission === 'granted') {
                // 检查是否已有今日日记
                const currentUser = authManager ? authManager.getCurrentUser() : null;
                if (currentUser && diaryManager) {
                    const diaries = diaryManager.diaries;
                    const today = new Date().toISOString().split('T')[0];
                    const hasTodayDiary = diaries.some(diary => diary.date === today);
                    
                    if (!hasTodayDiary) {
                        new Notification('小鹅日记提醒', {
                            body: '今天还没写日记呢，快来记录一下吧！',
                            icon: 'gooseai.png'
                        });
                    }
                }
            }
        }, timeUntilReminder);
    }
}

// ==================== 应用初始化 ====================

// 初始化应用（修改版本）
function initApp() {
    // 初始化PWA功能
    initPWA();
    
    // 设置加载超时机制，防止无限加载
    const loadingTimeout = setTimeout(forceHideLoader, MAX_LOADING_TIME);
    
    const authManager = new AuthManager();
    
    // 首先尝试自动登录
    const autoLoginResult = authManager.autoLogin();
    
    if (autoLoginResult.success) {
        // 自动登录成功
        clearTimeout(loadingTimeout);
        hideLoader();
        setTimeout(() => {
            initMainApp(authManager);
            // 请求通知权限
            requestNotificationPermission();
        }, 300);
    } else {
        // 显示加载界面2秒后再显示登录窗口
        setTimeout(() => {
            hideLoader();
            setTimeout(() => {
                openAuthWindow(authManager, () => {
                    // 登录成功后的回调
                    clearTimeout(loadingTimeout);
                    initMainApp(authManager);
                    // 请求通知权限
                    requestNotificationPermission();
                });
            }, 500);
        }, 2000);
    }
}
// 等待DOM加载完成后初始化应用
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}