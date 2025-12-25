// プロジェクト詳細モーダル
const detailButtons = document.querySelectorAll('.detail-btn');
const modal = document.getElementById('projectModal');
const modalClose = document.getElementById('modalClose');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalRole = document.getElementById('modalRole');
const modalDescription = document.getElementById('modalDescription');

const projectData = {
    1: {
        title: 'Chatly',
        role: 'メッセージングアプリ',
        description: '友達がlineに送れる機能を作っていたので、僕は、チャットアプリを作って、その機能を入れてみたいなという考えから作りました。LINEのようなリアルタイムメッセージング機能を実装し、使いやすいUIを目指しました。',
        mockup: 'book',
        period: '2025年11月 - 2025年12月',
        technologies: 'HTML, CSS, JavaScript, Firebase(Realtime Database)',
        responsibilities: 'アプリ全体の設計、通知設定、'
    },
    2: {
        title: 'Scheduler',
        role: '時間割共有アプリ',
        description: '学校の時間割を、学校のパソコンから編集でき、シームレスに家のスマホへと転送されます。クラウド同期機能により、どのデバイスからでも最新の時間割を確認できます。',
        mockup: 'desktop',
        period: '2025年12月 - 2025年12月',
        technologies: 'HTML, CSS, JavaScript, Firebase',
        responsibilities: 'フロントエンド開発、データ同期機能の実装'
    },
    3: {
        title: 'Useful-apps',
        role: '生活に便利なアプリ配布',
        description: 'タイマーや計算機、図形の面積計算など、生活にあったら便利なものを作成したので、ここで共有します。日常生活で使える実用的なツールを集めたアプリケーション集です。Macbookの操作感やUIなどにしました。',
        mockup: 'phone',
        period: '2025年12月 - 現在',
        technologies: 'HTML, CSS, JavaScript',
        responsibilities: '複数の便利ツールの開発、UI設計'
    }
};

// モーダル要素の取得に追加
const modalPeriod = document.getElementById('modalPeriod');
const modalTechnologies = document.getElementById('modalTechnologies');
const modalResponsibilities = document.getElementById('modalResponsibilities');

// 詳細ボタンのクリックイベント内で更新
detailButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const card = btn.closest('.project-card');
        const projectId = card.getAttribute('data-project');
        const project = projectData[projectId];

        if (project) {
            modalTitle.textContent = project.title;
            modalRole.textContent = project.role;
            modalDescription.textContent = project.description;
            modalImage.innerHTML = getMockupHTML(project.mockup);

            // 詳細情報を更新
            modalPeriod.textContent = project.period;
            modalTechnologies.textContent = project.technologies;
            modalResponsibilities.textContent = project.responsibilities;

            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    });
});

// モックアップHTML生成
function getMockupHTML(type) {
    if (type === 'book') {
        return '<div class="mockup-book"></div>';
    } else if (type === 'desktop') {
        return `<div class="mockup-desktop">
            <div class="mockup-desktop-content">
                <div>POP</div>
                <div style="font-size: 20px; margin-top: -5px;">Up</div>
            </div>
        </div>`;
    } else if (type === 'phone') {
        return `<div class="mockup-phone">
            <div class="mockup-phone-screen"></div>
            <div class="mockup-phone-text">SAMSU</div>
        </div>`;
    }
}

// モーダルを閉じる
function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// ESCキーでモーダルを閉じる
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
    }
});

// 作成したプロジェクトへ行くボタン
const projectButtons = document.querySelectorAll('.btn-project');

projectButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation(); // カードへのイベント伝播を防ぐ
        // リンクは通常通り動作する(preventDefaultしない)
    });
});