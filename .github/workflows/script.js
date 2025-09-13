// script.js
window.addEventListener('load', () => {

    // --- 資料設定 ---
    const SPIN_DURATION_BASE = 2;
    const SPIN_DURATION_OFFSET = 1;
    const AUDIO_VOLUME = 0.3;

    // --- DOM 元素獲取 ---
    const reelStrips = document.querySelectorAll('.reel-strip');
    const mascotContainer = document.getElementById('mascot-container');
    const spinButton = document.getElementById('spin-button');
    const resultDisplay = document.getElementById('result-display');
    const resultTitle = document.getElementById('result-title');
    const resultDescription = document.getElementById('result-description');
    const spinSound = document.getElementById('spin-sound');
    const winSound = document.getElementById('win-sound');

    // 在程式一開始就設定好音量
    spinSound.volume = AUDIO_VOLUME;
    winSound.volume = AUDIO_VOLUME;

    // --- 常數設定 ---
    // 【關鍵修正】移除 margin 計算，現在 ICON_HEIGHT 就等於 CSS 中的 --icon-size
    const ICON_HEIGHT = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--bubble-size'));

    const ICONS_PER_REEL = 100;
    const BUBBLE_SIZE = 150; 

    const drinkPrizes = [
        { id: 'drink01', name: '蜜汁豬肉條', description: '...', icon: 'img/岩燒豬肉條.png'},
        { id: 'drink02', name: '蓬萊米餅', description: '...', icon: 'img/蓬萊米餅.png' },
        { id: 'drink03', name: '青蔥脆餅', description: '...', icon: 'img/蔥師傅蔥餅.png' },
    ];

    let isSpinning = false;

    // --- 函數 ---
    function setupReels() {
        const uniqueIcons = drinkPrizes.map(p => p.icon);
    
        reelStrips.forEach(strip => {
            strip.innerHTML = ''; 
    
            let iconPool = [];
            for (let i = 0; i < (ICONS_PER_REEL / uniqueIcons.length) + 1; i++) {
                iconPool.push(...uniqueIcons);
            }
    
            for (let i = iconPool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [iconPool[i], iconPool[j]] = [iconPool[j], iconPool[i]];
            }
    
            const finalIcons = iconPool.slice(0, ICONS_PER_REEL);
    
            finalIcons.forEach(iconSrc => {
                const img = document.createElement('img');
                img.src = iconSrc;
                img.dataset.iconName = iconSrc; 
                strip.appendChild(img);
            });
        });
    }
    
    async function spin() {
        // 檢查是否正在旋轉，防止重複觸發
        if (isSpinning) return;

        // ⭐ 關鍵修正：將尺寸計算放在這裡，確保每次點擊都取得最新、最正確的 CSS 尺寸
        const ICON_HEIGHT = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--bubble-size'));

        // --- 開始旋轉的準備工作 ---
        isSpinning = true;
        spinButton.disabled = true;

        // 重置音效與介面狀態
        winSound.pause();
        winSound.currentTime = 0;
        spinSound.currentTime = 0;
        spinSound.play();

        resultDisplay.classList.add('hidden');
        mascotContainer.classList.remove('happy');

        // --- 隨機決定中獎獎項 ---
        const winningDrink = drinkPrizes[Math.floor(Math.random() * drinkPrizes.length)];
        const winningIconSrc = winningDrink.icon;

        // --- 為每一個滾輪建立一個獨立的動畫 Promise ---
        const promises = Array.from(reelStrips).map((strip, i) => {
            return new Promise(resolve => {
                const iconsInStrip = Array.from(strip.children);
                
                // 從滾輪中找出中獎圖標的位置 (為了效果，從後面開始找，讓它停在比較深處的位置)
                let targetIconIndex = -1;
                for (let k = iconsInStrip.length - 1; k >= 0; k--) {
                    if (iconsInStrip[k].dataset.iconName === winningIconSrc) {
                        targetIconIndex = k;
                        break;
                    }
                }
                
                // 如果找不到（理論上不應該發生），隨機給一個位置
                const finalIndex = targetIconIndex === -1 ? Math.floor(Math.random() * (iconsInStrip.length - 1)) : targetIconIndex;

                // ⭐ 使用剛剛在函數內部計算出的 ICON_HEIGHT 來決定最終位置
                const targetPosition = finalIndex * ICON_HEIGHT;
                
                // --- 開始執行動畫 ---
                // 1. 為了讓動畫看起來更真實，先隨機跳到一個初始位置
                const randomOffset = (Math.random() - 0.5) * ICON_HEIGHT;
                strip.style.transition = 'none'; // 先取消過渡效果，才能瞬間移動
                strip.style.transform = `translateY(${randomOffset}px)`;
                
                // 2. 強制瀏覽器重繪，確保瞬間移動生效
                strip.offsetHeight; 

                // 3. 加上帶有延遲的過渡效果，並滾動到目標位置
                const transitionDuration = SPIN_DURATION_BASE + i * SPIN_DURATION_OFFSET; // 每個滾輪停止時間不同，更有層次感
                strip.style.transition = `transform ${transitionDuration}s cubic-bezier(0.25, 1, 0.5, 1)`;
                strip.style.transform = `translateY(-${targetPosition}px)`;

                // 4. 在動畫結束後，resolve 這個 Promise
                setTimeout(resolve, transitionDuration * 1000);
            });
        });

        // --- 等待所有滾輪動畫都結束 ---
        await Promise.all(promises);

        // --- 顯示結果 ---
        showResult(winningDrink);
    }

    function showResult(prize) {
        spinSound.pause();
        winSound.play();
    
        resultTitle.textContent = `恭喜！鯨寶寶為您帶來了`;
        resultDescription.textContent = `「${prize.name}」`;
        resultDisplay.classList.remove('hidden');
        mascotContainer.classList.add('happy');
    
        isSpinning = false;
        spinButton.disabled = false;
    }

    // --- 事件監聽 ---
    spinButton.addEventListener('click', spin);

    // --- 初始化 ---
    setupReels();

});
