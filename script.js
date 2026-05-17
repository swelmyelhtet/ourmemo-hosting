const CORRECT_PIN = "0208"; // သင့် PIN Code ကို ဒီမှာ ပြောင်းပါ (ဂဏန်းသီးသန့်ဖြစ်ရမည်)
let currentPIN = "";

// နံပါတ်ကွက်ကို နှိပ်တဲ့အခါ
function addNumber(num) {
  if (currentPIN.length < 4) {
    currentPIN += num;
    updatePinDots();

    // PIN ၄ လုံး ပြည့်သွားရင် အလိုအလျောက် စစ်ဆေးမယ်
    if (currentPIN.length === 4) {
      checkPIN();
    }
  }
}

// ဖြတ်တဲ့ ခလုတ် (⌫) ကို နှိပ်တဲ့အခါ
function deleteNumber() {
  if (currentPIN.length > 0) {
    currentPIN = currentPIN.slice(0, -1);
    updatePinDots();
  }
}

// အစက်လေးတွေရဲ့ Design ကို Update လုပ်ခြင်း
function updatePinDots() {
  const dots = document.querySelectorAll(".pin-dot");
  dots.forEach((dot, index) => {
    if (index < currentPIN.length) {
      dot.classList.add("filled"); // ပြည့်သွားတဲ့ အစက်
    } else {
      dot.classList.remove("filled"); // ကွက်လပ် အစက်
    }
  });
}

// PIN Code စစ်ဆေးခြင်း
function checkPIN() {
  const errorElem = document.getElementById("error-msg");
  const dotContainer = document.querySelector(".pin-dots-container");
  const dots = document.querySelectorAll(".pin-dot");

  if (currentPIN === CORRECT_PIN) {
    errorElem.style.visibility = "hidden";
    sessionStorage.setItem("isLoggedIn", "true");

    document.getElementById("password-screen").style.display = "none";
    const overlay = document.getElementById("loading-overlay");
    overlay.style.display = "flex";
    overlay.style.opacity = "1";

    setTimeout(() => {
      overlay.style.opacity = "0";
      setTimeout(() => {
        overlay.style.display = "none";
        document.getElementById("main-content").classList.add("show");
        initWebsite();
      }, 500);
    }, 2000);
  } else {
    // ၁။ စာသားပြမယ်
    errorElem.style.visibility = "visible";

    // ၂။ အစက်လေးတွေကို အနီရောင်ပြောင်းပြီး တုန်ခါခိုင်းမယ်
    dots.forEach((dot) => (dot.style.borderColor = "#ff4d4d"));
    dotContainer.style.animation = "shake 0.3s ease-in-out";

    setTimeout(() => {
      // ၃။ ပြန်ရှင်းမယ်
      currentPIN = "";
      updatePinDots();
      dotContainer.style.animation = "";
      dots.forEach((dot) => (dot.style.borderColor = ""));
    }, 600);

    // ၄။ ၃ စက္ကန့်ကြာရင် စာသား ပြန်ဖျောက်မယ်
    setTimeout(() => {
      errorElem.style.visibility = "hidden";
    }, 3000);
  }
}

let allMemories = [];
let currentIndex = 0;
const itemsPerPage = 5; // တစ်ခါပြရင် ၅ ခုပဲ အရင်ပြမယ် (ဒါမှ Website မလေးမှာပါ)

function toMyanmarNum(num) {
  const mNum = ["၀", "၁", "၂", "၃", "၄", "၅", "၆", "၇", "၈", "၉"];
  return num
    .toString()
    .split("")
    .map((d) => mNum[d] || d)
    .join("");
}

// --- FETCH DATA FROM JSON ---

async function initWebsite() {
  try {
    const response = await fetch(`data.json?t=${Date.now()}`);
    allMemories = await response.json();

    allMemories.sort((a, b) => {
      const dateA = a.isoDate ? new Date(a.isoDate) : new Date();
      const dateB = b.isoDate ? new Date(b.isoDate) : new Date();
      return dateA - dateB; // အဟောင်းဆုံးမှ အသစ်ဆုံးသို့ စီခြင်း
    });
    // Button ကို နှိပ်မှ Memories တွေ ပေါ်လာစေရန်
    const btn = document.getElementById("view-memories-btn");
    btn.addEventListener("click", () => {
      const overlay = document.getElementById("loading-overlay");
      const container = document.querySelector(".container"); // ပတ်ဝန်းကျင်ကို Blur လုပ်ဖို့

      // ၁။ Loading Animation ကို ပြန်ဖော်ပြီး Background ကို Blur လုပ်ခြင်း
      overlay.style.display = "flex";
      overlay.style.opacity = "1";
      if (container) container.style.filter = "blur(8px)";

      // ၂။ ၁.၅ စက္ကန့် (1500ms) ကြာမှ memories များကို တင်ခြင်း
      setTimeout(() => {
        const storyList = document.getElementById("story-list");
        const sentinel = document.getElementById("sentinel");

        storyList.style.display = "block";
        sentinel.style.display = "block";

        const footer = document.querySelector("footer");
        if (footer) footer.style.display = "none";

        // Memory များ စတင်တင်ခြင်း
        setTimeout(() => {
          storyList.classList.add("reveal");
          loadMoreMemories();
          setupInfiniteScroll();

          // ၃။ အကုန်တင်ပြီးမှ Loading ကို ပြန်ဖျောက်ပြီး Blur ဖယ်ခြင်း
          overlay.style.opacity = "0";
          if (container) container.style.filter = "none";

          setTimeout(() => {
            overlay.style.display = "none";
          }, 500);
        }, 100);

        // အသာအယာ Scroll ဆွဲသွားခြင်း
        window.scrollTo({
          top: storyList.offsetTop - 100,
          behavior: "smooth",
        });

        btn.remove(); // ခလုတ်ကို လုံးဝဖယ်ရှားခြင်း
      }, 1500);
    });
    let hideTimeout;

    window.addEventListener("scroll", () => {
      const nav = document.getElementById("nav-timeline");
      const indicator = document.getElementById("timeline-indicator");
      const dateDisplay = document.getElementById("timeline-date-display");
      const sections = document.querySelectorAll("section");

      if (!nav || sections.length === 0) return;

      // ၁။ Scroll လုပ်လျှင် ချက်ချင်းပြန်ပေါ်လာစေရန်
      if (window.scrollY > 400) {
        nav.style.opacity = "1";
        indicator.style.opacity = "1";
        indicator.style.transform = "translateX(0)";
      } else {
        nav.style.opacity = "0";
        return;
      }

      // ၂။ လက်ရှိ Date ကို ရှာဖွေခြင်း
      let activeIndex = 0;
      sections.forEach((sec, i) => {
        const rect = sec.getBoundingClientRect();
        if (rect.top <= window.innerHeight / 2 + 50) {
          activeIndex = i;
        }
      });

      // ၃။ Date စာသားကို Update လုပ်ခြင်း
      if (allMemories[activeIndex]) {
        let fullDate = allMemories[activeIndex].date; // "၂၃ စက်တင်ဘာ ၂၀၂၃"

        // ရက်စွဲ (ရှေ့ဆုံးက ဂဏန်းတွေ) ကို ဖယ်ထုတ်ပြီး "စက်တင်ဘာ ၂၀၂၃" ပဲ ယူခြင်း
        // မြန်မာဂဏန်း သို့မဟုတ် အင်္ဂလိပ်ဂဏန်း ရှေ့ဆုံးမှာ ပါနေရင် ဖယ်လိုက်ပါမယ်
        let monthYear = fullDate.replace(/^[၀-၉0-9\s]+/, "").trim();

        // ရလာတဲ့ "စက်တင်ဘာ ၂၀၂၃" ကိုမှ မြန်မာဂဏန်းပြောင်းပြီး ပြသခြင်း
        dateDisplay.innerText = toMyanmarNum(monthYear).replace("၊", " ");
      }

      // ၄။ ၂ စက္ကန့်အကြာတွင် Auto-hide လုပ်ခြင်း
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => {
        indicator.style.opacity = "0";
        indicator.style.transform = "translateX(30px)"; // ညာဘက်သို့ Slide ဖြစ်ပြီး ပျောက်ကွယ်သွားမည်
      }, 2000);
    });
    loadMoreMemories();
    setupInfiniteScroll();
  } catch (err) {
    console.error("JSON file မတွေ့ပါ (သို့မဟုတ်) Error တက်နေပါသည်:", err);
  }
}
// Timeline Links ဖန်တီးခြင်း

// initWebsite ထဲမှာ loadMoreMemories() ပြီးရင် createTimeline() ကို ခေါ်ပေးပါ

function loadMoreMemories() {
  const list = document.getElementById("story-list");
  const nextBatch = allMemories.slice(
    currentIndex,
    currentIndex + itemsPerPage,
  );

  if (nextBatch.length === 0) {
    document.getElementById("sentinel").innerText =
      "မှတ်တမ်းများ အကုန်လုံး ပြသပြီးပါပြီ ❤";
    return;
  }

  nextBatch.forEach((m, idx) => {
    const globalIdx = currentIndex + idx;
    let mediaHTML = "";
    if (m.type === "image")
      mediaHTML = `<div class="media-frame"><img src="${m.src}" loading="lazy"></div>`;
    else if (m.type === "video")
      mediaHTML = `<div class="media-frame"><video src="${m.src}" autoplay muted loop playsinline></video></div>`;
    else if (m.type === "carousel") {
      mediaHTML = `<div class="carousel-container" id="carousel-${globalIdx}"><div class="carousel-track" id="track-${globalIdx}">${m.images.map((img) => `<div class="carousel-slide"><img src="${img}" loading="lazy"></div>`).join("")}</div></div>`;
    }

    const section = document.createElement("section");
    section.id = `story-${globalIdx}`;
    section.innerHTML = `
                    <div class="newspaper-card">
                        <h2 class="story-title">${m.title}</h2>
                        ${mediaHTML}
                        <p class="story-content">${m.text}</p>
                        <div class="page-number"> - ${toMyanmarNum(globalIdx + 1)} -</div>
                        <div class="story-info-bottom">${m.location}၊ ${m.date}</div>
                    </div>
                    <div style="text-align:center; margin:40px 0; font-size:24px; color:var(--accent);">❤</div>
                `;
    list.appendChild(section);
    if (m.type === "carousel") setupCarousel(globalIdx, m.images.length);
    observer.observe(section);
  });
  if (currentIndex >= allMemories.length) {
    const footer = document.querySelector("footer");
    if (footer) {
      footer.style.display = "block"; // အားလုံးပြီးမှ ပေါ်လာစေရန်
    }
    // အားလုံးပြီးသွားရင် sentinel ကို ပြန်ဖျောက်ထားလို့ရပါတယ်
    document.getElementById("sentinel").style.display = "none";
    return;
  }

  currentIndex += itemsPerPage;
}
// --- INFINITE SCROLL LOGIC ---
function setupInfiniteScroll() {
  const sentinelObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        loadMoreMemories();
      }
    },
    { threshold: 0.1 },
  );
  sentinelObserver.observe(document.getElementById("sentinel"));
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        let video = entry.target.querySelector("video");
        if (video) video.play();
      }
    });
  },
  { threshold: 0.1 },
);

// --- CAROUSEL LOGIC ---
function setupCarousel(idx, count) {
  setTimeout(() => {
    const container = document.getElementById(`carousel-${idx}`);
    if (!container) return; // Container မရှိရင် ရပ်ရန် (Error မတက်အောင်)

    const slides = container.querySelectorAll(".carousel-slide");

    // Dots ထည့်ခြင်း
    const dotsContainer = document.createElement("div");
    dotsContainer.className = "carousel-dots";
    for (let i = 0; i < count; i++) {
      const dot = document.createElement("div");
      dot.className = `dot ${i === 0 ? "active" : ""}`;
      dotsContainer.appendChild(dot);
    }
    container.appendChild(dotsContainer);
    const dots = dotsContainer.querySelectorAll(".dot");

    let curr = 0;
    let startX = 0;
    let autoRun = null; // Interval ကို သိမ်းမည့် Variable

    function updateStackedSlides() {
      slides.forEach((slide, i) => {
        slide.classList.remove("active", "next");
        dots[i].classList.remove("active");

        if (i === curr) {
          slide.classList.add("active");
          dots[i].classList.add("active");
        } else if (i === (curr + 1) % count) {
          slide.classList.add("next");
        }
      });
    }

    // Auto Slide စတင်မည့် Function
    function startAutoSlide() {
      if (autoRun) clearInterval(autoRun); // ရှိပြီးသား Interval ကို အရင်ဖျက်မယ်
      autoRun = setInterval(() => {
        curr = (curr + 1) % count;
        updateStackedSlides();
      }, 3000);
    }

    // Auto Slide ခဏရပ်မည့် Function
    function stopAutoSlide() {
      if (autoRun) clearInterval(autoRun);
    }

    // လက်နဲ့ရွေ့ဖို့ Touch Events (ဒီတစ်နေရာတည်းမှာပဲ စုချိတ်ပါမယ်)
    container.addEventListener(
      "touchstart",
      (e) => {
        startX = e.touches[0].clientX;
        stopAutoSlide(); // လက်နဲ့ ကိုင်ထားစဉ် Auto Slide ကို လှမ်းရပ်ထားမယ်
      },
      { passive: true },
    );

    container.addEventListener(
      "touchend",
      (e) => {
        let endX = e.changedTouches[0].clientX;
        let diff = startX - endX;

        if (Math.abs(diff) > 50) {
          // ၅၀ pixel ကျော်အောင် ဆွဲမှ ရွေ့မည်
          if (diff > 0) {
            // ဘယ်ဘက်ကိုဆွဲလျှင် (Next)
            curr = (curr + 1) % count;
          } else {
            // ညာဘက်ကိုဆွဲလျှင် (Prev)
            curr = (curr - 1 + count) % count;
          }
          updateStackedSlides();
        }

        startAutoSlide(); // လက်လွှတ်လိုက်တာနဲ့ Auto Slide ကို ပြန်စခိုင်းမယ်
      },
      { passive: true },
    );

    // စတင်ချိန်မှာ ပထမဆုံးပုံကို ပြရန်
    updateStackedSlides();

    // စစချင်း Auto Slide မောင်းနှင်ရန် Function ကို ခေါ်လိုက်ပါမယ်
    startAutoSlide();
  }, 500);
}

// အင်္ဂလိပ်ဂဏန်းကို မြန်မာဂဏန်းသို့ ပြောင်းပေးသော function
function toMyanmarNumber(num) {
  const myanmarNumbers = ["၀", "၁", "၂", "၃", "၄", "၅", "၆", "၇", "၈", "၉"];
  return num
    .toString()
    .split("")
    .map((d) => myanmarNumbers[d] || d)
    .join("");
}

function updateLoveCounter() {
  const startDate = new Date("2023-10-04"); // ကိုကိုတို့ စတင်ခဲ့တဲ့ရက်စွဲ
  const now = new Date();

  let years = now.getFullYear() - startDate.getFullYear();
  let months = now.getMonth() - startDate.getMonth();
  let days = now.getDate() - startDate.getDate();

  if (days < 0) {
    months--;
    const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += lastMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  let result = "";

  // မြန်မာဂဏန်းသို့ ပြောင်းလဲခြင်း
  const mmYears = toMyanmarNumber(years);
  const mmMonths = toMyanmarNumber(months);
  const mmDays = toMyanmarNumber(days);

  // ၁။ နှစ်ပတ်လည်နေ့ ဟုတ်မဟုတ် စစ်ဆေးခြင်း
  if (years > 0 && months === 0 && days === 0) {
    result = `${mmYears} နှစ်ပြည့်`;
  } else {
    // ၂။ နှစ်၊ လ၊ ရက် တွက်ချက်ခြင်း (၀ မဟုတ်မှ ပေါ်ရန်)
    let parts = [];
    if (years > 0) parts.push(`${mmYears} နှစ်`);
    if (months > 0) parts.push(`${mmMonths} လ`);
    if (days > 0) parts.push(`${mmDays} ရက်`);

    // စာသားများကို "နဲ့" ဖြင့် ချိတ်ဆက်ခြင်း
    if (parts.length > 1) {
      const lastPart = parts.pop();
      result = parts.join(" ") + " နဲ့ " + lastPart;
    } else {
      result = parts[0] || "ဒီနေ့မှစတင်သော";
    }
  }

  // HTML ထဲသို့ ထည့်ခြင်း
  const counterElem = document.getElementById("counter-text");
  if (counterElem) {
    counterElem.innerText = result;
  }
}

// Window load ဖြစ်တဲ့အခါ Login ရှိမရှိ စစ်ဆေးခြင်း
window.onload = function () {
  updateLoveCounter();
  const overlay = document.getElementById("loading-overlay");
  const pwScreen = document.getElementById("password-screen");
  const isLoggedIn = sessionStorage.getItem("isLoggedIn");

  // စစချင်း Animation ပြမယ်
  overlay.style.display = "flex";
  overlay.style.opacity = "1";

  setTimeout(() => {
    overlay.style.opacity = "0";
    setTimeout(() => {
      overlay.style.display = "none";

      // Animation ပြီးမှ Login ရှိမရှိ စစ်မယ်
      if (isLoggedIn !== "true") {
        pwScreen.style.display = "flex";
        // (Optional) PIN စရိုက်ရင် Background ကို Blur လုပ်ချင်ရင်
        // document.getElementById('main-content').style.filter = 'blur(10px)';
      } else {
        // Login ဝင်ပြီးသားဆိုရင် တန်းပြမယ်
        document.getElementById("main-content").classList.add("show");
        initWebsite();
      }
    }, 500);
  }, 2500);
};

// ပုံပေါ်မှာ context menu (Right click/Long press) ပေါ်မလာအောင် ပိတ်ခြင်း
document.addEventListener(
  "contextmenu",
  function (e) {
    if (e.target.tagName === "IMG") {
      e.preventDefault();
    }
  },
  false,
);

// ပုံကို Drag ဆွဲပြီး save တာမျိုး မရအောင် ပိတ်ခြင်း
document.addEventListener(
  "dragstart",
  function (e) {
    if (e.target.tagName === "IMG") {
      e.preventDefault();
    }
  },
  false,
);

// ပုံတွေ အားလုံးကို ဒေါင်းလုဒ်ဆွဲပြီးမှ ပြသပေးမည့် စနစ်
document.addEventListener(
  "load",
  function (event) {
    if (event.target.tagName === "IMG") {
      event.target.classList.add("loaded");
    }
  },
  true,
); // 'true' (Capturing Phase) က load event အတွက် မဖြစ်မနေ လိုအပ်ပါတယ်

// Browser ထဲမှာ ပုံက ရှိနှင့်ပြီးသား သို့မဟုတ် Cache ထဲရှိနေရင် တန်းပြရန် စစ်ဆေးခြင်း
function checkLoadedImages() {
  document.querySelectorAll("img").forEach((img) => {
    if (img.complete) {
      img.classList.add("loaded");
    }
  });
}

// ၎င်း စစ်ဆေးချက်ကို စက္ကန့်ဝက်တစ်ခါ နောက်ကွယ်ကနေ စစ်ခိုင်းထားမယ် (Memories အသစ်တွေတက်လာရင် အလုပ်လုပ်ဖို့)
setInterval(checkLoadedImages, 500);
