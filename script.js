function addTodo() {
    // ดึงข้อความจากช่องพิมพ์
    let text = document.getElementById("todo-input").value;
    
    if (text !== "") {
        // เปลี่ยนข้อความในป้ายราคาโทสไข่ดาวทันที!
        document.querySelector(".item-toast .price-tag").innerText = text;
        
        // ล้างช่องพิมพ์ให้ว่าง
        document.getElementById("todo-input").value = "";
    }
}
let currentTheme = 'breakfast';
let currentIndex = 0;
let isRewardMode = false;

/// 🏠 1. ฟังก์ชันเลือกธีม 
function selectTheme(themeName) {
    currentTheme = themeName;
    
    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.remove("active");
    });
    
    setTimeout(() => {
        let targetScreen;
        if (themeName === 'breakfast') {
            targetScreen = document.getElementById("tray-page");
        } else if (themeName === 'fruits') {
            targetScreen = document.getElementById("fruits-page");
        } else if (themeName === 'picnic') {
            targetScreen = document.getElementById("picnic-page"); // 🌟 เปิดหน้าปิคนิค!
        }
        
        if (targetScreen) {
            targetScreen.classList.add("active");
            resetTray(); 
        }
    }, 100);
}

// 🔙 2. ย้อนกลับหน้า Home
function goToHome() {
    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.remove("active");
    });
    setTimeout(() => {
        let home = document.getElementById("home-page");
        if (home) home.classList.add("active");
    }, 100);
}

// ✍️ 3. ฟังก์ชันเพิ่ม To-Do (เจาะจงเฉพาะปุ่ม .cute-btn ด้านล่าง!)
// ✍️ อัปเดตให้ addTodo() บันทึกประวัติ To-Do ลง Scrapbook
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
        // 🌟 เมื่ออยู่ในโหมดกด Seal It! (บันทึกรางวัล + บันทึก To-Do ทั้งหมดของวันนี้)
        let rewardDisplay = activeScreen.querySelector(".reward-text");
        if (rewardDisplay) rewardDisplay.innerText = "💌 " + text;
        
        let envelope = activeScreen.querySelector(".envelope-card");
        if (envelope) {
            envelope.style.display = "flex";
            envelope.style.opacity = "1";
            envelope.style.transform = "translate(-50%, -50%) scale(1)";
        }
        
        // 1. บันทึกเช็กอิน
        markTodayComplete();

        // 2. 🌟 รวบรวมข้อความ To-Do ทั้งหมดที่พิมพ์ไว้ในหน้านี้
        let todayTasks = [];
        allPriceTags.forEach(tag => {
            if (tag.innerText && tag.innerText !== "") {
                todayTasks.push(tag.innerText);
            }
        });

        // 3. 🌟 บันทึกลง Scrapbook History ของวันนี้
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

// 💌 4. ฟังก์ชันกดเปิดจดหมาย
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

// 🔄 5. ตั้งค่าถาดเริ่มต้น + สลับข้อความน่ารักๆ ตามธีม
function resetTray() {
    let activeScreen = document.querySelector(".screen.active");
    if (!activeScreen) return;

    // 1. ซ่อนอาหารและจดหมายไว้ก่อน
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
    
    // คืนค่าปุ่มโฮมซ้ายบน
    let navBtn = activeScreen.querySelector(".nav-btn");
    if (navBtn) navBtn.innerText = "🏠 Themes";

    // 🌟 2. สลับข้อความ Placeholder & ปุ่ม ตามธีมปัจจุบัน!
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

// 6. ดักจับการกด Enter และการคลิกจิ้มอาหารหาย
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

// 7. 🗓️ โค้ดระบบ Streak Check-in
let checkedDays = JSON.parse(localStorage.getItem("myStreakDays")) || [];

// 🗓️ เปิด Modal ปฏิทิน (สั่งวาดปฏิทินใหม่ทุกครั้งที่เปิด)
function openStreakModal() {
    renderCalendar(); // 🌟 บังคับวาดปฏิทินก่อน!
    let modal = document.getElementById("streak-modal");
    if (modal) {
        modal.style.display = "flex";
    }
}

// ปิด Modal
function closeStreakModal() {
    document.getElementById("streak-modal").style.display = "none";
}

// 📅 ฟังก์ชันวาดปฏิทิน + เชื่อมคลิกไปหน้า Scrapbook
function renderCalendar() {
    let grid = document.getElementById("calendar-grid");
    if (!grid) return;
    
    grid.innerHTML = ""; // ล้างหน้าปฏิทินเก่า
    
    let now = new Date();
    let monthNames = ["January", "February", "March", "April", "May", "June", 
                      "July", "August", "September", "October", "November", "December"];
    
    // อัปเดตชื่อเดือน
    let monthHeader = document.getElementById("calendar-month");
    if (monthHeader) {
        monthHeader.innerText = "🌸 " + monthNames[now.getMonth()] + " " + now.getFullYear() + " 🌸";
    }

    // คำนวณจำนวนวันในเดือนนี้
    let totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    for (let i = 1; i <= totalDays; i++) {
        let dayBox = document.createElement("div");
        dayBox.classList.add("day-box");
        
        // จิ้มวันที่เพื่อไปเปิดหน้า Scrapbook ของวันนั้น
        dayBox.onclick = function() {
            openScrapbookForDay(i);
        };
        dayBox.style.cursor = "pointer";
        
        // เช็กว่าทำสำเร็จหรือยัง
        if (checkedDays.includes(i)) {
            dayBox.classList.add("checked");
            dayBox.innerText = "✨"; 
        } else {
            dayBox.innerText = i;
        }
        
        grid.appendChild(dayBox);
    }

    let streakNum = document.getElementById("streak-num");
    if (streakNum) {
        streakNum.innerText = checkedDays.length;
    }
}

// 🌟 ฟังก์ชันนี้สั่งให้ทำงานตอนกดผนึกจดหมาย (Seal) สำเร็จ!
function markTodayComplete() {
    let today = new Date().getDate();
    if (!checkedDays.includes(today)) {
        checkedDays.push(today);
        localStorage.setItem("myStreakDays", JSON.stringify(checkedDays));
    }
}

// 8. 📖 คลังบันทึกประวัติ Scrapbook
let scrapbookHistory = JSON.parse(localStorage.getItem("myScrapbookHistory")) || {};

// 💾 บันทึก To-Do + Reward
function saveScrapbookData(tasks, reward) {
    let todayKey = new Date().getDate(); // ใช้เลขวันที่เป็น Key (เช่น 13)
    scrapbookHistory[todayKey] = {
        tasks: tasks,
        reward: reward
    };
    localStorage.setItem("myScrapbookHistory", JSON.stringify(scrapbookHistory));
}

// 🎨 วาดและแปะ To-Do + Reward ลงในหน้า Scrapbook Planner
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
    
    body.innerHTML = ""; // ล้างหน้ากระดาษก่อน

    let data = scrapbookHistory[dayNum];
    
    if (data && data.tasks) {
        // ตำแหน่งแนวตั้ง % ของแต่ละช่วง (morning, sunlit, afternoon, nighttime)
        let topPositions = [5, 23, 42, 60]; 
        
        // 1. วาดรายการ To-Do ในช่องต่างๆ
        data.tasks.forEach((taskText, index) => {
            let sticker = document.createElement("div");
            sticker.classList.add("scrapbook-sticker");
            
            let randomRotate = (Math.random() * 10 - 5).toFixed(1); // เอียง -5 ถึง 5 องศา
            
            // 🌟 เขยิบมาทางซ้ายมากขึ้น! (ปรับเหลือ 28% - 48%)
            let randomLeft = Math.floor(Math.random() * 20) + 28; 

            let topPos = topPositions[index] || (18 * index);

            sticker.style.top = topPos + "%";
            sticker.style.left = randomLeft + "%";
            sticker.style.transform = "rotate(" + randomRotate + "deg)";

            sticker.innerHTML = '<div class="tape-tag">📌 ' + taskText + '</div>';
            body.appendChild(sticker);
        });

        // 2. ข้อความรางวัลตรงช่อง cozy unwind (ช่องล่างสุด)
        if (data.reward) {
            let rewardSticker = document.createElement("div");
            rewardSticker.classList.add("scrapbook-sticker");
            
            let rewardRotate = (Math.random() * 8 - 4).toFixed(1);
            
            // 🌟 เขยิบมาทางซ้ายมากขึ้นเช่นกัน! (30% - 50%)
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

// 👆 สั่งให้เปิดหน้า Scrapbook พอกดจิ้มวันที่ใน Streak Modal
function openScrapbookForDay(dayNum) {
    closeStreakModal(); // 1. ปิด Modal ปฏิทินก่อน

    // 2. ซ่อนหน้าอื่นๆ ทั้งหมด
    document.querySelectorAll(".screen").forEach(function(s) {
        s.classList.remove("active");
        s.style.display = "none"; 
    });
    
    // 3. ดึงหน้า Scrapbook ขึ้นมาแสดง!
    let scrapbookScreen = document.getElementById("scrapbook-page");
    if (scrapbookScreen) {
        scrapbookScreen.classList.add("active");
        scrapbookScreen.style.display = "flex"; // สั่งเปิดหน้าจอแบบชัวร์ๆ!
        renderScrapbookPage(dayNum); // วาด To-Do ของวันที่จิ้ม
    }
}