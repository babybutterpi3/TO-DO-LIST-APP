// ================= 🔥 1. เชื่อมต่อ FIREBASE CLOUD =================
const firebaseConfig = {
    apiKey: "AIzaSyBfirq37geauaCQ8SDDJVralEf8T9PQ3bM",
    authDomain: "todo-tray-app.firebaseapp.com",
    projectId: "todo-tray-app",
    storageBucket: "todo-tray-app.firebasestorage.app",
    messagingSenderId: "1054819710064",
    appId: "1:1054819710064:web:9166837281c8c69601b0b5",
    measurementId: "G-B9BB0H2PJY"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const docRef = db.collection("userData").doc("mainUser");

// ☁️ ฟังก์ชันส่งข้อมูลขึ้น Cloud
function syncToCloud(dataObj) {
    docRef.set(dataObj, { merge: true })
        .then(() => console.log("☁️ Synced to Firebase!"))
        .catch(err => console.error("Firebase Sync Error:", err));
}

// ================= 📂 2. ตัวแปรตั้งต้น & รับข้อมูล REAL-TIME =================
let currentTheme = 'breakfast';
let currentIndex = 0;
let isRewardMode = false;
let selectedStamp = null;
let currentViewingDay = null; 
let currentSealedStamp = null; // เริ่มต้นยังไม่เลือกแสตมป์

// โหลดข้อมูลจากเครื่องก่อน (เผื่อเน็ตหลุด)
let checkedDays = JSON.parse(localStorage.getItem("myStreakDays")) || [];
let scrapbookHistory = JSON.parse(localStorage.getItem("myScrapbookHistory")) || {};

// 🔄 รับข้อมูล Real-time จาก Cloud
docRef.onSnapshot((doc) => {
    if (doc.exists) {
        const cloudData = doc.data();
        
        // 1. อัปเดต Streak
        if (cloudData.streakDays) {
            checkedDays = cloudData.streakDays.map(d => Number(d));
            localStorage.setItem("myStreakDays", JSON.stringify(checkedDays));
            
            if (typeof renderCalendar === "function") {
                renderCalendar();
            }
        }
        
        // 2. อัปเดต Scrapbook & Stamps
        if (cloudData.scrapbookHistory) {
            scrapbookHistory = cloudData.scrapbookHistory;
            localStorage.setItem("myScrapbookHistory", JSON.stringify(scrapbookHistory));
            if (currentViewingDay && document.getElementById("scrapbook-page")?.classList.contains("active")) {
                renderScrapbookPage(currentViewingDay);
            }
        }
    }
});

// ================= 🏠 3. ระบบนำทาง & ฟังก์ชันทั่วไป =================
function selectTheme(themeName) {
    currentTheme = themeName;
    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.remove("active");
        screen.style.display = "none";
    });
    setTimeout(() => {
        let targetScreen;
        if (themeName === 'breakfast') targetScreen = document.getElementById("tray-page");
        else if (themeName === 'fruits') targetScreen = document.getElementById("fruits-page");
        else if (themeName === 'picnic') targetScreen = document.getElementById("picnic-page");
        
        if (targetScreen) {
            targetScreen.classList.add("active");
            targetScreen.style.display = "flex";
            resetTray(); 
        }
    }, 100);
}

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

// ================= ✍️ 4. ระบบ TO-DO & SEAL IT =================
// 💌 1. เมื่อคลิกเลือกแสตมป์ ➡️ แสตมป์จะไปติดที่มุมซองให้ดูทันที (ไม่ปิดเอง)
function chooseSealStamp(stampSrc, element) {
    currentSealedStamp = stampSrc;
    document.querySelectorAll(".stamp-opt").forEach(img => img.classList.remove("selected"));
    if (element) element.classList.add("selected");

    let activeScreen = document.querySelector(".screen.active");
    if (!activeScreen) return;

    let envStamp = activeScreen.querySelector(".envelope-stamp-img");
    if (envStamp) {
        envStamp.src = stampSrc;
        envStamp.style.display = "block";
    }
}

// ✨ 2. ฟังก์ชันกดยืนยันแสตมป์ ➡️ ปิดถาด แล้วเลื่อนซองลงไปด้านล่าง
function finishSealing() {
    let activeScreen = document.querySelector(".screen.active");
    if (!activeScreen) return;

    // ย้ายซองจดหมายลงไปที่ตำแหน่งด้านล่างของถาด
    let envelope = activeScreen.querySelector(".envelope-card");
    if (envelope) {
        envelope.classList.add("settled");
    }

    // ซ่อนถาดเลือกแสตมป์
    let picker = document.getElementById("reward-stamp-picker");
    if (picker) {
        picker.style.display = "none";
    }

    // บันทึกรูปลง Scrapbook ประจำวัน
    let todayKey = new Date().getDate();
    if (scrapbookHistory[todayKey]) {
        scrapbookHistory[todayKey].sealedStamp = currentSealedStamp || "st-cat.png";
        localStorage.setItem("myScrapbookHistory", JSON.stringify(scrapbookHistory));
        syncToCloud({ scrapbookHistory: scrapbookHistory });
    }
}

// ✍️ 3. ระบบ To-Do & Seal It
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
    let envelope = activeScreen.querySelector(".envelope-card");

    if (!isRewardMode) {
        // ซ่อนซองเก่าถ้าเริ่มเควสต์ใหม่
        if (currentIndex === 0 && envelope) {
            envelope.style.display = "none";
            envelope.style.opacity = "0";
            envelope.classList.remove("settled", "open");
        }

        // วางอาหารทีละชิ้น
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
        
        input.value = "";

        // ใส่ครบทุกชิ้น ➡️ เปลี่ยนเป็นช่องพิมพ์ Reward
        if (currentIndex >= allFoods.length) {
            isRewardMode = true;
            
            if (currentTheme === 'breakfast') input.placeholder = "tell yourself a sweet reward... 🥐";
            else if (currentTheme === 'fruits') input.placeholder = "manifest your daily wins bestie... 🔮";
            else if (currentTheme === 'picnic') input.placeholder = "whisper a secret reward for today... 🤫";
            
            btn.innerText = "seal it! 💌";
            btn.style.background = "linear-gradient(135deg, #a1887f, #5d4037)";
            return;
        }

    } else {
        // 🌟 โหมดกด Seal It! ➡️ เด้งซองขนาดเต็มถาด + เปิดถาดแสตมป์
        let rewardDisplay = activeScreen.querySelector(".reward-text");
        if (rewardDisplay) rewardDisplay.innerText = "💌 " + text;

        if (envelope) {
            envelope.classList.remove("settled", "open");
            envelope.style.display = "flex";
            envelope.style.opacity = "1";
            envelope.style.transform = "translate(-50%, -50%) scale(1)";
        }

        // ตั้งค่าแสตมป์เริ่มต้นเป็นแมว ถ้ายังไม่ได้เลือก
        if (!currentSealedStamp) currentSealedStamp = "st-cat.png";

        // แสดงรูปแสตมป์บนซองทันที
        let envStamp = activeScreen.querySelector(".envelope-stamp-img");
        if (envStamp) {
            envStamp.src = currentSealedStamp;
            envStamp.style.display = "block";
        }

        // เปิดถาดเลือกแสตมป์
        let picker = document.getElementById("reward-stamp-picker");
        if (picker) {
            picker.style.display = "block";
            document.querySelectorAll(".stamp-opt").forEach(img => {
                if (img.getAttribute("src") === currentSealedStamp) {
                    img.classList.add("selected");
                } else {
                    img.classList.remove("selected");
                }
            });
        }

        let todayTasks = [];
        allPriceTags.forEach(tag => {
            if (tag.innerText && tag.innerText !== "") {
                todayTasks.push(tag.innerText);
            }
        });

        markTodayComplete();
        saveScrapbookData(todayTasks, text, currentSealedStamp);

        isRewardMode = false;
        currentIndex = 0;
        input.value = "";
        input.placeholder = "✨ what are you like to do today?";
        if (btn) {
            let emoji = (currentTheme === 'fruits') ? '🍎' : (currentTheme === 'picnic' ? '🧺' : '🍳');
            btn.innerText = "add " + emoji;
            btn.style.background = "rgba(255, 255, 255, 0.6)";
        }
    }
}
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
        setTimeout(() => { envelope.style.display = "none"; }, 500);
    }
}

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

    let picker = document.getElementById("reward-stamp-picker");
    if (picker) picker.style.display = "none";

    currentIndex = 0;
    isRewardMode = false;
    currentSealedStamp = null;
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

document.addEventListener("DOMContentLoaded", function() {
    document.addEventListener("keypress", function(e) {
        if (e.key === "Enter") addTodo();
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

    // 🖱️ ระบบเลื่อนถาดแสตมป์ด้วย Wheel และ Drag
    const initStampScroll = () => {
        const stampScroll = document.querySelector(".stamp-options-scroll");
        if (!stampScroll) return;

        // เลื่อนด้วยลูกกลิ้งเมาส์
        stampScroll.addEventListener("wheel", function(e) {
            if (e.deltaY !== 0 || e.deltaX !== 0) {
                e.preventDefault();
                stampScroll.scrollLeft += (e.deltaY || e.deltaX);
            }
        }, { passive: false });

        // คลิกเมาส์ค้างแล้วลาก (Drag to Scroll)
        let isDown = false;
        let startX;
        let scrollLeft;

        stampScroll.addEventListener('mousedown', (e) => {
            isDown = true;
            stampScroll.style.cursor = 'grabbing';
            startX = e.pageX - stampScroll.offsetLeft;
            scrollLeft = stampScroll.scrollLeft;
        });

        window.addEventListener('mouseup', () => {
            isDown = false;
            if (stampScroll) stampScroll.style.cursor = 'grab';
        });

        stampScroll.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - stampScroll.offsetLeft;
            const walk = (x - startX) * 1.5;
            stampScroll.scrollLeft = scrollLeft - walk;
        });
    };

    initStampScroll();
});

// ================= 🗓️ 5. ระบบ STREAK =================
function openStreakModal() {
    renderCalendar();
    let modal = document.getElementById("streak-modal");
    if (modal) modal.style.display = "flex";
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
        
        let isChecked = checkedDays.some(d => Number(d) === i);

        if (isChecked) {
            dayBox.classList.add("checked");
            dayBox.innerText = "✨"; 
        } else {
            dayBox.innerText = i;
        }
        
        grid.appendChild(dayBox);
    }

    let currentStreakCount = checkedDays.length;
    let streakNum = document.getElementById("streak-num");
    if (streakNum) streakNum.innerText = currentStreakCount;

    let streakDisplays = document.querySelectorAll(".streak-count, #streak-modal p, #streak-modal span");
    streakDisplays.forEach(el => {
        if (el && el.innerText.includes("Completed")) {
            el.innerHTML = `🔥 Completed: ${currentStreakCount} Days`;
        }
    });
}

function markTodayComplete() {
    let today = new Date().getDate();
    if (!checkedDays.includes(today)) {
        checkedDays.push(today);
    }
    localStorage.setItem("myStreakDays", JSON.stringify(checkedDays));
    syncToCloud({ streakDays: checkedDays });
    
    if (typeof renderCalendar === "function") {
        renderCalendar();
    }
}

// ================= 📖 6. ระบบ SCRAPBOOK & STAMPS =================
function saveScrapbookData(tasks, reward, sealedStamp) {
    let todayKey = new Date().getDate();
    let existingStamps = scrapbookHistory[todayKey]?.stamps || [];
    
    scrapbookHistory[todayKey] = {
        tasks: tasks,
        reward: reward,
        stamps: existingStamps,
        sealedStamp: sealedStamp || "st-cat.png"
    };
    localStorage.setItem("myScrapbookHistory", JSON.stringify(scrapbookHistory));
    syncToCloud({ scrapbookHistory: scrapbookHistory });
}

function renderScrapbookPage(dayNum) {
    currentViewingDay = dayNum;
    
    let now = new Date();
    let monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    let monthTitle = document.getElementById("planner-month-title");
    let dateNum = document.getElementById("planner-date-num");
    
    if (monthTitle) monthTitle.innerText = monthNames[now.getMonth()] + " Log";
    if (dateNum) dateNum.innerText = dayNum + "/" + (now.getMonth() + 1);

    let body = document.getElementById("planner-body");
    let paper = document.getElementById("planner-paper");
    if (body) body.innerHTML = "";
    document.querySelectorAll(".stamped-item").forEach(item => item.remove());
    document.querySelectorAll(".scrapbook-corner-stamp").forEach(el => el.remove());

    let data = scrapbookHistory[dayNum];
    
    // 1. วาด To-Do
    if (data && data.tasks && data.tasks.length > 0) {
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
        if (body) body.innerHTML = '<div style="text-align:center; padding-top:50%; color:#a1887f; font-size:12px; line-height:1.5;">today\'s side-quests<br> haven\'t started yet! 🍃</div>';
    }

    // 2. วาดแสตมป์ที่เคยกดปั๊มเอง
    if (data && data.stamps && Array.isArray(data.stamps)) {
        data.stamps.forEach(s => drawSingleStamp(s));
    }

    // 3. วาดแสตมป์ประจำวันตรงมุมขวาบน
    if (data && data.sealedStamp && paper) {
        let cornerStamp = document.createElement("img");
        cornerStamp.src = data.sealedStamp;
        cornerStamp.classList.add("scrapbook-corner-stamp");
        paper.appendChild(cornerStamp);
    }
}

function openScrapbookForDay(dayNum) {
    closeStreakModal();
    document.querySelectorAll(".screen").forEach(s => {
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

function selectStamp(stampContent, btnElement) {
    selectedStamp = stampContent;
    document.querySelectorAll(".stamp-btn").forEach(b => b.classList.remove("active"));
    if (btnElement) btnElement.classList.add("active");
}

function stampOnPaper(event) {
    let scrapbookScreen = document.getElementById("scrapbook-page");
    if (!scrapbookScreen || !scrapbookScreen.classList.contains("active")) return;

    if (!selectedStamp) {
        alert("กรุณาเลือกแสตมป์จากถาดด้านล่างก่อนน้า ✨");
        return;
    }

    if (!currentViewingDay) currentViewingDay = new Date().getDate();

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
    syncToCloud({ scrapbookHistory: scrapbookHistory });

    drawSingleStamp(stampData);
}

function drawSingleStamp(stampData) {
    let paper = document.getElementById("planner-paper");
    if (!paper) return;
    let el = document.createElement("div");
    el.classList.add("stamped-item");
    if (stampData.isText) el.classList.add("text-stamp");

    el.innerText = stampData.content;
    el.style.left = stampData.x + "%";
    el.style.top = stampData.y + "%";
    el.style.transform = `translate(-50%, -50%) rotate(${stampData.rotate}deg)`;

    paper.appendChild(el);
}

function clearDayStamps() {
    if (!currentViewingDay || !scrapbookHistory[currentViewingDay]) return;
    
    scrapbookHistory[currentViewingDay].stamps = [];
    localStorage.setItem("myScrapbookHistory", JSON.stringify(scrapbookHistory));
    syncToCloud({ scrapbookHistory: scrapbookHistory });

    document.querySelectorAll(".stamped-item").forEach(item => item.remove());
}

// ================= 📔 7. ระบบ STAMP ALBUM & LOCKED REWARDS =================
const stampCatalog = [
    // 🌟 แสตมป์พื้นฐาน (ปลดล็อกตั้งแต่เริ่มต้น: reqStreak: 0)
    { src: "st-alice.png", name: "Alice Wonderland", date: "13 Aug 2026", reqStreak: 0 },
    { src: "st-angel.png", name: "Vintage Angel", date: "13 Aug 2026", reqStreak: 0 },
    { src: "st-astronomy.png", name: "Astronomy Chart", date: "13 Aug 2026", reqStreak: 0 },
    { src: "st-cat.png", name: "Black Cat", date: "13 Aug 2026", reqStreak: 0 },
    { src: "st-fungi.png", name: "Wild Fungi", date: "13 Aug 2026", reqStreak: 0 },
    { src: "st-hellas.png", name: "Hellas Myth", date: "13 Aug 2026", reqStreak: 0 },
    { src: "st-horses.png", name: "Noble Horses", date: "13 Aug 2026", reqStreak: 0 },
    { src: "st-italia.png", name: "Italia Classic", date: "13 Aug 2026", reqStreak: 0 },
    { src: "st-jester.png", name: "Retro Jester", date: "13 Aug 2026", reqStreak: 0 },
    { src: "st-korea.png", name: "Old Korea", date: "13 Aug 2026", reqStreak: 0 },
    { src: "st-laos.png", name: "Postes Laos", date: "13 Aug 2026", reqStreak: 0 },
    { src: "st-mongol.png", name: "Mongol Rider", date: "13 Aug 2026", reqStreak: 0 },
    { src: "st-skull.png", name: "Flora Skull", date: "13 Aug 2026", reqStreak: 0 },
    { src: "st-smoke.png", name: "Blue Smoke", date: "13 Aug 2026", reqStreak: 0 },
    { src: "st-vaticana.png", name: "Posta Vaticana", date: "13 Aug 2026", reqStreak: 0 },

    // 🔒 แสตมป์ลับที่ต้องทำ Streak เพื่อปลดล็อก!
    { src: "st-francaise.png", name: "Française Classic", date: "19 Aug 2026", reqStreak: 2 },
    { src: "st-Czechoslovakia.png", name: "Czechoslovakia", date: "19 Aug 2026", reqStreak: 3 },
    { src: "st-sheep.png", name: "Green Meadow", date: "19 Aug 2026", reqStreak: 4 },
    { src: "st-deutsche.png", name: "Deutsche Post", date: "19 Aug 2026", reqStreak: 5 },
    { src: "st-first.dino.ch.png", name: "First Dino", date: "19 Aug 2026", reqStreak: 7 },
    { src: "st-leke.png", name: "Leke Fantasy", date: "19 Aug 2026", reqStreak: 10 },
    { src: "st-dragon.png", name: "Green Dragon", date: "19 Aug 2026", reqStreak: 12 },
    // 🌟 คู่ที่ 1 (Streak ครบ 8 วัน ปลดล็อก 2 ลาย)
    { src: "st-junji1.png", name: "Junji Ito Mask", date: "20 Aug 2026", reqStreak: 14 },
    { src: "st-junji2.png", name: "Junji Ito Spiral", date: "20 Aug 2026", reqStreak: 14 },

    // 🌟 คู่ที่ 2 (Streak ครบ 10 วัน ปลดล็อก 2 ลาย)
    { src: "st-vietnam.png", name: "Postes Vietnam", date: "20 Aug 2026", reqStreak: 16 },
    { src: "st-clown.png", name: "Magyar Posta", date: "20 Aug 2026", reqStreak: 16 },

    // 🌟 คู่ที่ 3 (Streak ครบ 12 วัน ปลดล็อก 2 ลาย)
    { src: "st-londres.png", name: "Correos del Perú", date: "20 Aug 2026", reqStreak: 18 },
    { src: "st-monaco.png", name: "Monaco Croix", date: "20 Aug 2026", reqStreak: 18 },

    // 🌟 คู่ที่ 4 (Streak ครบ 14 วัน ปลดล็อก 2 ลาย)
    { src: "st-nine.hearts.png", name: "Nine of Hearts", date: "20 Aug 2026", reqStreak: 20 },
    { src: "st-la.poste.png", name: "L'Écuyère France", date: "20 Aug 2026", reqStreak: 20 },
]; //

let currentAlbumSpread = 0;
const stampsPerPage = 2; // ฝั่งละ 2 ชิ้น รวมคู่หน้าละ 4 ชิ้น

function openStampAlbum() {
    currentAlbumSpread = 0;
    renderStampAlbum();
    let modal = document.getElementById("stamp-album-modal");
    if (modal) modal.style.display = "flex";
}

function closeStampAlbum() {
    let modal = document.getElementById("stamp-album-modal");
    if (modal) modal.style.display = "none";
}

function renderStampAlbum() {
    const leftPage = document.getElementById("album-left-page");
    const rightPage = document.getElementById("album-right-page");
    const pageNumText = document.getElementById("album-page-num");

    if (!leftPage || !rightPage) return;

    leftPage.innerHTML = "";
    rightPage.innerHTML = "";

    const startIndex = currentAlbumSpread * (stampsPerPage * 2);
    const leftStamps = stampCatalog.slice(startIndex, startIndex + stampsPerPage);
    const rightStamps = stampCatalog.slice(startIndex + stampsPerPage, startIndex + (stampsPerPage * 2));

    // วาดหน้าซ้ายและขวา
    leftStamps.forEach(stamp => leftPage.appendChild(createStampSlot(stamp)));
    rightStamps.forEach(stamp => rightPage.appendChild(createStampSlot(stamp)));

    // อัปเดตตัวเลขหน้า
    const page1 = (currentAlbumSpread * 2) + 1;
    const page2 = page1 + 1;
    if (pageNumText) pageNumText.innerText = `Pages ${page1} - ${page2}`;
}

// 🌟 สร้างช่องแสตมป์ พร้อมเช็กสถานะการปลดล็อก
function createStampSlot(stamp) {
    const currentStreak = (checkedDays && Array.isArray(checkedDays)) ? checkedDays.length : 0;
    const isUnlocked = currentStreak >= (stamp.reqStreak || 0);

    const slot = document.createElement("div");
    slot.classList.add("album-stamp-slot");
    slot.style.cursor = "pointer";

    if (isUnlocked) {
        // ปลดล็อกแล้ว: แสดงรูปปกติและกดซูมดูรูปใหญ่ได้
        slot.onclick = () => openStampZoom(stamp);
        slot.innerHTML = `
            <img src="${stamp.src}" alt="${stamp.name}">
            <span class="album-stamp-name">${stamp.name}</span>
        `;
    } else {
        // ยังไม่ปลดล็อก: แสดงภาพเงาดำพร้อมแม่กุญแจ
        slot.classList.add("stamp-locked");
        slot.onclick = () => alert(`🔒 ลายนี้ต้องทำ Streak ให้ครบ ${stamp.reqStreak} วันก่อนน้า! (ตอนนี้: ${currentStreak}/${stamp.reqStreak} วัน) ✨`);
        slot.innerHTML = `
            <div class="lock-overlay">
                <img src="${stamp.src}" class="locked-img" alt="Locked">
                <span class="lock-icon">🔒</span>
            </div>
            <span class="album-stamp-name lock-text">Streak ${stamp.reqStreak} Days</span>
        `;
    }

    return slot;
}

// 🔍 ฟังก์ชันเปิดดูรูปใหญ่
function openStampZoom(stamp) {
    const modal = document.getElementById("stamp-zoom-modal");
    const img = document.getElementById("zoom-stamp-img");
    const name = document.getElementById("zoom-stamp-name");
    const date = document.getElementById("zoom-stamp-date");

    if (!modal || !img || !name || !date) return;

    img.src = stamp.src;
    name.innerText = stamp.name;
    date.innerText = stamp.date || "Original Collection";

    modal.style.display = "flex";
}

// 🔍 ฟังก์ชันปิดหน้าต่างดูรูปใหญ่
function closeStampZoom(event, forceClose = false) {
    if (forceClose || (event && event.target.id === "stamp-zoom-modal")) {
        const modal = document.getElementById("stamp-zoom-modal");
        if (modal) modal.style.display = "none";
    }
}

function nextAlbumPage() {
    const maxSpreads = Math.ceil(stampCatalog.length / (stampsPerPage * 2)) - 1;
    if (currentAlbumSpread < maxSpreads) {
        currentAlbumSpread++;
        renderStampAlbum();
    }
}

function prevAlbumPage() {
    if (currentAlbumSpread > 0) {
        currentAlbumSpread--;
        renderStampAlbum();
    }
}