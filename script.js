const app = document.getElementById("app");

function renderDashboard() {
  if (!window.games || !Array.isArray(window.games)) {
    app.innerHTML = "<h2>No data found in data.js</h2>";
    return;
  }

  let html = `
    <h1>Poker Nights Dashboard</h1>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Player</th>
            <th>Buy-In</th>
            <th>Rebuy</th>
            <th>Cash-Out</th>
            <th>Profit</th>
          </tr>
        </thead>
        <tbody>
  `;

  window.games.forEach((game) => {
    html += `
      <tr>
        <td>${game.date || ""}</td>
        <td>${game.player || ""}</td>
        <td>${game.buyIn || ""}</td>
        <td>${game.rebuy || ""}</td>
        <td>${game.cashOut || ""}</td>
        <td>${game.profit || ""}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  app.innerHTML = html;
}

renderDashboard();
