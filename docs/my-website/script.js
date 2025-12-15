// ナビゲーションのアクティブ状態を管理
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section');

// ナビゲーションリンクのクリックイベント
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth' });
        }

        // モバイルでサイドバーを閉じる
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('active');
        }
    });
});

// スクロールでアクティブリンク更新
function updateActiveNav() {
    let current = '';
    const scrollPosition = window.scrollY;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (scrollPosition >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

window.addEventListener('scroll', updateActiveNav);

// ページ読み込み時にもアクティブリンクを更新
window.addEventListener('load', updateActiveNav);

// モバイルメニュー切り替え
const sidebar = document.getElementById('sidebar');
let menuToggle;

function createMobileMenuToggle() {
    if (window.innerWidth <= 768 && !menuToggle) {
        menuToggle = document.createElement('button');
        menuToggle.className = 'mobile-menu-toggle';
        menuToggle.innerHTML = '☰';
        menuToggle.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            width: 50px;
            height: 50px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 50%;
            font-size: 24px;
            cursor: pointer;
            z-index: 999;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
        `;
        
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            menuToggle.innerHTML = sidebar.classList.contains('active') ? '×' : '☰';
        });
        
        document.body.appendChild(menuToggle);
    } else if (window.innerWidth > 768 && menuToggle) {
        menuToggle.remove();
        menuToggle = null;
        sidebar.classList.remove('active');
    }
}

// 初期化とリサイズ時の処理
createMobileMenuToggle();
window.addEventListener('resize', createMobileMenuToggle);

// プロジェクト詳細モーダル
const projectCards = document.querySelectorAll('.project-card');
const modal = document.getElementById('projectModal');
const modalClose = document.getElementById('modalClose');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalRole = document.getElementById('modalRole');
const modalDescription = document.getElementById('modalDescription');

const projectData = {
    1: {
        title: 'Chatly',
        role: 'プロジェクトマネージャー',
        description: 'これは、学校で答えを教え会いたいという考えから作成されたものです。Firebaseを使用して、リアルタイムで通信できるようにしました。',
        mockup: 'book'
    },
    2: {
        title: 'プロジェクト名02',
        role: 'プロジェクトマネージャー',
        description: 'これは段落です。「テキストを編集」をクリックするか、ここをダブルクリックしてテキストを追加・編集してください。また、文字の色やフォントを変更することもできます。プロジェクトの詳細な説明をここに記載します。',
        mockup: 'desktop'
    },
    3: {
        title: 'プロジェクト名03',
        role: 'プロジェクトマネージャー',
        description: 'これは段落です。「テキストを編集」をクリックするか、ここをダブルクリックしてテキストを追加・編集してください。また、文字の色やフォントを変更することもできます。プロジェクトの詳細な説明をここに記載します。',
        mockup: 'phone'
    },
    4: {
        title: 'プロジェクト名04',
        role: 'プロジェクトマネージャー',
        description: 'これは段落です。「テキストを編集」をクリックするか、ここをダブルクリックしてテキストを追加・編集してください。また、文字の色やフォントを変更することもできます。プロジェクトの詳細な説明をここに記載します。',
        mockup: 'book'
    }
};

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

// プロジェクトカードクリック
projectCards.forEach(card => {
    card.addEventListener('click', (e) => {
        e.preventDefault();
        const projectId = card.getAttribute('data-project');
        const project = projectData[projectId];
        
        if (project) {
            modalTitle.textContent = project.title;
            modalRole.textContent = project.role;
            modalDescription.textContent = project.description;
            modalImage.innerHTML = getMockupHTML(project.mockup);
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    });
});

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