// game.js (1/5) - 기본 설정 및 로그인 처리

const socket = io();
const gameContainer = document.getElementById('game-container');
const loginContainer = document.getElementById('login-container');
const nicknameInput = document.getElementById('nickname-input');
const classSelect = document.getElementById('class-select');
const startButton = document.getElementById('start-button');
const chatContainer = document.getElementById('chat-container');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');

let players = {};
let localPlayer;
let isChatFocused = false;

let playerData = {
  id: null,
  x: Math.random() * window.innerWidth,
  y: Math.random() * window.innerHeight,
  speed: 2,
  nickname: '',
  class: '',
  score: 0,
  hp: 100,
  direction: 'right',
  isAttacking: false,
  canUseSkill: true,
  basicDamage: 10,
  skillCooldown: 5000
};

let skillCooldownTime = 0;
let skillCooldownRemaining = 0;
let skillCooldownInterval;

function directionToIndex(direction, job) {
  if (job === 'general') {
    // 궁수: 0 왼쪽, 1 오른쪽, 2 위쪽, 3 아래쪽
    switch (direction) {
      case 'left': return 0;
      case 'right': return 1;
      case 'up': return 2;
      case 'down': return 3;
      default: return 0;
    }
  } else if (job === 'archer') {
    // 마법사: 0 아래, 1 왼쪽, 2 오른쪽, 3 위쪽
    switch (direction) {
      case 'down': return 0;
      case 'left': return 1;
      case 'right': return 2;
      case 'up': return 3;
      default: return 0;
    }
  } else {
    // 검투사 및 기타: 기본 방향
    switch (direction) {
      case 'down': return 0;
      case 'up': return 1;
      case 'left': return 2;
      case 'right': return 3;
      default: return 0;
    }
  }
}

let frame = 0;

startButton.addEventListener('click', () => {
  playerData.nickname = nicknameInput.value || '플레이어';
  playerData.class = classSelect.value;
  playerData.id = socket.id;

  playerData.hp = 100;     // 체력 초기화
  playerData.score = 0;    // 점수 초기화 (선택)

  
  const skillIcon = document.getElementById('skill-icon');
  if (playerData.class === 'gladiator') {
    playerData.basicDamage = 20;
    playerData.skillCooldown = 1000;
    skillCooldownTime = 1;
    skillIcon.style.backgroundImage = "url('icon.png')";
  } else if (playerData.class === 'general') {
    playerData.basicDamage = 20;
    playerData.skillCooldown = 1000;
    skillCooldownTime = 1;
    skillIcon.style.backgroundImage = "url('icon3.png')";
  } else if (playerData.class === 'archer') {
    playerData.basicDamage = 20;
    playerData.skillCooldown = 1000;
    skillCooldownTime = 1;
    skillIcon.style.backgroundImage = "url('icon4.png')";
  }
  
  loginContainer.style.display = 'none';
  gameContainer.style.display = 'block';
  document.getElementById('hp-bar-container').style.display = 'block';
  
  skillCooldownRemaining = 0;
  updateSkillCooldownUI();
  
  initializePlayer();
  movePlayer();
});

// 화면 클릭 시 채팅 포커스 해제
window.addEventListener('click', (e) => {
  if (isChatFocused && e.target !== chatInput) {
    chatInput.style.display = 'none';
    chatInput.blur();
    isChatFocused = false;
  }
});

// 채팅 전송 처리
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const message = chatInput.value.trim();
    if (message !== '') {
      socket.emit('chatMessage', { nickname: playerData.nickname, message });
      chatInput.value = '';
    }
    chatInput.style.display = 'none';
    chatInput.blur();
    isChatFocused = false;
  }
});

// 채팅 수신 처리
socket.on('chatMessage', (data) => {
  const messageElement = document.createElement('div');
  messageElement.textContent = `${data.nickname}: ${data.message}`;
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});
const jobs = {
  gladiator: {
    src: "./killyou2.png",
    weapon: "./kimremove.png",
    frameWidth: 58,
    frameHeight: 117,
    weaponScale: 0.2,
    weaponLogic: (x, y, dir) => {
      if (dir === 0) return { x: x - 200, y: y - 220, rotate: 65 };
      if (dir === 1) return { x: x - 195, y: y - 220, rotate: 65 };
      if (dir === 2) return { x: x - 250, y: y - 215, rotate: +10 };
      if (dir === 3) return { x: x - 200, y: y - 215, rotate: 80 };
      return { x: x, y: y, rotate: 0 };
    }
  },
  general: {
    src: "./helpme.png",
    weapon: "./stupid-removebg-preview.png",
    frameWidth: 87,
    frameHeight: 90,
    weaponScale: 0.2,
    weaponLogic: (x, y, dir) => {
      if (dir === 0) return { x: x - 195, y: y - 220, rotate: -90 };
      if (dir === 1) return { x: x - 198, y: y - 220, rotate: +180 };
      if (dir === 2) return { x: x - 198, y: y - 210, rotate: +160 };
      if (dir === 3) return { x: x - 190, y: y - 220, rotate: -90 };
      return { x: x, y: y, rotate: 0 };
    }
  },
  archer: {
    src: "./ling.png",
    weapon: "./stickremove.png",
    frameWidth: 60,
    frameHeight: 88,
    weaponScale: 0.2,
    weaponLogic: (x, y, dir) => {
      if (dir === 0) return { x: x - 5, y: y - 100, rotate: +35 };
      if (dir === 1) return { x: x - 22, y: y - 100, rotate: -40 };
      if (dir === 2) return { x: x - 18, y: y - 100, rotate: +40 };
      if (dir === 3) return { x: x - 5, y: y - 100, rotate: +30 };
      return { x: x, y: y, rotate: 0 };
    }
  },
  wizard: {
    src: "./wizard.png",
    weapon: "./staff.png",
    frameWidth: 64,
    frameHeight: 96,
    weaponScale: 0.25,
    weaponLogic: (x, y, dir) => {
      if (dir === 0) return { x: x + 22, y: y + 75, rotate: 0 };
      if (dir === 2) return { x: x + 5, y: y + 40, rotate: -90 };
      if (dir === 3) return { x: x + 45, y: y + 40, rotate: 90 };
      return { x: x + 20, y: y + 5, rotate: 0 };
    }
  }
};

// 내 플레이어 초기화
function initializePlayer() {
  const jobData = jobs[playerData.class];
  if (!jobData) return;
  
  localPlayer = document.createElement('div');
  localPlayer.id = playerData.id;
  localPlayer.classList.add('player');
  localPlayer.style.position = 'absolute';
  localPlayer.style.width = jobData.frameWidth + 'px';
  localPlayer.style.height = jobData.frameHeight + 'px';
  localPlayer.style.overflow = 'hidden';
  gameContainer.appendChild(localPlayer);
  
  const sprite = document.createElement('img');
  sprite.classList.add('character');
  sprite.src = jobData.src;
  sprite.style.width = (jobData.frameWidth * 4) + 'px';
  sprite.style.height = (jobData.frameHeight * 4) + 'px';
  sprite.style.position = 'absolute';
  sprite.style.imageRendering = 'pixelated';
  
  const weapon = document.createElement('img');
  weapon.classList.add('weapon');
  weapon.src = jobData.weapon;
  weapon.style.position = 'absolute';
  weapon.style.pointerEvents = 'none';
  weapon.style.zIndex = '5';
  weapon.style.imageRendering = 'pixelated';
  
  localPlayer.sprite = sprite;
  localPlayer.weaponImg = weapon;
  
  localPlayer.appendChild(sprite);
  gameContainer.appendChild(weapon); // 내 무기는 gameContainer에 직접 추가
  
  const nicknameTag = document.createElement('div');
  nicknameTag.classList.add('nickname');
  nicknameTag.innerText = playerData.nickname;
  localPlayer.appendChild(nicknameTag);
  
  const healthBar = document.createElement('div');
  healthBar.classList.add('health-bar');
  healthBar.style.width = '100%';
  localPlayer.appendChild(healthBar);
  
  socket.emit('newPlayer', playerData);
}
// createOtherPlayer 함수
function createOtherPlayer(data) {
  const jobData = jobs[data.class];
  if (!jobData) return;
  
  // 중복 생성 방지: 같은 ID의 DOM 요소가 이미 있으면 생성하지 않음
  if (document.getElementById(data.id)) return;
  
  // 다른 플레이어 컨테이너 생성 (스프라이트, 닉네임, 체력바 포함)
  const otherPlayer = document.createElement('div');
  otherPlayer.id = data.id;
  otherPlayer.classList.add('player');
  otherPlayer.style.position = 'absolute';
  otherPlayer.style.left = data.x + 'px';
  otherPlayer.style.top = data.y + 'px';
  otherPlayer.style.width = jobData.frameWidth + 'px';
  otherPlayer.style.height = jobData.frameHeight + 'px';
  otherPlayer.style.overflow = 'hidden';
  
  // 캐릭터 스프라이트 생성
  const sprite = document.createElement('img');
  sprite.classList.add('character');
  sprite.src = jobData.src;
  sprite.style.width = (jobData.frameWidth * 4) + 'px';
  sprite.style.height = (jobData.frameHeight * 4) + 'px';
  sprite.style.position = 'absolute';
  sprite.style.imageRendering = 'pixelated';
  
  otherPlayer.appendChild(sprite);
  
  // 닉네임 태그 생성 및 추가
  const nicknameTag = document.createElement('div');
  nicknameTag.classList.add('nickname');
  nicknameTag.innerText = data.nickname;
  otherPlayer.appendChild(nicknameTag);
  
  // 체력 바 생성 및 추가
  const healthBar = document.createElement('div');
  healthBar.classList.add('health-bar');
  healthBar.style.width = `${data.hp}%`;
  otherPlayer.appendChild(healthBar);
  
  gameContainer.appendChild(otherPlayer);
  
  // 무기 엘리먼트 생성 후, 초기 transform 설정
  const weapon = document.createElement('img');
  weapon.classList.add('weapon');
  weapon.src = jobData.weapon; // 직업별 무기 이미지 사용
  weapon.style.position = 'absolute';
  weapon.style.pointerEvents = 'none';
  weapon.style.zIndex = '2';
  weapon.style.imageRendering = 'pixelated';
  
  // 계산: otherPlayer 기준 절대 좌표로 초기 transform 적용
  const otherRect = otherPlayer.getBoundingClientRect();
  const gameRect = gameContainer.getBoundingClientRect();
  const baseX = otherRect.left - gameRect.left;
  const baseY = otherRect.top - gameRect.top;
  const dirIndex = directionToIndex(data.direction, data.class);
  const weaponPos = jobData.weaponLogic(baseX, baseY, dirIndex);
  weapon.style.left = weaponPos.x + "px";
  weapon.style.top = weaponPos.y + "px";
  weapon.style.transform = `scale(${jobData.weaponScale}) rotate(${weaponPos.rotate}deg)`;
  
  // 무기 엘리먼트를 gameContainer에 직접 추가
  gameContainer.appendChild(weapon);
  
  // 참조 저장
  otherPlayer.weaponImg = weapon;
}
// 이동 처리 및 내 플레이어 업데이트
let keys = {};
document.addEventListener('keydown', (e) => {
  if (isChatFocused) return;
  keys[e.key] = true;
  if ((e.key === 'x' || e.key === 'X') && playerData.canUseSkill) {
    useSkill();
  }
  if (e.key === 'Enter') {
    chatInput.style.display = 'block';
    chatInput.focus();
    isChatFocused = true;
  }
});
document.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});
document.addEventListener('click', () => {
  if (isChatFocused) {
    chatInput.blur();
    chatInput.style.display = 'none';
    isChatFocused = false;
  }
});

let canMove = true;


function updateMovement() {
  if (isChatFocused) return;
  let moved = false;
  if (keys['ArrowUp']) {
    playerData.y -= playerData.speed;
    playerData.direction = 'up';
    moved = true;
  }
  if (keys['ArrowDown']) {
    playerData.y += playerData.speed;
    playerData.direction = 'down';
    moved = true;
  }
  if (keys['ArrowLeft']) {
    playerData.x -= playerData.speed;
    playerData.direction = 'left';
    moved = true;
  }
  if (keys['ArrowRight']) {
    playerData.x += playerData.speed;
    playerData.direction = 'right';
    moved = true;
  }
  if (keys['ArrowUp'] && keys['ArrowLeft']) playerData.direction = 'up';
  if (keys['ArrowUp'] && keys['ArrowRight']) playerData.direction = 'up';
  if (keys['ArrowDown'] && keys['ArrowLeft']) playerData.direction = 'down';
  if (keys['ArrowDown'] && keys['ArrowRight']) playerData.direction = 'down';
  if (moved) movePlayer();
}
setInterval(updateMovement, 10);
function movePlayer() {
  if (localPlayer) {
    localPlayer.style.left = playerData.x + 'px';
    localPlayer.style.top = playerData.y + 'px';
    playerData.frame = frame;
    socket.emit('playerMove', playerData);
    updateCharacterSpriteAndWeapon();
  }
}
let lastFrameTime = Date.now();
function updateCharacterSpriteAndWeapon() {
  const jobData = jobs[playerData.class];
  if (!jobData || !localPlayer.sprite || !localPlayer.weaponImg) return;
  const now = Date.now();
  if (now - lastFrameTime > 150) {
    frame = (frame + 1) % 4;
    lastFrameTime = now;
  }
  const sprite = localPlayer.sprite;
  const directionIndex = directionToIndex(playerData.direction, playerData.class);
  sprite.style.transform = `translate(-${frame * jobData.frameWidth}px, -${directionIndex * jobData.frameHeight}px)`;
  
  const gameRect = gameContainer.getBoundingClientRect();
  const charRect = localPlayer.getBoundingClientRect();
  const baseX = charRect.left - gameRect.left;
  const baseY = charRect.top - gameRect.top;
  const weaponPos = jobData.weaponLogic(baseX, baseY, directionIndex);
  
  const weapon = localPlayer.weaponImg;
  console.log("🛠️ weapon.src:", weapon.src);
  console.log("🛠️ 무기 위치 계산:", JSON.stringify(weaponPos));
  weapon.style.left = weaponPos.x + 'px';
  weapon.style.top = weaponPos.y + 'px';
  weapon.style.transform = `scale(${jobData.weaponScale}) rotate(${weaponPos.rotate}deg)`;
  console.log("✅ 적용 후 weapon 위치:", weapon.style.left, weapon.style.top);
}
// 소켓 이벤트: currentPlayers, newPlayer, playerMove, updateHealth, removePlayer, updateScores
socket.on('currentPlayers', (serverPlayers) => {
  Object.keys(serverPlayers).forEach((id) => {
    const data = serverPlayers[id];

    if (id === socket.id) {
      // — 내 플레이어의 스코어를 서버 값으로 동기화
      playerData.score = data.score;

      // DOM 생성은 이미 해뒀으니 건너뜀
    } else {
      // — 다른 플레이어
      if (!document.getElementById(id)) {
        createOtherPlayer(data);
      }
    }

    // 공통: players 맵에 서버 데이터를 덮어쓰기
    players[id] = { ...data };
  });

  // 랭킹 UI에도 반영
  updateRanking();
});


socket.on('newPlayer', (data) => {
  // 1) respawn 시에도 이전 점수 유지
  const oldScore = players[data.id]?.score ?? data.score ?? 0;

  // 2) DOM 생성(기존 로직)
  if (data.id !== socket.id) {
    if (!document.getElementById(data.id)) {
      createOtherPlayer(data);
    }
  }

  // 3) players 맵에 데이터 넣을 때 score만 oldScore로 덮어쓰기
  players[data.id] = {
    ...data,
    score: oldScore
  };

  // 4) 내 데이터면 playerData.score도 동기화
  if (data.id === socket.id) {
    playerData.score = oldScore;
  }

  // 5) 랭킹 갱신(기존 로직)
  updateRanking();
});

socket.on('playerMove', (data) => {
  if (data.id !== socket.id) {
    const otherPlayer = document.getElementById(data.id);
    if (otherPlayer) {
      otherPlayer.style.left = data.x + 'px';
      otherPlayer.style.top = data.y + 'px';
      
      const jobData = jobs[data.class];
      const sprite = otherPlayer.querySelector('.character');
      if (sprite && jobData) {
        const dirIndex = directionToIndex(data.direction, data.class);
        const frameX = (data.frame || 0) * jobData.frameWidth;
        sprite.style.transform = `translate(-${frameX}px, -${dirIndex * jobData.frameHeight}px)`;
      }
      
      const weapon = otherPlayer.weaponImg;
      if (weapon && jobData) {
        const otherRect = otherPlayer.getBoundingClientRect();
        const gameRect = gameContainer.getBoundingClientRect();
        const baseX = otherRect.left - gameRect.left;
        const baseY = otherRect.top - gameRect.top;
        const dirIndex = directionToIndex(data.direction, data.class);
        const weaponPos = jobData.weaponLogic(baseX, baseY, dirIndex);
        weapon.style.left = weaponPos.x + "px";
        weapon.style.top = weaponPos.y + "px";
        weapon.style.transform = `scale(${jobData.weaponScale}) rotate(${weaponPos.rotate}deg)`;
      }
    }
  }
});

socket.on('updateHealth', (data) => {
  if (data.id === socket.id) {
    playerData.hp = data.hp;

    // 1) 스프라이트 밑 health‑bar
    const healthBar = localPlayer.querySelector('.health-bar');
    if (healthBar) healthBar.style.width = `${playerData.hp}%`;

    // 2) overlay HP bar
    const overlayBar = document.getElementById('hp-bar');
    if (overlayBar) overlayBar.style.width = `${playerData.hp}%`;

    // 3) overlay HP text
    const overlayText = document.getElementById('hp-text');
    if (overlayText) overlayText.innerText = `HP ${playerData.hp}`;
    
  } else {
    // (다른 플레이어 HP 업데이트는 그대로)
    const other = document.getElementById(data.id);
    if (other) {
      const hb = other.querySelector('.health-bar');
      if (hb) hb.style.width = `${data.hp}%`;
    }
  }
});


// 기존 removePlayer 콜백을 아래처럼 수정합니다.
socket.on('removePlayer', (deadId) => {
  // 1) 자신에게 오는 삭제 이벤트는 무시
  if (deadId === socket.id) return;



  // 3) 클라이언트 로컬 players 객체에서 해당 유저 삭제
  delete players[deadId];

  // 4) 화면에서 DOM 요소 제거
  const otherPlayer = document.getElementById(deadId);
  if (otherPlayer) {
    if (otherPlayer.weaponImg) otherPlayer.weaponImg.remove();
    otherPlayer.remove();
  }

  // 5) 랭킹 갱신
  updateRanking();
});



socket.on('updateScores', (scores) => {
  Object.entries(scores).forEach(([id, info]) => {
    if (players[id]) {
      players[id].score = info.score;
    }
    if (id === socket.id) {
      playerData.score = info.score;
    }
  });
  updateRanking();
});


socket.on('youDied', () => {

  // ← 리스폰할 때 방향키 입력 상태 초기화
  keys = {};
  alert('😵 사망! 리스폰합니다.');
  

  // → HP 리셋
  playerData.hp = 100;

  // → 스프라이트 밑 바
  const healthBar = localPlayer.querySelector('.health-bar');
  if (healthBar) healthBar.style.width = '100%';

  // → overlay HP bar / text
  const overlayBar = document.getElementById('hp-bar');
  if (overlayBar) overlayBar.style.width = '100%';
  const overlayText = document.getElementById('hp-text');
  if (overlayText) overlayText.innerText = 'HP 100';

  // → 무작위 위치 리스폰
  playerData.x = Math.random() * window.innerWidth;
  playerData.y = Math.random() * window.innerHeight;
  localPlayer.style.left = playerData.x + 'px';
  localPlayer.style.top  = playerData.y + 'px';

  // → 서버에 새 플레이어로 등록
  socket.emit('newPlayer', playerData);

  // → 즉시 무기 등 위치 업데이트
  updateCharacterSpriteAndWeapon();
});



document.addEventListener('click', (e) => {
  if (isChatFocused && !chatInput.contains(e.target)) {
    chatInput.blur();
    chatInput.style.display = 'none';
    isChatFocused = false;
  }
});

function updateRanking() {
  const rankingList = document.getElementById('ranking-list');
  rankingList.innerHTML = '';
  const sortedPlayers = Object.values(players).sort((a, b) => b.score - a.score);
  sortedPlayers.slice(0, 5).forEach((player, index) => {
    const listItem = document.createElement('li');
    listItem.textContent = `${index + 1}위 ${player.nickname}: ${player.score}점`;
    rankingList.appendChild(listItem);
  });
}

document.getElementById('close-left-ad').addEventListener('click', () => {
  document.getElementById('left-ad').style.display = 'none';
});
document.getElementById('close-right-ad').addEventListener('click', () => {
  document.getElementById('right-ad').style.display = 'none';
});

function showSkillEffect(imageSrc, duration = 1000) {
  const effect = document.createElement('img');
  effect.src = imageSrc;
  effect.className = 'skill-effect';
  effect.style.position = 'absolute';
  effect.style.zIndex = '10';
  effect.style.pointerEvents = 'none';
  effect.style.transformOrigin = 'center center';
  
  let offsetX = 0;
  let offsetY = 0;
  let rotation = 0;
  switch (playerData.direction) {
    case 'up':
      offsetX = 30;
      offsetY = -10;
      rotation = -90;
      break;
    case 'down':
      offsetX = 50;
      offsetY = 100;
      rotation = 90;
      break;
    case 'left':
      offsetX = -20;
      offsetY = 50;
      rotation = 180;
      break;
    case 'right':
      offsetX = 100;
      offsetY = 40;
      rotation = 0;
      break;
    default:
      rotation = 0;
  }
  effect.style.left = playerData.x + offsetX + 'px';
  effect.style.top = playerData.y + offsetY + 'px';
  effect.style.transform = `translate(-50%, -50%) rotate(${rotation + 180}deg)`;
  gameContainer.appendChild(effect);
  setTimeout(() => {
    effect.remove();
  }, duration);
}

function useSkill() {
  playerData.canUseSkill = false;
  skillCooldownRemaining = skillCooldownTime;
  updateSkillCooldownUI();
  startSkillCooldownTimer();
  if (playerData.class === 'gladiator') {
    showSkillEffect('skill2-remove.png', 1000);
  }
  if (playerData.class === 'general') {
    showSkillEffect('wind.png', 1000);
  }
  if (playerData.class === 'archer') {
    showSkillEffect('magicremove.png', 1000);
  }
  socket.emit('useSkill', playerData);
}

function updateSkillCooldownUI() {
  const cooldownOverlay = document.getElementById('cooldown-overlay');
  const cooldownText = document.getElementById('cooldown-text');
  if (playerData.canUseSkill) {
    cooldownOverlay.style.height = '0%';
    cooldownText.innerText = '';
  } else {
    const percentage = (skillCooldownRemaining / skillCooldownTime) * 100;
    cooldownOverlay.style.height = `${percentage}%`;
    cooldownText.innerText = Math.ceil(skillCooldownRemaining);
  }
}

function startSkillCooldownTimer() {
  skillCooldownInterval = setInterval(() => {
    skillCooldownRemaining -= 0.1;
    if (skillCooldownRemaining <= 0) {
      skillCooldownRemaining = 0;
      playerData.canUseSkill = true;
      clearInterval(skillCooldownInterval);
    }
    updateSkillCooldownUI();
  }, 100);
}


function getDistance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

// 상대방 스킬 이펙트를 보여주기 위한 코드
socket.on('skillUsed', (data) => {
  if (data.id === socket.id) return;

  console.log('[skillUsed] recv:', data);

  let imageSrc;
  switch (data.class) {
    case 'gladiator': imageSrc = 'skill2-remove.png'; break;
    case 'general':   imageSrc = 'wind.png';           break;
    case 'archer':    imageSrc = 'magicremove.png';    break;
    case 'wizard':    imageSrc = 'skill-wizard.png';   break;
    default:          imageSrc = 'skill-default.png';
  }

  const effect = document.createElement('img');
  effect.src = imageSrc;
  effect.className = 'skill-effect';
  effect.style.position = 'absolute';
  effect.style.pointerEvents = 'none';
  effect.style.zIndex = '10';

  let offX=0, offY=0, rot=0;
  switch (data.direction) {
    case 'up':    offX=30;  offY=-10; rot=-90; break;
    case 'down':  offX=50;  offY=100; rot=90;  break;
    case 'left':  offX=-20; offY=50;  rot=180; break;
    case 'right': offX=100; offY=40;  rot=0;   break;
  }

  effect.style.left      = (data.x + offX) + 'px';
  effect.style.top       = (data.y + offY) + 'px';
  effect.style.transform = `translate(-50%,-50%) rotate(${rot+180}deg)`;

  gameContainer.appendChild(effect);
  setTimeout(() => effect.remove(), 1000);
});
