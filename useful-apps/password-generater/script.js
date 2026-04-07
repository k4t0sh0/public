function generatePasswordSet() {
    const charsets = [
        { id: "uppercase", chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ" },
        { id: "lowercase", chars: "abcdefghijklmnopqrstuvwxyz" },
        { id: "numbers", chars: "1234567890" },
        { id: "symbols", chars: "!@#$%^&*()-_=+[]{};:,.<>?/|" }
    ];

    let charset = "";
    let selectedCharsets = [];

    for (const cs of charsets) {
        const checkbox = document.getElementById(cs.id);
        if (checkbox.checked) {
            charset += cs.chars;
            selectedCharsets.push(cs.chars);
        }
    }

    const lengthValue = parseInt(document.getElementById("length").value);
    const countValue = parseInt(document.getElementById("count").value);
    const resultList = document.getElementById("resultList");
    resultList.innerHTML = "";

    if (isNaN(lengthValue) || lengthValue < 4 || lengthValue > 64) {
        resultList.innerHTML = "<li>文字数は4〜64の数字を入力してください</li>";
        return;
    }

    if (isNaN(countValue) || countValue < 1 || countValue > 20) {
        resultList.innerHTML = "<li>生成数は1〜20の間で指定してください</li>";
        return;
    }

    if (charset === "") {
        resultList.innerHTML = "<li>1つ以上チェックをしてください</li>";
        return;
    }

    for (let j = 0; j < countValue; j++) {
        let password = "";

        // 各種1文字ずつ
        for (const s of selectedCharsets) {
            const rand = Math.floor(Math.random() * s.length);
            password += s[rand];
        }

        // 残りをランダムに追加
        for (let i = password.length; i < lengthValue; i++) {
            const rand = Math.floor(Math.random() * charset.length);
            password += charset[rand];
        }

        // シャッフル
        const shuffled = password.split('').sort(() => 0.5 - Math.random()).join('');

        // 表示＆ボタン追加
        const li = document.createElement("li");
        const span = document.createElement("span");
        span.textContent = shuffled;

        const button = document.createElement("button");
        button.textContent = "コピー";
        button.className = "inline-copy";
        button.addEventListener("click", () => {
            navigator.clipboard.writeText(shuffled).then(() => {
                alert(`「${shuffled}」をコピーしました。`);
            });
        });

        li.appendChild(span);
        li.appendChild(button);
        resultList.appendChild(li);
    }
}

document.getElementById("generate").addEventListener("click", generatePasswordSet);

document.getElementById("btn").addEventListener("click", () => {
    const results = document.querySelectorAll("#resultList li span");
    const all = Array.from(results).map(span => span.textContent).join("\n");

    navigator.clipboard.writeText(all).then(
        () => alert("すべてコピーしました。"),
        () => alert("コピーに失敗しました。")
    );
});