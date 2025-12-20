const database = firebase.database();
const dataRef = database.ref('schoolSchedule');
const auth = firebase.auth();
let currentUser = null;
let isAnonymous = false;
let scheduleData = [];
let itemsData = [];
let eventData = '';

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

// 権限に応じてUIを更新
// 権限に応じてUIを更新
function updateUIForPermissions() {
    const editButtons = document.querySelectorAll('.edit-btn');
    const emailBtn = document.getElementById('emailBtn');

    editButtons.forEach(btn => {
        if (isAnonymous) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        }
    });

    if (emailBtn && isAnonymous) {
        emailBtn.disabled = true;
        emailBtn.style.opacity = '0.5';
        emailBtn.style.cursor = 'not-allowed';
    }

    // 既存の通知を削除してから追加（重複防止）
    const existingNotice = document.querySelector('.readonly-notice');
    if (existingNotice) {
        existingNotice.remove();
    }

    if (isAnonymous) {
        const notice = document.createElement('div');
        notice.className = 'readonly-notice';
        notice.innerHTML = '<span>📖</span><span>閲覧専用モードです。編集するにはアカウント登録してください。</span>';

        // left-columnの最初に追加
        const leftColumn = document.querySelector('.left-column');
        if (leftColumn && leftColumn.firstChild) {
            leftColumn.insertBefore(notice, leftColumn.firstChild);
        }
    }
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

function loadData() {
    if (!currentUser) return;

    // 共有データを読み込む（全員が閲覧可能）
    const dataRef = database.ref('schoolSchedule/shared');

    dataRef.once('value', (snapshot) => {  // ← 'on' を 'once' に変更
        const data = snapshot.val();
        if (data) {
            scheduleData = data.schedule || [];
            itemsData = data.items || [];
            eventData = data.event || '';
        } else {
            // デフォルトデータ
            scheduleData = [
                { period: 1, subject: '国語', description: '漢字テスト、物語文' },
                { period: 2, subject: '算数', description: '分数のかけ算' },
                { period: 3, subject: '理科', description: '植物の観察' },
                { period: 4, subject: '社会', description: '日本の歴史' },
                { period: 5, subject: '体育', description: 'マット運動' },
                { period: 6, subject: '音楽', description: 'リコーダー' }
            ];
            itemsData = ['教科書', 'ノート', '筆記用具', '体育着', 'リコーダー', '給食セット'];
            eventData = '明日は通常授業です。';

            if (!isAnonymous) {
                saveData();
            }
        }
        renderSchedule();
        renderItems();
        renderEvent();
    });

    // リアルタイム更新を監視（ループを防ぐため、saveDataは呼ばない）
    dataRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            scheduleData = data.schedule || [];
            itemsData = data.items || [];
            eventData = data.event || '';
            renderSchedule();
            renderItems();
            renderEvent();
        }
    });
}

// データ保存
function saveData() {
    if (isAnonymous) {
        alert('匿名ユーザーは編集できません。アカウント登録してください。');
        return;
    }

    const data = {
        schedule: scheduleData,
        items: itemsData,
        event: eventData
    };

    database.ref('schoolSchedule/shared').set(data)
        .then(() => console.log('保存成功'))
        .catch((error) => {
            console.error('保存失敗:', error);
            alert('保存に失敗しました');
        });
}

// スケジュール表示
function renderSchedule() {
    const container = document.getElementById('scheduleList');
    container.innerHTML = scheduleData.map(period => `
                <div class="period-card">
                    <div class="period-number">${period.period}時間目</div>
                    <div class="subject">${period.subject}</div>
                    <div class="description">${period.description}</div>
                </div>
            `).join('');
}

// 持ち物表示
function renderItems() {
    const container = document.getElementById('itemsList');
    container.innerHTML = itemsData.map(item => `<li>${item}</li>`).join('');
}

// 明日の予定表示
function renderEvent() {
    document.getElementById('eventBox').innerHTML = `<strong>📅 明日</strong>${eventData}`;
}

// スケジュール編集モーダルを開く
function openScheduleModal() {
    const form = document.getElementById('scheduleForm');
    // openScheduleModal() 内
    form.innerHTML = `
<div class="schedule-edit-grid">
${scheduleData.map((period, index) => `
    <div class="form-group">
        <label>${period.period}時間目</label>
        <input type="text" id="subject${index}" value="${period.subject}">
        <input type="text" id="desc${index}" value="${period.description}" style="margin-top:6px;">
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

    // 時間割
    document.getElementById('bulkScheduleInput').value =
        scheduleData.map(p =>
            `${p.period}限 ${p.subject} ${p.description}`
        ).join('\n');

    // 持ち物
    document.getElementById('bulkItemsInput').value =
        itemsData.join('\n');

    // 明日の予定
    document.getElementById('bulkEventInput').value =
        eventData;

    document.getElementById('allBulkModal').style.display = 'flex';
}

function saveAllBulk() {
    if (isAnonymous) {
        alert('匿名ユーザーは編集できません');
        return;
    }

    /* ===== 時間割 ===== */
    const scheduleLines =
        document.getElementById('bulkScheduleInput').value
            .split('\n')
            .filter(l => l.trim() !== '');

    scheduleData = scheduleLines.map((line, index) => {
        const parts = line.split(' ');
        return {
            period: index + 1,
            subject: parts[1] || '',
            description: parts.slice(2).join(' ') || ''
        };
    });

    /* ===== 持ち物 ===== */
    itemsData =
        document.getElementById('bulkItemsInput').value
            .split('\n')
            .filter(i => i.trim() !== '');

    /* ===== 明日の予定 ===== */
    eventData =
        document.getElementById('bulkEventInput').value;

    saveData();
    renderSchedule();
    renderItems();
    renderEvent();
    closeModal('allBulkModal');
}

function sendEmail() {
    if (isAnonymous) {
        alert('メール送信にはアカウント登録が必要です');
        return;
    }

    const toEmail = 'mail.jouto@icloud.com'

    const subject = encodeURIComponent('2-2');
    const body = encodeURIComponent(
        `※これは自動送信です。` +
        `📚 学校スケジュール\n\n` +
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