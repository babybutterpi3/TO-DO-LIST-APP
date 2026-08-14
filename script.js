let currentTheme = 'breakfast';
let currentIndex = 0;
let isRewardMode = false;

// 🗓️ 1. โหลดข้อมูลประวัติ Streak & Scrapbook
let checkedDays = JSON.parse(localStorage.getItem("myStreakDays")) || [];
let scrapbookHistory = JSON.parse(localStorage.getItem("myScrapbookHistory")) || {};

// 🏠 2. ฟังก์ชันเลือกธีม
function selectTheme(themeName) {
    currentTheme = themeName;
    
    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.remove("active");
        screen.style.display = "none";
    });
    
    setTimeout(() => {
        let targetScreen;
        if (themeName === 'breakfast') {
            targetScreen = document.getElementById("tray-page");
        } else if (themeName === 'fruits') {
            targetScreen = document.getElementById("fruits-page");
        } else if (themeName === 'picnic') {
            targetScreen = document.getElementById("picnic-page");
        }
        
        if (targetScreen) {
            targetScreen.classList.add("active");
            targetScreen.style.display = "flex";
            resetTray(); 
        }
    }, 100);
}

// 🔙 3. ย้อนกลับหน้า Home
function goToHome() {
    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.remove("active");
        screen.style.display = "none";
    });
    setTimeout(() => {
        let home = document.getElementById("home-page");
        if (home) {
            home.classList.add("active");
            home.style.display = "flex";
        }
    }, 100);
}

// ✍️ 4. ฟังก์ชันเพิ่ม To-Do & Seal It
function addTodo() {
    let activeScreen = document.querySelector(".screen.active");
    if (!activeScreen) return;

    let input = activeScreen.querySelector("input[type='text']");
    let btn = activeScreen.querySelector(".cute-btn");
    
    if (!input) return;
    let text = input.value.trim();
    if (text === "") return;

    let allPriceTags = activeScreen.querySelectorAll(".price-tag");
    let allFoods = activeScreen.querySelectorAll(".food-item");

    if (!isRewardMode) {
        if (currentIndex < allPriceTags.length) {
            allPriceTags[currentIndex].innerText = text;
            
            let currentFood = allFoods[currentIndex];
            if (currentFood) {
                currentFood.style.display = "flex";
                currentFood.style.opacity = "1";
                currentFood.style.transform = "scale(1)";
            }

            currentIndex++;
        }
        
        if (currentIndex >= allFoods.length) {
            isRewardMode = true;
            if (currentTheme === 'breakfast') {
                input.placeholder = "tell yourself a sweet reward... 🥐";
            } else if (currentTheme === 'fruits') {
                input.placeholder = "manifest your daily wins bestie... 🔮";
            } else if (currentTheme === 'picnic') {
                input.placeholder = "whisper a secret reward for today... 🤫";
            }
            
            btn.innerText = "seal it! 💌";
            btn.style.background = "linear-gradient(135deg, #a1887f, #5d4037)";
        }
        
    } else {
        // 🌟 โหมดกด Seal It!
        let rewardDisplay = activeScreen.querySelector(".reward-text");
        if (rewardDisplay) rewardDisplay.innerText = "💌 " + text;
        
        let envelope = activeScreen.querySelector(".envelope-card");
        if (envelope) {
            envelope.style.display = "flex";
            envelope.style.opacity = "1";
            envelope.style.transform = "translate(-50%, -50%) scale(1)";
        }
        
        // 1. บันทึกเช็กอิน Streak
        markTodayComplete();

        // 2. รวบรวม To-Do ทั้งหมด
        let todayTasks = [];
        allPriceTags.forEach(tag => {
            if (tag.innerText && tag.innerText !== "") {
                todayTasks.push(tag.innerText);
            }
        });

        // 3. บันทึกลง Scrapbook History
        saveScrapbookData(todayTasks, text);

        isRewardMode = false;
        currentIndex = 0;
        input.placeholder = "✨ เพิ่มรายการ To-Do วันนี้...";
        if (btn) {
            let emoji = (currentTheme === 'fruits') ? '🍎' : '🍳';
            btn.innerText = "เพิ่ม " + emoji;
            btn.style.background = "linear-gradient(135deg, #ffb74d, #f57c00)";
        }
    }

    input.value = "";
}

// 💌 5. ฟังก์ชันกดเปิดจดหมาย
function openEnvelope() {
    let activeScreen = document.querySelector(".screen.active");
    if (!activeScreen) return;

    let envelope = activeScreen.querySelector(".envelope-card");
    if (!envelope) return;
    
    if (!envelope.classList.contains("open")) {
        envelope.classList.add("open");
    } else {
        envelope.style.transition = "all 0.5s ease";
        envelope.style.opacity = "0";
        envelope.style.transform = "translate(-50%, -50%) scale(0.5)";
        
        setTimeout(() => {
            envelope.style.display = "none";
        }, 500);
    }
}

// 🔄 6. ตั้งค่าถาดเริ่มต้น
function resetTray() {
    let activeScreen = document.querySelector(".screen.active");
    if (!activeScreen) return;

    let allFoods = activeScreen.querySelectorAll(".food-item");
    allFoods.forEach(food => {
        food.style.display = "none";
        food.style.opacity = "0";
        food.style.transform = "scale(0.3)";
    });

    let envelope = activeScreen.querySelector(".envelope-card");
    if (envelope) {
        envelope.style.display = "none";
        envelope.style.opacity = "0";
        envelope.style.transform = "translate(-50%, -50%) scale(0.3)";
        envelope.classList.remove("open");
    }

    currentIndex = 0;
    isRewardMode = false;
    
    let input = activeScreen.querySelector("input[type='text']");
    let btn = activeScreen.querySelector(".cute-btn");
    
    let navBtn = activeScreen.querySelector(".nav-btn");
    if (navBtn) navBtn.innerText = "🏠 Themes";

    if (input && btn) {
        if (currentTheme === 'breakfast') {
            input.placeholder = "what's cooking today, bff? 🪄";
            btn.innerText = "cook! 🍳";
        } else if (currentTheme === 'fruits') {
            input.placeholder = "slaying today's side quest... ✨";
            btn.innerText = "slay! 🍎";
        } else if (currentTheme === 'picnic') {
            input.placeholder = "serving today's cute menu... 🍰";
            btn.innerText = "lock in! 🧺";
        }
        btn.style.background = "linear-gradient(135deg, #ffb74d, #f57c00)";
    }
}

// ⌨️ 7. ดักจับปุ่มกด Enter และการแตะอาหาร
document.addEventListener("DOMContentLoaded", function() {
    document.addEventListener("keypress", function(e) {
        if (e.key === "Enter") {
            addTodo();
        }
    });

    document.addEventListener("click", function(e) {
        let food = e.target.closest(".food-item");
        if (food) {
            food.style.transition = "all 0.3s ease";
            food.style.opacity = "0";
            food.style.transform = "scale(0.3)";
            setTimeout(() => { food.style.display = "none"; }, 300);
        }
    });
});

// 🗓️ 8. ระบบ Streak Modal & Calendar
function openStreakModal() {
    renderCalendar();
    let modal = document.getElementById("streak-modal");
    if (modal) {
        modal.style.display = "flex";
    }
}

function closeStreakModal() {
    let modal = document.getElementById("streak-modal");
    if (modal) modal.style.display = "none";
}

function renderCalendar() {
    let grid = document.getElementById("calendar-grid");
    if (!grid) return;
    
    grid.innerHTML = "";
    
    let now = new Date();
    let monthNames = ["January", "February", "March", "April", "May", "June", 
                      "July", "August", "September", "October", "November", "December"];
    
    let monthHeader = document.getElementById("calendar-month");
    if (monthHeader) {
        monthHeader.innerText = "🌸 " + monthNames[now.getMonth()] + " " + now.getFullYear() + " 🌸";
    }

    let totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    for (let i = 1; i <= totalDays; i++) {
        let dayBox = document.createElement("div");
        dayBox.classList.add("day-box");
        
        dayBox.onclick = function() {
            openScrapbookForDay(i);
        };
        dayBox.style.cursor = "pointer";
        
        if (checkedDays.includes(i)) {
            dayBox.classList.add("checked");
            dayBox.innerText = "✨"; 
        } else {
            dayBox.innerText = i;
        }
        
        grid.appendChild(dayBox);
    }

    // อัปเดตตัวเลข Streak
    let streakNum = document.getElementById("streak-num");
    if (streakNum) streakNum.innerText = checkedDays.length;

    let completedText = document.querySelector(".streak-count, .streak-modal p, #streak-modal span");
    if (completedText && completedText.innerText.includes("Completed")) {
        completedText.innerHTML = `🔥 Completed: ${checkedDays.length} Days`;
    }
}

function markTodayComplete() {
    let today = new Date().getDate();
    if (!checkedDays.includes(today)) {
        checkedDays.push(today);
        localStorage.setItem("myStreakDays", JSON.stringify(checkedDays));
    }
}

// 📖 9. บันทึกและแสดงผล Scrapbook Planner
function saveScrapbookData(tasks, reward) {
    let todayKey = new Date().getDate();
    scrapbookHistory[todayKey] = {
        tasks: tasks,
        reward: reward
    };
    localStorage.setItem("myScrapbookHistory", JSON.stringify(scrapbookHistory));
}

function renderScrapbookPage(dayNum) {
    let now = new Date();
    let monthNames = ["January", "February", "March", "April", "May", "June", 
                      "July", "August", "September", "October", "November", "December"];
    
    let monthTitle = document.getElementById("planner-month-title");
    let dateNum = document.getElementById("planner-date-num");
    
    if (monthTitle) monthTitle.innerText = monthNames[now.getMonth()] + " Log";
    if (dateNum) dateNum.innerText = dayNum + "/" + (now.getMonth() + 1);

    let body = document.getElementById("planner-body");
    if (!body) return;
    
    body.innerHTML = "";

    let data = scrapbookHistory[dayNum];
    
    if (data && data.tasks) {
        let topPositions = [5, 23, 42, 60]; 
        
        data.tasks.forEach((taskText, index) => {
            let sticker = document.createElement("div");
            sticker.classList.add("scrapbook-sticker");
            
            let randomRotate = (Math.random() * 10 - 5).toFixed(1);
            let randomLeft = Math.floor(Math.random() * 20) + 28; 
            let topPos = topPositions[index] || (18 * index);

            sticker.style.top = topPos + "%";
            sticker.style.left = randomLeft + "%";
            sticker.style.transform = "rotate(" + randomRotate + "deg)";
            sticker.innerHTML = '<div class="tape-tag">📌 ' + taskText + '</div>';
            body.appendChild(sticker);
        });

        if (data.reward) {
            let rewardSticker = document.createElement("div");
            rewardSticker.classList.add("scrapbook-sticker");
            
            let rewardRotate = (Math.random() * 8 - 4).toFixed(1);
            let rewardLeft = Math.floor(Math.random() * 20) + 30;

            rewardSticker.style.top = "80%"; 
            rewardSticker.style.left = rewardLeft + "%";
            rewardSticker.style.transform = "rotate(" + rewardRotate + "deg)";
            rewardSticker.innerHTML = '<div class="tape-tag reward-tag">💌 ' + data.reward + '</div>';
            body.appendChild(rewardSticker);
        }

    } else {
        body.innerHTML = '<div style="text-align:center; padding-top:50%; color:#a1887f; font-size:12px; line-height:1.5;">today\'s side-quests<br> haven\'t started yet! 🍃</div>';
    }
}

function openScrapbookForDay(dayNum) {
    closeStreakModal();
    document.querySelectorAll(".screen").forEach(function(s) {
        s.classList.remove("active");
        s.style.display = "none"; 
    });
    
    let scrapbookScreen = document.getElementById("scrapbook-page");
    if (scrapbookScreen) {
        scrapbookScreen.classList.add("active");
        scrapbookScreen.style.display = "flex";
        renderScrapbookPage(dayNum);
    }
}

// ================= 🎨 STAMP SYSTEM =================
let selectedStamp = null;
let currentViewingDay = null; // เก็บว่าตอนนี้เปิด Scrapbook ของวันที่เท่าไหร่

// 1. เลือกแสตมป์
function selectStamp(stampContent, btnElement) {
    selectedStamp = stampContent;
    console.log("เลือกแสตมป์แล้ว:", selectedStamp);
    
    document.querySelectorAll(".stamp-btn").forEach(b => b.classList.remove("active"));
    if (btnElement) {
        btnElement.classList.add("active");
    }
}

// 2. ปั๊มลงกระดาษ
// 🌟 ฟังก์ชันปั๊มแสตมป์ (จะทำงานเฉพาะตอนที่เปิดหน้า Scrapbook อยู่เท่านั้น!)
function stampOnPaper(event) {
    let scrapbookScreen = document.getElementById("scrapbook-page");
    
    // ถ้าไม่ได้เปิดหน้า Scrapbook อยู่ หรือหน้าโดนซ่อนอยู่ ไม่ต้องทำอะไรเลย
    if (!scrapbookScreen || !scrapbookScreen.classList.contains("active")) {
        return;
    }

    if (!selectedStamp) {
        alert("กรุณาเลือกแสตมป์จากถาดด้านล่างก่อนน้า ✨");
        return;
    }

    if (!currentViewingDay) {
        currentViewingDay = new Date().getDate();
    }

    let paper = document.getElementById("planner-paper");
    if (!paper) return;

    let rect = paper.getBoundingClientRect();
    let xPercent = ((event.clientX - rect.left) / rect.width) * 100;
    let yPercent = ((event.clientY - rect.top) / rect.height) * 100;
    let rotate = (Math.random() * 16 - 8).toFixed(1);

    let finalContent = selectedStamp;
    let isText = false;

    if (selectedStamp === 'TIME_NOW') {
        let d = new Date();
        let hours = d.getHours().toString().padStart(2, '0');
        let mins = d.getMinutes().toString().padStart(2, '0');
        finalContent = `⏱️ ${hours}:${mins}`;
        isText = true;
    } else if (selectedStamp.length > 2) {
        isText = true;
    }

    if (!scrapbookHistory[currentViewingDay]) {
        scrapbookHistory[currentViewingDay] = { tasks: [], reward: "" };
    }
    if (!scrapbookHistory[currentViewingDay].stamps) {
        scrapbookHistory[currentViewingDay].stamps = [];
    }

    let stampData = {
        content: finalContent,
        x: xPercent,
        y: yPercent,
        rotate: rotate,
        isText: isText
    };

    scrapbookHistory[currentViewingDay].stamps.push(stampData);
    localStorage.setItem("myScrapbookHistory", JSON.stringify(scrapbookHistory));

    drawSingleStamp(stampData);
}

// 3. ฟังก์ชันวาดแสตมป์เดี่ยวๆ
function drawSingleStamp(stampData) {
    let paper = document.getElementById("planner-paper");
    let el = document.createElement("div");
    el.classList.add("stamped-item");
    if (stampData.isText) el.classList.add("text-stamp");

    el.innerText = stampData.content;
    el.style.left = stampData.x + "%";
    el.style.top = stampData.y + "%";
    el.style.transform = `translate(-50%, -50%) rotate(${stampData.rotate}deg)`;

    paper.appendChild(el);
}

// 4. ล้างแสตมป์ทั้งหมดของวันที่กำลังเปิด
function clearDayStamps() {
    if (!currentViewingDay || !scrapbookHistory[currentViewingDay]) return;
    
    scrapbookHistory[currentViewingDay].stamps = [];
    localStorage.setItem("myScrapbookHistory", JSON.stringify(scrapbookHistory));
    
    // ลบ element แสตมป์ออกจากหน้า
    document.querySelectorAll(".stamped-item").forEach(item => item.remove());
}

// 🌟 อัปเดตฟังก์ชัน renderScrapbookPage เดิม เพื่อให้วาดแสตมป์เก่าที่เคยปั๊มไว้ด้วย
let originalRenderScrapbookPage = renderScrapbookPage;
renderScrapbookPage = function(dayNum) {
    currentViewingDay = dayNum; // จำว่าเปิดวันไหน
    
    // ลบแสตมป์เก่าบนหน้าจอออกก่อน
    document.querySelectorAll(".stamped-item").forEach(item => item.remove());

    // เรียกฟังก์ชันวาดข้อความเดิม
    if (typeof originalRenderScrapbookPage === "function") {
        originalRenderScrapbookPage(dayNum);
    }

    // วาดแสตมป์ที่เคยปั๊มไว้ของวันนี้
    let data = scrapbookHistory[dayNum];
    if (data && data.stamps && Array.isArray(data.stamps)) {
        data.stamps.forEach(s => drawSingleStamp(s));
    }
};
