const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// 모든 플레이어의 상태를 추적하는 객체
let players = {};

// 클라이언트에게 정적 파일 제공
app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('A player connected: ' + socket.id);

    // 채팅 메시지
    socket.on('chatMessage', (data) => {
        io.emit('chatMessage', data);
    });

    // 새로운 혹은 리스폰 플레이어 등록
    socket.on('newPlayer', (data) => {
        // 리스폰 시 기존 score를 보존, 처음 접속 시 0으로
        const oldScore = players[socket.id]?.score || 0;
    
        players[socket.id] = {
            id: socket.id,
            nickname: data.nickname,
            class: data.class,
            x: data.x,
            y: data.y,
            direction: data.direction,
            frame: 0,
            hp: 100,
            score: oldScore,      // ← 기존 점수 유지
            basicDamage: data.basicDamage,
            skillCooldown: data.skillCooldown
        };
    
        socket.emit('currentPlayers', players);
        socket.broadcast.emit('newPlayer', players[socket.id]);
    });
    
    // 플레이어 이동
    socket.on('playerMove', (data) => {
        if (!players[socket.id]) return;
        players[socket.id] = {
            ...players[socket.id],
            x: data.x,
            y: data.y,
            direction: data.direction,
            frame: data.frame
        };
        io.emit('playerMove', players[socket.id]);
    });

    // 화살 명중 처리
    socket.on('arrowHit', ({ targetId, damage }) => {
        const target = players[targetId];
        const attacker = players[socket.id];
        if (!target || !attacker) return;

        target.hp -= damage;
        io.emit('updateHealth', { id: targetId, hp: target.hp });

        if (target.hp <= 0) {
            attacker.score += 1;
            updateScores();
            socket.broadcast.emit('removePlayer', targetId);
            io.to(targetId).emit('youDied');
            // 삭제 없이 서버 메모리에 유지
        }
    });

    // 기본 공격
    socket.on('basicAttack', (data) => {
        const attacker = players[socket.id];
        if (!attacker) return;
        const now = Date.now();
        if (attacker.lastAttackTime && now - attacker.lastAttackTime < 500) return;
        attacker.lastAttackTime = now;

        for (let id in players) {
            if (id === socket.id) continue;
            const target = players[id];
            const dist = getDistance(attacker.x, attacker.y, target.x, target.y);
            const range = attacker.class === 'archer' ? 300 : 50;
            if (dist <= range &&
                (attacker.class !== 'archer' || isInAttackDirection(attacker, target))) {
                target.hp -= attacker.basicDamage;
                io.to(id).emit('updateHealth', { id, hp: target.hp });
                if (target.hp <= 0) {
                    attacker.score += 1;
                    updateScores();
                    socket.broadcast.emit('removePlayer', id);
                    io.to(id).emit('youDied');
                    // 삭제 없이 서버 메모리에 유지
                }
            }
        }
    });

    // 스킬 사용
    socket.on('useSkill', (data) => {
        const player = players[socket.id];
        if (!player) return;
        const now = Date.now();
        if (player.lastSkillTime && now - player.lastSkillTime < player.skillCooldown) return;
        player.lastSkillTime = now;

        const SKILL_DAMAGE = 20;

        // 검투사
        if (player.class === 'gladiator') {
            for (let id in players) {
                if (id === socket.id) continue;
                const target = players[id];
                const dist = getDistance(player.x, player.y, target.x, target.y);
                if (dist <= 100) {
                    target.hp -= SKILL_DAMAGE;
                    players[id] = target;
                    io.to(id).emit('updateHealth', { id, hp: target.hp });
                    if (target.hp <= 0) {
                        player.score += 1;
                        updateScores();
                        socket.broadcast.emit('removePlayer', id);
                        io.to(id).emit('youDied');
                        // 삭제 없이 서버 메모리에 유지
                    }
                }
            }
        }

        // 궁수
        else if (player.class === 'general') {
            for (let id in players) {
                if (id === socket.id) continue;
                const target = players[id];
                const dist = getDistance(player.x, player.y, target.x, target.y);
                if (dist <= 100) {
                    target.hp -= SKILL_DAMAGE;
                    io.to(id).emit('updateHealth', { id, hp: target.hp });
                    if (target.hp <= 0) {
                        player.score += 1;
                        updateScores();
                        socket.broadcast.emit('removePlayer', id);
                        io.to(id).emit('youDied');
                        // 삭제 없이 서버 메모리에 유지
                    }
                }
            }
        }

        // 마법사
        else if (player.class === 'archer') {
            for (let id in players) {
                if (id === socket.id) continue;
                const target = players[id];
                const dist = getDistance(player.x, player.y, target.x, target.y);
                if (dist <= 100) {
                    target.hp -= SKILL_DAMAGE;
                    io.to(id).emit('updateHealth', { id, hp: target.hp });
                    if (target.hp <= 0) {
                        player.score += 1;
                        updateScores();
                        socket.broadcast.emit('removePlayer', id);
                        io.to(id).emit('youDied');
                        // 삭제 없이 서버 메모리에 유지
                    }
                }
            }
        }

        // 마법사(ghost)
        else if (player.class === 'wizard') {
            for (let id in players) {
                if (id === socket.id) continue;
                const target = players[id];
                const dist = getDistance(player.x, player.y, target.x, target.y);
                if (dist <= 120) {
                    target.hp -= SKILL_DAMAGE;
                    io.to(id).emit('updateHealth', { id, hp: target.hp });
                    if (target.hp <= 0) {
                        player.score += 1;
                        updateScores();
                        socket.broadcast.emit('removePlayer', id);
                        io.to(id).emit('youDied');
                        // 삭제 없이 서버 메모리에 유지
                    }
                }
            }
        }

        io.emit('skillUsed', {
            id: socket.id,
            class: player.class,
            x: player.x,
            y: player.y,
            direction: player.direction
        });
    });

    // 기타 데미지
    socket.on('inflictDamage', (data) => {
        const target = players[data.targetId];
        const attacker = players[socket.id];
        if (!target || !attacker) return;

        target.hp -= data.damage;
        io.emit('updateAllHealth', getAllPlayerHealth());
        if (target.hp <= 0) {
            attacker.score += 1;
            updateScores();
            socket.broadcast.emit('removePlayer', data.targetId);
            io.to(data.targetId).emit('youDied');
            // 삭제 없이 서버 메모리에 유지
        }
    });

    // 연결 끊김
    socket.on('disconnect', () => {
        console.log('A player disconnected: ' + socket.id);
        delete players[socket.id];
        io.emit('removePlayer', socket.id);
    });

    // 점수 업데이트
    function updateScores() {
        const scores = {};
        for (let id in players) {
            scores[id] = {
                nickname: players[id].nickname,
                score:    players[id].score
            };
        }
        io.emit('updateScores', scores);
    }

    // 전체 체력
    function getAllPlayerHealth() {
        const healthData = {};
        for (let id in players) {
            healthData[id] = {
                nickname: players[id].nickname,
                hp:       players[id].hp
            };
        }
        return healthData;
    }

    // 거리 계산
    function getDistance(x1, y1, x2, y2) {
        return Math.hypot(x2 - x1, y2 - y1);
    }

    // 공격 방향 체크 (궁수)
    function isInAttackDirection(attacker, target) {
        const dx = target.x - attacker.x;
        const dy = target.y - attacker.y;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        if (attacker.direction === 'up'    && angle >= -135 && angle <= -45)   return true;
        if (attacker.direction === 'down'  && angle >= 45   && angle <= 135)   return true;
        if (attacker.direction === 'left'  && (angle >= 135 || angle <= -135)) return true;
        if (attacker.direction === 'right' && angle >= -45  && angle <= 45)    return true;
        if (attacker.direction === 'up-left'    && angle >= -180 && angle <= -90) return true;
        if (attacker.direction === 'up-right'   && angle >= -90  && angle <= 0)   return true;
        if (attacker.direction === 'down-left'  && angle >= 90   && angle <= 180) return true;
        if (attacker.direction === 'down-right' && angle >= 0    && angle <= 90)  return true;
        return false;
    }
});

// 서버 시작
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});