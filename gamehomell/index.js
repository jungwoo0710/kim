document.getElementById("loginForm").addEventListener("submit", function(event) {
    event.preventDefault(); // 기본 제출 동작 방지

    const id = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // 간단한 ID/PW 검증 (예제 ID: user, 비밀번호: 1234)
    if (id === "admin" && password === "admin12345") {
        alert("로그인 성공!");
        window.location.href = "login.html"; // 로그인 후 이동할 페이지
    } else {
        alert("ID 또는 비밀번호가 올바르지 않습니다.");
    }
});
