const database = firebase.database();
const dataRef = database.ref('schoolSchedule');
const auth = firebase.auth();
let currentUser = null;
let isAnonymous = false;
//現在の曜日のデータとして参照
let scheduleData = [];
let itemsData = [];
let eventData = '';

// script.js の冒頭部分を変更
let currentDay = 'monday'; // 現在選択中の曜日を追跡
let allScheduleData = {
    monday: { schedule: [], items: [], event: '' },
    tuesday: { schedule: [], items: [], event: '' },
    wednesday: { schedule: [], items: [], event: '' },
    thursday: { schedule: [], items: [], event: '' },
    friday: { schedule: [], items: [], event: '' }
};

const SUBJECT_LIST = [
    '国語', '数学', '英語', '理科', '社会', '体育',
    '音楽', '美術', '技術', '家庭科', '総合', '学活', '委員会', 'なし'
];

const SUBJECT_COLORS = {
    '国語': '#fdecea',        // パステル赤
    '数学': '#e3f2fd',        // パステル青
    '英語': '#ede7f6',        // パステル紫
    '理科': '#e8f5e9',        // パステル緑
    '社会': '#fff3e0',        // パステル橙
    '体育': '#fffde7',        // パステル黄
    '音楽': '#fce4ec',        // パステルピンク
    '美術': '#fbe9e7',        // 赤〜橙（赤紫寄り）
    '技術': '#ffe0b2',        // オレンジ
    '家庭科': '#ffe0b2',      // オレンジ
    '総合': '#e1f5fe',        // 水色
    '学活': '#e1f5fe',        // 水色
    '委員会': '#f1f8e9',      // 黄緑
    'なし': '#ffffff'
};





function init() {
    // 認証状態の監視
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            isAnonymous = user.isAnonymous;
            showApp();
            loadData();
        } else {
            showAuth();
        }
    });
}

function loadData() {
    if (!currentUser) return;

    const dataRef = database.ref('schoolSchedule/shared');

    dataRef.once('value', (snapshot) => {
        const data = snapshot.val();

        if (data && data.monday) {
            // 新しい曜日別構造
            allScheduleData = data;
        } else if (data && data.schedule) {
            // 古い構造からの移行
            const defaultData = {
                schedule: data.schedule || [],
                items: data.items || [],
                event: data.event || ''
            };
            // 全曜日に同じデータをコピー
            ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
                allScheduleData[day] = JSON.parse(JSON.stringify(defaultData));
            });
            if (!isAnonymous) {
                // 新構造で保存
                database.ref('schoolSchedule/shared').set(allScheduleData);
            }
        } else {
            // 完全に新規の場合
            initializeDefaultData();
            // ↓ この行を追加（匿名でなければ保存）
            if (!isAnonymous) {
                database.ref('schoolSchedule/shared').set(allScheduleData);
            }
        }

        loadCurrentDayData();
        renderAll();
    });

    // リアルタイム更新
    dataRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data && data.monday) {
            allScheduleData = data;
            loadCurrentDayData();
            renderAll();
        }
    });
}

// デフォルトデータの初期化
function initializeDefaultData() {
    const defaultSchedule = [
        { period: 1, subject: '国語', description: '漢字テスト、物語文' },
        { period: 2, subject: '算数', description: '分数のかけ算' },
        { period: 3, subject: '理科', description: '植物の観察' },
        { period: 4, subject: '社会', description: '日本の歴史' },
        { period: 5, subject: '体育', description: 'マット運動' },
        { period: 6, subject: '音楽', description: 'リコーダー' }
    ];
    const defaultItems = ['教科書', 'ノート', '筆記用具', '体育着', 'リコーダー', '給食セット'];
    const defaultEvent = '明日は通常授業です。';

    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
        allScheduleData[day] = {
            schedule: JSON.parse(JSON.stringify(defaultSchedule)),
            items: [...defaultItems],
            event: defaultEvent
        };
    });
}

// 現在の曜日のデータを読み込む
// 現在の曜日のデータを読み込む
function loadCurrentDayData() {
    // ディープコピーで完全に独立させる
    scheduleData = JSON.parse(JSON.stringify(allScheduleData[currentDay].schedule));
    itemsData = Array.isArray(allScheduleData[currentDay].items)
        ? [...allScheduleData[currentDay].items]
        : [];

    eventData = allScheduleData[currentDay].event;
}

// 曜日切り替え
function switchDay(day) {
    // 切り替え前に現在の曜日のデータを保存
    allScheduleData[currentDay] = {
        schedule: scheduleData,
        items: itemsData,
        event: eventData
    };

    currentDay = day;

    // ボタンのアクティブ状態を更新
    document.querySelectorAll('.day-btn').forEach(btn => {
        btn.classList.remove('active');
        // クリックされたボタンにactiveを追加
        if (btn.textContent === getDayText(day)) {
            btn.classList.add('active');
        }
    });

    loadCurrentDayData();
    renderAll();
}

// 曜日名を取得するヘルパー関数
function getDayText(day) {
    const dayMap = {
        'monday': '月',
        'tuesday': '火',
        'wednesday': '水',
        'thursday': '木',
        'friday': '金'
    };
    return dayMap[day];
}

// 全体を再描画
function renderAll() {
    renderSchedule();
    renderItems();
    renderEvent();
}

// ログイン画面表示
function showAuth() {
    document.getElementById('authScreen').style.display = 'block';
    document.getElementById('appScreen').style.display = 'none';
}

// アプリ画面表示
function showApp() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('appScreen').style.display = 'block';
    updateUserStatus();
    displayDate();
    updateUIForPermissions();
}

// ユーザーステータス表示
function updateUserStatus() {
    const status = document.getElementById('userStatus');
    if (isAnonymous) {
        status.textContent = '👤 匿名ユーザー（閲覧のみ）';
    } else {
        status.textContent = `📧 ${currentUser.email}`;
    }
}

function updateUIForPermissions() {

    // 少し待ってから取得
    setTimeout(() => {
        const editButtons = document.querySelectorAll('.edit-btn');
        const emailBtn = document.getElementById('emailBtn');

        console.log('編集ボタン数:', editButtons.length); // デバッグ用

        if (isAnonymous) {
            editButtons.forEach(btn => {
                btn.disabled = false;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            });

            if (emailBtn) {
                emailBtn.disabled = false;
                emailBtn.style.opacity = '0.5';
                emailBtn.style.cursor = 'not-allowed';
            }
        }

        const dayButtons = document.querySelectorAll('.day-btn'); // 追加

        if (isAnonymous) {
            // 編集ボタンを無効化
            editButtons.forEach(btn => {
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            });

            // 曜日ボタンは閲覧可能(無効化しない) - 追加
            dayButtons.forEach(btn => {
                btn.disabled = false;
            });

            // メールボタンを無効化
            if (emailBtn) {
                emailBtn.disabled = true;
                emailBtn.style.opacity = '0.5';
                emailBtn.style.cursor = 'not-allowed';
            }
        }

        // ↓ ここから下は既存のコードをそのまま残す ↓

        // 既存の通知を削除してから追加(重複防止)
        const existingNotice = document.querySelector('.readonly-notice');
        if (existingNotice) {
            existingNotice.remove();
        }

        if (isAnonymous) {
            const notice = document.createElement('div');
            notice.className = 'readonly-notice';
            notice.innerHTML = '<span>📖</span><span>閲覧専用モードです。編集するにはアカウント登録してください。</span>';

            const leftColumn = document.querySelector('.left-column');
            if (leftColumn && leftColumn.firstChild) {
                leftColumn.insertBefore(notice, leftColumn.firstChild);
            }
        }
    }, 100);
}
// ログイン（メール確認チェック付き）
// ログイン（メール確認チェック付き）
async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('authError');

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // 最新情報を取得
        await user.reload();

        // メール確認済みかチェック
        if (!user.emailVerified) {
            // 未確認の場合、ログアウトして確認待ち画面へ
            // パスワードを一時保存（再送信用）
            document.getElementById('registerPassword').value = password;
            document.getElementById('verificationEmail').textContent = email;
            showEmailVerification();
            await auth.signOut();

            const messageDiv = document.getElementById('verificationMessage');
            messageDiv.textContent = 'メールアドレスが確認されていません。確認メールをご確認ください。';
            messageDiv.className = 'info-message error-message';
            return;
        }

        // 確認済みならそのままログイン
        errorDiv.textContent = '';

    } catch (error) {
        errorDiv.textContent = getErrorMessage(error.code);
    }
}

// フォーム切り替え
function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('emailVerificationForm').style.display = 'none';
    document.getElementById('authError').textContent = '';
    document.getElementById('divider').style.display = 'block';
    document.getElementById('anonymousBtn').style.display = 'block';
}

function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('emailVerificationForm').style.display = 'none';
    document.getElementById('authError').textContent = '';
    document.getElementById('divider').style.display = 'block';
    document.getElementById('anonymousBtn').style.display = 'block';
}

function showEmailVerification() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('emailVerificationForm').style.display = 'block';
    document.getElementById('divider').style.display = 'none';
    document.getElementById('anonymousBtn').style.display = 'none';
    document.getElementById('authError').textContent = '';
}

// 新規登録（メール確認付き）
async function register() {
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const errorDiv = document.getElementById('authError');

    try {
        // ユーザー作成
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // 確認メールを送信
        await user.sendEmailVerification();

        // 確認待ち画面を表示
        document.getElementById('verificationEmail').textContent = email;
        // パスワードは既に入力済みなので保持される
        showEmailVerification();
        errorDiv.textContent = '';

        // いったんログアウト（確認前はログインさせない）
        await auth.signOut();

    } catch (error) {
        errorDiv.textContent = getErrorMessage(error.code);
    }
}

// 確認メールを再送信
async function resendVerificationEmail() {
    const email = document.getElementById('verificationEmail').textContent;
    const password = document.getElementById('registerPassword').value;
    const messageDiv = document.getElementById('verificationMessage');

    try {
        // 一時的にログインして再送信
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        await userCredential.user.sendEmailVerification();
        await auth.signOut();

        messageDiv.textContent = '✓ 確認メールを再送信しました';
        messageDiv.className = 'info-message success-message';

        setTimeout(() => {
            messageDiv.textContent = '';
        }, 3000);

    } catch (error) {
        messageDiv.textContent = 'エラー: ' + getErrorMessage(error.code);
        messageDiv.className = 'info-message error-message';
    }
}

// メール確認済みかチェックしてログイン
// メール確認済みかチェックしてログイン
async function checkEmailVerified() {
    const email = document.getElementById('verificationEmail').textContent;
    const password = document.getElementById('registerPassword').value;
    const messageDiv = document.getElementById('verificationMessage');

    if (!password) {
        messageDiv.textContent = 'パスワードが見つかりません。ログイン画面から再度お試しください。';
        messageDiv.className = 'info-message error-message';
        return;
    }

    try {
        // ログインしてユーザー情報を取得
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // 最新の情報を取得
        await user.reload();

        if (user.emailVerified) {
            // 確認済み → そのままログイン
            messageDiv.textContent = '✓ メール確認が完了しました！';
            messageDiv.className = 'info-message success-message';
            // onAuthStateChangedが自動でアプリ画面を表示
        } else {
            // 未確認 → ログアウト
            await auth.signOut();
            messageDiv.textContent = 'まだメールが確認されていません。メール内のリンクをクリックしてください。';
            messageDiv.className = 'info-message error-message';
        }

    } catch (error) {
        messageDiv.textContent = 'エラー: ' + getErrorMessage(error.code);
        messageDiv.className = 'info-message error-message';
    }
}

// ログイン画面に戻る
function backToLogin() {
    document.getElementById('emailVerificationForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('verificationMessage').textContent = '';
    document.getElementById('authError').textContent = '';
}

// 匿名ログイン
async function anonymousLogin() {
    const errorDiv = document.getElementById('authError');
    try {
        await auth.signInAnonymously();
        errorDiv.textContent = '';
    } catch (error) {
        errorDiv.textContent = 'ログインに失敗しました';
    }
}

// ログアウト
async function logout() {
    try {
        await auth.signOut();
    } catch (error) {
        alert('ログアウトに失敗しました');
    }
}


// エラーメッセージ
function getErrorMessage(code) {
    switch (code) {
        case 'auth/invalid-email':
            return 'メールアドレスの形式が正しくありません';
        case 'auth/user-not-found':
            return 'ユーザーが見つかりません';
        case 'auth/wrong-password':
            return 'パスワードが間違っています';
        case 'auth/email-already-in-use':
            return 'このメールアドレスは既に使用されています';
        case 'auth/weak-password':
            return 'パスワードは6文字以上で設定してください';
        case 'auth/too-many-requests':
            return '試行回数が多すぎます。しばらくしてからお試しください';
        case 'auth/network-request-failed':
            return 'ネットワークエラーが発生しました';
        default:
            return 'エラーが発生しました: ' + code;
    }
}

// 日付表示
function displayDate() {
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    document.getElementById('dateDisplay').textContent = today.toLocaleDateString('ja-JP', options);
}

// データ保存
function saveData() {
    if (isAnonymous) {
        alert('匿名ユーザーは編集できません。アカウント登録してください。');
        return;
    }

    // 現在の曜日のデータを更新
    allScheduleData[currentDay] = {
        schedule: scheduleData,
        items: itemsData,
        event: eventData
    };

    // 全曜日分を保存
    database.ref('schoolSchedule/shared').set(allScheduleData)
        .then(() => console.log('保存成功'))
        .catch((error) => {
            console.error('保存失敗:', error);
            alert('保存に失敗しました');
        });
}

// スケジュール表示
function renderSchedule() {
    const container = document.getElementById('scheduleList');

    container.innerHTML = scheduleData.map(period => {
        const bgColor = SUBJECT_COLORS[period.subject] || '#ffffff';

        return `
            <div class="period-card" style="background:${bgColor}">
                <div class="period-number">${period.period}時間目</div>
                <div class="subject">${period.subject}</div>
                <div class="description">${period.description}</div>
            </div>
        `;
    }).join('');
}


// 持ち物表示
function renderItems() {
    const container = document.getElementById('itemsList');
    container.innerHTML = itemsData.map(item => `<li>${item}</li>`).join('');
}

// 明日の予定表示
function renderEvent() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const month = tomorrow.getMonth() + 1;
    const date = tomorrow.getDate();

    document.getElementById('eventBox').innerHTML =
        `<strong>📅 ${month}月${date}日の予定</strong><br>${eventData}`;
}

function openScheduleModal() {
    const form = document.getElementById('scheduleForm');

    form.innerHTML = `
        <div class="schedule-edit-grid">
        ${scheduleData.map((period, index) => `
            <div class="form-group">
                <label>${period.period}時間目</label>

                <select id="subject${index}"
                    style="background:${SUBJECT_COLORS[period.subject] || '#fff'}"
                    onchange="this.style.backgroundColor = SUBJECT_COLORS[this.value]">
                    ${SUBJECT_LIST.map(sub =>
        `<option value="${sub}" ${sub === period.subject ? 'selected' : ''}>${sub}</option>`
    ).join('')}
                </select>

                <input type="text"
                    id="desc${index}"
                    value="${period.description}"
                    style="margin-top:6px;">
            </div>
        `).join('')}
        </div>
    `;

    document.getElementById('scheduleModal').style.display = 'flex';
}



// 持ち物編集モーダルを開く
function openItemsModal() {
    document.getElementById('itemsInput').value = itemsData.join('\n');
    document.getElementById('itemsModal').style.display = 'flex';
}

// 明日の予定編集モーダルを開く
function openEventModal() {
    document.getElementById('eventInput').value = eventData;
    document.getElementById('eventModal').style.display = 'flex';
}

// モーダルを閉じる
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// スケジュール保存
function saveSchedule() {
    if (isAnonymous) {
        alert('匿名ユーザーは編集できません');
        return;
    }
    scheduleData = scheduleData.map((period, index) => ({
        period: period.period,
        subject: document.getElementById(`subject${index}`).value,
        description: document.getElementById(`desc${index}`).value
    }));
    saveData();
    renderSchedule();
    closeModal('scheduleModal');
}

// 持ち物保存
function saveItems() {
    if (isAnonymous) {
        alert('匿名ユーザーは編集できません');
        return;
    }
    const input = document.getElementById('itemsInput').value;
    itemsData = input.split('\n').filter(item => item.trim() !== '');
    saveData();
    renderItems();
    closeModal('itemsModal');
}

// 明日の予定保存
function saveEvent() {
    if (isAnonymous) {
        alert('匿名ユーザーは編集できません');
        return;
    }
    eventData = document.getElementById('eventInput').value;
    saveData();
    renderEvent();
    closeModal('eventModal');
}

// モーダル外クリックで閉じる
window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

function openAllBulkModal() {
    const body = document.querySelector('#allBulkModal .modal-body');

    body.innerHTML = `
        <div class="form-group">
            <label>📖 時間割（選択式）</label>
            ${scheduleData.map((p, i) => `
                <div style="display:flex; gap:8px; margin-bottom:6px;">
                    <span style="width:50px">${p.period}限</span>
                    <select id="bulkSubject${i}"
                        style="flex:1; background:${SUBJECT_COLORS[p.subject] || '#fff'}"
                        onchange="this.style.backgroundColor = SUBJECT_COLORS[this.value]">
                        ${SUBJECT_LIST.map(sub =>
        `<option value="${sub}" ${sub === p.subject ? 'selected' : ''}>${sub}</option>`
    ).join('')}
                    </select>
                    <input type="text" id="bulkDesc${i}" value="${p.description}" style="flex:2;">
                </div>
            `).join('')}
        </div>

        <div class="form-group">
            <label>🎒 持ち物</label>
            <textarea id="bulkItemsInput" rows="5">${itemsData.join('\n')}</textarea>
        </div>

        <div class="form-group">
            <label>🗓️ 明日の予定</label>
            <textarea id="bulkEventInput" rows="4">${eventData}</textarea>
        </div>
    `;

    document.getElementById('allBulkModal').style.display = 'flex';
}


function saveAllBulk() {
    if (isAnonymous) {
        alert('匿名ユーザーは編集できません');
        return;
    }

    scheduleData = scheduleData.map((p, i) => ({
        period: p.period,
        subject: document.getElementById(`bulkSubject${i}`).value,
        description: document.getElementById(`bulkDesc${i}`).value
    }));

    itemsData = document.getElementById('bulkItemsInput').value
        .split('\n')
        .map(i => i.trim())
        .filter(i => i !== '');


    eventData = document.getElementById('bulkEventInput').value;

    saveData();
    renderAll();
    closeModal('allBulkModal');
}


function sendEmail() {
    if (isAnonymous) {
        alert('メール送信にはアカウント登録が必要です');
        return;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const month = tomorrow.getMonth() + 1;
    const date = tomorrow.getDate();

    const toEmail = 'mail.jouto@icloud.com';
    const subject = encodeURIComponent('2-2');
    const body = encodeURIComponent(
        `※これは自動送信です。\n` +
        `【${month}月${date}日の予定】\n\n` +
        `【時間割】\n` +
        scheduleData.map(p => `${p.period}時間目: ${p.subject} - ${p.description}`).join('\n') +
        `\n\n【持ち物】\n` +
        itemsData.map(item => `・${item}`).join('\n') +
        `\n\n【明日の予定】\n${eventData}`
    );

    window.location.href = `mailto:${toEmail}?subject=${subject}&body=${body}`;
}
// 初期化実行
init();