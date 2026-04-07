let isPaused = false;
let workTime = 20;
let restTime = 10;
let isWorking = true;
let timerId = null;
let endTime = null;
const beep = document.getElementById("beep");

// beep変数の宣言の後に追加
window.addEventListener('DOMContentLoaded', () => {
    const initialWorkTime = getTimeFromInputs("workMin", "workSec");
    updateDisplay(initialWorkTime);
});

/* --- 追加：全画面表示の切り替え機能 --- */
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log("全画面表示への切り替えに失敗しました。");
        });
    } else {
        document.exitFullscreen();
    }
}

function startTimer() {
    if (timerId !== null) return;

    // ストップからの再開か?
    if (isPaused && savedRemaining > 0) {
        isPaused = false;

        // 保存していた残り時間から再開
        endTime = Date.now() + savedRemaining * 1000;

        document.getElementById("status").textContent = isWorking ? "勉強中!" : "休憩中…";

        // 背景色を復元
        const container = document.querySelector('.glass-container');
        container.style.background = isWorking
            ? "rgba(215, 255, 217, 0.25)"
            : "rgba(208, 236, 255, 0.25)";
        container.style.backdropFilter = "blur(20px) saturate(180%)";

        timerId = setInterval(tick, 200);
        return;
    }

    // 通常スタート
    workTime = getTimeFromInputs("workMin", "workSec");
    restTime = getTimeFromInputs("restMin", "restSec");

    isWorking = true;
    endTime = null; // ← この行を追加
    setMode(workTime);

    isPaused = false;
    timerId = setInterval(tick, 200);
}

function setMode(duration) {
    endTime = Date.now() + duration * 1000;
    beep.play();

    const status = document.getElementById("status");
    status.textContent = isWorking ? "勉強中!" : "休憩中…";

    const container = document.querySelector('.glass-container');
    container.style.background = isWorking
        ? "rgba(215, 255, 217, 0.25)"
        : "rgba(208, 236, 255, 0.25)";
    container.style.backdropFilter = "blur(20px) saturate(180%)";

    status.style.color = "white";
}

function resetTimer() {
    stopTimer();
    isPaused = false;
    endTime = null;
    savedRemaining = 0;

    const resetWorkTime = getTimeFromInputs("workMin", "workSec");
    restTime = getTimeFromInputs("restMin", "restSec");
    isWorking = true;

    document.getElementById("status").textContent = "リセット済み";
    updateDisplay(resetWorkTime);
}

// リセット時の背景色（元の色に戻す）
const container = document.querySelector('.glass-container');
container.style.background = "rgba(255, 255, 255, 0.15)";
container.style.backdropFilter = "blur(20px) saturate(180%)";

function tick() {
    let remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));
    updateDisplay(remaining);

    if (remaining <= 0) {
        isWorking = !isWorking;
        setMode(isWorking ? workTime : restTime);
    }
}

// 修正後
function updateDisplay(seconds) {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    const timeString = `${m}:${s}`;

    const timerElement = document.getElementById("timer");
    const spans = timerElement.querySelectorAll('span');

    // 初回または要素数が違う場合は全体を作成
    if (spans.length !== timeString.length) {
        timerElement.innerHTML = timeString
            .split('')
            .map(char => `<span>${char}</span>`)
            .join('');
    } else {
        // 各spanのテキストだけを個別に更新（アニメーション継続）
        timeString.split('').forEach((char, index) => {
            if (spans[index].textContent !== char) {
                spans[index].textContent = char;
            }
        });
    }
}

function stopTimer() {
    if (timerId === null) return;

    clearInterval(timerId);
    timerId = null;
    isPaused = true;

    // 残り時間を保存
    savedRemaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));

    const status = document.getElementById("status");
    status.textContent = "ストップ中";

    // ストップ中の背景色（グレー系）
    const container = document.querySelector('.glass-container');
    container.style.background = "rgba(200, 200, 200, 0.25)";
    container.style.backdropFilter = "blur(20px) saturate(180%)";
}

function getTimeFromInputs(minId, secId) {
    const minutes = parseInt(document.getElementById(minId).value || "0", 10);
    const seconds = parseInt(document.getElementById(secId).value || "0", 10);
    return (isNaN(minutes) ? 0 : minutes) * 60 + (isNaN(seconds) ? 0 : seconds);
}
