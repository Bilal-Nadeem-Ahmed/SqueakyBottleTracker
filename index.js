let addBottleButton = undefined;
let addNappyButton = undefined;
let addMedicineButton = undefined;
let feedDiv = undefined;
let feeds = [];
const Days = ["Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat"];

const TypeEnum = {
  Bottle: "Bottle",
  Nappy: "Nappy",
  Medicine: "Medicine",
};
const TypeSymbols = {
  Bottle: "🍼",
  Nappy: "💩",
  Medicine: "💊",
};

window.onload = function () {
  addBottleButton = document.getElementById("add-bottle");
  feedDiv = document.getElementById("previous-feeds");
  const feedDialog = document.getElementById("feed-dialog");
  const closeButton = document.querySelector("#feed-dialog button");
  const feedInput = document.getElementById("add-feed");
  const timeInput = document.createElement("input");
  timeInput.type = "datetime-local";
  timeInput.id = "feed-time";
  timeInput.value = new Date().toISOString().slice(0, 16);

  timeInput.setAttribute(
    "min",
    new Date(new Date().setDate(new Date().getDate() - 5))
      .toISOString()
      .slice(0, 16)
  );

  feedDialog.insertBefore(timeInput, closeButton);

  InitialiseNappyFunctionality();
  RemoveOverOneWeek();
  GenerateFeedList();

  addBottleButton?.addEventListener("click", (e) => {
    e.preventDefault();
    timeInput.value = new Date().toISOString().slice(0, 16);
    feedDialog.showModal();
  });

  closeButton.addEventListener("click", () => {
    let currentFeed = {
      Time: new Date(timeInput.value) || new Date(),
      Value: parseFloat(feedInput.value) || 0,
      Type: TypeEnum.Bottle,
    };

    if (currentFeed.Value > 0) {
      let items = JSON.parse(localStorage.getItem("FeedList")) ?? [];
      items.push(currentFeed);
      items.sort((a, b) => new Date(a.Time) - new Date(b.Time));
      feeds = items;
      localStorage.setItem("FeedList", JSON.stringify(items));
      feedInput.value = "";
    }

    feedDialog.close();
    GenerateFeedList();
  });
};
function InitialiseNappyFunctionality() {
  //
  addNappyButton = document.getElementById("add-nappy");

  addNappyButton?.addEventListener("click", (e) => {
    e.preventDefault();

    let currentNappy = {
      Time: new Date(),
      Value: 1,
      Type: TypeEnum.Nappy,
    };

    let items = JSON.parse(localStorage.getItem("FeedList")) ?? [];
    items.push(currentNappy);
    items.sort((a, b) => new Date(a.Time) - new Date(b.Time));
    feeds = items;

    localStorage.setItem("FeedList", JSON.stringify(items));

    GenerateFeedList();
  });
}

function GenerateFeedList() {
  if (!feeds.length) {
    feedDiv.innerText = "No Data To Display! Add A Feed";
  } else {
    feedDiv.innerText = "";
    const FeedList = document.createElement("ul");
    FeedList.classList.add("feed-list");
    const dailyTotals = {};

    feeds.forEach((feed, index) => {
      let date = new Date(feed.Time);
      let dayName = Days[date.getUTCDay()];
      let totalMinutes = date.getHours() * 60 + date.getMinutes(); // Convert feed time to minutes

      if (!dailyTotals[dayName]) {
        dailyTotals[dayName] = {
          Value: 0,
          TotalBottles: 0,
          TotalMinutes: [],
          TotalNappies: 0,
        };
      }

      if (feed.Type === TypeEnum.Bottle) {
        dailyTotals[dayName].Value += Number(feed.Value);
        dailyTotals[dayName].TotalBottles += 1;
        dailyTotals[dayName].TotalMinutes.push(totalMinutes); // Store time in minutes
      }
      if (feed.Type === TypeEnum.Nappy) {
        dailyTotals[dayName].TotalNappies += 1;
      }

      let li = document.createElement("li");
      // add the symbols below
      li.className = "feed-item";

      let initialHTML = `<span>${TypeSymbols[feed.Type]} ${dayName} ${
        date.getHours() % 12 || 12
      }:${date.getMinutes().toString().padStart(2, "0")} ${
        date.getHours() >= 12 ? "PM" : "AM"
      }</span > `;
      let middleHTML = ``;
      if (feed.Type === TypeEnum.Bottle) {
        middleHTML = `<span>Drank: ${feed.Value} oz</span>`;
      }
      li.innerHTML = ` ${initialHTML} ${middleHTML} <button class="delete-button" data-index="${index}">Delete</button>`;

      FeedList.appendChild(li);
    });

    feedDiv.appendChild(FeedList);

    const deleteButtons = document.querySelectorAll(".delete-button");
    deleteButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const index = parseInt(button.getAttribute("data-index"), 10);
        DeleteFeedItem(index);
      });
    });

    const TotalsDiv = document.createElement("div");

    TotalsDiv.innerHTML = "<h3>Daily Totals</h3>";
    const TotalsList = document.createElement("ul");
    TotalsList.classList.add("daily-totals-list");

    for (let day in dailyTotals) {
      dailyTotals[day].TotalMinutes.sort((a, b) => a - b);

      let totalDiff = 0;
      let avgHours = 0;
      let avgMins = 0;

      if (dailyTotals[day].TotalBottles > 1) {
        for (let i = 1; i < dailyTotals[day].TotalMinutes.length; i++) {
          totalDiff +=
            dailyTotals[day].TotalMinutes[i] -
            dailyTotals[day].TotalMinutes[i - 1];
        }
        let avgMinutes = Math.round(
          totalDiff / (dailyTotals[day].TotalBottles - 1)
        );
        avgHours = Math.floor(avgMinutes / 60);
        avgMins = avgMinutes % 60;
      }

      let totalLi = document.createElement("li");
      totalLi.classList.add("daily-total");

      let liHTML = `
 
  <div class="daily-total__values">
  <div><strong>${day}</strong> </div>
  <div><strong>${
    dailyTotals[day].TotalBottles
  }</strong> <span class='b-emogi'>🍼<span></div>
    <div><strong>${dailyTotals[day].Value}</strong> oz</div>
    <div><strong>${(
      Number(dailyTotals[day].Value) * 28.6
    ).toFixed()}</strong> ml</div>
    <div><div><strong>${
      dailyTotals[day].TotalNappies
    }</strong> </div><div class='p-emogi'>💩</div></div>
    ${
      dailyTotals[day].TotalBottles > 1
        ? `
      <span >
      <strong>  Avg: </strong>${avgHours}h:${avgMins
            .toString()
            .padStart(2, "0")}m
      </span>`
        : "<div>Only one feed</div>"
    }
  </div> `;

      totalLi.innerHTML = liHTML;

      totalLi.innerHTML = liHTML;
      TotalsList.appendChild(totalLi);
    }

    TotalsDiv.appendChild(TotalsList);
    feedDiv.appendChild(TotalsDiv);
    const previousFeed = document.querySelector(".feed-list");
    const totals = document.querySelector(".daily-totals-list");

    previousFeed.scrollTo({
      top: previousFeed.scrollHeight,
      behavior: "smooth",
    });
    totals.scrollTo({
      top: totals.scrollHeight,
      behavior: "smooth",
    });
  }
}

function DeleteFeedItem(index) {
  feeds.splice(index, 1);
  localStorage.setItem("FeedList", JSON.stringify(feeds));
  GenerateFeedList();
}

function RemoveOverOneWeek() {
  const List = localStorage.getItem("FeedList");
  const items = List ? JSON.parse(List) : [];

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 6);

  if (items.length > 0) {
    const inDateItems = items.filter(
      (item) => new Date(item.Time) >= oneWeekAgo
    );
    // remove in a week
    items.forEach((item) => {
      if (!item.Type) {
        item.Type = TypeEnum.Bottle;
      }
    });
    inDateItems.sort((a, b) => new Date(a.Time) - new Date(b.Time));
    feeds = inDateItems;
    localStorage.setItem("FeedList", JSON.stringify(inDateItems));
  }
}
