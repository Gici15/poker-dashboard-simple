const COLORS = ['#f87171', '#facc15', '#4ade80', '#60a5fa', '#c084fc', '#f472b6', '#38bdf8', '#a3e635', '#fb923c', '#e879f9'];
const players = window.players || [];
const games = window.games || [];
const TOTAL_TOURNAMENT_NIGHTS = window.TOTAL_TOURNAMENT_NIGHTS || 20;
const RF_BONUS_POINTS = window.RF_BONUS_POINTS || 10;
const SF_BONUS_POINTS = window.SF_BONUS_POINTS || 5;
const app = document.getElementById('app');

function bonusFor(game, name) {
  let pts = 0;
  if (game.pointsByPlayer[name] === 'x') return 0;
  if (game.handBonuses?.RF === name) pts += RF_BONUS_POINTS;
  if (game.handBonuses?.SF === name) pts += SF_BONUS_POINTS;
  return pts;
}

function stats() {
  return players.map(name => {
    let totalPoints = 0, gamesPlayed = 0, wins = 0, seconds = 0, thirds = 0, rfCount = 0, sfCount = 0;
    for (const game of games) {
      const value = game.pointsByPlayer[name];
      if (value === 'x') continue;
      gamesPlayed += 1;
      const numeric = typeof value === 'number' ? value : 0;
      totalPoints += numeric + bonusFor(game, name);
      if (numeric === 4) wins += 1;
      if (numeric === 2) seconds += 1;
      if (numeric === 1) thirds += 1;
      if (game.handBonuses?.RF === name) rfCount += 1;
      if (game.handBonuses?.SF === name) sfCount += 1;
    }
    const avgPoints = gamesPlayed ? totalPoints / gamesPlayed : 0;
    return { name, totalPoints, gamesPlayed, wins, seconds, thirds, rfCount, sfCount, avgPoints };
  });
}

function compareRank(a, b) {
  return b.totalPoints - a.totalPoints || b.wins - a.wins || b.seconds - a.seconds || b.thirds - a.thirds || b.avgPoints - a.avgPoints || a.name.localeCompare(b.name);
}

function maxNight() {
  return games.length ? Math.max(...games.map(g => g.dayId || 1)) : 1;
}

function cumulativeRows() {
  const max = maxNight();
  const totals = Object.fromEntries(players.map(p => [p, 0]));
  const rows = [];
  for (let night = 1; night <= max; night++) {
    for (const game of games.filter(g => (g.dayId || 1) === night)) {
      for (const name of players) {
        const value = game.pointsByPlayer[name];
        if (typeof value === 'number') totals[name] += value + bonusFor(game, name);
      }
    }
    rows.push({ night: `Night ${night}`, ...totals });
  }
  return rows;
}

function h2h(playerA, playerB) {
  let winsA = 0, winsB = 0, ties = 0;
  for (const game of games) {
    const a = game.pointsByPlayer[playerA], b = game.pointsByPlayer[playerB];
    if (a === 'x' || b === 'x') continue;
    const isPodium = v => v === 4 || v === 2 || v === 1;
    if (!isPodium(a) || !isPodium(b)) continue;
    if (a > b) winsA++; else if (b > a) winsB++; else ties++;
  }
  return { winsA, winsB, ties, gamesCompared: winsA + winsB + ties };
}

function card(title, meta, inner) {
  return `<section class="card"><div class="card-header"><h2>${title}</h2>${meta ? `<p>${meta}</p>` : ''}</div>${inner}</section>`;
}

function renderHeader() {
  const nightsPlayed = new Set(games.map(g => g.dayId)).size;
  const gamesToGo = Math.max(TOTAL_TOURNAMENT_NIGHTS - nightsPlayed, 0);
  return `<header class="header"><div><h1>Poker Nights Dashboard</h1><p>Season 2</p></div><div class="badges"><span>${gamesToGo} nights to go</span><span>${nightsPlayed}/${TOTAL_TOURNAMENT_NIGHTS} nights played</span></div></header>`;
}

function renderStandings() {
  const rows = stats().sort(compareRank);
  const top = rows[0];
  const ppg = [...rows].sort((a,b) => b.avgPoints - a.avgPoints || b.gamesPlayed - a.gamesPlayed)[0];

  const body = rows.map((r,i)=>`<tr><td><span class="rank rank-${i+1}">${i+1}</span></td><td>${r.name}</td><td><b>${r.totalPoints}</b></td><td>${r.gamesPlayed}</td><td>${r.wins}</td><td>${r.seconds}</td><td>${r.thirds}</td><td>${r.avgPoints.toFixed(2)}</td><td>${r.rfCount}</td><td>${r.sfCount}</td></tr>`).join('');

  return card('Overall Standings','Click-free static ranking', `<div class="table-wrap"><table><thead><tr><th>#</th><th>Player</th><th>Total</th><th>Gms</th><th>1st</th><th>2nd</th><th>3rd</th><th>PPG</th><th>RF</th><th>SF</th></tr></thead><tbody>${body}</tbody></table></div><div class="mini"><span>Top performer: <b>${top.name}</b> (${top.totalPoints} pts)</span><span>PPG: <b>${ppg.name}</b> (${ppg.avgPoints.toFixed(2)})</span><span>Total games: <b>${games.length}</b></span></div>`);
}

function renderChartCard(id, title, meta, controls='') {
  return card(title, meta, `${controls}<div class="chart${id==='cumulativeChart'?' tall':''}"><div class="canvas-wrap"><canvas id="${id}"></canvas></div></div>`);
}

function renderNightControls() {
  let opts = Array.from({length:maxNight()}, (_,i)=>`<option value="${i+1}" ${i+1===maxNight()?'selected':''}>Night ${i+1}</option>`).join('');
  return `<div class="toolbar"><span>Night</span><select id="nightSelect">${opts}</select></div>`;
}

function renderPodiumControls() {
  return `<div class="toolbar"><span>Position</span><select id="placeSelect"><option value="4">1st place</option><option value="2">2nd place</option><option value="1">3rd place</option></select></div>`;
}

function renderH2H() {
  const ranked = stats().sort(compareRank);
  const a = ranked[0]?.name || players[0];
  const b = ranked[1]?.name || players[1];
  const opts = (selected) => players.map(p => `<option ${p===selected?'selected':''}>${p}</option>`).join('');
  return card('Head to Head', 'Games where both players finished on the podium.', `<div class="toolbar h2h"><select id="h2hA">${opts(a)}</select><b>VS</b><select id="h2hB">${opts(b)}</select></div><div id="h2hScore" class="score"></div>`);
}

function renderBonuses() {
  const events = [];
  for (const game of games) {
    if (game.handBonuses?.RF) events.push({game: game.id, night: game.dayId, player: game.handBonuses.RF, type: 'RF', points: RF_BONUS_POINTS});
    if (game.handBonuses?.SF) events.push({game: game.id, night: game.dayId, player: game.handBonuses.SF, type: 'SF', points: SF_BONUS_POINTS});
  }

  const body = events.length ? `<div class="table-wrap small"><table><thead><tr><th>Game</th><th>Night</th><th>Player</th><th>Type</th><th>Pts</th></tr></thead><tbody>${events.map(e=>`<tr><td>#${e.game}</td><td>${e.night}</td><td>${e.player}</td><td>${e.type}</td><td>${e.points}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">No RF or SF recorded in game data yet.</p>';

  return card('RF / SF log', `Royal flush (+${RF_BONUS_POINTS}) and straight flush (+${SF_BONUS_POINTS}).`, body);
}

function renderRules() {
  return card('Tournament Rules', '', `<ol class="rules"><li>Ties are broken by most 1st places, then most 2nd places, then highest PPG.</li><li>A valid game that is eligible to count toward points needs a minimum of 6 players.</li><li>RF scores 10 points; SF scores 5 points.</li><li>Each game gives 4 points to 1st, 2 points to 2nd, and 1 point to 3rd.</li><li>Each player may take up to 2 re-buys.</li></ol>`);
}

function render() {
  app.innerHTML = renderHeader() + renderStandings() + `<section class="grid">
  ${renderChartCard('cumulativeChart','Cumulative Points by Night',`Running totals after each night (${players.length} players).`)}
  ${renderChartCard('nightChart','Night Standings','Total points for selected night.', renderNightControls())}
  ${renderChartCard('podiumChart','Podium Finishes','Pick a position below, counting that position over all games.', renderPodiumControls())}
  ${renderChartCard('currentNoPodiumStreakChart','Lojra Larg Podiumit','Games away from podium')}
  ${renderH2H()}${renderBonuses()}</section>` + renderRules() + `<div class="footer"></div>`;
  drawCharts();
  bindEvents();
  updateH2H();
}

let charts = {};

function chartDefaults() {
  Chart.defaults.color = '#94a3b8';
  Chart.defaults.borderColor = '#1f2937';
  Chart.defaults.font.family = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
}

function makeChart(id, config) {
  if (charts[id]) charts[id].destroy();
  charts[id] = new Chart(document.getElementById(id), config);
}

function drawCharts() {
  chartDefaults();
  drawCumulative();
  drawNight(maxNight());
  drawPodium(4);
  drawCurrentNoPodiumStreak();
}

function drawCumulative() {
  const data = cumulativeRows();
  makeChart('cumulativeChart', {
    type:'line',
    data:{
      labels:data.map(r=>r.night),
      datasets:players.map((p,i)=>({
        label:p,
        data:data.map(r=>r[p]),
        borderColor:COLORS[i%COLORS.length],
        backgroundColor:COLORS[i%COLORS.length],
        tension:.35,
        pointRadius:0,
        borderWidth:2
      }))
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      plugins:{legend:{position:'bottom'}, tooltip:{mode:'index', intersect:false,
    itemSort: function(a, b) {
      return b.parsed.y - a.parsed.y;}}},
      scales:{y:{beginAtZero:true, ticks:{precision:0}}, x:{grid:{display:false}}}
    }
  });
}

function nightRows(night) {
  return players.map(name => {
    let pts = 0, played = 0;
    games.filter(g => (g.dayId || 1) === night).forEach(g => {
      const v = g.pointsByPlayer[name];
      if (typeof v === 'number') {
        pts += v + bonusFor(g, name);
        played++;
      }
    });
    return {name, pts, played};
  }).filter(r => r.played).sort((a,b) => b.pts - a.pts || b.name.localeCompare(a.name));
}

function drawNight(night) {
  const rows = nightRows(Number(night));
  makeChart('nightChart', {
    type:'bar',
    data:{
      labels:rows.map(r=>r.name),
      datasets:[{
        label:'Points',
        data:rows.map(r=>r.pts),
        backgroundColor:rows.map(r=>COLORS[players.indexOf(r.name)%COLORS.length]),
        borderRadius:10
      }]
    },
    options:{
      indexAxis:'y',
      responsive:true,
      maintainAspectRatio:false,
      plugins:{legend:{display:false}},
      scales:{x:{beginAtZero:true, ticks:{precision:0}}, y:{grid:{display:false}}}
    }
  });
}

function podiumRows(place) {
  return players.map(name => ({
    name,
    count: games.filter(g => g.pointsByPlayer[name] === Number(place)).length
  })).sort((a,b)=>b.count-a.count || b.name.localeCompare(a.name));
}

function currentNoPodiumStreakRows() { 
  return players.map(name => { 
    let streak = 0; for (let i = games.length - 1; i >= 0; i--) 
    { const value = games[i].pointsByPlayer[name]; 
        if (value === 4 || value === 2 || value === 1) { break; } streak++; } 
    return { name, streak }; }).sort((a, b) => b.streak - a.streak || a.name.localeCompare(b.name)); 
}

function drawPodium(place) {
  const rows = podiumRows(place);
  makeChart('podiumChart', {
    type:'bar',
    data:{
      labels:rows.map(r=>r.name),
      datasets:[{
        label:'Count',
        data:rows.map(r=>r.count),
        backgroundColor:rows.map(r=>COLORS[players.indexOf(r.name)%COLORS.length]),
        borderRadius:10
      }]
    },
    options:{
      indexAxis:'y',
      responsive:true,
      maintainAspectRatio:false,
      plugins:{legend:{display:false}},
      scales:{x:{beginAtZero:true, ticks:{precision:0}}, y:{grid:{display:false}}}
    }
  });
}

function drawCurrentNoPodiumStreak() {
  const rows = currentNoPodiumStreakRows();

  makeChart('currentNoPodiumStreakChart', {
    type: 'bar',
    data: {
      labels: rows.map(r => r.name),
      datasets: [{
        label: 'Games without top 3',
        data: rows.map(r => r.streak),
        backgroundColor: rows.map(r => COLORS[players.indexOf(r.name) % COLORS.length]),
        borderRadius: 10
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { precision: 0 }
        },
        y: {
          grid: { display: false }
        }
      }
    }
  });
}

function updateH2H() {
  const a = document.getElementById('h2hA').value;
  const b = document.getElementById('h2hB').value;
  const el = document.getElementById('h2hScore');

  if (a === b) {
    el.innerHTML = '<p class="muted">Select two different players.</p>';
    return;
  }

  const r = h2h(a,b);
  el.innerHTML = `<div>${a}</div><strong>${r.winsA} — ${r.winsB}</strong><div>${b}</div><small>${r.gamesCompared} games counted${r.ties ? ` · ${r.ties} tied` : ''}</small>`;
}

function bindEvents() {
  document.getElementById('nightSelect').addEventListener('change', e => drawNight(e.target.value));
  document.getElementById('placeSelect').addEventListener('change', e => drawPodium(e.target.value));
  document.getElementById('h2hA').addEventListener('change', updateH2H);
  document.getElementById('h2hB').addEventListener('change', updateH2H);
}

const SITE_PASSWORD = "Fito_shume";

function showLogin() {
  app.innerHTML = `
    <div class="login-box">
      <h1>Poker Nights Dashboard</h1>
      <p>Enter password</p>

      <input
        type="password"
        id="passwordInput"
        placeholder="Password"
        style="
          padding:10px;
          border-radius:8px;
          border:none;
          margin-top:10px;
        "
      />

      <br><br>

      <button
        id="loginBtn"
        style="
          padding:10px 20px;
          border:none;
          border-radius:8px;
          cursor:pointer;
          background:#16a34a;
          color:white;
          font-weight:bold;
        "
      >
        Login
      </button>

      <p id="errorMsg" style="color:red;margin-top:10px;"></p>
    </div>
  `;

  document.getElementById("loginBtn").addEventListener("click", () => {
    const password = document.getElementById("passwordInput").value;

    if (password === SITE_PASSWORD) {
      localStorage.setItem("poker-auth", "true");
      render();
    } else {
      document.getElementById("errorMsg").innerText = "Wrong password";
    }
  });
}

if (localStorage.getItem("poker-auth") === "true") {
  render();
} else {
  showLogin();
}
