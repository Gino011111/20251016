// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------


// let scoreText = "成績分數: " + finalScore + "/" + maxScore;
// 確保這是全域變數
let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; // 用於 p5.js 繪圖的文字

// !!! 新增：煙火相關的全局變數 !!!
let particles = []; // 用來儲存所有粒子的陣列
let shouldAnimate = false; // 控制是否進入動畫迴圈

// 粒子類別 (Particle Class) - 簡化版
class Particle {
    constructor(x, y, hu, firework) {
        this.pos = createVector(x, y);
        // 如果是煙火主體，則垂直向上移動；如果是爆炸粒子，則隨機向外擴散
        if (firework) {
            this.vel = createVector(0, random(-12, -8));
            this.lifespan = 255;
        } else {
            this.vel = p5.Vector.random2D();
            this.vel.mult(random(2, 10)); // 賦予隨機初速度
            this.lifespan = random(100, 200); // 爆炸粒子壽命較短
        }
        this.acc = createVector(0, 0);
        this.hu = hu;
        this.exploded = firework ? false : true; // 只有主體會爆炸
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        if (!this.exploded) {
            // 煙火主體只受重力
            this.applyForce(createVector(0, 0.2)); // 簡化重力
            this.vel.add(this.acc);
            this.pos.add(this.vel);
            this.acc.mult(0); // 重設加速度
            
            // 判斷是否到達爆炸點 (速度開始向下時)
            if (this.vel.y >= 0) {
                this.exploded = true;
                this.explode();
            }
        } else {
            // 爆炸粒子
            this.applyForce(createVector(0, 0.1)); // 簡化重力
            this.vel.mult(0.95); // 空氣阻力
            this.vel.add(this.acc);
            this.pos.add(this.vel);
            this.acc.mult(0);
            this.lifespan -= 5;
        }
    }
    
    // 爆炸功能
    explode() {
        let particleCount = 50;
        let explosionColor = this.hu;
        for (let i = 0; i < particleCount; i++) {
            // 生成新的爆炸粒子，firework 設為 false
            particles.push(new Particle(this.pos.x, this.pos.y, explosionColor, false)); 
        }
    }


    done() {
        return this.lifespan < 0;
    }

    show() {
        colorMode(HSB, 255);
        if (!this.exploded) {
            // 煙火主體的尾巴
            strokeWeight(4);
            stroke(this.hu, 255, 255);
        } else {
            // 爆炸粒子的淡出
            strokeWeight(2);
            stroke(this.hu, 255, 255, this.lifespan);
        }
        point(this.pos.x, this.pos.y);
        colorMode(RGB, 255);
    }
}
// ----------------------------------------
// 煙火程式碼結束
// ----------------------------------------


window.addEventListener('message', function (event) {
    // 執行來源驗證...
    // ...
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score; // 更新全域變數
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 
        
        // ----------------------------------------
        // 關鍵步驟 2: 呼叫重新繪製 (見方案二)
        // ----------------------------------------
        if (typeof redraw === 'function') {
            redraw(); 
        }
    }
}, false);


// =================================================================
// 步驟二：使用 p5.js 繪製分數 (在網頁 Canvas 上顯示)
// -----------------------------------------------------------------

function setup() { 
    // ... (其他設置)
    createCanvas(windowWidth / 2, windowHeight / 2); 
    background(255); 
    // 更改：移除 noLoop(); 或註解
    // noLoop(); // 如果您希望分數只有在改變時才繪製，保留此行
    colorMode(HSB, 255); // 讓顏色更容易控制
} 

// score_display.js 中的 draw() 函數片段

function draw() { 
    // -----------------------------------------------------------------
    // 關鍵更改：背景設為半透明黑色，以創造粒子尾巴和夜空效果
    // -----------------------------------------------------------------
    background(0, 0, 0, 50); // 黑色夜空，半透明用於拖尾效果

    // 計算百分比
    let percentage = (finalScore / maxScore) * 100;
    
    // -----------------------------------------------------------------
    // 關鍵更改：分數 90% 以上時的煙火邏輯
    // -----------------------------------------------------------------
    if (percentage >= 90) {
        // 啟用動畫模式
        if (!shouldAnimate) {
            loop(); // 啟用 draw 迴圈
            shouldAnimate = true;
        }

        // 隨機發射煙火 (降低頻率，避免過載)
        if (random(1) < 0.05) {
             // 煙火主體：從底部中間隨機 x 處發射
            let hu = random(255); // 隨機色相
            particles.push(new Particle(random(width / 4, width * 3 / 4), height, hu, true)); 
        }

        // 更新及繪製所有粒子
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].show();
            if (particles[i].done()) {
                particles.splice(i, 1); // 移除壽命結束的粒子
            }
        }
        
        // 如果沒有粒子且應該停止動畫，則停止迴圈
        if (particles.length === 0 && shouldAnimate) {
             noLoop();
             shouldAnimate = false;
        }

    } else {
        // 如果分數低於 90，且目前在動畫模式，則停止動畫
        if (shouldAnimate) {
            noLoop();
            shouldAnimate = false;
        }
        background(255); // 非動畫模式下，背景保持白色
    }

    // 恢復 RGB 模式繪製文字 (確保文字顏色不受 HSB 影響)
    colorMode(RGB, 255); 
    
    textSize(80); 
    textAlign(CENTER);
    
    // -----------------------------------------------------------------
    // A. 根據分數區間改變文本顏色和內容 (畫面反映一)
    // -----------------------------------------------------------------
    if (percentage >= 90) {
        // 滿分或高分：顯示鼓勵文本，使用鮮豔顏色
        fill(0, 200, 50); // 綠色 [6]
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
    } else if (percentage >= 60) {
        // 中等分數：顯示一般文本，使用黃色 [6]
        fill(255, 181, 35); 
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        // 低分：顯示警示文本，使用紅色 [6]
        fill(200, 0, 0); 
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        // 尚未收到分數或分數為 0
        fill(150);
        text(scoreText, width / 2, height / 2);
    }

    // 顯示具體分數
    textSize(50);
    fill(50);
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // -----------------------------------------------------------------
    // B. 根據分數觸發不同的幾何圖形反映 (畫面反映二)
    // -----------------------------------------------------------------
    
    if (percentage >= 90) {
        // 畫一個大圓圈代表完美 [7] (此處可以保留或移除，由於煙火效果已經很豐富)
        // fill(0, 200, 50, 150); // 帶透明度
        // noStroke();
        // circle(width / 2, height / 2 + 150, 150);
        
    } else if (percentage >= 60) {
        // 畫一個方形 [4]
        fill(255, 181, 35, 150);
        rectMode(CENTER);
        rect(width / 2, height / 2 + 150, 150, 150);
    }
    
    // 如果您想要更複雜的視覺效果，還可以根據分數修改線條粗細 (strokeWeight) 
    // 或使用 sin/cos 函數讓圖案的動畫效果有所不同 [8, 9]。
}
