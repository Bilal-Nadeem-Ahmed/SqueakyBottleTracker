let addBottleButton = undefined;
let feedDiv = undefined;
let feeds = [];
const Days = ["Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat"];

window.onload = function () {
  addBottleButton = document.getElementById("add-bottle");
  feedDiv = document.getElementById("previous-feeds");
  const dialog = document.querySelector("dialog");
  const closeButton = document.querySelector("dialog button");
  const feedInput = document.getElementById("add-feed");
  const timeInput = document.createElement("input");
  timeInput.type = "datetime-local";
  timeInput.id = "feed-time";
  timeInput.value = new Date().toISOString().slice(0, 16);
  // set min date to 6 days ago
  timeInput.setAttribute(
    "min",
    new Date(new Date().setDate(new Date().getDate() - 6))
      .toISOString()
      .slice(0, 16)
  );

  dialog.insertBefore(timeInput, closeButton);

  RemoveOverOneWeek();

  GenerateFeedList();

  addBottleButton?.addEventListener("click", (e) => {
    e.preventDefault();
    timeInput.value = new Date().toISOString().slice(0, 16);
    dialog.showModal();
  });

  closeButton.addEventListener("click", () => {
    let currentFeed = {
      Time: new Date(timeInput.value) || new Date(),
      Value: parseFloat(feedInput.value) || 0,
    };

    if (currentFeed.Value > 0) {
      let items = JSON.parse(localStorage.getItem("FeedList")) ?? [];
      items.push(currentFeed);
      items.sort((a, b) => new Date(a.Time) - new Date(b.Time));
      feeds = items;
      localStorage.setItem("FeedList", JSON.stringify(items));
      feedInput.value = "";
    }

    dialog.close();
    GenerateFeedList();
  });
};

function GenerateFeedList() {
  if (!feeds.length) {
    feedDiv.innerText = "No Data To Display! Add A Feed";
  } else {
    feedDiv.innerText = "";
    const FeedList = document.createElement("ul");
    const dailyTotals = {};

    feeds.forEach((feed, index) => {
      let date = new Date(feed.Time);
      let li = document.createElement("li");
      li.className = "feed-item";
      li.innerHTML = `<span>${Days[date.getUTCDay()]} ${
        date.getHours() % 12 || 12
      }:${date.getMinutes().toString().padStart(2, "0")} ${
        date.getHours() >= 12 ? "PM" : "AM"
      }</span> <span>Drank: ${
        feed.Value
      } oz</span> <button class="delete-button" data-index="${index}">Delete</button>`;

      FeedList.appendChild(li);

      let dayName = Days[date.getUTCDay()];
      if (!dailyTotals[dayName]) {
        dailyTotals[dayName] = 0;
      }
      dailyTotals[dayName] += Number(feed.Value);
    });

    feedDiv.appendChild(FeedList);

    const deleteButtons = document.querySelectorAll(".delete-button");
    deleteButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const index = parseInt(button.getAttribute("data-index"), 10);
        DeleteFeedItem(index);
      });
    });

    const TotalsDiv = document.createElement("div");
    TotalsDiv.style.marginTop = "20px";
    TotalsDiv.innerHTML = "<h3>Daily Totals</h3>";
    const TotalsList = document.createElement("ul");
    for (let day in dailyTotals) {
      let totalLi = document.createElement("li");
      totalLi.textContent = `${day}: ${dailyTotals[day]} oz, ${(
        Number(dailyTotals[day]) * 28.6
      ).toFixed()} ml`;
      TotalsList.appendChild(totalLi);
    }
    TotalsDiv.appendChild(TotalsList);
    feedDiv.appendChild(TotalsDiv);
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
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  if (items.length > 0) {
    const inDateItems = items.filter(
      (item) => new Date(item.Time) >= oneWeekAgo
    );
    inDateItems.sort((a, b) => new Date(a.Time) - new Date(b.Time));
    feeds = inDateItems;
    localStorage.setItem("FeedList", JSON.stringify(inDateItems));
  }
}
