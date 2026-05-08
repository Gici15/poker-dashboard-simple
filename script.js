const SITE_PASSWORD = "Fito_shume";

const COLORS = ['#f87171', '#facc15', '#4ade80', '#60a5fa', '#c084fc', '#f472b6', '#38bdf8', '#a3e635', '#fb923c', '#e879f9'];
const players = window.players || [];
const games = window.games || [];
const TOTAL_TOURNAMENT_NIGHTS = window.TOTAL_TOURNAMENT_NIGHTS || 20;
const RF_BONUS_POINTS = window.RF_BONUS_POINTS || 10;
const SF_BONUS_POINTS = window.SF_BONUS_POINTS || 5;
const app = document.getElementById('app');

function showLogin() {
  app.innerHTML = `
    <div class="login-box">
      <h1>Poker Nights Dashboard</h1>
      <p>Enter password to continue</p>
      <input type="password" id="passwordInput" placeholder="Password" />
      <button id="loginBtn">Login</button>
      <p id="errorMsg" style="color:red;"></p>
    </div>
  `;

  document.getElementById('loginBtn').addEventListener('click', checkPassword);

  document.getElementById('passwordInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      checkPassword();
    }
  });
}

function checkPassword() {
  const value = document.getElementById('passwordInput').value;

  if (value === SITE_PASSWORD) {
    localStorage.setItem('pokerAuth', 'true');
    render();
  } else {
    document.getElementById('errorMsg').innerText = 'Wrong password';
  }
}

if (localStorage.getItem('pokerAuth') !== 'true') {
  showLogin();
} else {
  render();
}

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
        if (typeof value === 'number') {
          totals[name] += value + bonusFor(game, name);
        }
      }
    }
    rows.push({ night: `Night ${night}`, ...totals });
  }

  return rows;
}

function card(title, meta, inner) {
  return `<section class="card"><div class="card-header"><h2>${title}</h2>${meta ? `<p>${meta}</p>` : ''}</div>${inner}</section>`;
}

function renderHeader() {
  const nightsPlayed = new Set(games.map(g => g.dayId)).size;
  const gamesToGo = Math.max(TOTAL_TOURNAMENT_NIGHTS - nightsPlayed, 0);

  return `
    <header class="header">
      <div>
        <h1>Poker Nights Dashboard</h1>
        <p>Season 2 Dashboard</p>
      </div>

      <div class="badges">
        <span>${gamesToGo} nights to go</span>
        <span>${nightsPlayed}/${TOTAL_TOURNAMENT_NIGHTS} nights played</span>
      </div>
    </header>
  `;
}

function renderStandings() {
  const rows = stats().sort(compareRank);

  const body = rows.map((r,i)=>`
    <tr>
      <td>${i+1}</td>
      <td>${r.name}</td>
      <td>${r.totalPoints}</td>
      <td>${r.gamesPlayed}</td>
      <td>${r.wins}</td>
      <td>${r.avgPoints.toFixed(2)}</td>
    </tr>
  `).join('');

  return card(
    'Overall Standings',
    '',
    `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Player</th>
              <th>Points</th>
              <th>Games</th>
              <th>Wins</th>
              <th>PPG</th>
            </tr>
          </thead>

          <tbody>
            ${body}
          </tbody>
        </table>
      </div>
    `
  );
}

function render() {
  app.innerHTML =
    renderHeader() +
    renderStandings() +
    `<div class="footer">Private Poker Dashboard</div>`;
}
