const rankingData = [
    { rank: 5, nickname: "Player5", level: 95 },
    { rank: 6, nickname: "Player6", level: 94 },
    { rank: 7, nickname: "Player7", level: 93 },
    { rank: 8, nickname: "Player8", level: 92 },
    { rank: 9, nickname: "Player9", level: 91 },
    { rank: 10, nickname: "Player10", level: 90 },
    { rank: 11, nickname: "Player11", level: 89 },
    { rank: 12, nickname: "Player12", level: 88 },
    { rank: 13, nickname: "Player13", level: 87 },
    { rank: 14, nickname: "Player14", level: 86 },
    { rank: 15, nickname: "Player15", level: 85 },
    { rank: 16, nickname: "Player16", level: 84 },
    { rank: 17, nickname: "Player17", level: 83 },
    { rank: 18, nickname: "Player18", level: 82 },
    { rank: 19, nickname: "Player19", level: 81 },
    { rank: 20, nickname: "Player20", level: 80 },
    { rank: 21, nickname: "Player21", level: 79 },
    { rank: 22, nickname: "Player22", level: 78 },
    { rank: 23, nickname: "Player23", level: 77 },
    { rank: 24, nickname: "Player24", level: 76 },
    { rank: 25, nickname: "Player25", level: 75 },
    { rank: 26, nickname: "Player26", level: 74 },
    { rank: 27, nickname: "Player27", level: 73 },
    { rank: 28, nickname: "Player28", level: 72 },
    { rank: 29, nickname: "Player29", level: 71 },
    { rank: 30, nickname: "Player30", level: 70 }
];

const rankingBody = document.getElementById("ranking-body");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

let currentPage = 0;
const itemsPerPage = 20;

// 랭킹 데이터 표시
function displayRanking() {
    rankingBody.innerHTML = "";
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedData = rankingData.slice(start, end);

    paginatedData.forEach(player => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${player.rank}</td>
            <td>${player.nickname}</td>
            <td>${player.level}</td>
        `;
        rankingBody.appendChild(row);
    });

    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = end >= rankingData.length;
}

// 이전 목록 버튼
prevBtn.addEventListener("click", () => {
    if (currentPage > 0) {
        currentPage--;
        displayRanking();
    }
});

// 다음 목록 버튼
nextBtn.addEventListener("click", () => {
    if ((currentPage + 1) * itemsPerPage < rankingData.length) {
        currentPage++;
        displayRanking();
    }
});

// 초기 실행
displayRanking();
